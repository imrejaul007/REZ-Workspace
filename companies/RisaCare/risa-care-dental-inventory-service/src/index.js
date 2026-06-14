/**
 * RisaCare Dental Inventory Service
 *
 * Manages dental supplies inventory with auto-reorder:
 * - Implants, anesthetics, whitening materials
 * - Connects to Nexha ProcurementOS for auto-reorder
 * - Inventory tracking and alerts
 *
 * Port: 4752
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const inventoryRoutes = require('./routes/inventory');
const reorderRoutes = require('./routes/reorder');
const catalogRoutes = require('./routes/catalog');

const app = express();
const PORT = process.env.PORT || 4752;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risacare-dental-inventory';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'dental-inventory', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reorder', reorderRoutes);
app.use('/api/catalog', catalogRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Database connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Dental Inventory Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
