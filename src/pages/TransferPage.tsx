import React, { useState, useEffect } from 'react';
import { Send, Link as LinkIcon, CheckCircle, Copy, Zap } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FileDropZone from '../components/transfer/FileDropZone';
import TransferProgress from '../components/transfer/TransferProgress';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { prepareFileForTransfer, sendFileViaPeer, createPeer, TransferProgress as TransferProgressType } from '../utils/webrtc';
import { v4 as uuidv4 } from 'uuid';

const TransferPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [transferId, setTransferId] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [transfers, setTransfers] = useState<TransferProgressType[]>([]);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      // Generate a unique ID for this transfer
      const newTransferId = uuidv4();
      setTransferId(newTransferId);
      
      // In a real app, we'd register this transfer with the server
      // socket.emit('create_transfer', { transferId: newTransferId, fileInfo: ... });
      
      // Create a shareable URL
      const url = `${window.location.origin}/receive/${newTransferId}`;
      setShareUrl(url);
      
      // Add metadata to transfer object
      const initialTransfers: TransferProgressType[] = selectedFiles.map(file => ({
        transferId: uuidv4(),
        sentChunks: 0,
        totalChunks: Math.ceil(file.size / (16 * 1024)), // 16KB chunks
        receivedChunks: 0,
        status: 'waiting',
        metadata: {
          id: uuidv4(),
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
        },
      }));
      
      setTransfers(initialTransfers);
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
  
  const updateTransferProgress = (progress: TransferProgressType) => {
    setTransfers(prevTransfers => 
      prevTransfers.map(transfer => 
        transfer.transferId === progress.transferId ? progress : transfer
      )
    );
  };
  
  const startTransfer = async () => {
    if (!socket || !connected) {
      setError('Socket connection not available');
      return;
    }
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }
    
    try {
      // Signal the server that we're ready to connect to a peer
      socket.emit('ready_to_connect', { transferId, senderId: user?.id });
      
      // Create a WebRTC peer (as initiator)
      const peer = createPeer(true, socket, transferId);
      
      // When the connection is established
      peer.on('connect', async () => {
        console.log('Peer connection established');
        
        // Process each file
        for (const file of selectedFiles) {
          // Prepare the file for transfer (split into chunks)
          const { metadata, chunks } = await prepareFileForTransfer(file);
          
          // Send the file over the peer connection
          sendFileViaPeer(peer, metadata, chunks, updateTransferProgress);
        }
      });
      
      // Update all transfers to 'connecting' status
      setTransfers(prevTransfers => 
        prevTransfers.map(transfer => ({
          ...transfer,
          status: 'connecting',
        }))
      );
    } catch (err) {
      console.error('Error starting transfer:', err);
      setError('Failed to start transfer');
      
      // Update all transfers to 'error' status
      setTransfers(prevTransfers => 
        prevTransfers.map(transfer => ({
          ...transfer,
          status: 'error',
          error: 'Connection failed',
        }))
      );
    }
  };
  
  const handleRetry = (transferId: string) => {
    // In a real implementation, we would reinitiate just that specific transfer
    console.log('Retrying transfer:', transferId);
    
    // For demo, we'll just reset the status
    setTransfers(prevTransfers => 
      prevTransfers.map(transfer => 
        transfer.transferId === transferId 
          ? { ...transfer, status: 'waiting', error: undefined } 
          : transfer
      )
    );
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
            {transfers.map((transfer) => (
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