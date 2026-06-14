/**
 * RisaCare Dental Twin Service
 *
 * Dental Twin extends Patient Twin with dental-specific data:
 * - Tooth-by-tooth records
 * - X-ray history
 * - Oral health assessments
 * - Treatment history per tooth
 * - Dental conditions
 *
 * Port: 4751
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const dentalRoutes = require('./routes/dental');
const toothRoutes = require('./routes/tooth');
const xrayRoutes = require('./routes/xray');
const oralHealthRoutes = require('./routes/oralHealth');

const app = express();
const PORT = process.env.PORT || 4751;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risacare-dental-twin';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-dental-twin',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/dental', dentalRoutes);
app.use('/api/tooth', toothRoutes);
app.use('/api/xray', xrayRoutes);
app.use('/api/oral-health', oralHealthRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Database connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Dental Twin Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
