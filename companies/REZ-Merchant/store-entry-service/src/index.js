/**
 * Store Entry Service
 * FreshMart 10AM Story: Customer scans REZ QR at entrance
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const entryRoutes = require('./routes/entry.routes');

const app = express();
const PORT = process.env.PORT || 4654;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'store-entry-service', version: '1.0.0' });
});

app.use('/api/entry', entryRoutes);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/store-entry')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🏪 Store Entry Service');
  console.log('📖 FreshMart 10AM: Customer scans REZ QR');
  console.log('═══════════════════════════════════════════════════');
  console.log('Port:', PORT);
  console.log('Endpoints:');
  console.log('  POST /api/entry/scan');
  console.log('  POST /api/entry/:sessionId/exit');
  console.log('  GET  /api/entry/session/:customerId');
  console.log('  POST /api/entry/:sessionId/product');
  console.log('  GET  /api/entry/analytics/:storeId');
  console.log('═══════════════════════════════════════════════════');
});

module.exports = app;
