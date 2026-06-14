/**
 * AdBazaar Agency OS
 * Complete agency management platform
 *
 * Port: 4972
 * Purpose: White label, client management, billing, reporting
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4972;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(helmet()); app.use(cors()); app.use(express.json());

// MongoDB
const clientSchema = new mongoose.Schema({
  clientId: String, agencyId: String, name: String, industry: String,
  contacts: mongoose.Schema.Types.Mixed, campaigns: [String], status: String, createdAt: Date
});

const invoiceSchema = new mongoose.Schema({
  invoiceId: String, agencyId: String, clientId: String,
  amount: Number, status: String, items: mongoose.Schema.Types.Mixed, dueDate: Date, createdAt: Date
});

const Client = mongoose.model('Client', clientSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'agency-os', port: PORT }));

// Clients
app.post('/api/clients', async (req, res) => {
  try {
    const { agencyId, name, industry, contacts } = req.body;
    const clientId = `client_${Date.now()}`;

    const client = new Client({ clientId, agencyId, name, industry, contacts, campaigns: [], status: 'active', createdAt: new Date() });
    await client.save();

    res.json({ success: true, id: clientId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.get('/api/clients/:agencyId', async (req, res) => {
  try {
    const clients = await Client.find({ agencyId: req.params.agencyId });
    res.json({ success: true, clients });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Invoices
app.post('/api/invoices', async (req, res) => {
  try {
    const { agencyId, clientId, amount, items, dueDate } = req.body;
    const invoiceId = `inv_${Date.now()}`;

    const invoice = new Invoice({ invoiceId, agencyId, clientId, amount, items, status: 'pending', dueDate, createdAt: new Date() });
    await invoice.save();

    res.json({ success: true, id: invoiceId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.get('/api/invoices/:agencyId', async (req, res) => {
  try {
    const invoices = await Invoice.find({ agencyId: req.params.agencyId });
    const total = invoices.reduce((sum, i) => sum + i.amount, 0);
    const pending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);

    res.json({ success: true, invoices, summary: { total, pending, paid: total - pending } });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Team
app.post('/api/team', async (req, res) => {
  try {
    const { agencyId, name, role, email } = req.body;
    const memberId = `member_${Date.now()}`;

    res.json({ success: true, id: memberId, name, role });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Proposals
app.post('/api/proposals', async (req, res) => {
  try {
    const { agencyId, clientId, services, amount } = req.body;
    const proposalId = `prop_${Date.now()}`;

    res.json({ success: true, id: proposalId, status: 'draft', amount });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Reports
app.get('/api/reports/:clientId', async (req, res) => {
  try {
    const clients = await Client.find({ clientId: req.params.clientId });

    res.json({
      success: true,
      report: {
        clientId: req.params.clientId,
        campaigns: clients[0]?.campaigns?.length || 0,
        period: 'Last 30 days',
        impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0
      }
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// White label
app.get('/api/white-label/:agencyId', async (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        logo: '/api/agency/logo/' + req.params.agencyId,
        domain: 'client.agency.com',
        colors: { primary: '#000000', secondary: '#ffffff' },
        features: ['dashboard', 'reports', 'invoices']
      }
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.listen(PORT, () => {
  logger.info(`🚀 Agency OS started on port ${PORT}`);
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agency_os');
});

export default app;