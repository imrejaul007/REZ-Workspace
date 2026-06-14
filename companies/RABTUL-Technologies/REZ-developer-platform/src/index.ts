/**
 * Developer Platform - API
 * Self-service developer portal for REZ services
 */

import express from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4036;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/developer-platform';

app.use(cors());
app.use(express.json());

// API Keys model
const APIKeySchema = new mongoose.Schema({
  keyId: String,
  key: String,
  service: String,
  owner: String,
  permissions: [String],
  active: { type: Boolean, default: true },
  lastUsed: Date,
  createdAt: { type: Date, default: Date.now },
});

const APIKey = mongoose.models.APIKey || mongoose.model('APIKey', APIKeySchema);

// Generate API key
app.post('/api/keys', async (req, res) => {
  const { service, owner, permissions } = req.body;
  const key = `rez_${require('crypto').randomBytes(32).toString('hex')}`;
  const keyId = `key_${Date.now()}`;

  await APIKey.create({
    keyId,
    key,
    service,
    owner,
    permissions: permissions || ['read'],
  });

  res.json({ keyId, key });
});

app.get('/api/keys', async (req, res) => {
  const keys = await APIKey.find({}, '-key');
  res.json({ keys });
});

app.delete('/api/keys/:id', async (req, res) => {
  await APIKey.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'developer-platform' });
});

app.listen(PORT, () => {
  mongoose.connect(MONGODB_URI).then(() => logger.info('MongoDB connected'));
  logger.info(`Developer Platform on ${PORT}`);
});
