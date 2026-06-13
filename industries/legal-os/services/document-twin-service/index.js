const express = require('express');
const mongoose = require('mongoose');
const { DocumentTwin } = require('../../models/document-twin');
const { authenticate, authorize } = require('../../middleware/auth');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Upload directory
const UPLOAD_DIR = process.env.DOCUMENT_UPLOAD_DIR || '/data/legal-documents';

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    logger.error('Error creating upload directory:', error);
  }
};

// Create document metadata
router.post('/', authenticate, async (req, res) => {
  try {
    await ensureUploadDir();

    const document = new DocumentTwin({
      ...req.body,
      uploadedBy: req.user.id
    });
    await document.save();

    logger.info(`Document created: ${document._id}`);
    res.status(201).json(document);
  } catch (error) {
    logger.error('Error creating document:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all documents
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, caseId, limit = 50, offset = 0 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (caseId) query.case = caseId;

    const documents = await DocumentTwin.find(query)
      .populate('case', 'title caseNumber')
      .populate('uploadedBy', 'name email')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await DocumentTwin.countDocuments(query);

    res.json({ documents, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    logger.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get document by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await DocumentTwin.findById(req.params.id)
      .populate('case')
      .populate('uploadedBy');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    logger.error('Error fetching document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download document
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const document = await DocumentTwin.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(UPLOAD_DIR, document.filePath);

    if (!await fs.access(filePath).then(() => true).catch(() => false)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, document.originalName);
  } catch (error) {
    logger.error('Error downloading document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update document
router.put('/:id', authenticate, async (req, res) => {
  try {
    const document = await DocumentTwin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    logger.info(`Document updated: ${document._id}`);
    res.json(document);
  } catch (error) {
    logger.error('Error updating document:', error);
    res.status(400).json({ error: error.message });
  }
});

// Archive document
router.post('/:id/archive', authenticate, async (req, res) => {
  try {
    const document = await DocumentTwin.findByIdAndUpdate(
      req.params.id,
      { archived: true, archivedAt: new Date(), archivedBy: req.user.id },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    logger.info(`Document archived: ${document._id}`);
    res.json(document);
  } catch (error) {
    logger.error('Error archiving document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id', authenticate, authorize(['admin', 'partner']), async (req, res) => {
  try {
    const document = await DocumentTwin.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete physical file
    const filePath = path.join(UPLOAD_DIR, document.filePath);
    await fs.unlink(filePath).catch(() => {});

    await document.deleteOne();

    logger.info(`Document deleted: ${req.params.id}`);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
