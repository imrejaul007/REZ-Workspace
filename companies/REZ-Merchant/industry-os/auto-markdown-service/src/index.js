/**
 * Auto Markdown Service
 * FreshMart 3PM Story: Spoilage Prevention
 *
 * "Tomatoes Expiry Risk: 24 Hours → Quick Sale Campaign"
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const markdownRoutes = require('./routes/markdown.routes');

const app = express();
const PORT = process.env.PORT || 4653;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auto-markdown-service',
    version: '1.0.0',
    freshMartStory: '3PM - Spoilage Prevention'
  });
});

// Routes
app.use('/api/markdown', markdownRoutes);

// MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auto-markdown';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('🚀 Auto Markdown Service ready');
    console.log('📍 Port:', PORT);
    console.log('🍅 FreshMart 3PM Story: Spoilage Prevention');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Scheduled job - run at 3PM daily
const cron = require('node-cron');

// Run spoilage scan at 3PM every day
cron.schedule('0 15 * * *', async () => {
  console.log('🕒 Running 3PM spoilage scan...');
  // In production, iterate through all stores and run scans
  // const stores = await storeService.getAllStores();
  // for (const store of stores) {
  //   await markdownService.scanForExpiringItems(store.id);
  // }
});

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🍅 Auto Markdown Service');
  console.log('📖 FreshMart 3PM Story: Spoilage Prevention');
  console.log('═══════════════════════════════════════════════════');
  console.log('Endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/markdown/dashboard/:storeId');
  console.log('  POST /api/markdown/scan/:storeId');
  console.log('  POST /api/markdown/expiring');
  console.log('  POST /api/markdown/approve/:itemId');
  console.log('  POST /api/markdown/campaign/:id/launch');
  console.log('  GET  /api/markdown/campaign/:id');
  console.log('  GET  /api/markdown/expiring/:storeId');
  console.log('═══════════════════════════════════════════════════');
});

module.exports = app;
