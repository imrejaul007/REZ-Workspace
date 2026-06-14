export interface Connector { id: string; name: string; type: string; config: Record<string, any>; status: 'active' | 'inactive'; createdAt: string; }
export interface SyncJob { id: string; connectorId: string; status: 'pending' | 'running' | 'completed' | 'failed'; recordsProcessed: number; error?: string; createdAt: string; }
