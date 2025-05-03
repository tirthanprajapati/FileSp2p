import React, { useState, useEffect } from 'react';
import socket from '../socket';

const ReceiveFiles = () => {
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [statusMessage, setStatusMessage] = useState('');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // Handle when sender is ready
    socket.on('senderReady', () => {
      setConnectionStatus('Connected to Sender');
      setStatusMessage('Sender is connected. Waiting for files...');
    });
    
    // Handle incoming file information
    socket.on('incomingFiles', (data) => {
      setFiles(data.files);
      setStatusMessage('Receiving files...');
    });
    
    // Clean up event listeners on unmount
    return () => {
      socket.off('senderReady');
      socket.off('incomingFiles');
    };
  }, [socket]);

  return (
    <div>
      <h2>File Receiver</h2>
      <p>Status: {connectionStatus}</p>
      <p>{statusMessage}</p>
      <ul>
        {files.map((file, index) => (
          <li key={index}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ReceiveFiles;