/**
 * REZ Procurement Payment Service
 * FreshMart 6AM Story: RABTUL schedules payment for supplier delivery
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');

const paymentRoutes = require('./routes/payment.routes');

const app = express();
const PORT = process.env.PORT || 4007;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-procurement-payment', version: '1.0.0' });
});

app.use('/api/payments', paymentRoutes);

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-procurement-payment')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Scheduled job - check payments every hour
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Checking payments due...');
  // In production, execute due payments
});

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('💰 REZ Procurement Payment Service');
  console.log('📖 FreshMart 6AM: RABTUL schedules payment');
  console.log('═══════════════════════════════════════════════════');
  console.log('Port:', PORT);
  console.log('Endpoints:');
  console.log('  POST /api/payments/schedule');
  console.log('  GET  /api/payments/due');
  console.log('  POST /api/payments/:id/execute');
  console.log('  GET  /api/payments/store/:storeId');
  console.log('  GET  /api/payments/supplier/:supplierId');
  console.log('═══════════════════════════════════════════════════');
});

module.exports = app;
