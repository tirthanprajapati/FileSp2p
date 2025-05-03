/**
 * Debug helper for FileSp2p
 * Provides utilities for logging and diagnosing connection issues
 */

// Log the current state of senders and receivers
const logConnectionState = (senders, receivers) => {
  console.log('=== CONNECTION STATE ===');
  
  console.log('Senders:');
  console.log(Array.from(senders.entries()));
  
  console.log('Receivers:');
  const receiverEntries = Array.from(receivers.entries());
  console.log(receiverEntries);
  
  // Log any potential issues
  const senderUids = Array.from(senders.keys());
  const receiverSenderUids = new Set(Array.from(receivers.values()).map(r => r.senderUid));
  
  console.log('Orphaned receivers (no matching sender):');
  for (const senderUid of receiverSenderUids) {
    if (!senderUids.includes(senderUid)) {
      console.log(`Receiver waiting for sender: ${senderUid}`);
    }
  }
  
  console.log('========================');
};

module.exports = {
  logConnectionState
};
