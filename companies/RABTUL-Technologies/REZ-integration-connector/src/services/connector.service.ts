import { v4 as uuid } from 'uuid';
import { Connector, SyncJob } from '../models/connector';
import logger from '../utils/logger';

const connectors = new Map<string, Connector>();
const syncJobs = new Map<string, SyncJob>();

export const createConnector = (name: string, type: string, config: Record<string, any>): Connector => {
  const id = `conn_${uuid()}`;
  const connector: Connector = { id, name, type, config, status: 'active', createdAt: new Date().toISOString() };
  connectors.set(id, connector);
  logger.info(`Connector created: ${id}`);
  return connector;
};

export const getConnector = (id: string) => connectors.get(id);
export const updateConnector = (id: string, updates: Partial<Connector>) => { const c = connectors.get(id); if (c) Object.assign(c, updates); return c; };
export const deleteConnector = (id: string) => connectors.delete(id);
export const listConnectors = () => Array.from(connectors.values());

export const createSyncJob = (connectorId: string): SyncJob => {
  const job: SyncJob = { id: `sync_${uuid()}`, connectorId, status: 'pending', recordsProcessed: 0, createdAt: new Date().toISOString() };
  syncJobs.set(job.id, job);
  return job;
};

export const runSync = async (connectorId: string): Promise<SyncJob> => {
  const job = createSyncJob(connectorId);
  job.status = 'running';
  logger.info(`Sync started for ${connectorId}`);
  await new Promise(r => setTimeout(r, 500));
  job.status = 'completed';
  job.recordsProcessed = Math.floor(Math.random() * 100);
  logger.info(`Sync completed: ${job.recordsProcessed} records`);
  return job;
};

export const getSyncJobs = (connectorId: string) => Array.from(syncJobs.values()).filter(j => j.connectorId === connectorId);
