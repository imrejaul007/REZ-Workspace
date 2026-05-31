"use strict";
/**
 * Hojai Model Router - Model Registry Integration
 * Provides preferred model overrides from the model registry
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelRegistryService = void 0;
class ModelRegistryService {
    preferences = new Map();
    /**
     * Set a preferred model for a task type
     */
    setPreferredModel(task, provider, model, version) {
        this.preferences.set(task, { provider, model, version });
        console.log(`[Registry] Set preference: ${task} -> ${provider}/${model}`);
    }
    /**
     * Get the preferred model for a task type
     */
    getPreferredModel(task) {
        const preference = this.preferences.get(task);
        return preference?.provider || null;
    }
    /**
     * Get the preferred model details
     */
    getPreferredModelDetails(task) {
        return this.preferences.get(task) || null;
    }
    /**
     * Remove a preference
     */
    removePreference(task) {
        this.preferences.delete(task);
    }
    /**
     * Get all preferences
     */
    getAllPreferences() {
        return new Map(this.preferences);
    }
    /**
     * Clear all preferences
     */
    clearPreferences() {
        this.preferences.clear();
    }
    /**
     * Load preferences from a model registry
     * This would typically call the model-registry service
     */
    async loadFromRegistry(registryUrl) {
        try {
            const response = await fetch(`${registryUrl}/api/models`);
            if (!response.ok) {
                console.warn(`[Registry] Failed to load from registry: ${response.status}`);
                return;
            }
            const jsonData = await response.json();
            const data = jsonData;
            // Process models and set preferences based on production models
            if (data.models) {
                for (const model of data.models) {
                    if (model.versions) {
                        const productionVersions = model.versions.filter((v) => v.stage === 'production');
                        if (productionVersions.length > 0) {
                            // Find the latest production version
                            const latest = productionVersions[productionVersions.length - 1];
                            if (latest) {
                                const metadata = latest.metadata;
                                if (metadata?.task && metadata?.provider) {
                                    this.setPreferredModel(metadata.task, metadata.provider, `${model.name}:${latest.version}`, latest.version);
                                }
                            }
                        }
                    }
                }
            }
            console.log(`[Registry] Loaded ${this.preferences.size} preferences from registry`);
        }
        catch (error) {
            console.warn('[Registry] Could not load from registry:', error);
        }
    }
}
// Export singleton instance
exports.modelRegistryService = new ModelRegistryService();
//# sourceMappingURL=registry.js.map