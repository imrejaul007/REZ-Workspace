import { logger } from '../../shared/logger';
/**
 * CorpID v2.0 - Employee Migration Script
 *
 * Links existing employees to CorpID identities
 *
 * @module backend/scripts/migrateEmployeesToCorpId
 * @author RTNM Digital
 * @version 2.0.0
 *
 * Usage:
 *   npx tsx scripts/migrateEmployeesToCorpId.ts
 *   npx tsx scripts/migrateEmployeesToCorpId.ts --dry-run
 *   npx tsx scripts/migrateEmployeesToCorpId.ts --tenant=TENANT_ID
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

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
  skipped: { prefix: '⏭️', color: '\x1b[90m' },
  link: { prefix: '🔗', color: '\x1b[35m' },
  stats: { prefix: '📊', color: '\x1b[36m' },
};

const reset = '\x1b[0m';

function log(level: string, message: string, meta?: Record<string, unknown>): void {
  if (level === 'debug' && !isVerbose) return;

  const { prefix, color } = levels[level] || levels.info;
  const timestamp = new Date().toISOString();

  if (isProduction) {
    // JSON logging in production
    const entry = {
      timestamp,
      level: level.toUpperCase(),
      service: 'corpid-migration',
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

const migrationLog = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  success: (msg: string, meta?: Record<string, unknown>) => log('success', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  skipped: (msg: string, meta?: Record<string, unknown>) => log('skipped', msg, meta),
  link: (msg: string, meta?: Record<string, unknown>) => log('link', msg, meta),
  stats: (msg: string, meta?: Record<string, unknown>) => log('stats', msg, meta),
};

// ============================================================
// TYPES
// ============================================================

interface EmployeeDoc {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  designation?: string;
  managerId?: string;
  corpId?: string;
  corpIdSyncStatus?: string;
}

// ============================================================
// CONFIGURATION
// ============================================================

const CORPID_URL = process.env.CORPID_SERVICE_URL || 'http://localhost:4702';
const CORPID_TOKEN = process.env.CORPID_INTERNAL_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks';

// Validate required environment variables
if (!CORPID_TOKEN) {
  migrationLog.error('CORPID_INTERNAL_TOKEN environment variable is required');
  process.exit(1);
}

// Flags
const DRY_RUN = process.argv.includes('--dry-run');
const TENANT_FILTER = process.argv.find(arg => arg.startsWith('--tenant='))?.split('=')[1];

// Stats
const stats = {
  total: 0,
  processed: 0,
  success: 0,
  skipped: 0,
  failed: 0,
  errors: [] as string[],
};

// ============================================================
// CORPID API CLIENT
// ============================================================

/**
 * Make request to CorpID service
 */
async function corpIdRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${CORPID_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': CORPID_TOKEN,
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || `CorpID request failed: ${response.status}`);
  }
  return data;
}

// ============================================================
// MIGRATION FUNCTIONS
// ============================================================

/**
 * Link employee to CorpID
 */
async function linkEmployeeToCorpId(employee: EmployeeDoc): Promise<{ corpId: string; preExisting: boolean } | null> {
  try {
    const result = await corpIdRequest('/identities/link/employee', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: employee.employeeId,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        designation: employee.designation,
        metadata: {
          tenantId: employee.tenantId,
          migratedAt: new Date().toISOString(),
          source: 'migration_script',
        },
      }),
    });

    return result.data;
  } catch (error: any) {
    migrationLog.error(`Failed to link ${employee.employeeId}: ${error.message}`);
    stats.errors.push(`${employee.employeeId}: ${error.message}`);
    return null;
  }
}

/**
 * Create manager relationship
 */
async function createManagerRelationship(
  employeeCorpId: string,
  managerCorpId: string,
  employeeId: string
): Promise<void> {
  try {
    // Use the trust-graph service port
    const trustGraphUrl = CORPID_URL.replace(':4702', ':4706');
    await fetch(`${trustGraphUrl}/relationships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': CORPID_TOKEN,
      },
      body: JSON.stringify({
        fromCorpId: employeeCorpId,
        toCorpId: managerCorpId,
        type: 'REPORTS_TO',
        verified: true,
        metadata: {
          source: 'migration_script',
          migratedAt: new Date().toISOString(),
        },
      }),
    });
    migrationLog.success('Created REPORTS_TO relationship');
  } catch (error: any) {
    migrationLog.warn(`Could not create manager relationship: ${error.message}`);
    // Don't fail the migration for relationship issues
  }
}

/**
 * Main migration function
 */
async function migrate() {
  migrationLog.info('CorpID v2.0 Employee Migration', {
    mode: DRY_RUN ? 'DRY RUN' : 'LIVE',
    corpIdUrl: CORPID_URL,
    tenantFilter: TENANT_FILTER || 'none',
  });

  // Connect to MongoDB
  migrationLog.info('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  migrationLog.success('Connected to MongoDB');

  // Get Employee model
  const { Employee } = await import('../src/models/index.js');

  // Build query
  const query: any = { isDeleted: false };
  if (TENANT_FILTER) {
    query.tenantId = TENANT_FILTER;
  }

  // Count employees
  stats.total = await Employee.countDocuments(query);
  migrationLog.stats(`Found ${stats.total} employees to process`);

  if (stats.total === 0) {
    migrationLog.info('Nothing to migrate. Exiting.');
    await mongoose.disconnect();
    return;
  }

  // Process in batches
  const batchSize = 50;
  let skip = 0;

  while (skip < stats.total) {
    const employees = await Employee.find(query)
      .skip(skip)
      .limit(batchSize)
      .lean<EmployeeDoc[]>();

    for (const employee of employees) {
      stats.processed++;

      // Skip if already has CorpID
      if (employee.corpId && employee.corpIdSyncStatus === 'synced') {
        migrationLog.skipped(`[${stats.processed}/${stats.total}] ${employee.employeeId} - Already linked (${employee.corpId})`);
        stats.skipped++;
        continue;
      }

      migrationLog.link(`[${stats.processed}/${stats.total}] ${employee.employeeId} - ${employee.firstName} ${employee.lastName}`);

      if (DRY_RUN) {
        migrationLog.info('Would link to CorpID');
        stats.skipped++;
        continue;
      }

      // Link to CorpID
      const result = await linkEmployeeToCorpId(employee);

      if (result) {
        // Update employee record
        await Employee.updateOne(
          { _id: employee._id },
          {
            $set: {
              corpId: result.corpId,
              corpIdSyncStatus: 'synced',
              lastSyncedAt: new Date(),
            },
          }
        );

        migrationLog.success(`Linked to CorpID: ${result.corpId}`);

        if (result.preExisting) {
          migrationLog.info('CorpID already existed (employee may have been previously linked)');
        }

        // Create manager relationship if manager exists and has CorpID
        if (employee.managerId) {
          const manager = await Employee.findOne({
            employeeId: employee.managerId,
            isDeleted: false,
          }).lean<EmployeeDoc | null>();

          if (manager?.corpId) {
            await createManagerRelationship(result.corpId, manager.corpId, employee.employeeId);
          }
        }

        stats.success++;
      } else {
        // Mark as error
        await Employee.updateOne(
          { _id: employee._id },
          { $set: { corpIdSyncStatus: 'error' } }
        );
        stats.failed++;
      }
    }

    skip += batchSize;
    migrationLog.stats(`Progress: ${Math.min(skip, stats.total)}/${stats.total}`);
  }

  // Summary
  migrationLog.stats('MIGRATION SUMMARY', {
    totalEmployees: stats.total,
    processed: stats.processed,
    success: stats.success,
    skipped: stats.skipped,
    failed: stats.failed,
    errorCount: stats.errors.length,
  });

  if (stats.errors.length > 0) {
    migrationLog.warn('Errors occurred during migration', {
      errors: stats.errors.slice(0, 10),
      additionalErrors: stats.errors.length > 10 ? stats.errors.length - 10 : 0,
    });
  }

  if (DRY_RUN) {
    migrationLog.warn('This was a DRY RUN. No changes were made.');
    migrationLog.info('Run without --dry-run to apply changes.');
  } else {
    migrationLog.success('Migration complete!');
  }

  await mongoose.disconnect();
}

// ============================================================
// MAIN
// ============================================================

migrate().catch(error => {
  migrationLog.error('Migration failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
