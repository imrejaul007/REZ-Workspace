/**
 * Feature Store Service
 * Core business logic for feature management
 */
import type { Feature, FeatureSet } from '../types';
import type { StoreFeaturesInput, BatchGetInput } from '../validators';
declare class FeatureService {
    /**
     * Determine the type of a feature value
     */
    private getFeatureType;
    /**
     * Store features for an entity
     */
    storeFeatures(entityId: string, input: StoreFeaturesInput): Promise<FeatureSet>;
    /**
     * Get all features for an entity
     */
    getFeatures(entityId: string): Promise<FeatureSet | null>;
    /**
     * Get a single feature for an entity
     */
    getFeature(entityId: string, featureName: string): Promise<Feature | null>;
    /**
     * Get specific features for an entity
     */
    getFeaturesByNames(entityId: string, featureNames: string[]): Promise<Record<string, Feature>>;
    /**
     * Delete all features for an entity
     */
    deleteFeatures(entityId: string): Promise<{
        deleted: boolean;
        featuresDeleted: number;
    }>;
    /**
     * Batch get features for multiple entities
     */
    batchGetFeatures(input: BatchGetInput): Promise<Array<{
        entity_id: string;
        features: Record<string, Feature>;
        last_updated: string;
        found: boolean;
    }>>;
    /**
     * Check if entity exists
     */
    entityExists(entityId: string): Promise<boolean>;
    /**
     * Get feature count for an entity
     */
    getFeatureCount(entityId: string): Promise<number>;
}
export declare const featureService: FeatureService;
export {};
//# sourceMappingURL=feature.d.ts.map