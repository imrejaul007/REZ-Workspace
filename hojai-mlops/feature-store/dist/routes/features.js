"use strict";
/**
 * Feature Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feature_1 = require("../services/feature");
const validators_1 = require("../validators");
const error_1 = require("../middleware/error");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
/**
 * POST /api/features/:entityId
 * Store features for an entity
 */
router.post('/:entityId', async (req, res, next) => {
    try {
        // Validate entity ID
        const entityIdResult = validators_1.entityIdSchema.safeParse(req.params.entityId);
        if (!entityIdResult.success) {
            throw new error_1.ValidationError('Invalid entity ID');
        }
        // Validate request body
        const bodyResult = validators_1.storeFeaturesSchema.safeParse(req.body);
        if (!bodyResult.success) {
            throw new error_1.ValidationError(bodyResult.error.errors
                .map((e) => `${e.path.join('.')}: ${e.message}`)
                .join(', '));
        }
        const featureSet = await feature_1.featureService.storeFeatures(entityIdResult.data, bodyResult.data);
        res.status(201).json({
            entity_id: featureSet.entity_id,
            features: featureSet.features,
            last_updated: featureSet.last_updated,
            features_stored: bodyResult.data.features.length,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            next(new error_1.ValidationError(error.errors
                .map((e) => `${e.path.join('.')}: ${e.message}`)
                .join(', ')));
            return;
        }
        next(error);
    }
});
/**
 * GET /api/features/:entityId
 * Get all features for an entity
 */
router.get('/:entityId', async (req, res, next) => {
    try {
        // Validate entity ID
        const entityIdResult = validators_1.entityIdSchema.safeParse(req.params.entityId);
        if (!entityIdResult.success) {
            throw new error_1.ValidationError('Invalid entity ID');
        }
        const featureSet = await feature_1.featureService.getFeatures(entityIdResult.data);
        if (!featureSet) {
            res.status(404).json({
                entity_id: entityIdResult.data,
                features: {},
                last_updated: '',
                found: false,
            });
            return;
        }
        res.json({
            entity_id: featureSet.entity_id,
            features: featureSet.features,
            last_updated: featureSet.last_updated,
            found: true,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/features/:entityId/:featureName
 * Get a single feature for an entity
 */
router.get('/:entityId/:featureName', async (req, res, next) => {
    try {
        // Validate entity ID
        const entityIdResult = validators_1.entityIdSchema.safeParse(req.params.entityId);
        if (!entityIdResult.success) {
            throw new error_1.ValidationError('Invalid entity ID');
        }
        // Validate feature name
        const featureNameResult = validators_1.featureNameSchema.safeParse(req.params.featureName);
        if (!featureNameResult.success) {
            throw new error_1.ValidationError('Invalid feature name');
        }
        const feature = await feature_1.featureService.getFeature(entityIdResult.data, featureNameResult.data);
        if (!feature) {
            res.status(404).json({
                entity_id: entityIdResult.data,
                feature: null,
                found: false,
            });
            return;
        }
        res.json({
            entity_id: entityIdResult.data,
            feature,
            found: true,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/features/:entityId
 * Delete all features for an entity
 */
router.delete('/:entityId', async (req, res, next) => {
    try {
        // Validate entity ID
        const entityIdResult = validators_1.entityIdSchema.safeParse(req.params.entityId);
        if (!entityIdResult.success) {
            throw new error_1.ValidationError('Invalid entity ID');
        }
        const result = await feature_1.featureService.deleteFeatures(entityIdResult.data);
        res.json({
            entity_id: entityIdResult.data,
            deleted: result.deleted,
            features_deleted: result.featuresDeleted,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/features/batch
 * Batch get features for multiple entities
 */
router.post('/batch', async (req, res, next) => {
    try {
        // Validate request body
        const bodyResult = validators_1.batchGetSchema.safeParse(req.body);
        if (!bodyResult.success) {
            throw new error_1.ValidationError(bodyResult.error.errors
                .map((e) => `${e.path.join('.')}: ${e.message}`)
                .join(', '));
        }
        const results = await feature_1.featureService.batchGetFeatures(bodyResult.data);
        res.json({
            results,
            total: results.length,
            found_count: results.filter((r) => r.found).length,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            next(new error_1.ValidationError(error.errors
                .map((e) => `${e.path.join('.')}: ${e.message}`)
                .join(', ')));
            return;
        }
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=features.js.map