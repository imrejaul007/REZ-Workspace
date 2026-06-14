import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('[FATAL] MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  // Build connection options with replica set support
  const options: mongoose.ConnectOptions = {
    // IDX-1: Disable autoIndex in production (same pattern as monolith).
    // autoIndex=true would make every pod re-run ensureIndex() on boot,
    // stalling startup and racing on large collections. Index creation
    // is handled via one-off migration scripts in production.
    autoIndex: process.env.NODE_ENV !== 'production',
    autoCreate: process.env.NODE_ENV !== 'production',
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Replica set options
    replicaSet: extractReplicaSetName(uri),
    // Read preference: primary for writes, secondary for reads (if specified)
    readPreference: (process.env.MONGODB_READ_PREFERENCE || 'primary') as 'primary' | 'secondary' | 'primaryPreferred' | 'secondaryPreferred' | 'nearest',
    // Auth source
    authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
  };

  mongoose.connection.on('connected', () => logger.info('[MongoDB] Connected', { uri: maskUri(uri) }));
  mongoose.connection.on('disconnected', () => logger.warn('[MongoDB] Disconnected'));
  mongoose.connection.on('error', (err) => logger.error('[MongoDB] Error: ' + err.message));
  mongoose.connection.on('reconnected', () => logger.info('[MongoDB] Reconnected'));

  await mongoose.connect(uri, options);
  logger.info('[MongoDB] Connected successfully', {
    replicaSet: options.replicaSet || 'none',
    readPreference: options.readPreference,
    autoIndex: options.autoIndex,
  });
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
}

/**
 * Extract replica set name from connection URI
 * Format: mongodb://host:27017/db?replicaSet=rs0
 */
function extractReplicaSetName(uri: string): string | undefined {
  try {
    const match = uri.match(/replicaSet=([^&]+)/i);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Mask credentials in URI for logging
 */
function maskUri(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
}
