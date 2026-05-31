"use strict";
/**
 * HOJAI RAG Service - Search Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validators_1 = require("../validators");
const documentService_1 = require("../services/documentService");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
// POST /api/search - Search documents
router.post('/', async (req, res, next) => {
    try {
        const input = validators_1.searchRequestSchema.parse(req.body);
        const limit = input.limit || config_1.default.defaultSearchLimit;
        const namespace = input.namespace;
        const minScore = input.min_score || config_1.default.defaultMinScore;
        const results = (0, documentService_1.getSearchResultsWithContent)(input.query, limit, namespace, minScore, config_1.default.embeddingDimension);
        const response = {
            success: true,
            data: results,
            timestamp: new Date().toISOString(),
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map