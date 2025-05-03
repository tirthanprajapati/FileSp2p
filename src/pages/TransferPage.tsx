import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link as LinkIcon, CheckCircle, Copy, Zap } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FileDropZone from '../components/transfer/FileDropZone';
import TransferProgress from '../components/transfer/TransferProgress';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { TransferProgress as TransferProgressType } from '../utils/webrtc';
import { v4 as uuidv4 } from 'uuid';

const TransferPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [transfers, setTransfers] = useState<TransferProgressType[]>([]);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store cached file chunks to avoid re-reading files
  const fileChunksCache = useRef<Map<string, Uint8Array[]>>(new Map());
  
  // Store one sender UID for this session
  const senderUidRef = useRef<string>('');
  
  // Define updateTransferProgress before using it in memoizedProcessFilesForTransfer
  const updateTransferProgress = useCallback((progress: TransferProgressType) => {
    setTransfers(prevTransfers => {
      // Find if this transfer already exists in our array
      const existingIndex = prevTransfers.findIndex(
        t => t.transferId === progress.transferId
      );
      
      if (existingIndex >= 0) {
        // Update existing transfer
        const updatedTransfers = [...prevTransfers];
        updatedTransfers[existingIndex] = progress;
        return updatedTransfers;
      } else {
        // Add new transfer to the array
        return [...prevTransfers, progress];
      }
    });
  }, []);

  // Read file as chunks and cache them for efficient transfer
  const prepareFileChunks = useCallback(async (file: File, chunkSize: number = 64 * 1024) => {
    const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
    
    // Check if we already have the chunks cached
    if (fileChunksCache.current.has(cacheKey)) {
      console.log(`Using cached chunks for ${file.name}`);
      return fileChunksCache.current.get(cacheKey) as Uint8Array[];
    }
    
    console.log(`Reading file ${file.name} as chunks`);
    const chunks: Uint8Array[] = [];
    let offset = 0;
    
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      const buffer = await chunk.arrayBuffer();
      chunks.push(new Uint8Array(buffer));
      offset += chunkSize;
    }
    
    // Cache the chunks for later use
    fileChunksCache.current.set(cacheKey, chunks);
    return chunks;
  }, []);

  // Improved file transfer implementation
  const transferFile = useCallback(async (
    file: File, 
    receiverId: string, 
    sessionId: string,
    transferId: string
  ) => {
    if (!socket) {
      throw new Error("Socket connection not available");
    }
    
    console.log(`Starting file transfer for ${file.name} to receiver ${receiverId}`);
    
    // Create transfer progress record
    const transferProgress: TransferProgressType = {
      transferId,
      sentChunks: 0,
      totalChunks: Math.ceil(file.size / (64 * 1024)), // 64KB chunks
      receivedChunks: 0,
      status: 'waiting',
      metadata: {
        id: transferId,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      },
    };
    
    // Update UI with initial progress
    updateTransferProgress(transferProgress);
    
    try {
      // Prepare file chunks
      const chunks = await prepareFileChunks(file);
      console.log(`Prepared ${chunks.length} chunks for file ${file.name}`);
      
      // Send file metadata to start the process
      socket.emit("fs-meta", {
        filename: file.name,
        total_buffer_size: file.size,
        buffer_size: 64 * 1024,
        receiverId,
        senderUid: sessionId,
        sessionId,
        transferId,
        userId: user?.id || 'anonymous',
        type: file.type
      });
      
      console.log(`Sent metadata for file ${file.name}, waiting for fs-start events`);
      
      // Interface for fs-start event data
      interface FsStartData {
        sessionId: string;
        uid?: string;
        receiverId?: string;
      }

      // Set up handler for start requests
      const handleFsStart = (data: FsStartData) => {
        console.log(`Received fs-start event:`, data);
        
        // Verify this is for our session
        if (data.sessionId !== sessionId) {
          console.log(`Ignoring fs-start for different session ID: ${data.sessionId}`);
          return;
        }
        
        // Find the requested chunk index
        const currentIndex = transferProgress.sentChunks;
        console.log(`Sending chunk ${currentIndex + 1}/${chunks.length} for ${file.name}`);
        
        // Check if we've sent all chunks
        if (currentIndex >= chunks.length) {
          // We're done with this file
          console.log(`All chunks sent for ${file.name}`);
          updateTransferProgress({
            ...transferProgress,
            status: 'completed',
            sentChunks: chunks.length,
            totalChunks: chunks.length
          });
          
          // Clean up this handler
          socket.off('fs-start', handleFsStart);
          return;
        }
        
        // Get the next chunk
        const chunk = chunks[currentIndex];
        
        // Send the chunk
        socket.emit("fs-share", {
          buffer: chunk,
          senderUid: sessionId,
          receiverId,
          sessionId,
          chunkIndex: currentIndex,
          totalChunks: chunks.length,
          transferId,
          isLastChunk: currentIndex === chunks.length - 1
        });
        
        // Update transfer progress
        const newSentChunks = currentIndex + 1;
        updateTransferProgress({
          ...transferProgress,
          sentChunks: newSentChunks,
          status: newSentChunks === chunks.length ? 'completed' : 'transferring'
        });
        
        // Update the reference for next time
        transferProgress.sentChunks = newSentChunks;
      };
      
      // Handle error responses
      interface ReceiverNotFoundData {
        transferId: string;
      }
      
      const handleReceiverNotFound = (data: ReceiverNotFoundData) => {
        console.log(`Receiver not found for transfer ${data.transferId}`);
        if (data.transferId === transferId) {
          updateTransferProgress({
            ...transferProgress,
            status: 'error',
            error: 'Receiver disconnected or not found'
          });
          socket.off('fs-start', handleFsStart);
          socket.off('receiver-not-found', handleReceiverNotFound);
        }
      };
      
      // Listen for start events and receiver errors
      socket.on('fs-start', handleFsStart);
      socket.on('receiver-not-found', handleReceiverNotFound);
      
      // Return a cleanup function
      return () => {
        socket.off('fs-start', handleFsStart);
        socket.off('receiver-not-found', handleReceiverNotFound);
      };
    } catch (err) {
      console.error(`Error transferring file ${file.name}:`, err);
      updateTransferProgress({
        ...transferProgress,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }, [socket, prepareFileChunks, updateTransferProgress, user?.id]);

  // Enhanced function to process files for transfer
  const processFilesForTransfer = useCallback((receiverId: string) => {
    console.log("Processing files for transfer to receiver:", receiverId);
    
    if (!socket) {
      setError('Socket connection not available');
      return;
    }
    
    // Generate a unique session ID for this transfer batch
    const sessionId = senderUidRef.current || uuidv4();
    
    // Process each file sequentially
    const transferFiles = async () => {
      for (const file of selectedFiles) {
        // Create a unique ID for this specific file transfer
        const fileTransferId = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Start the transfer
        await transferFile(file, receiverId, sessionId, fileTransferId);
      }
    };
    
    // Start the transfers
    transferFiles().catch(err => {
      console.error("Error during file transfers:", err);
      setError(`Transfer error: ${err.message || 'Unknown error'}`);
    });
  }, [socket, selectedFiles, transferFile]);

  useEffect(() => {
    if (!socket) return;
    
    // Register sender with the server
    senderUidRef.current = uuidv4();
    socket.emit('sender-join', { 
      uid: senderUidRef.current,
      userId: user?.id || 'anonymous',
      files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    console.log('Registered sender with UID:', senderUidRef.current);

    // Listen for receiver connections
    const handleReceiverInit = (receiverData: { socketId?: string, uid?: string }) => {
      console.log('Receiver connected:', receiverData);
      // Don't auto-start transfer, wait for the user to click "Start Transfer"
    };
    
    socket.on('init', handleReceiverInit);

    return () => {
      socket.off('init', handleReceiverInit);
    };
  }, [socket, user?.id, selectedFiles]);

  // Reset copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timeout = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copySuccess]);
  
  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
    // Reset share URL and transfers when files change
    setShareUrl('');
    setTransfers([]);
  };
  
  const generateShareLink = async () => {
    if (!socket || !connected) {
      setError('Socket connection not available');
      return;
    }
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }
    
    setIsCreatingLink(true);
    setError(null);
    
    try {
      // Use the existing sender UID
      const transferId = senderUidRef.current;
      
      // Create a shareable URL with the sender UID
      const url = `${window.location.origin}/receive/${transferId}`;
      setShareUrl(url);
      
      // Reset transfers to avoid duplicates
      setTransfers([]);
      
      // Add metadata to transfer object
      const initialTransfers: TransferProgressType[] = selectedFiles.map(file => {
        const uniqueId = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return {
          transferId: uniqueId,
          sentChunks: 0,
          totalChunks: Math.ceil(file.size / (64 * 1024)), // 64KB chunks
          receivedChunks: 0,
          status: 'waiting',
          metadata: {
            id: uniqueId,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
          },
        };
      });
      
      setTransfers(initialTransfers);
      
      console.log('Created share link with sender UID:', transferId);
      console.log('Share URL:', url);
    } catch (err) {
      console.error('Error creating share link:', err);
      setError('Failed to create share link');
    } finally {
      setIsCreatingLink(false);
    }
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopySuccess(true);
  };
  
  // Function to handle starting the transfer process after link generation
  const startTransfer = () => {
    if (!socket || !connected) {
      setError('Socket connection not available');
      return;
    }
    
    console.log("Starting transfer process with sender UID:", senderUidRef.current);
    
    // Check if we have any receivers connected
    socket.emit('check-receivers', { senderUid: senderUidRef.current }, (response: { hasReceivers: boolean; receiverId: string }) => {
      console.log("Receiver check response:", response);
      
      if (response && response.hasReceivers && response.receiverId) {
        // Start transferring to the connected receiver
        console.log("Connected receiver found, initiating transfer to:", response.receiverId);
        processFilesForTransfer(response.receiverId);
      } else {
        console.log("No connected receivers found, waiting for connections...");
        // Automatically wait for receiver connections
        socket.once('init', (receiverData: { socketId?: string; uid?: string }) => {
          console.log("Receiver connected during wait:", receiverData);
          const receiverId = receiverData.socketId || receiverData.uid;
          if (receiverId) {
            processFilesForTransfer(receiverId);
          } else {
            setError('No valid receiver ID found');
          }
        });
        
        // Update UI to show waiting state
        setTransfers(prev => prev.map(transfer => ({
          ...transfer,
          status: 'waiting'
        })));
      }
    });
  };
  
  const handleRetry = (transferId: string) => {
    // Find the corresponding file
    const transfer = transfers.find(t => t.transferId === transferId);
    if (!transfer || !transfer.metadata) return;
    
    // Find the file by name
    const file = selectedFiles.find(f => f.name === transfer.metadata?.name);
    if (!file) return;
    
    // Reset transfer status
    updateTransferProgress({
      ...transfer,
      status: 'waiting',
      sentChunks: 0,
      receivedChunks: 0,
      error: undefined
    });
    
    // Check if socket exists before using it
    if (!socket) {
      setError('Socket connection not available');
      return;
    }
    
    // Retry the transfer
    socket.once('init', (receiverData: { socketId?: string; uid?: string }) => {
      const receiverId = receiverData.socketId || receiverData.uid;
      if (receiverId) {
        transferFile(
          file, 
          receiverId, 
          senderUidRef.current, 
          transferId
        );
      } else {
        setError('No valid receiver ID found');
      }
    });
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Send Files
      </h1>
      
      <div className="mb-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Step 1: Select Files
        </h2>
        
        <FileDropZone 
          onFilesSelected={handleFileSelect}
          multiple
          maxSize={5000} // 5GB max
          disabled={shareUrl !== ''}
        />
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="mb-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Step 2: Generate Sharing Link
          </h2>
          
          {shareUrl ? (
            <div>
              <div className="flex items-center mb-4">
                <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                <span className="text-success-700 dark:text-success-400 font-medium">
                  Share link created successfully!
                </span>
              </div>
              
              <div className="flex items-center mb-6">
                <Input
                  value={shareUrl}
                  readOnly
                  fullWidth
                  leftIcon={<LinkIcon size={18} />}
                />
                <Button
                  className="ml-2"
                  variant="outline"
                  onClick={handleCopyLink}
                  leftIcon={copySuccess ? <CheckCircle size={18} /> : <Copy size={18} />}
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              
              <Button 
                onClick={startTransfer}
                leftIcon={<Zap size={18} />}
                fullWidth
              >
                Start Transfer
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <Input 
                  label="Recipient Email (Optional)"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  helperText="We'll notify them when the transfer is ready"
                  fullWidth
                />
              </div>
              
              <Button
                onClick={generateShareLink}
                isLoading={isCreatingLink}
                leftIcon={<LinkIcon size={18} />}
                fullWidth
              >
                Generate Share Link
              </Button>
              
              {error && (
                <div className="mt-4 p-3 bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {transfers.length > 0 && (
        <div className="mb-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Transfer Progress
          </h2>
          
          <div className="space-y-4">
            {/* Use a more unique key and filter out duplicates based on filename */}
            {transfers
              .filter((transfer, index, self) => 
                index === self.findIndex(t => t.metadata?.name === transfer.metadata?.name)
              )
              .map((transfer) => (
                <TransferProgress
                  key={transfer.transferId}
                  transfer={transfer}
                  onRetry={() => handleRetry(transfer.transferId)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferPage;

