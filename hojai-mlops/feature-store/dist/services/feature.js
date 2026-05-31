"use strict";
/**
 * Feature Store Service
 * Core business logic for feature management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureService = void 0;
const redis_1 = require("./redis");
const config_1 = __importDefault(require("../config"));
class FeatureService {
    /**
     * Determine the type of a feature value
     */
    getFeatureType(value) {
        if (typeof value === 'number')
            return 'number';
        if (typeof value === 'string')
            return 'string';
        if (typeof value === 'boolean')
            return 'boolean';
        return 'string';
    }
    /**
     * Store features for an entity
     */
    async storeFeatures(entityId, input) {
        const client = redis_1.redisService.getClient();
        const timestamp = new Date().toISOString();
        const features = {};
        for (const featureInput of input.features) {
            const feature = {
                name: featureInput.name,
                value: featureInput.value,
                type: this.getFeatureType(featureInput.value),
                timestamp,
            };
            const key = redis_1.redisService.buildKey(entityId, featureInput.name);
            // Store feature as JSON
            await client.set(key, JSON.stringify(feature));
            // Set TTL if configured
            if (config_1.default.featureStore.ttl > 0) {
                await client.expire(key, config_1.default.featureStore.ttl);
            }
            features[featureInput.name] = feature;
        }
        // Update feature set metadata
        const featureSetKey = redis_1.redisService.buildKey(entityId, '__meta__');
        const featureSet = {
            entity_id: entityId,
            features,
            last_updated: timestamp,
        };
        await client.set(featureSetKey, JSON.stringify(featureSet));
        if (config_1.default.featureStore.ttl > 0) {
            await client.expire(featureSetKey, config_1.default.featureStore.ttl);
        }
        return featureSet;
    }
    /**
     * Get all features for an entity
     */
    async getFeatures(entityId) {
        const client = redis_1.redisService.getClient();
        const featureSetKey = redis_1.redisService.buildKey(entityId, '__meta__');
        const data = await client.get(featureSetKey);
        if (!data) {
            return null;
        }
        return JSON.parse(data);
    }
    /**
     * Get a single feature for an entity
     */
    async getFeature(entityId, featureName) {
        const client = redis_1.redisService.getClient();
        const key = redis_1.redisService.buildKey(entityId, featureName);
        const data = await client.get(key);
        if (!data) {
            return null;
        }
        return JSON.parse(data);
    }
    /**
     * Get specific features for an entity
     */
    async getFeaturesByNames(entityId, featureNames) {
        const client = redis_1.redisService.getClient();
        const keys = featureNames.map((name) => redis_1.redisService.buildKey(entityId, name));
        const pipeline = client.pipeline();
        for (const key of keys) {
            pipeline.get(key);
        }
        const results = await pipeline.exec();
        const features = {};
        if (results) {
            for (let i = 0; i < results.length; i++) {
                const [err, data] = results[i];
                if (!err && data) {
                    const feature = JSON.parse(data);
                    features[feature.name] = feature;
                }
            }
        }
        return features;
    }
    /**
     * Delete all features for an entity
     */
    async deleteFeatures(entityId) {
        const client = redis_1.redisService.getClient();
        const featureSetKey = redis_1.redisService.buildKey(entityId, '__meta__');
        // Get the feature set to find all feature keys
        const featureSetData = await client.get(featureSetKey);
        let featuresDeleted = 0;
        if (featureSetData) {
            const featureSet = JSON.parse(featureSetData);
            featuresDeleted = Object.keys(featureSet.features).length;
            // Delete all feature keys
            const featureKeys = Object.keys(featureSet.features).map((name) => redis_1.redisService.buildKey(entityId, name));
            if (featureKeys.length > 0) {
                await client.del(...featureKeys);
            }
        }
        // Delete the feature set metadata
        await client.del(featureSetKey);
        return {
            deleted: true,
            featuresDeleted,
        };
    }
    /**
     * Batch get features for multiple entities
     */
    async batchGetFeatures(input) {
        const { entity_ids, feature_names } = input;
        const results = [];
        for (const entityId of entity_ids) {
            let features = {};
            let last_updated = '';
            let found = false;
            if (feature_names && feature_names.length > 0) {
                // Get specific features
                features = await this.getFeaturesByNames(entityId, feature_names);
                found = Object.keys(features).length > 0;
                if (found) {
                    const timestamps = Object.values(features).map((f) => new Date(f.timestamp).getTime());
                    last_updated = new Date(Math.max(...timestamps)).toISOString();
                }
            }
            else {
                // Get all features
                const featureSet = await this.getFeatures(entityId);
                if (featureSet) {
                    features = featureSet.features;
                    last_updated = featureSet.last_updated;
                    found = true;
                }
            }
            results.push({
                entity_id: entityId,
                features,
                last_updated,
                found,
            });
        }
        return results;
    }
    /**
     * Check if entity exists
     */
    async entityExists(entityId) {
        const featureSet = await this.getFeatures(entityId);
        return featureSet !== null;
    }
    /**
     * Get feature count for an entity
     */
    async getFeatureCount(entityId) {
        const featureSet = await this.getFeatures(entityId);
        if (!featureSet) {
            return 0;
        }
        return Object.keys(featureSet.features).length;
    }
}
exports.featureService = new FeatureService();
//# sourceMappingURL=feature.js.map