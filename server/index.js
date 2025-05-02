import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Simple in-memory database for demo purposes
// In a real app, you'd use MongoDB or another database
const users = [];
const transfers = [];
const activeConnections = new Map();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// API Routes
app.use('/api', (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const userId = `user_${Date.now()}`;
    const newUser = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Create token
    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Send response
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        username,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Send response
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = users.find(user => user.id === decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Send response
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle signaling for WebRTC
  socket.on('signal', (data) => {
    // Forward the signal to the recipient
    io.to(data.to).emit('signal', {
      from: socket.id,
      signal: data.signal
    });
  });
  
  // Handle connection requests
  socket.on('ready_to_connect', ({ transferId, senderId }) => {
    console.log(`Sender ${senderId} ready to connect for transfer ${transferId}`);
    
    // Store the connection info
    activeConnections.set(transferId, {
      senderId: socket.id,
      senderUserId: senderId,
      timestamp: Date.now()
    });
    
    // Join a room with the transfer ID
    socket.join(transferId);
  });
  
  socket.on('ready_to_receive', ({ transferId }) => {
    console.log(`Receiver ready to connect for transfer ${transferId}`);
    
    // Check if the transfer exists
    const connection = activeConnections.get(transferId);
    if (connection) {
      // Join the transfer room
      socket.join(transferId);
      
      // Notify the sender that a receiver is ready
      io.to(connection.senderId).emit('receiver_connected', {
        transferId,
        receiverId: socket.id
      });
    } else {
      // Transfer not found or expired
      socket.emit('error', {
        message: 'Transfer not found or expired'
      });
    }
  });
  
  // Clean up on disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    
    // Remove any active connections where this socket was the sender
    for (const [transferId, connection] of activeConnections.entries()) {
      if (connection.senderId === socket.id) {
        activeConnections.delete(transferId);
        console.log(`Cleaned up transfer ${transferId}`);
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});