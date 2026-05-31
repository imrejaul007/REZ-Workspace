/**
 * Hojai Model Registry - In-Memory Model Store
 */
import { ModelStage, RegisterModelRequest, RegisterModelResponse, ListModelsResponse, GetModelVersionsResponse, GetModelVersionResponse, GetLatestVersionResponse, UpdateStageResponse, DeleteVersionResponse } from '../types';
declare class ModelRegistryService {
    private models;
    /**
     * Register a new model version or update existing model
     */
    registerModel(request: RegisterModelRequest): Promise<RegisterModelResponse>;
    /**
     * List all registered models
     */
    listModels(): Promise<ListModelsResponse>;
    /**
     * Get all versions for a specific model
     */
    getModelVersions(name: string): Promise<GetModelVersionsResponse>;
    /**
     * Get the latest version of a model
     */
    getLatestVersion(name: string): Promise<GetLatestVersionResponse>;
    /**
     * Get a specific version of a model
     */
    getVersion(name: string, version: string): Promise<GetModelVersionResponse>;
    /**
     * Update the stage of a specific model version
     */
    updateStage(name: string, version: string, newStage: ModelStage): Promise<UpdateStageResponse>;
    /**
     * Delete a specific version of a model
     */
    deleteVersion(name: string, version: string): Promise<DeleteVersionResponse>;
    /**
     * Get statistics about registered models
     */
    getStats(): Promise<{
        models_registered: number;
        total_versions: number;
    }>;
    /**
     * Compare two semver versions
     * Returns negative if a < b, positive if a > b, 0 if equal
     */
    private compareVersions;
}
export declare const modelRegistryService: ModelRegistryService;
export {};
//# sourceMappingURL=registry.d.ts.map