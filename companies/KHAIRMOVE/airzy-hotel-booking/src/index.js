/**
 * Airzy Hotel Booking Service
 * Main entry point for the hotel reservation system
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { initializeDatabase } = require('./db/init');
const hotelRoutes = require('./routes/hotelRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 4510;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Request-Id']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Strict rate limit for booking endpoints
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 booking requests per minute
  message: { error: 'Too many booking requests, please try again later.' }
});
app.use('/api/bookings', bookingLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'airzy-hotel-booking',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'Airzy Hotel Booking Service',
    version: '1.0.0',
    port: PORT,
    endpoints: {
      hotels: {
        'GET /api/hotels/search': 'Search hotels with filters',
        'GET /api/hotels/:id': 'Get hotel details',
        'GET /api/hotels/:id/rooms': 'Get room availability'
      },
      bookings: {
        'POST /api/bookings': 'Create a new booking',
        'GET /api/bookings/:id': 'Get booking details',
        'GET /api/bookings/user/:userId': 'Get user bookings',
        'PUT /api/bookings/:id': 'Modify booking',
        'DELETE /api/bookings/:id': 'Cancel booking'
      },
      reviews: {
        'GET /api/reviews/hotel/:hotelId': 'Get hotel reviews',
        'POST /api/reviews': 'Add a review',
        'GET /api/reviews/booking/:bookingId': 'Get review by booking'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database initialized successfully');

    app.listen(PORT, () => {
      logger.info(`Airzy Hotel Booking Service started on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API docs: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;
