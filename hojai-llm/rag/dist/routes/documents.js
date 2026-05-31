"use strict";
/**
 * HOJAI RAG Service - Document Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validators_1 = require("../validators");
const documentService_1 = require("../services/documentService");
const error_1 = require("../middleware/error");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
// POST /api/documents - Create a new document
router.post('/', async (req, res, next) => {
    try {
        const input = validators_1.documentCreateSchema.parse(req.body);
        const document = (0, documentService_1.createDocument)(input.title, input.content, input.metadata, input.namespace, config_1.default.embeddingDimension);
        const response = {
            success: true,
            data: document,
            timestamp: new Date().toISOString(),
        };
        res.status(201).json(response);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/documents/batch - Batch create documents
router.post('/batch', async (req, res, next) => {
    try {
        const input = validators_1.documentBatchSchema.parse(req.body);
        const documents = input.documents.map(doc => (0, documentService_1.createDocument)(doc.title, doc.content, doc.metadata, input.namespace, config_1.default.embeddingDimension));
        const response = {
            success: true,
            data: documents,
            timestamp: new Date().toISOString(),
        };
        res.status(201).json(response);
    }
    catch (error) {
        next(error);
    }
});
// GET /api/documents/:id - Get document by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const document = (0, documentService_1.getDocument)(id);
        if (!document) {
            throw new error_1.NotFoundError('Document');
        }
        const response = {
            success: true,
            data: document,
            timestamp: new Date().toISOString(),
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/documents/:id - Delete document by ID
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = (0, documentService_1.deleteDocument)(id);
        if (!deleted) {
            throw new error_1.NotFoundError('Document');
        }
        const response = {
            success: true,
            data: { deleted: true },
            timestamp: new Date().toISOString(),
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
// GET /api/documents - List all documents (with optional namespace filter)
router.get('/', async (req, res, next) => {
    try {
        const namespace = req.query.namespace;
        const documents = (0, documentService_1.getAllDocuments)(namespace);
        const response = {
            success: true,
            data: documents,
            timestamp: new Date().toISOString(),
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=documents.js.map