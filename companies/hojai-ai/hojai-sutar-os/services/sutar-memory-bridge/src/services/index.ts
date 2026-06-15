export { memoryService } from './MemoryService';
export const versionService = { getVersions: () => [], createVersion: () => ({ id: 'v-1' }) };
export const semanticSearchService = { search: () => [] };
export const analyticsService = { getStats: () => ({ total: 0 }) };
export const ttlManager = { cleanup: () => {} };
export const backupService = { backup: () => 'ok', restore: () => 'ok' };
