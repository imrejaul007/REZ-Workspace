/**
 * Legal OS - Documents Management Routes
 */

const express = require('express');
const router = express.Router();

// In-memory document storage
let documents = [
  {
    id: 'doc-001',
    title: 'Initial Complaint',
    type: 'pleading',
    caseId: 'case-001',
    fileName: 'complaint.pdf',
    fileSize: 245000,
    uploadedBy: 'attorney-001',
    status: 'final',
    version: 1,
    createdAt: new Date().toISOString()
  }
];

// GET /api/documents - List all documents
router.get('/', (req, res) => {
  const { caseId, type, status } = req.query;
  let filtered = [...documents];

  if (caseId) filtered = filtered.filter(d => d.caseId === caseId);
  if (type) filtered = filtered.filter(d => d.type === type);
  if (status) filtered = filtered.filter(d => d.status === status);

  res.json({ documents: filtered, count: filtered.length });
});

// GET /api/documents/:id - Get document by ID
router.get('/:id', (req, res) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

// POST /api/documents - Upload new document
router.post('/', (req, res) => {
  const { title, type, caseId, fileName, fileSize, uploadedBy } = req.body;

  if (!title || !type || !caseId) {
    return res.status(400).json({ error: 'title, type, and caseId are required' });
  }

  const newDoc = {
    id: `doc-${Date.now()}`,
    title,
    type,
    caseId,
    fileName: fileName || 'document.pdf',
    fileSize: fileSize || 0,
    uploadedBy: uploadedBy || 'unknown',
    status: 'draft',
    version: 1,
    createdAt: new Date().toISOString()
  };

  documents.push(newDoc);
  res.status(201).json(newDoc);
});

// PUT /api/documents/:id - Update document
router.put('/:id', (req, res) => {
  const index = documents.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Document not found' });

  documents[index].version += 1;
  documents[index] = { ...documents[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json(documents[index]);
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', (req, res) => {
  const index = documents.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Document not found' });

  documents.splice(index, 1);
  res.json({ message: 'Document deleted successfully' });
});

// GET /api/documents/:id/versions - Get document versions
router.get('/:id/versions', (req, res) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  res.json({
    documentId: doc.id,
    title: doc.title,
    currentVersion: doc.version,
    versions: Array.from({ length: doc.version }, (_, i) => ({ version: i + 1 }))
  });
});

module.exports = router;