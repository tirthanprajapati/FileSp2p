import React, { useState } from 'react';
import socket from '../socket';

const SendFiles = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [transferStatus, setTransferStatus] = useState('');

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const startTransfer = () => {
    setTransferStatus('Establishing connection');
    
    // First, make sure we're registered as a sender
    socket.emit('senderJoin', senderUid);
    
    // Listen for receiver connection confirmation
    socket.on('receiverConnected', (receiverUid) => {
      console.log(`Connected to receiver: ${receiverUid}`);
      
      // Initiate the actual transfer
      socket.emit('initiateTransfer', {
        senderUid,
        files: selectedFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      });
    });
    
    // Handle transfer ready confirmation
    socket.on('readyForTransfer', (data) => {
      setTransferStatus('Sending files');
      beginFileTransfer();
    });
    
    // Handle transfer errors
    socket.on('transferError', (error) => {
      setTransferStatus(`Error: ${error.message}`);
    });
  };

  const beginFileTransfer = () => {
    // Implement the actual file transfer logic
    // This could involve chunking files and sending them via socket.io
    // ...existing file transfer implementation...
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={startTransfer}>Send Files</button>
      <p>{transferStatus}</p>
    </div>
  );
};

export default SendFiles;