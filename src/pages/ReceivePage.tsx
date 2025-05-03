import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Shield, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import TransferProgress from '../components/transfer/TransferProgress';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { TransferProgress as TransferProgressType } from '../utils/webrtc';

// Define the receive state type
type ReceiveState = {
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'completed';
  error: string | null;
};

interface FileShareState {
  metadata: {
    filename: string;
    total_buffer_size: number;
    buffer_size: number;
    senderUid: string;
    sessionId: string;
    type?: string;
  };
  transmitted: number;
  buffer: Uint8Array[];
  sessionId?: string;
}

const ReceivePage: React.FC = () => {
  const { id: urlTransferId } = useParams<{ id: string }>();
  const [transferCode, setTransferCode] = useState<string>(urlTransferId || '');
  const { socket } = useSocket();
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transfers, setTransfers] = useState<TransferProgressType[]>([]);
  const [completedFiles, setCompletedFiles] = useState<{ id: string; blob: Blob; name: string; type: string }[]>([]);
  const [receiveState, setReceiveState] = useState<ReceiveState>({
    status: 'idle',
    error: null
  });
  
  // The transfer ID to use (from URL or input field)
  const transferId = urlTransferId !== 'guest' ? urlTransferId : transferCode;
  
  // File share state reference for Socket.IO based transfers
  const fileShare = useRef<Record<string, FileShareState>>({});
  const receiverUID = useRef<string>('');
  
  // Update transfer progress in the UI
  const updateTransferProgress = useCallback((progress: TransferProgressType) => {
    setTransfers(prevTransfers => {
      // If this transfer is not in the list yet, add it
      const exists = prevTransfers.some(t => t.transferId === progress.transferId);
      if (!exists) {
        return [...prevTransfers, progress];
      }
      
      // Otherwise update the existing transfer
      return prevTransfers.map(transfer => 
        transfer.transferId === progress.transferId ? progress : transfer
      );
    });
  }, []);
  
  // Handler for completed file reception
  const handleFileReceived = useCallback((transferId: string, blob: Blob) => {
    console.log(`File received: ${transferId}, size: ${blob.size}`);
    
    // Find the transfer in our list
    const transfer = transfers.find(t => t.transferId === transferId);
    
    // Update transfer progress to completed
    updateTransferProgress({
      transferId,
      sentChunks: transfer?.totalChunks || 0,
      receivedChunks: transfer?.totalChunks || 0,
      totalChunks: transfer?.totalChunks || 0,
      status: 'completed',
      metadata: transfer?.metadata
    });
    
    // Add to completed files with proper metadata
    const fileName = transfer?.metadata?.name || 
                    Object.values(fileShare.current).find(fs => fs.metadata.filename)?.metadata.filename || 
                    'unknown';
    
    const fileType = transfer?.metadata?.type || 
                    Object.values(fileShare.current).find(fs => fs.metadata.type)?.metadata.type || 
                    'application/octet-stream';
    
    setCompletedFiles(prev => [
      ...prev, 
      { 
        id: transferId,
        blob: blob,
        name: fileName,
        type: fileType,
      }
    ]);
    
    console.log(`Added file to completed files: ${fileName}`);
  }, [transfers, updateTransferProgress]);

  // Improved function to connect to sender with better error handling
  const connectToSender = useCallback(async () => {
    if (!transferId || !socket) {
      setReceiveState({
        status: 'error',
        error: 'No transfer code provided or socket not connected'
      });
      return;
    }
    
    try {
      setReceiveState({
        status: 'connecting',
        error: null
      });
      setIsConnecting(true);
      // Reset any existing state
      fileShare.current = {};
      
      // Clear existing listeners
      socket.off("fs-meta");
      socket.off("fs-share");
      socket.off("sender-not-found");

      // Generate unique receiver ID and store it
      receiverUID.current = `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
      
      console.log(`Joining as receiver with ID: ${receiverUID.current} for sender: ${transferId}`);
      
      // Join as a receiver
      socket.emit("receiver-join", { 
        sender_uid: transferId, 
        uid: receiverUID.current,
        userId: user?.id || 'anonymous-user'
      });

      // Handle file metadata
      socket.on("fs-meta", (metadata) => {
        console.log("Received file metadata:", metadata);
        
        const sessionId = metadata.sessionId;
        const transferId = metadata.transferId || metadata.filename;
        
        // Initialize file share state for this transfer
        fileShare.current[transferId] = {
          metadata,
          transmitted: 0,
          buffer: [],
          sessionId
        };
        
        // Update UI with initial progress
        updateTransferProgress({
          transferId,
          sentChunks: 0,
          totalChunks: Math.ceil(metadata.total_buffer_size / (metadata.buffer_size || 64 * 1024)),
          receivedChunks: 0,
          status: 'transferring',
          metadata: {
            id: transferId,
            name: metadata.filename,
            type: metadata.type || 'application/octet-stream',
            size: metadata.total_buffer_size,
            lastModified: Date.now()
          }
        });
        
        // Set connection as established
        setIsConnected(true);
        setIsConnecting(false);
        setReceiveState({
          status: 'connected',
          error: null
        });
        
        console.log(`Requesting first chunk for ${metadata.filename} with session ID: ${sessionId}`);
        
        // Request the first chunk with correct parameters
        socket.emit("fs-start", { 
          uid: metadata.senderUid,
          sessionId: sessionId,
          receiverId: receiverUID.current
        });
      });

      // Handle file chunks
      socket.on("fs-share", (data) => {
        if (!data || !data.buffer) {
          console.error("Missing buffer in fs-share event");
          return;
        }
        
        const { buffer, transferId, sessionId, chunkIndex, totalChunks, isLastChunk } = data;
        const fileId = transferId || (sessionId && data.sessionId);
        
        console.log(`Received chunk ${chunkIndex + 1}/${totalChunks} for transfer ID: ${fileId}`);
        
        // Get the file state or create a new one if not found
        if (!fileShare.current[fileId]) {
          console.error(`No file state found for transfer ID: ${fileId}`);
          return;
        }
        
        const fileState = fileShare.current[fileId];
        
        // Process the chunk
        const newTransmitted = fileState.transmitted + buffer.byteLength;
        const newBuffer = [...fileState.buffer, buffer];
        
        // Update file state
        fileShare.current[fileId] = {
          ...fileState,
          transmitted: newTransmitted,
          buffer: newBuffer
        };
        
        // Calculate progress
        const progress = Math.round((newTransmitted / fileState.metadata.total_buffer_size) * 100);
        console.log(`File progress: ${progress}% (${newTransmitted}/${fileState.metadata.total_buffer_size} bytes)`);
        
        // Update UI
        updateTransferProgress({
          transferId: fileId,
          sentChunks: Math.ceil(newTransmitted / (fileState.metadata.buffer_size || 64 * 1024)),
          totalChunks: Math.ceil(fileState.metadata.total_buffer_size / (fileState.metadata.buffer_size || 64 * 1024)),
          receivedChunks: Math.ceil(newTransmitted / (fileState.metadata.buffer_size || 64 * 1024)),
          status: newTransmitted === fileState.metadata.total_buffer_size || isLastChunk ? 'completed' : 'transferring',
          metadata: {
            id: fileId,
            name: fileState.metadata.filename,
            type: fileState.metadata.type || 'application/octet-stream',
            size: fileState.metadata.total_buffer_size,
            lastModified: Date.now()
          }
        });

        // Handle file completion
        if (newTransmitted === fileState.metadata.total_buffer_size || isLastChunk) {
          console.log(`File transfer complete: ${fileState.metadata.filename}`);
          
          // Create blob from all chunks
          const blob = new Blob(newBuffer, { 
            type: fileState.metadata.type || 'application/octet-stream' 
          });
          
          // Mark as completed
          handleFileReceived(fileId, blob);
          
          // Notify sender of completion
          socket.emit('transfer-complete', {
            transferId: fileState.metadata.senderUid,
            fileName: fileState.metadata.filename
          });
          
          // Clean up this file's state
          delete fileShare.current[fileId];
        } else {
          // Request next chunk with minimal delay and proper parameters
          setTimeout(() => {
            console.log(`Requesting next chunk for session ${fileState.sessionId}`);
            socket.emit("fs-start", { 
              uid: fileState.metadata.senderUid,
              sessionId: fileState.sessionId,
              receiverId: receiverUID.current
            });
          }, 10); // Minimal delay for faster transfers
        }
      });
      
      // Handle errors
      socket.on('sender-not-found', () => {
        console.error('Sender not found event received');
        setIsConnecting(false);
        setReceiveState({
          status: 'error',
          error: 'Sender not found. The link may be invalid or the sender disconnected.'
        });
      });
      
      // Set a timeout to detect connection failures
      const connectionTimeout = setTimeout(() => {
        if (isConnecting && !isConnected) {
          console.error('Connection timed out');
          setIsConnecting(false);
          setReceiveState({
            status: 'error',
            error: 'Connection timed out. The sender may be offline.'
          });
        }
      }, 15000); // 15 second timeout
      
      return () => {
        clearTimeout(connectionTimeout);
        socket.off("fs-meta");
        socket.off("fs-share");
        socket.off("sender-not-found");
      };
      
    } catch (error) {
      console.error('Error connecting to sender:', error);
      setIsConnecting(false);
      setReceiveState({
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, [transferId, socket, user?.id, updateTransferProgress, handleFileReceived, isConnecting, isConnected]);

  // Function to download a received file
  const downloadFile = useCallback((fileId: string) => {
    const file = completedFiles.find(f => f.id === fileId);
    if (!file) return;
    
    // Create a download link
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }, [completedFiles]);
  
  // Function to download all files
  const downloadAllFiles = useCallback(() => {
    completedFiles.forEach(file => {
      downloadFile(file.id);
    });
  }, [completedFiles, downloadFile]);
  
  // Report connection status to server periodically to help with matching
  useEffect(() => {
    if (!socket || !transferId || !receiverUID.current) return;
    
    // Send periodic status updates to help with matching
    const updateInterval = setInterval(() => {
      socket.emit('receiver-status-update', {
        transferId,
        userId: user?.id || 'anonymous',
        receiverUid: receiverUID.current,
        timestamp: Date.now(),
        connected: isConnected
      });
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(updateInterval);
  }, [socket, transferId, user?.id, isConnected]);

  // Send heartbeat when connected
  useEffect(() => {
    if (isConnected && socket && transferId) {
      // Send heartbeat
      const heartbeatInterval = setInterval(() => {
        socket.emit('receiver-heartbeat', {
          transferId,
          userId: user?.id || 'anonymous-user'
        });
      }, 5000);
      
      return () => clearInterval(heartbeatInterval);
    }
  }, [isConnected, socket, transferId, user?.id]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Receive Files
      </h1>
      
      <div className="mb-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Download size={28} />
          </div>
        </div>
        
        <h2 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-2">
          {completedFiles.length > 0
            ? 'Files Ready to Download'
            : isConnected
            ? 'Connected to Sender'
            : 'Ready to Receive Files'}
        </h2>
        
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          {completedFiles.length > 0
            ? `${completedFiles.length} file(s) have been successfully transferred. You can download them now.`
            : isConnected
            ? 'Waiting for the sender to begin transferring files...'
            : 'Connect to the sender to start receiving files. Your files will be transferred securely using end-to-end encryption.'}
        </p>
        
        {receiveState.status === 'idle' && completedFiles.length === 0 && (
          <>
            {urlTransferId === 'guest' && (
              <div className="mb-4">
                <Input
                  label="Enter transfer code"
                  value={transferCode}
                  onChange={e => setTransferCode(e.target.value)}
                  placeholder="Paste code here"
                  fullWidth
                />
              </div>
            )}
            <div className="flex justify-center mb-6">
              <Button
                onClick={connectToSender}
                size="lg"
                leftIcon={<Shield size={18} />}
                disabled={!transferId || !socket}
              >
                Connect to Sender
              </Button>
            </div>
            
            <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              <Shield size={16} className="mr-2" />
              <span>Secure, encrypted peer-to-peer transfer</span>
            </div>
          </>
        )}
        
        {receiveState.status === 'connecting' && (
          <div className="text-center">
            <Loader size={32} className="mx-auto mb-4 animate-spin text-primary-500" />
            <p className="text-gray-600 dark:text-gray-400">
              Connecting to the sender...
            </p>
          </div>
        )}
        
        {receiveState.status === 'error' && (
          <div className="mt-4 p-4 bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 rounded-md flex items-center">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            <p>{receiveState.error}</p>
          </div>
        )}
      </div>
      
      {/* Transfer Progress */}
      {transfers.length > 0 && !transfers.every(t => t.status === 'completed') && (
        <div className="mb-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Transfer Progress
          </h2>
          
          <div className="space-y-4">
            {transfers.map((transfer) => (
              <TransferProgress
                key={transfer.transferId}
                transfer={transfer}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Completed Files */}
      {completedFiles.length > 0 && (
        <div className="mb-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Ready to Download
            </h2>
            
            {completedFiles.length > 1 && (
              <Button 
                size="sm" 
                onClick={downloadAllFiles}
                leftIcon={<Download size={16} />}
              >
                Download All
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {completedFiles.map((file) => (
              <div 
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-md"
              >
                <div className="flex items-center">
                  <CheckCircle size={20} className="text-success-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.blob.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Download size={16} />}
                  onClick={() => downloadFile(file.id)}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivePage;
