import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3042;

app.use(express.json());

// In-memory stores
const certificates: Map<string, any> = new Map();
const templates: Map<string, any> = new Map();
const credentials: Map<string, any> = new Map();

// Initialize sample templates
const sampleTemplates = [
  { id: 'completion', name: 'Course Completion Certificate', category: 'completion', description: 'Awarded for completing a course' },
  { id: 'achievement', name: 'Achievement Certificate', category: 'achievement', description: 'Awarded for outstanding performance' },
  { id: 'participation', name: 'Participation Certificate', category: 'participation', description: 'Awarded for participation in events' },
  { id: 'professional', name: 'Professional Certificate', category: 'professional', description: 'Professional development certification' }
];

sampleTemplates.forEach(t => templates.set(t.id, t));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'certificate-ai', timestamp: new Date().toISOString() });
});

// Get all templates
app.get('/api/templates', (_req: Request, res: Response) => {
  const templateList = Array.from(templates.values());
  res.json({ success: true, count: templateList.length, data: templateList });
});

// Create certificate template
app.post('/api/templates', (req: Request, res: Response) => {
  const { name, category, description, fields, backgroundImage } = req.body;

  if (!name || !category) {
    res.status(400).json({ success: false, error: 'name and category are required' });
    return;
  }

  const template = {
    id: uuidv4(),
    name,
    category,
    description: description || '',
    fields: fields || [],
    backgroundImage: backgroundImage || null,
    createdAt: new Date().toISOString()
  };

  templates.set(template.id, template);
  res.status(201).json({ success: true, data: template });
});

// Issue certificate
app.post('/api/certificates', (req: Request, res: Response) => {
  const { recipientName, recipientEmail, templateId, courseName, completionDate, issuerName, metadata } = req.body;

  if (!recipientName || !recipientEmail || !templateId) {
    res.status(400).json({ success: false, error: 'recipientName, recipientEmail, and templateId are required' });
    return;
  }

  const template = templates.get(templateId);
  if (!template) {
    res.status(404).json({ success: false, error: 'Template not found' });
    return;
  }

  const certificate = {
    id: uuidv4(),
    certificateNumber: `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    recipientName,
    recipientEmail,
    templateId,
    templateName: template.name,
    templateCategory: template.category,
    courseName: courseName || '',
    completionDate: completionDate || new Date().toISOString(),
    issuerName: issuerName || 'LearnIQ',
    issuedDate: new Date().toISOString(),
    expiresAt: null,
    status: 'active',
    verificationCode: uuidv4().substring(0, 8).toUpperCase(),
    metadata: metadata || {},
    createdAt: new Date().toISOString()
  };

  certificates.set(certificate.id, certificate);
  res.status(201).json({ success: true, data: certificate });
});

// Get all certificates
app.get('/api/certificates', (req: Request, res: Response) => {
  const { status, templateId, recipientEmail, search } = req.query;
  let filtered = Array.from(certificates.values());

  if (status) {
    filtered = filtered.filter((c: any) => c.status === status);
  }
  if (templateId) {
    filtered = filtered.filter((c: any) => c.templateId === templateId);
  }
  if (recipientEmail) {
    filtered = filtered.filter((c: any) => c.recipientEmail === recipientEmail);
  }
  if (search) {
    const searchLower = (search as string).toLowerCase();
    filtered = filtered.filter((c: any) =>
      c.recipientName.toLowerCase().includes(searchLower) ||
      c.certificateNumber.toLowerCase().includes(searchLower) ||
      c.verificationCode.toLowerCase().includes(searchLower)
    );
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get certificate by ID
app.get('/api/certificates/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const certificate = certificates.get(id);

  if (!certificate) {
    res.status(404).json({ success: false, error: 'Certificate not found' });
    return;
  }

  res.json({ success: true, data: certificate });
});

// Verify certificate
app.get('/api/certificates/verify/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const certificate = Array.from(certificates.values()).find((c: any) => c.verificationCode === code);

  if (!certificate) {
    res.status(404).json({ success: false, error: 'Certificate not found', valid: false });
    return;
  }

  const isValid = certificate.status === 'active' &&
    (!certificate.expiresAt || new Date(certificate.expiresAt) > new Date());

  res.json({
    success: true,
    data: {
      valid: isValid,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        recipientName: certificate.recipientName,
        templateName: certificate.templateName,
        courseName: certificate.courseName,
        issuedDate: certificate.issuedDate,
        status: certificate.status
      }
    }
  });
});

// Revoke certificate
app.patch('/api/certificates/:id/revoke', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const certificate = certificates.get(id);
  if (!certificate) {
    res.status(404).json({ success: false, error: 'Certificate not found' });
    return;
  }

  certificate.status = 'revoked';
  certificate.revokedAt = new Date().toISOString();
  certificate.revocationReason = reason || 'Not specified';
  certificate.updatedAt = new Date().toISOString();

  certificates.set(id, certificate);
  res.json({ success: true, data: certificate });
});

// Add credential
app.post('/api/credentials', (req: Request, res: Response) => {
  const { recipientName, credentialType, issuer, issueDate, expiryDate, credentialId, url } = req.body;

  if (!recipientName || !credentialType || !issuer) {
    res.status(400).json({ success: false, error: 'recipientName, credentialType, and issuer are required' });
    return;
  }

  const credential = {
    id: uuidv4(),
    recipientName,
    credentialType,
    issuer,
    issueDate: issueDate || new Date().toISOString(),
    expiryDate: expiryDate || null,
    credentialId: credentialId || '',
    url: url || '',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  credentials.set(credential.id, credential);
  res.status(201).json({ success: true, data: credential });
});

// Get all credentials
app.get('/api/credentials', (req: Request, res: Response) => {
  const { recipientName, credentialType, issuer } = req.query;
  let filtered = Array.from(credentials.values());

  if (recipientName) {
    filtered = filtered.filter((c: any) => c.recipientName === recipientName);
  }
  if (credentialType) {
    filtered = filtered.filter((c: any) => c.credentialType === credentialType);
  }
  if (issuer) {
    filtered = filtered.filter((c: any) => c.issuer === issuer);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get certificate statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  const allCertificates = Array.from(certificates.values());
  const activeCerts = allCertificates.filter((c: any) => c.status === 'active');
  const revokedCerts = allCertificates.filter((c: any) => c.status === 'revoked');

  res.json({
    success: true,
    data: {
      totalCertificates: allCertificates.length,
      activeCertificates: activeCerts.length,
      revokedCertificates: revokedCerts.length,
      byCategory: allCertificates.reduce((acc: any, c: any) => {
        acc[c.templateCategory] = (acc[c.templateCategory] || 0) + 1;
        return acc;
      }, {}),
      totalCredentials: credentials.size
    }
  });
});

app.listen(PORT, () => {
  console.log(`Certificate AI service running on port ${PORT}`);
});

export default app;