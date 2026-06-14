/**
 * Document Vault Routes
 * API endpoints for secure document storage
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import {
  VaultDocument,
  DocumentUploadRequest,
  TravelFolder,
  ShareLink,
  DOCUMENT_LABELS
} from './types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'airzy-vault-secret';

// In-memory stores (would be encrypted database in production)
const vaults = new Map<string, Map<string, VaultDocument>>();
const folders = new Map<string, TravelFolder[]>();
const shareLinks = new Map<string, ShareLink>();

/**
 * Health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'airzy-document-vault' });
});

/**
 * Get document labels
 */
router.get('/labels', (_req: Request, res: Response) => {
  res.json({ labels: DOCUMENT_LABELS });
});

/**
 * Get user's vault
 */
router.get('/vault/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userVault = vaults.get(userId);

  if (!userVault) {
    return res.json({ documents: [] });
  }

  const documents = Array.from(userVault.values());
  res.json({ documents });
});

/**
 * Add document to vault
 */
router.post('/vault/:userId/documents', (req: Request, res: Response) => {
  const { userId } = req.params;
  const docReq: DocumentUploadRequest = req.body;

  if (!docReq.type || !docReq.name) {
    return res.status(400).json({ error: 'type and name are required' });
  }

  // Get or create user vault
  if (!vaults.has(userId)) {
    vaults.set(userId, new Map());
  }
  const userVault = vaults.get(userId)!;

  // Create document
  const doc: VaultDocument = {
    id: uuidv4(),
    type: docReq.type,
    name: docReq.name,
    number: docReq.number ? maskDocumentNumber(docReq.number) : undefined,
    issueDate: docReq.issueDate,
    expiryDate: docReq.expiryDate,
    issuingAuthority: docReq.issuingAuthority,
    country: docReq.country,
    verified: false,
    fileUrl: docReq.file ? `/files/${userId}/${uuidv4()}.pdf` : undefined,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  userVault.set(doc.id, doc);

  res.status(201).json({ document: doc });
});

/**
 * Get document by ID
 */
router.get('/vault/:userId/documents/:docId', (req: Request, res: Response) => {
  const { userId, docId } = req.params;
  const userVault = vaults.get(userId);
  const doc = userVault?.get(docId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json({ document: doc });
});

/**
 * Update document
 */
router.patch('/vault/:userId/documents/:docId', (req: Request, res: Response) => {
  const { userId, docId } = req.params;
  const updates = req.body;
  const userVault = vaults.get(userId);
  const doc = userVault?.get(docId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Apply updates
  const updatedDoc: VaultDocument = {
    ...doc,
    ...updates,
    id: doc.id, // Prevent ID change
    updatedAt: new Date().toISOString(),
  };

  userVault!.set(docId, updatedDoc);

  res.json({ document: updatedDoc });
});

/**
 * Delete document
 */
router.delete('/vault/:userId/documents/:docId', (req: Request, res: Response) => {
  const { userId, docId } = req.params;
  const userVault = vaults.get(userId);

  if (!userVault?.has(docId)) {
    return res.status(404).json({ error: 'Document not found' });
  }

  userVault.delete(docId);
  res.json({ message: 'Document deleted' });
});

/**
 * Verify document (mock)
 */
router.post('/vault/:userId/documents/:docId/verify', async (req: Request, res: Response) => {
  const { userId, docId } = req.params;
  const userVault = vaults.get(userId);
  const doc = userVault?.get(docId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Mock verification (would call DigiLocker or government API)
  doc.verified = true;
  doc.verifiedAt = new Date().toISOString();
  userVault!.set(docId, doc);

  res.json({
    document: doc,
    verification: {
      status: 'verified',
      verifiedAt: doc.verifiedAt,
      provider: 'airzy-verification',
    }
  });
});

/**
 * Create share link
 */
router.post('/share', (req: Request, res: Response) => {
  const { documentId, expiresInDays, fields } = req.body;

  const token = jwt.sign(
    { documentId, exp: Math.floor(Date.now() / 1000) + (expiresInDays || 7) * 24 * 60 * 60 },
    JWT_SECRET
  );

  const shareLink: ShareLink = {
    id: uuidv4(),
    documentId,
    token,
    expiresAt: new Date(Date.now() + (expiresInDays || 7) * 24 * 60 * 60 * 1000).toISOString(),
    accessCount: 0,
    allowedFields: fields,
    createdAt: new Date().toISOString(),
  };

  shareLinks.set(shareLink.id, shareLink);

  res.json({
    shareLink,
    url: `/share/${shareLink.id}?token=${token}`,
  });
});

/**
 * Access shared document
 */
router.get('/shared/:linkId', (req: Request, res: Response) => {
  const { linkId } = req.params;
  const token = req.query.token as string;
  const shareLink = shareLinks.get(linkId);

  if (!shareLink) {
    return res.status(404).json({ error: 'Share link not found' });
  }

  if (new Date(shareLink.expiresAt) < new Date()) {
    return res.status(410).json({ error: 'Share link expired' });
  }

  // Verify token
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Increment access count
  shareLink.accessCount++;

  // Find document (would search through all vaults)
  let document: VaultDocument | undefined;
  for (const vault of vaults.values()) {
    if (vault.has(shareLink.documentId)) {
      document = vault.get(shareLink.documentId);
      break;
    }
  }

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Return only allowed fields
  const allowedFields = shareLink.allowedFields || Object.keys(document);
  const filteredDoc: Partial<VaultDocument> = {};
  for (const field of allowedFields) {
    (filteredDoc as any)[field] = (document as any)[field];
  }

  res.json({ document: filteredDoc, accessedAt: new Date().toISOString() });
});

/**
 * Create travel folder
 */
router.post('/folders', (req: Request, res: Response) => {
  const { userId, name, tripType, destination, startDate, endDate } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: 'userId and name are required' });
  }

  const folder: TravelFolder = {
    id: uuidv4(),
    userId,
    name,
    tripType: tripType || 'domestic',
    destination,
    startDate,
    endDate,
    documents: [],
    status: 'planning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!folders.has(userId)) {
    folders.set(userId, []);
  }
  folders.get(userId)!.push(folder);

  res.status(201).json({ folder });
});

/**
 * Get user's folders
 */
router.get('/folders/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userFolders = folders.get(userId) || [];
  res.json({ folders: userFolders });
});

/**
 * Add document to folder
 */
router.post('/folders/:folderId/documents', (req: Request, res: Response) => {
  const { folderId } = req.params;
  const { documentId } = req.body;

  // Find folder
  let folder: TravelFolder | undefined;
  for (const userFolders of folders.values()) {
    const found = userFolders.find(f => f.id === folderId);
    if (found) {
      folder = found;
      break;
    }
  }

  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  if (!folder.documents.includes(documentId)) {
    folder.documents.push(documentId);
    folder.updatedAt = new Date().toISOString();
  }

  res.json({ folder });
});

/**
 * DigiLocker link status (mock)
 */
router.get('/digilocker/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  // Mock - would connect to actual DigiLocker API
  res.json({
    linked: false,
    message: 'Connect DigiLocker to auto-sync government documents',
    benefits: [
      'Auto-fetch passport details',
      'Verify documents instantly',
      'Pre-fill visa applications',
    ],
  });
});

/**
 * Connect DigiLocker (mock)
 */
router.post('/digilocker/:userId/connect', (req: Request, res: Response) => {
  const { userId } = req.params;
  // Mock - would initiate DigiLocker OAuth flow
  res.json({
    success: true,
    redirectUrl: 'https://api.digilocker.gov.in/oauth/authorize?...',
    message: 'Redirecting to DigiLocker for authentication',
  });
});

/**
 * Helper: Mask document number
 */
function maskDocumentNumber(number: string): string {
  if (number.length <= 4) return '****';
  return '*'.repeat(number.length - 4) + number.slice(-4);
}

export default router;
