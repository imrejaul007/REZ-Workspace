/**
 * REZ White Label Service
 * White-label platform configuration
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Schemas
const tenantSchema = new mongoose.Schema({
  tenantId: String, name: String, slug: String,
  logo: String, favicon: String,
  theme: {
    primary: String, secondary: String, accent: String,
    fontFamily: String, borderRadius: Number
  },
  config: mongoose.Schema.Types.Mixed,
  domains: [String],
  services: [String],
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  createdAt: Date, updatedAt: Date
});
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'rez-white-label-service' }));

// Tenants
app.post('/api/tenants', async (req, res) => {
  const tenant = new Tenant({ ...req.body, createdAt: new Date() });
  await tenant.save();
  res.json({ success: true, data: tenant });
});

app.get('/api/tenants', async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};
  const tenants = await Tenant.find(query);
  res.json({ success: true, data: tenants });
});

app.get('/api/tenants/:id', async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);
  res.json({ success: true, data: tenant });
});

app.get('/api/tenants/slug/:slug', async (req, res) => {
  const tenant = await Tenant.findOne({ slug: req.params.slug });
  res.json({ success: true, data: tenant });
});

app.put('/api/tenants/:id', async (req, res) => {
  const tenant = await Tenant.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: tenant });
});

app.put('/api/tenants/:id/theme', async (req, res) => {
  const { theme } = req.body;
  const tenant = await Tenant.findByIdAndUpdate(req.params.id, { theme, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: tenant });
});

app.post('/api/tenants/:id/config', async (req, res) => {
  const { config } = req.body;
  const tenant = await Tenant.findByIdAndUpdate(req.params.id, { $set: { config } }, { new: true });
  res.json({ success: true, data: tenant });
});

app.get('/api/config/:tenantSlug', async (req, res) => {
  const tenant = await Tenant.findOne({ slug: req.params.tenantSlug, status: 'active' });
  if (!tenant) return res.status(404).json({ success: false, error: 'Tenant not found' });
  res.json({
    success: true,
    data: {
      name: tenant.name,
      logo: tenant.logo,
      theme: tenant.theme,
      config: tenant.config
    }
  });
});

const PORT = process.env.PORT || 3083;
app.listen(PORT, () => logger.info(`rez-white-label-service on port ${PORT}`));

export default app;
