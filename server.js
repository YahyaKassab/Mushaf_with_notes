require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const mushafRoutes = require('./routes/mushafs');
const pageRoutes = require('./routes/pages');
const noteRoutes = require('./routes/notes');
const interactionRoutes = require('./routes/interactions');
const markRoutes = require('./routes/marks');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.API_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for images
app.use('/images', express.static('public/images'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mushaf with Notes API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mushafs', mushafRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/search', searchRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Mushaf with Notes API',
    version: '1.0.0',
    documentation: {
      auth: {
        POST: ['/api/auth/register', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout'],
        GET: ['/api/auth/profile'],
        PUT: ['/api/auth/profile']
      },
      mushafs: {
        GET: ['/api/mushafs', '/api/mushafs/:id', '/api/mushafs/:id/statistics'],
        POST: ['/api/mushafs'],
        PUT: ['/api/mushafs/:id'],
        DELETE: ['/api/mushafs/:id'],
        PATCH: ['/api/mushafs/:id/current-page']
      },
      pages: {
        GET: [
          '/api/pages', 
          '/api/pages/:pageNumber', 
          '/api/pages/:pageNumber/metadata',
          '/api/pages/:pageNumber/words',
          '/api/pages/:pageNumber/lines',
          '/api/pages/:pageNumber/search'
        ]
      },
      notes: {
        GET: ['/api/notes', '/api/notes/:id', '/api/notes/page/:pageId', '/api/notes/search'],
        POST: ['/api/notes'],
        PUT: ['/api/notes/:id'],
        DELETE: ['/api/notes/:id']
      },
      interactions: {
        GET: ['/api/interactions', '/api/interactions/:id', '/api/interactions/word/:wordId'],
        POST: ['/api/interactions', '/api/interactions/toggle'],
        PUT: ['/api/interactions/:id'],
        DELETE: ['/api/interactions/:id']
      },
      marks: {
        GET: [
          '/api/marks', 
          '/api/marks/:id', 
          '/api/marks/word/:wordId',
          '/api/marks/category/:category',
          '/api/marks/search'
        ],
        POST: ['/api/marks'],
        PUT: ['/api/marks/:id'],
        DELETE: ['/api/marks/:id']
      },
      search: {
        GET: ['/api/search', '/api/search/notes', '/api/search/quran', '/api/search/suggestions'],
        POST: ['/api/search/advanced']
      }
    }
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableRoutes: [
      'GET /health',
      'GET /api',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/mushafs',
      'GET /api/pages',
      'GET /api/notes',
      'GET /api/interactions',
      'GET /api/marks',
      'GET /api/search'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // MongoDB duplicate key error
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered',
      error: error.message
    });
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Default server error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Mushaf with Notes API server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;