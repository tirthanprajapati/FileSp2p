// Socket.IO handler for peer-to-peer file transfers
import { Server } from 'socket.io';

// Maps to track senders and receivers
const senders = new Map();
const receivers = new Map();
const activeTransfers = new Map();

export default function setupSocketHandlers(server, corsOrigin) {
  const io = new Server(server, {
    cors: {
      origin: corsOrigin || 'http://localhost:5173',
      credentials: true,
      maxHttpBufferSize: 1e8 // 100 MB max buffer size for large file chunks
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle sender registration
    socket.on('sender-join', (data) => {
      console.log('Sender joined with ID:', data.uid);
      senders.set(data.uid, socket.id);
      
      // Store additional sender metadata
      const senderInfo = {
        socketId: socket.id,
        userId: data.userId || 'anonymous',
        connectTime: Date.now(),
        files: data.files || []
      };
      
      activeTransfers.set(data.uid, {
        sender: senderInfo,
        receivers: []
      });
      
      console.log('Current senders:', Array.from(senders.entries()));
    });
    
    // Enhanced receiver join handler
    socket.on('receiver-join', (data) => {
      console.log('Receiver joined with data:', data);
      
      // Store more information about the receiver for better matching
      const receiverInfo = {
        senderUid: data.sender_uid,
        uid: data.uid,
        userId: data.userId || 'anonymous',
        joinTime: Date.now(),
        socketId: socket.id
      };
      
      receivers.set(socket.id, receiverInfo);
      
      // Add receiver to the active transfer if exists
      if (activeTransfers.has(data.sender_uid)) {
        const transfer = activeTransfers.get(data.sender_uid);
        transfer.receivers.push(receiverInfo);
      }
      
      console.log(`Receiver map updated - Socket ID: ${socket.id}, UID: ${data.uid}`);
      
      // If sender exists, connect them
      if (senders.has(data.sender_uid)) {
        console.log(`Sender found with ID ${data.sender_uid}, emitting init event`);
        // Notify sender about the receiver with more details
        io.to(senders.get(data.sender_uid)).emit('init', {
          uid: data.uid,
          socketId: socket.id,
          userId: data.userId || 'anonymous'
        });
      } else {
        console.log(`Sender ${data.sender_uid} not found in senders map`);
      }
    });
    
    // Enhanced file metadata handling
    socket.on('fs-meta', (data) => {
      console.log('File metadata received:', data.filename);
      
      let receiverFound = false;
      let targetSocketId = null;
      
      // 1. Direct lookup by receiverId
      for (const [receiverSocketId, info] of receivers.entries()) {
        if (info.uid === data.receiverId || info.socketId === data.receiverId) {
          console.log('Found receiver by direct UID match');
          targetSocketId = receiverSocketId;
          receiverFound = true;
          break;
        }
      }
      
      // 2. Socket ID match
      if (!receiverFound && receivers.has(data.receiverId)) {
        console.log('Found receiver by direct socket ID match');
        targetSocketId = data.receiverId;
        receiverFound = true;
      }
      
      // 3. Match by sender UID
      if (!receiverFound) {
        for (const [receiverSocketId, info] of receivers.entries()) {
          if (info.senderUid === data.senderUid) {
            console.log('Found receiver by sender UID match');
            targetSocketId = receiverSocketId;
            receiverFound = true;
            break;
          }
        }
      }
      
      if (receiverFound && targetSocketId) {
        console.log(`Forwarding metadata to receiver: ${targetSocketId}`);
        io.to(targetSocketId).emit('fs-meta', data);
      } else {
        console.log('No matching receiver found for this metadata');
        // Notify sender that receiver is not available
        socket.emit('receiver-not-found', { 
          transferId: data.transferId || data.sessionId,
          filename: data.filename 
        });
      }
    });
    
    // File chunk transfer handler
    socket.on('fs-share', (data) => {
      // Find the receiver's socket ID by iterating through the receivers map
      let receiverFound = false;
      
      // First try to find by sender UID (most common case)
      for (const [receiverSocketId, info] of receivers.entries()) {
        if (info.senderUid === data.senderUid) {
          io.to(receiverSocketId).emit('fs-share', data);
          receiverFound = true;
          break;
        }
      }
      
      // If not found by sender UID, try by receiver ID if specified
      if (!receiverFound && data.receiverId) {
        for (const [receiverSocketId, info] of receivers.entries()) {
          if (info.uid === data.receiverId) {
            io.to(receiverSocketId).emit('fs-share', data);
            receiverFound = true;
            break;
          }
        }
      }
      
      if (!receiverFound) {
        socket.emit('receiver-not-found', { 
          transferId: data.transferId || data.sessionId,
          chunkIndex: data.chunkIndex 
        });
      }
    });
    
    // Handle fs-start request from receiver
    socket.on('fs-start', (data) => {
      // Find the sender for this transfer
      let senderSocketId = null;
      
      for (const [senderUid, sid] of senders.entries()) {
        if (senderUid === data.uid) {
          senderSocketId = sid;
          break;
        }
      }
      
      if (senderSocketId) {
        io.to(senderSocketId).emit('fs-start', data);
      } else {
        console.log('No sender found for fs-start request');
        socket.emit('sender-not-found', { receiverId: data.uid });
      }
    });
    
    // Handle check-receivers request
    socket.on('check-receivers', (data, callback) => {
      const { senderUid } = data;
      let hasReceivers = false;
      let receiverId = null;
      
      // Check if there are any receivers waiting for this sender
      for (const [receiverSocketId, info] of receivers.entries()) {
        if (info.senderUid === senderUid) {
          hasReceivers = true;
          receiverId = receiverSocketId;
          break;
        }
      }
      
      // Send response to sender
      if (callback && typeof callback === 'function') {
        callback({ hasReceivers, receiverId });
      }
    });
    
    // Handle heartbeats and status updates
    socket.on('receiver-status-update', (data) => {
      if (receivers.has(socket.id)) {
        const currentInfo = receivers.get(socket.id);
        receivers.set(socket.id, {
          ...currentInfo,
          lastUpdate: Date.now(),
          ...data
        });
      }
    });
    
    socket.on('receiver-heartbeat', (data) => {
      // Find the sender for this transfer
      if (data.transferId) {
        for (const [senderUid, sid] of senders.entries()) {
          if (senderUid === data.transferId) {
            io.to(sid).emit('receiver-heartbeat', {
              receiverId: socket.id,
              userId: data.userId
            });
            break;
          }
        }
      }
    });
    
    // Handle transfer completed events
    socket.on('transfer-complete', (data) => {
      console.log('Transfer completed:', data);
      
      // Notify the other party
      if (senders.has(data.transferId)) {
        io.to(senders.get(data.transferId)).emit('transfer-complete', {
          fileName: data.fileName,
          receiverId: socket.id
        });
      }
    });
    
    // Handle disconnections
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up from senders map
      for (const [uid, sid] of senders.entries()) {
        if (sid === socket.id) {
          senders.delete(uid);
          // Also remove from active transfers
          activeTransfers.delete(uid);
          break;
        }
      }
      
      // Clean up from receivers map and notify senders
      if (receivers.has(socket.id)) {
        const receiverInfo = receivers.get(socket.id);
        
        // Notify the sender if this receiver disconnects
        if (receiverInfo.senderUid && senders.has(receiverInfo.senderUid)) {
          io.to(senders.get(receiverInfo.senderUid)).emit('receiver-disconnected', {
            receiverId: socket.id,
            uid: receiverInfo.uid
          });
        }
        
        receivers.delete(socket.id);
      }
    });
  });

  return io;
}