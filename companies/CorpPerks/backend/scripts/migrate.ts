import { logger } from '../../shared/logger';
/**
 * Database Migration Script
 *
 * Handles database schema migrations for CorpPerks Backend.
 * Run automatically on startup or manually via: npm run migrate
 *
 * @module backend/scripts/migrate
 * @author RTNM Digital
 * @version 2.0.0
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================
// MIGRATION LOGGER
// ============================================================

const isProduction = process.env.NODE_ENV === 'production';
const isVerbose = process.env.MIGRATION_VERBOSE === 'true';

interface LogLevel {
  prefix: string;
  color: string;
}

const levels: Record<string, LogLevel> = {
  info: { prefix: '📋', color: '\x1b[36m' },
  success: { prefix: '✅', color: '\x1b[32m' },
  warn: { prefix: '⚠️', color: '\x1b[33m' },
  error: { prefix: '❌', color: '\x1b[31m' },
  debug: { prefix: '🔍', color: '\x1b[90m' },
};

const reset = '\x1b[0m';

function log(level: keyof typeof levels, message: string, meta?: Record<string, unknown>): void {
  if (level === 'debug' && !isVerbose) return;
  if (level === 'debug' && !isProduction) return;

  const { prefix, color } = levels[level];
  const timestamp = new Date().toISOString();

  if (isProduction) {
    // JSON logging in production
    const entry = {
      timestamp,
      level: level.toUpperCase(),
      service: 'migration',
      message,
      ...(meta && { meta }),
    };
    logger.info(JSON.stringify(entry));
  } else {
    // Pretty logging in development
    const formatted = `${color}${timestamp} ${prefix} ${message}${reset}`;
    if (meta && Object.keys(meta).length > 0) {
      logger.info(formatted, meta);
    } else {
      logger.info(formatted);
    }
  }
}

// Migration-specific logger
export const migrationLog = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  success: (msg: string, meta?: Record<string, unknown>) => log('success', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
};

// ============================================================
// CONFIGURATION
// ============================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks';

// ============================================================
// SCHEMAS
// ============================================================

const migrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  version: { type: Number, required: true },
  appliedAt: { type: Date, default: Date.now },
  description: String,
});

const Migration = mongoose.models.Migration || mongoose.model('Migration', migrationSchema);

// ============================================================
// MIGRATION TYPES
// ============================================================

interface Migration {
  name: string;
  version: number;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

// ============================================================
// MIGRATIONS
// ============================================================

const migrations: Migration[] = [
  {
    name: '001_initial_schema',
    version: 1,
    description: 'Create initial collections: users, employees, departments, leaves, attendance, shifts',
    up: async () => {
      migrationLog.info('Running migration 001: Initial schema...');

      // Create indexes for users
      await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.collection('users').createIndex({ role: 1 });
      await mongoose.connection.collection('users').createIndex({ tenantId: 1 });

      // Create indexes for employees
      await mongoose.connection.collection('employees').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.collection('employees').createIndex({ department: 1 });
      await mongoose.connection.collection('employees').createIndex({ status: 1 });
      await mongoose.connection.collection('employees').createIndex({ tenantId: 1 });

      // Create indexes for departments
      await mongoose.connection.collection('departments').createIndex({ code: 1 }, { unique: true });
      await mongoose.connection.collection('departments').createIndex({ tenantId: 1 });

      // Create indexes for leaves
      await mongoose.connection.collection('leaves').createIndex({ employee: 1 });
      await mongoose.connection.collection('leaves').createIndex({ status: 1 });
      await mongoose.connection.collection('leaves').createIndex({ leaveType: 1 });
      await mongoose.connection.collection('leaves').createIndex({ startDate: 1, endDate: 1 });

      // Create indexes for attendance
      await mongoose.connection.collection('attendance').createIndex({ employee: 1, date: 1 }, { unique: true });
      await mongoose.connection.collection('attendance').createIndex({ checkIn: 1 });
      await mongoose.connection.collection('attendance').createIndex({ status: 1 });

      // Create indexes for shifts
      await mongoose.connection.collection('shifts').createIndex({ name: 1 }, { unique: true });
      await mongoose.connection.collection('shifts').createIndex({ tenantId: 1 });

      migrationLog.success('Migration 001 completed successfully');
    },
  },
  {
    name: '002_add_tenant_support',
    version: 2,
    description: 'Add multi-tenancy support with tenantId to all collections',
    up: async () => {
      migrationLog.info('Running migration 002: Add tenant support...');

      const collections = ['users', 'employees', 'departments', 'leaves', 'attendance', 'shifts'];

      for (const collectionName of collections) {
        const collection = mongoose.connection.collection(collectionName);

        // Add tenantId index if it doesn't exist
        const indexes = await collection.indexes();
        const hasTenantIndex = indexes.some(idx => 'tenantId' in idx.key);

        if (!hasTenantIndex) {
          await collection.createIndex({ tenantId: 1 });
        }

        // Add compound indexes for tenant-scoped queries
        switch (collectionName) {
          case 'employees':
            await collection.createIndex({ tenantId: 1, email: 1 }, { unique: true });
            await collection.createIndex({ tenantId: 1, department: 1 });
            break;
          case 'departments':
            await collection.createIndex({ tenantId: 1, code: 1 }, { unique: true });
            break;
          case 'leaves':
            await collection.createIndex({ tenantId: 1, employee: 1 });
            await collection.createIndex({ tenantId: 1, status: 1 });
            break;
          case 'attendance':
            await collection.createIndex({ tenantId: 1, employee: 1 });
            break;
        }
      }

      migrationLog.success('Migration 002 completed successfully');
    },
  },
  {
    name: '003_add_geo_attendance',
    version: 3,
    description: 'Add geo-location fields to attendance for geo-attendance feature',
    up: async () => {
      migrationLog.info('Running migration 003: Add geo-attendance support...');

      // Add geolocation indexes for attendance
      await mongoose.connection.collection('attendance').createIndex({ location: '2dsphere' });
      await mongoose.connection.collection('attendance').createIndex({ checkInLocation: '2dsphere' });
      await mongoose.connection.collection('attendance').createIndex({ checkOutLocation: '2dsphere' });

      // Add work locations index
      await mongoose.connection.collection('worklocations').createIndex({ location: '2dsphere' });
      await mongoose.connection.collection('worklocations').createIndex({ radius: 1 });

      migrationLog.success('Migration 003 completed successfully');
    },
  },
  {
    name: '004_add_audit_logs',
    version: 4,
    description: 'Create audit logs collection for compliance',
    up: async () => {
      migrationLog.info('Running migration 004: Create audit logs...');

      await mongoose.connection.collection('auditlogs').createIndex({ timestamp: -1 });
      await mongoose.connection.collection('auditlogs').createIndex({ userId: 1 });
      await mongoose.connection.collection('auditlogs').createIndex({ action: 1 });
      await mongoose.connection.collection('auditlogs').createIndex({ resource: 1 });
      await mongoose.connection.collection('auditlogs').createIndex({ tenantId: 1 });
      await mongoose.connection.collection('auditlogs').createIndex({ timestamp: 1, action: 1 });

      migrationLog.success('Migration 004 completed successfully');
    },
  },
  {
    name: '005_add_performance_metrics',
    version: 5,
    description: 'Add performance metrics and KPI tracking',
    up: async () => {
      migrationLog.info('Running migration 005: Add performance metrics...');

      // Add indexes for performance tracking
      await mongoose.connection.collection('performancereviews').createIndex({ employee: 1, reviewPeriod: 1 });
      await mongoose.connection.collection('performancereviews').createIndex({ status: 1 });
      await mongoose.connection.collection('performancereviews').createIndex({ tenantId: 1 });

      await mongoose.connection.collection('goals').createIndex({ employee: 1 });
      await mongoose.connection.collection('goals').createIndex({ status: 1 });
      await mongoose.connection.collection('goals').createIndex({ dueDate: 1 });

      await mongoose.connection.collection('kpis').createIndex({ employee: 1 });
      await mongoose.connection.collection('kpis').createIndex({ department: 1 });
      await mongoose.connection.collection('kpis').createIndex({ period: 1 });

      migrationLog.success('Migration 005 completed successfully');
    },
  },
  {
    name: '006_add_payroll_support',
    version: 6,
    description: 'Add payroll and compensation tracking',
    up: async () => {
      migrationLog.info('Running migration 006: Add payroll support...');

      await mongoose.connection.collection('salaries').createIndex({ employee: 1 }, { unique: true });
      await mongoose.connection.collection('salaries').createIndex({ effectiveDate: -1 });

      await mongoose.connection.collection('payrollruns').createIndex({ status: 1 });
      await mongoose.connection.collection('payrollruns').createIndex({ payPeriod: 1 });
      await mongoose.connection.collection('payrollruns').createIndex({ tenantId: 1 });

      await mongoose.connection.collection('payslips').createIndex({ employee: 1 });
      await mongoose.connection.collection('payslips').createIndex({ payrollRun: 1 });
      await mongoose.connection.collection('payslips').createIndex({ tenantId: 1 });

      migrationLog.success('Migration 006 completed successfully');
    },
  },
];

// ============================================================
// MIGRATION FUNCTIONS
// ============================================================

/**
 * Get the latest applied migration version
 */
async function getLatestMigrationVersion(): Promise<number> {
  try {
    const latest = await Migration.findOne().sort({ version: -1 });
    return latest?.version || 0;
  } catch {
    return 0;
  }
}

/**
 * Check if migration is already applied
 */
async function isMigrationApplied(name: string): Promise<boolean> {
  const migration = await Migration.findOne({ name });
  return !!migration;
}

/**
 * Apply a migration
 */
async function applyMigration(migration: Migration): Promise<void> {
  migrationLog.info(`Applying migration: ${migration.name} (v${migration.version})`);

  try {
    await migration.up();

    // Record the migration
    await Migration.create({
      name: migration.name,
      version: migration.version,
      description: migration.description,
      appliedAt: new Date(),
    });

    migrationLog.success(`Migration ${migration.name} applied successfully`);
  } catch (error) {
    migrationLog.error(`Failed to apply migration ${migration.name}:`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Rollback a migration
 */
async function rollbackMigration(name: string): Promise<void> {
  const migration = migrations.find(m => m.name === name);
  if (!migration || !migration.down) {
    throw new Error(`Migration ${name} not found or no rollback defined`);
  }

  migrationLog.warn(`Rolling back migration: ${name}`);

  try {
    await migration.down();
    await Migration.deleteOne({ name });
    migrationLog.success(`Migration ${name} rolled back successfully`);
  } catch (error) {
    migrationLog.error(`Failed to rollback migration ${name}:`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations(): Promise<void> {
  migrationLog.info('Starting database migrations...');
  migrationLog.info(`MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    migrationLog.success('Connected to MongoDB');

    const latestVersion = await getLatestMigrationVersion();
    migrationLog.info(`Current migration version: ${latestVersion}`);

    // Find pending migrations
    const pendingMigrations = migrations.filter(m => m.version > latestVersion);

    if (pendingMigrations.length === 0) {
      migrationLog.success('No pending migrations. Database is up to date.');
      return;
    }

    migrationLog.info(`Found ${pendingMigrations.length} pending migration(s)`);

    // Apply each pending migration
    for (const migration of pendingMigrations) {
      await applyMigration(migration);
    }

    migrationLog.success('All migrations completed successfully!');
  } catch (error) {
    migrationLog.error('Migration failed:', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    migrationLog.info('Disconnected from MongoDB');
  }
}

/**
 * Rollback to a specific version
 */
async function rollbackTo(version: number): Promise<void> {
  migrationLog.warn(`Rolling back to version ${version}...`);

  try {
    await mongoose.connect(MONGODB_URI);

    const appliedMigrations = await Migration.find({ version: { $gt: version } })
      .sort({ version: -1 });

    for (const record of appliedMigrations) {
      await rollbackMigration(record.name);
    }

    migrationLog.success(`Rolled back to version ${version}`);
  } catch (error) {
    migrationLog.error('Rollback failed:', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Show migration status
 */
async function showStatus(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);

    const applied = await Migration.find().sort({ version: 1 });

    migrationLog.info('=== Migration Status ===');
    migrationLog.info(`Total migrations: ${migrations.length}`);
    migrationLog.info(`Applied: ${applied.length}`);
    migrationLog.info(`Pending: ${migrations.length - applied.length}`);

    if (applied.length > 0) {
      migrationLog.info('Applied migrations:');
      applied.forEach(m => {
        migrationLog.success(`  ✓ v${m.version} ${m.name} - ${m.description}`);
      });
    }

    const appliedNames = new Set(applied.map(m => m.name));
    const pending = migrations.filter(m => !appliedNames.has(m.name));

    if (pending.length > 0) {
      migrationLog.info('Pending migrations:');
      pending.forEach(m => {
        migrationLog.info(`  ○ v${m.version} ${m.name} - ${m.description}`);
      });
    }
  } catch (error) {
    migrationLog.error('Failed to show status:', {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await mongoose.disconnect();
  }
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

const command = process.argv[2];

async function main() {
  switch (command) {
    case 'up':
    case undefined:
      await runMigrations();
      break;
    case 'rollback':
      const version = parseInt(process.argv[3], 10);
      if (isNaN(version)) {
        migrationLog.error('Please specify a version number: npm run migrate rollback <version>');
        process.exit(1);
      }
      await rollbackTo(version);
      break;
    case 'status':
      await showStatus();
      break;
    default:
      migrationLog.info(`
Database Migration Script

Usage:
  npm run migrate           Run all pending migrations
  npm run migrate status    Show migration status
  npm run migrate rollback  Rollback to previous migration

Examples:
  npm run migrate           # Run all pending migrations
  npm run migrate status    # Show migration status
  npm run migrate rollback 2  # Rollback to version 2
      `);
  }
}

main().catch((error) => {
  migrationLog.error('Migration script failed:', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

export { runMigrations, rollbackTo, showStatus };
