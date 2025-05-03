import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import setupSocketHandlers from './socketHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import transferRoutes from './routes/transfers.js';
import userRoutes from './routes/users.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with our enhanced handler
setupSocketHandlers(server, process.env.CLIENT_URL || 'http://localhost:5173');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/users', userRoutes);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});