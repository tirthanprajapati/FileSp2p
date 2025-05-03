const io = require('socket.io')(server);
const receivers = new Map();

// Handle transfer initiation
socket.on('initiateTransfer', (data) => {
  const { senderUid, files } = data;
  
  // Look up the receiver socket IDs for this sender
  const receiversForSender = Array.from(receivers.entries())
    .filter(([_, receiverData]) => receiverData.senderUid === senderUid)
    .map(([socketId, _]) => socketId);
  
  if (receiversForSender.length === 0) {
    // No receivers found, notify the sender
    socket.emit('transferError', { message: 'No connected receivers found' });
    return;
  }
  
  // Notify receivers about the incoming files
  for (const receiverSocketId of receiversForSender) {
    io.to(receiverSocketId).emit('incomingFiles', { files });
  }
  
  // Confirm to the sender that receivers are ready
  socket.emit('readyForTransfer', { receiverCount: receiversForSender.length });
  
  console.log(`Transfer initiated from ${senderUid} to ${receiversForSender.length} receivers`);
});

module.exports = { io, receivers };