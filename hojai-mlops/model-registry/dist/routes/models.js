"use strict";
/**
 * Hojai Model Registry - Model Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const registry_1 = require("../services/registry");
const validators_1 = require("../validators");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
/**
 * POST /api/models - Register a new model version
 */
router.post('/', async (req, res, next) => {
    try {
        // Validate request body
        const validatedData = validators_1.registerModelSchema.parse(req.body);
        const result = await registry_1.modelRegistryService.registerModel(validatedData);
        res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({
                error: 'Validation Error',
                message: messages,
                statusCode: 400,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next(error);
    }
});
/**
 * GET /api/models - List all registered models
 */
router.get('/', async (_req, res, next) => {
    try {
        const result = await registry_1.modelRegistryService.listModels();
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/models/:name - Get all versions of a model
 */
router.get('/:name', async (req, res, next) => {
    try {
        const { name } = validators_1.modelNameParamSchema.parse(req.params);
        const result = await registry_1.modelRegistryService.getModelVersions(name);
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid model name format',
                statusCode: 400,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next(error);
    }
});
/**
 * GET /api/models/:name/latest - Get the latest version of a model
 */
router.get('/:name/latest', async (req, res, next) => {
    try {
        const { name } = validators_1.modelNameParamSchema.parse(req.params);
        const result = await registry_1.modelRegistryService.getLatestVersion(name);
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid model name format',
                statusCode: 400,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next(error);
    }
});
/**
 * GET /api/models/:name/:version - Get a specific version
 */
router.get('/:name/:version', async (req, res, next) => {
    try {
        const { name, version } = validators_1.versionParamSchema.parse(req.params);
        const result = await registry_1.modelRegistryService.getVersion(name, version);
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid model name or version format',
                statusCode: 400,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next(error);
    }
});
/**
 * PUT /api/models/:name/:version/stage - Update model stage
 */
router.put('/:name/:version/stage', async (req, res, next) => {
    try {
        const { name, version } = validators_1.versionParamSchema.parse(req.params);
        const { stage } = validators_1.updateStageSchema.parse(req.body);
        const result = await registry_1.modelRegistryService.updateStage(name, version, stage);
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({
                error: 'Validation Error',
                message: messages,
                statusCode: 400,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next(error);
    }
});
/**
 * DELETE /api/models/:name/:version - Delete a specific version
 */
router.delete('/:name/:version', async (req, res, next) => {
    try {
        const { name, version } = validators_1.versionParamSchema.parse(req.params);
        const result = await registry_1.modelRegistryService.deleteVersion(name, version);
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid model name or version format',
                statusCode: 400,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=models.js.map