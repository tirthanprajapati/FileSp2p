const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3000;

const receiversMap = new Map();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
    receiversMap.delete(socket.id);
  });

  socket.on('register-receiver', (data) => {
    receiversMap.set(socket.id, data);
  });

  // Handle file transfer events
  socket.on('transfer-start', (data) => {
    console.log(`Transfer started by sender ${data.senderUid}`);
    
    // Find all receivers for this sender
    const receiversForSender = [];
    for (const [socketId, userData] of receiversMap.entries()) {
      if (userData.senderUid === data.senderUid) {
        receiversForSender.push(socketId);
      }
    }
    
    // Notify all receivers that transfer is starting
    receiversForSender.forEach(receiverSocketId => {
      io.to(receiverSocketId).emit('transfer-start', data);
    });
  });
  
  // Handle file chunks
  socket.on('file-chunk', (data) => {
    // Find all receivers for this sender
    const receiversForSender = [];
    for (const [socketId, userData] of receiversMap.entries()) {
      if (userData.senderUid === data.senderUid) {
        receiversForSender.push(socketId);
      }
    }
    
    // Forward the chunk to all receivers
    receiversForSender.forEach(receiverSocketId => {
      io.to(receiverSocketId).emit('file-chunk', data);
    });
  });
  
  // Handle file completion
  socket.on('file-complete', (data) => {
    console.log(`File ${data.fileName} transfer completed by sender ${data.senderUid}`);
    
    // Find all receivers for this sender
    const receiversForSender = [];
    for (const [socketId, userData] of receiversMap.entries()) {
      if (userData.senderUid === data.senderUid) {
        receiversForSender.push(socketId);
      }
    }
    
    // Notify all receivers of completion
    receiversForSender.forEach(receiverSocketId => {
      io.to(receiverSocketId).emit('file-complete', data);
    });
  });
  
  // ...existing socket event handlers...
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});