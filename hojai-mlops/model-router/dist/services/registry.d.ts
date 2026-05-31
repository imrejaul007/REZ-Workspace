/**
 * Hojai Model Router - Model Registry Integration
 * Provides preferred model overrides from the model registry
 */
import { TaskType, LLMProvider } from '../types';
/**
 * Model preference mapping
 * Allows the model registry to override default routing decisions
 */
interface ModelPreference {
    provider: LLMProvider;
    model: string;
    version?: string;
    metrics?: Record<string, number>;
}
declare class ModelRegistryService {
    private preferences;
    /**
     * Set a preferred model for a task type
     */
    setPreferredModel(task: TaskType, provider: LLMProvider, model: string, version?: string): void;
    /**
     * Get the preferred model for a task type
     */
    getPreferredModel(task: TaskType): LLMProvider | null;
    /**
     * Get the preferred model details
     */
    getPreferredModelDetails(task: TaskType): ModelPreference | null;
    /**
     * Remove a preference
     */
    removePreference(task: TaskType): void;
    /**
     * Get all preferences
     */
    getAllPreferences(): Map<TaskType, ModelPreference>;
    /**
     * Clear all preferences
     */
    clearPreferences(): void;
    /**
     * Load preferences from a model registry
     * This would typically call the model-registry service
     */
    loadFromRegistry(registryUrl: string): Promise<void>;
}
export declare const modelRegistryService: ModelRegistryService;
export {};
//# sourceMappingURL=registry.d.ts.map