import mongoose from 'mongoose';

// ─── Structured Logger ─────────────────────────────────────────────────────────
const SERVICE_NAME = 'rez-profile-service';

function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, meta?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    service: SERVICE_NAME,
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(logEntry));
}

// SECURITY FIX: Fail at startup if MONGODB_URI not set
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI as string, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    log('INFO', 'Connected to MongoDB');
  } catch (error) {
    log('ERROR', 'MongoDB connection error', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

mongoose.connection.on('error', (err) => {
  log('ERROR', 'MongoDB connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  log('WARN', 'MongoDB disconnected');
});

export { mongoose };
