import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

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

const CHUNK_SIZE = 16 * 1024; // 16KB chunks

export function createPeer(initiator: boolean, socket: Socket, recipientId: string): Peer.Instance {
  // Create a WebRTC peer
  const peer = new Peer({
    initiator,
    trickle: true,
  });

  // Handle ICE candidates
  peer.on('signal', (data) => {
    socket.emit('signal', {
      to: recipientId,
      signal: data,
    });
  });

  // Handle socket signals
  socket.on('signal', (data) => {
    if (data.from === recipientId) {
      peer.signal(data.signal);
    }
  });

  return peer;
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
  peer: Peer.Instance,
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
  peer: Peer.Instance,
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