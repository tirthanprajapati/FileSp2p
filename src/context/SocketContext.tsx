import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Only connect if authenticated
    if (isAuthenticated && user) {
      // Connect to the socket server
      const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
        withCredentials: true,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      // Save the socket instance
      setSocket(socketInstance);

      // Cleanup on unmount
      return () => {
        socketInstance.disconnect();
      };
    } else if (socket) {
      // Disconnect if logged out
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};