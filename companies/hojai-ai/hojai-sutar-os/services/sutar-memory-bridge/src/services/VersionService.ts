export interface MemoryVersion { id: string; memoryId: string; version: number; content: string; }
export const versionService = { getVersions: (id: string) => [], createVersion: (o: any) => ({ id: 'v-1', ...o }) };
