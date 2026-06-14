/**
 * REZ Sign Service - DocuSign Competitor
 * Electronic signatures
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4104;

app.use(express.json());

// In-memory storage
const documents = new Map();
const templates = new Map();
const signatures = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'REZ Sign', version: '1.0.0' });
});

// Create document
app.post('/api/documents', (req, res) => {
  const { userId, title, fileUrl, fields, signers } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const document = {
    id: uuidv4(),
    userId,
    title,
    fileUrl: fileUrl || null,
    status: 'draft', // draft, sent, signed, declined, expired
    fields: fields || [],
    signers: (signers || []).map(s => ({
      id: uuidv4(),
      email: s.email,
      name: s.name || 'Signer',
      order: s.order || 1,
      status: 'pending', // pending, signed, declined
      signedAt: null,
    })),
    auditTrail: [{
      action: 'created',
      timestamp: new Date(),
      details: 'Document created',
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: null,
  };

  documents.set(document.id, document);
  res.status(201).json(document);
});

// List documents
app.get('/api/documents', (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const userId = req.headers['x-user-id'];

  let docs = Array.from(documents.values())
    .filter(d => !userId || d.userId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (status) {
    docs = docs.filter(d => d.status === status);
  }

  const total = docs.length;
  const start = (page - 1) * pageSize;

  res.json({ documents: docs.slice(start, start + pageSize), total, page, pageSize });
});

// Get document
app.get('/api/documents/:id', (req, res) => {
  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(document);
});

// Send document for signature
app.post('/api/documents/:id/send', (req, res) => {
  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (document.status !== 'draft') {
    return res.status(400).json({ error: 'Document already sent' });
  }

  document.status = 'sent';
  document.sentAt = new Date();
  document.auditTrail.push({
    action: 'sent',
    timestamp: new Date(),
    details: `Sent to ${document.signers.length} signer(s)`,
  });

  documents.set(document.id, document);
  res.json(document);
});

// Sign document (simulate signing)
app.post('/api/documents/:id/sign', (req, res) => {
  const { signerId, signature, ipAddress } = req.body;

  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const signer = document.signers.find(s => s.id === signerId);
  if (!signer) {
    return res.status(404).json({ error: 'Signer not found' });
  }

  signer.status = 'signed';
  signer.signedAt = new Date();
  signer.signature = signature || 'signed';
  signer.ipAddress = ipAddress;

  document.auditTrail.push({
    action: 'signed',
    timestamp: new Date(),
    details: `${signer.name} signed the document`,
    signerId,
  });

  // Check if all signers have signed
  const allSigned = document.signers.every(s => s.status === 'signed');
  if (allSigned) {
    document.status = 'signed';
    document.signedAt = new Date();
    document.auditTrail.push({
      action: 'completed',
      timestamp: new Date(),
      details: 'All signers have signed',
    });
  }

  documents.set(document.id, document);
  res.json(document);
});

// Remind signer
app.post('/api/documents/:id/remind', (req, res) => {
  const { signerId } = req.body;

  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const signer = document.signers.find(s => s.id === signerId);
  if (!signer) {
    return res.status(404).json({ error: 'Signer not found' });
  }

  document.auditTrail.push({
    action: 'reminder_sent',
    timestamp: new Date(),
    details: `Reminder sent to ${signer.name}`,
    signerId,
  });

  documents.set(document.id, document);
  res.json({ message: `Reminder sent to ${signer.email}` });
});

// Get audit trail
app.get('/api/documents/:id/audit', (req, res) => {
  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json({ auditTrail: document.auditTrail });
});

// Create template
app.post('/api/templates', (req, res) => {
  const { userId, name, fields, signers } = req.body;

  const template = {
    id: uuidv4(),
    userId,
    name,
    fields: fields || [],
    signers: signers || [],
    createdAt: new Date(),
  };

  templates.set(template.id, template);
  res.status(201).json(template);
});

// List templates
app.get('/api/templates', (req, res) => {
  const userId = req.headers['x-user-id'];
  const userTemplates = Array.from(templates.values())
    .filter(t => !userId || t.userId === userId);

  res.json({ templates: userTemplates });
});

// Get signed document download
app.get('/api/documents/:id/download', (req, res) => {
  const document = documents.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (document.status !== 'signed') {
    return res.status(400).json({ error: 'Document not yet fully signed' });
  }

  res.json({
    downloadUrl: `/api/documents/${document.id}/file`,
    message: 'Document ready for download'
  });
});

app.listen(PORT, () => {
  console.log(`✅ REZ Sign running on port ${PORT}`);
});

export default app;