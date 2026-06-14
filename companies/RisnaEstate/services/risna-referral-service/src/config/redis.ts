import IORedis from 'ioredis';
import { logger } from './logger';
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) { throw new Error('REDIS_URL required'); }
export const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: 3 });
redis.on('error', (err) => logger.error('[Redis] Error: ' + err.message));
redis.on('ready', () => logger.info('[Redis] Ready'));
