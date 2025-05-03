import SimplePeer from 'simple-peer';
import { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

export type PeerInstance = SimplePeer.Instance;

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
}

export interface FileChunk {
  metadata?: FileMetadata;
  data: ArrayBuffer;
  chunkIndex: number;
  totalChunks: number;
}

export interface TransferProgress {
  transferId: string;
  sentChunks: number;
  totalChunks: number;
  receivedChunks: number;
  status: 'waiting' | 'connecting' | 'transferring' | 'completed' | 'error' | 'paused';
  error?: string;
  metadata?: FileMetadata;
}

export interface FileTransfer {
  file: File;
  status: 'preparing' | 'transferring' | 'completed' | 'error';
  receiverId: string;
  sentChunks: number;
  totalChunks: number;
}

const CHUNK_SIZE = 16 * 1024; // 16KB chunks

export function createPeer(
  initiator: boolean,
  socket: Socket,
  roomId: string,
  userId: string // Add userId parameter
): SimplePeer.Instance {
  console.log(`Creating peer - initiator: ${initiator}, roomId: ${roomId}, userId: ${userId}`);
  
  try {
    // Create the peer with explicit configuration
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    // Send signal with userId included
    peer.on('signal', (signalData) => {
      console.log(`Sending signal from ${userId} for room ${roomId}`, signalData.type);
      socket.emit('signal', { 
        to: roomId, 
        from: userId, // Include userId
        signal: signalData 
      });
    });

    // Debug events
    peer.on('connect', () => {
      console.log(`Peer connection established for ${userId} in room ${roomId}`);
      
      // Emit connection confirmation to room
      socket.emit('peer-connected', { 
        room: roomId, 
        userId: userId,
        role: initiator ? 'sender' : 'receiver'
      });
      
      // Send connection confirmation directly to peer
      try {
        peer.send(JSON.stringify({ 
          type: 'connection-confirmed',
          userId: userId,
          role: initiator ? 'sender' : 'receiver'
        }));
      } catch (err) {
        console.warn('Could not send connection confirmation:', err);
      }
    });

    peer.on('error', (err) => {
      console.error(`Peer error for ${userId} in room ${roomId}:`, err);
    });

    // Handle incoming signals
    socket.on('signal', (data) => {
      console.log(`Received signal for room ${roomId} from ${data.from}`, data.signal.type);
      
      if (data && data.signal && typeof peer.signal === 'function') {
        try {
          peer.signal(data.signal);
        } catch (err) {
          console.error('Error processing signal:', err);
        }
      }
    });
    
    // Listen for the peer-connected event for the room
    socket.on('peer-connected', (data) => {
      if (data.room === roomId && data.userId !== userId) {
        console.log(`Peer ${data.userId} (${data.role}) connected to room ${roomId}`);
        
        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('peerConnectionStatus', {
          detail: { 
            connected: true,
            peerId: data.userId,
            role: data.role,
            roomId: roomId
          }
        });
        window.dispatchEvent(event);
      }
    });

    return peer;
  } catch (error) {
    console.error('Error creating peer:', error);
    throw error;
  }
}

export async function prepareFileForTransfer(file: File): Promise<{ 
  metadata: FileMetadata; 
  chunks: ArrayBuffer[];
}> {
  // Create file metadata
  const metadata: FileMetadata = {
    id: uuidv4(),
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
  };

  // Split file into chunks
  const chunks: ArrayBuffer[] = [];
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunk = await file.slice(start, end).arrayBuffer();
    chunks.push(chunk);
  }

  return { metadata, chunks };
}

export function sendFileViaPeer(
  peer: PeerInstance,
  metadata: FileMetadata,
  chunks: ArrayBuffer[],
  onProgress: (progress: TransferProgress) => void
): string {
  const transferId = metadata.id;
  const totalChunks = chunks.length;
  let sentChunks = 0;
  
  // Send metadata first
  peer.send(JSON.stringify({ 
    type: 'metadata', 
    transferId, 
    metadata 
  }));
  
  // Update progress
  const updateProgress = () => {
    onProgress({
      transferId,
      sentChunks,
      totalChunks,
      receivedChunks: 0, // Not tracking received on sender side
      status: sentChunks === totalChunks ? 'completed' : 'transferring',
      metadata,
    });
  };
  
  // Start sending chunks
  const sendNextChunk = () => {
    if (sentChunks < totalChunks) {
      // Prepare chunk data
      const chunkData: FileChunk = {
        data: chunks[sentChunks],
        chunkIndex: sentChunks,
        totalChunks,
      };
      
      // Convert data to buffer for transfer
      peer.send(JSON.stringify({
        type: 'chunk-header',
        transferId,
        chunkIndex: sentChunks,
        totalChunks,
      }));
      
      // Send binary data
      peer.send(chunkData.data);
      
      // Update progress
      sentChunks++;
      updateProgress();
      
      // Schedule next chunk (throttle to avoid overwhelming the connection)
      setTimeout(sendNextChunk, 10);
    }
  };
  
  // Start sending process
  updateProgress();
  sendNextChunk();
  
  return transferId;
}

export function setupFileReceiver(
  peer: PeerInstance,
  onProgress: (progress: TransferProgress) => void,
  onComplete: (transferId: string, file: Blob) => void
): void {
  const transfers = new Map<string, {
    metadata: FileMetadata;
    chunks: (ArrayBuffer | null)[];
    receivedChunks: number;
    totalChunks: number;
    currentChunkIndex?: number;
  }>();
  
  peer.on('data', (data) => {
    // Handle string messages (metadata or headers)
    if (typeof data === 'string') {
      try {
        const message = JSON.parse(data);
        
        // Handle connection-confirmed message
        if (message.type === 'connection-confirmed') {
          console.log(`Connection confirmed by ${message.role} (${message.userId})`);
          // Dispatch event to notify components
          const event = new CustomEvent('peerConnectionConfirmed', {
            detail: { userId: message.userId, role: message.role }
          });
          window.dispatchEvent(event);
          return;
        }
        
        if (message.type === 'metadata') {
          // Initialize a new transfer
          const { transferId, metadata } = message;
          transfers.set(transferId, {
            metadata,
            chunks: new Array(Math.ceil(metadata.size / CHUNK_SIZE)).fill(null),
            receivedChunks: 0,
            totalChunks: Math.ceil(metadata.size / CHUNK_SIZE),
          });
          
          // Report initial progress
          onProgress({
            transferId,
            sentChunks: 0,
            totalChunks: Math.ceil(metadata.size / CHUNK_SIZE),
            receivedChunks: 0,
            status: 'transferring',
            metadata,
          });
          
          // Send acknowledgment back to sender
          peer.send(JSON.stringify({
            type: 'metadata-received',
            transferId
          }));
        } else if (message.type === 'chunk-header') {
          // Prepare to receive the next chunk of data
          const { transferId, chunkIndex } = message;
          const transfer = transfers.get(transferId);
          
          if (transfer) {
            transfer.currentChunkIndex = chunkIndex;
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    } 
    // Handle binary data (file chunks)
    else if (data instanceof ArrayBuffer) {
      // Find the transfer this chunk belongs to
      for (const [transferId, transfer] of transfers.entries()) {
        if (transfer.currentChunkIndex !== undefined) {
          // Store the chunk
          transfer.chunks[transfer.currentChunkIndex] = data;
          transfer.receivedChunks++;
          delete transfer.currentChunkIndex;
          
          // Update progress
          onProgress({
            transferId,
            sentChunks: transfer.totalChunks, // Assume all sent from sender
            totalChunks: transfer.totalChunks,
            receivedChunks: transfer.receivedChunks,
            status: transfer.receivedChunks === transfer.totalChunks ? 'completed' : 'transferring',
            metadata: transfer.metadata,
          });
          
          // Check if transfer is complete
          if (transfer.receivedChunks === transfer.totalChunks) {
            // Remove null chunks (shouldn't happen in normal operation)
            const validChunks = transfer.chunks.filter(
              (chunk): chunk is ArrayBuffer => chunk !== null
            );
            
            // Combine chunks into a single blob
            const blob = new Blob(validChunks, { type: transfer.metadata.type });
            
            // Call completion callback
            onComplete(transferId, blob);
            
            // Clean up
            transfers.delete(transferId);
          }
          
          break; // We've handled this chunk
        }
      }
    }
  });
}

export function setupFileSender(
  peer: PeerInstance,
  userId: string // Add userId parameter
): {
  sendFile: (file: File, receiverId: string) => Promise<string>;
  cancelTransfer: (transferId: string) => void;
} {
  const transfers = new Map<string, FileTransfer>();
  
  // Listen for data from the peer
  peer.on('data', (data) => {
    if (typeof data === 'string') {
      try {
        const message = JSON.parse(data);
        
        // Handle connection confirmation
        // Handle connection confirmation
        if (message.type === 'connection-confirmed') {
          console.log(`Connection confirmed by receiver (${message.userId})`);
          
          // Dispatch event to notify components
          const event = new CustomEvent('peerConnectionConfirmed', {
            detail: { userId: message.userId }
          });
          window.dispatchEvent(event);
          
          // Resume any waiting transfers
          transfers.forEach((transfer, id) => {
            if (transfer.status === 'preparing') {
              console.log(`Resuming transfer ${id} after connection confirmed`);
              sendNextChunk(id);
            }
          });
        }
        
        // Handle metadata acknowledgment
        if (message.type === 'metadata-received') {
          const { transferId } = message;
          console.log(`Metadata received confirmation for transfer ${transferId}`);
          
          const transfer = transfers.get(transferId);
          if (transfer && transfer.status === 'preparing') {
            console.log(`Starting to send chunks for transfer ${transferId}`);
            transfer.status = 'transferring';
            sendNextChunk(transferId);
          }
        }
      } catch (err) {
        console.error('Error parsing message from peer:', err);
      }
    }
  });
  
  // Send file function
  const sendFile = async (file: File, receiverId: string): Promise<string> => {
    // Create a unique transfer ID
    const transferId = uuidv4();
    
    // Store transfer information
    transfers.set(transferId, {
      file,
      status: 'preparing',
      receiverId,
      sentChunks: 0,
      totalChunks: Math.ceil(file.size / CHUNK_SIZE)
    });
    
    // Send file metadata first with more robust identification info
    peer.send(JSON.stringify({
      type: 'file-metadata',
      transferId,
      metadata: {
        name: file.name,
        type: file.type,
        size: file.size
      },
      receiverId, // Include the receiver's ID
      senderUid: userId, // Include sender ID for fallback matching
      timestamp: Date.now(), // Add timestamp for logging/debugging
      socketReceiverId: receiverId // Ensure consistent format
    }));
    
    // Start sending chunks
    await sendNextChunk(transferId);
    
    return transferId;
  };
  
  // Cancel transfer function
  const cancelTransfer = (transferId: string): void => {
    // Implement cancel logic here
    if (transfers.has(transferId)) {
      transfers.delete(transferId);
    }
  };

  async function sendNextChunk(transferId: string): Promise<void> {
    const transfer = transfers.get(transferId);
    
    if (!transfer) {
      throw new Error(`Transfer with ID ${transferId} not found`);
    }
    
    // Update status to transferring if it's still preparing
    if (transfer.status === 'preparing') {
      transfer.status = 'transferring';
    }
    
    // Check if there are more chunks to send
    if (transfer.sentChunks < transfer.totalChunks) {
      try {
        // Calculate chunk position
        const start = transfer.sentChunks * CHUNK_SIZE;
        const end = Math.min(transfer.file.size, start + CHUNK_SIZE);
        
        // Get chunk data
        const chunkData = await transfer.file.slice(start, end).arrayBuffer();
        
        // Send chunk header
        peer.send(JSON.stringify({
          type: 'file-chunk',
          transferId,
          chunkIndex: transfer.sentChunks,
          totalChunks: transfer.totalChunks,
          receiverId: transfer.receiverId,
          senderUid: userId, // Include sender ID for better matching
          timestamp: Date.now() // Add timestamp for tracking
        }));
        
        // Send the binary data
        peer.send(chunkData);
        
        // Update sent chunks count
        transfer.sentChunks++;
        
        // If there are more chunks to send, schedule the next one
        if (transfer.sentChunks < transfer.totalChunks) {
          // Small delay to prevent overwhelming the connection
          setTimeout(() => sendNextChunk(transferId), 10);
        } else {
          // All chunks sent, update status
          transfer.status = 'completed';
          console.log(`File transfer ${transferId} completed`);
        }
        
        return Promise.resolve();
      } catch (error) {
        console.error(`Error sending chunk for transfer ${transferId}:`, error);
        transfer.status = 'error';
        throw error;
      }
    }
  }

  return {
    sendFile,
    cancelTransfer
  };
}
