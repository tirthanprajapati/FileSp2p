import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Shield, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import TransferProgress from '../components/transfer/TransferProgress';
import { useSocket } from '../context/SocketContext';
import { createPeer, setupFileReceiver, TransferProgress as TransferProgressType } from '../utils/webrtc';

const ReceivePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { socket, connected } = useSocket();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transfers, setTransfers] = useState<TransferProgressType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [completedFiles, setCompletedFiles] = useState<{ id: string; blob: Blob; name: string; type: string }[]>([]);
  
  const updateTransferProgress = (progress: TransferProgressType) => {
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
  };
  
  const handleFileReceived = (transferId: string, blob: Blob) => {
    // Mark the transfer as completed
    updateTransferProgress({
      transferId,
      sentChunks: 0,
      receivedChunks: 0,
      totalChunks: 0,
      status: 'completed',
    });
    
    // Get the metadata for this transfer
    const transfer = transfers.find(t => t.transferId === transferId);
    if (transfer?.metadata) {
      // Add to completed files
      setCompletedFiles(prev => [
        ...prev, 
        { 
          id: transferId,
          blob,
          name: transfer.metadata?.name || 'unknown-file',
          type: transfer.metadata?.type || 'application/octet-stream',
        }
      ]);
    }
  };
  
  const connectToSender = () => {
    if (!socket || !connected || !id) {
      setError('Cannot connect to the transfer. Please try again later.');
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Tell the server we're ready to receive
      socket.emit('ready_to_receive', { transferId: id });
      
      // Create a WebRTC peer (not as initiator)
      const peer = createPeer(false, socket, id);
      
      // Set up the file receiver
      setupFileReceiver(peer, updateTransferProgress, handleFileReceived);
      
      // When connected to the peer
      peer.on('connect', () => {
        console.log('Connected to sender');
        setIsConnected(true);
        setIsConnecting(false);
      });
      
      // Handle connection error
      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        setError('Failed to connect to the sender. They may be offline.');
        setIsConnecting(false);
      });
    } catch (err) {
      console.error('Error connecting to sender:', err);
      setError('Failed to set up connection');
      setIsConnecting(false);
    }
  };
  
  const downloadFile = (fileId: string) => {
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
  };
  
  const downloadAllFiles = () => {
    // For multiple files, either create a zip or download them one by one
    completedFiles.forEach(file => {
      downloadFile(file.id);
    });
  };
  
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
        
        {!isConnected && !isConnecting && completedFiles.length === 0 && (
          <>
            <div className="flex justify-center mb-6">
              <Button
                onClick={connectToSender}
                size="lg"
                leftIcon={<Shield size={18} />}
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
        
        {isConnecting && (
          <div className="text-center">
            <Loader size={32} className="mx-auto mb-4 animate-spin text-primary-500" />
            <p className="text-gray-600 dark:text-gray-400">
              Connecting to the sender...
            </p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 rounded-md flex items-center">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            <p>{error}</p>
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