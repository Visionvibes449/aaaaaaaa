const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/error');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/uploads', fileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve uploads directory in production
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.IO setup
let io;
const initializeSocketIO = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join_user', (userId) => {
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined their room`);
    });

    // Join ticket-specific room
    socket.on('join_ticket', (ticketId) => {
      socket.join(`ticket:${ticketId}`);
      logger.info(`Joined ticket room: ${ticketId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // Make io accessible globally
  global.io = io;
  
  return io;
};

module.exports = { app, initializeSocketIO };
