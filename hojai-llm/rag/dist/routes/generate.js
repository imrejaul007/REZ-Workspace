"use strict";
/**
 * HOJAI RAG Service - Generate Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validators_1 = require("../validators");
const documentService_1 = require("../services/documentService");
const llmService_1 = require("../services/llmService");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
// POST /api/generate - Generate with RAG context
router.post('/', async (req, res, next) => {
    try {
        const input = validators_1.generateRequestSchema.parse(req.body);
        // If no context provided, search for relevant documents
        let context = input.context;
        if (!context) {
            const searchResults = (0, documentService_1.getSearchResultsWithContent)(input.query, config_1.default.defaultSearchLimit, undefined, config_1.default.defaultMinScore, config_1.default.embeddingDimension);
            context = searchResults;
        }
        // Generate response with context
        const result = await (0, llmService_1.generateWithContext)(input.query, context, {
            model: input.model,
            max_tokens: input.max_tokens,
            temperature: input.temperature,
        });
        const response = {
            success: true,
            data: {
                answer: result.answer,
                sources: context,
                model: input.model || config_1.default.openaiModel,
                tokens_used: result.tokens_used,
            },
            timestamp: new Date().toISOString(),
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=generate.js.map