import { logger } from '../../shared/logger';
/**
 * MongoDB Migration Runner
 * Runs all migrations in order
 *
 * Usage:
 *   npm run migrate           - Run all pending migrations
 *   npm run migrate:rollback  - Rollback last migration
 *   npm run migrate:status    - Show migration status
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risna';
const MIGRATIONS_DIR = __dirname;

interface Migration {
  id: string;
  name: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

// Migration metadata type
interface MigrationRecord {
  id: string;
  name: string;
  description: string;
  appliedAt: Date;
}

// Load all migration files
async function loadMigrations(): Promise<Migration[]> {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d{3}_.+\.ts$/.test(f))
    .sort();

  const migrations: Migration[] = [];

  for (const file of files) {
    try {
      const module = await import(path.join(MIGRATIONS_DIR, file));
      const migration = module.default;
      const id = file.split('_')[0];

      if (migration && typeof migration.up === 'function' && typeof migration.down === 'function') {
        migrations.push({
          id,
          name: file.replace('.ts', ''),
          description: migration.description || '',
          up: migration.up,
          down: migration.down
        });
      }
    } catch (err) {
      logger.error(`Failed to load migration ${file}:`, err);
    }
  }

  return migrations;
}

// Get applied migrations from database
async function getAppliedMigrations(): Promise<MigrationRecord[]> {
  const db = mongoose.connection.db!;

  // Ensure migrations collection exists
  const collections = await db.listCollections({ name: 'migrations' }).toArray();
  if (collections.length === 0) {
    await db.createCollection('migrations');
  }

  return await db.collection<MigrationRecord>('migrations').find().toArray();
}

// Record migration as applied
async function recordMigration(migration: Migration): Promise<void> {
  await mongoose.connection.db!.collection('migrations').insertOne({
    id: migration.id,
    name: migration.name,
    description: migration.description,
    appliedAt: new Date()
  });
}

// Remove migration record
async function removeMigration(id: string): Promise<void> {
  await mongoose.connection.db!.collection('migrations').deleteOne({ id });
}

// Run all pending migrations
async function runMigrations(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  logger.info(`\n========================================`);
  logger.info(`  RisnaEstate Migration Runner`);
  logger.info(`========================================\n`);
  logger.info(`Connected to: ${MONGODB_URI}\n`);

  const migrations = await loadMigrations();
  const applied = await getAppliedMigrations();
  const appliedIds = applied.map(m => m.id);

  logger.info(`Found ${migrations.length} migrations\n`);

  let appliedCount = 0;

  for (const migration of migrations) {
    if (appliedIds.includes(migration.id)) {
      logger.info(`⏭  ${migration.id} - ${migration.name}`);
      logger.info(`    Skipping (already applied)\n`);
      continue;
    }

    logger.info(`⬆  ${migration.id} - ${migration.name}`);
    if (migration.description) {
      logger.info(`    ${migration.description}`);
    }

    try {
      await migration.up();
      await recordMigration(migration);
      logger.info(`    ✅ Applied successfully\n`);
      appliedCount++;
    } catch (err: any) {
      logger.error(`    ❌ Failed: ${err.message}\n`);
      throw err;
    }
  }

  logger.info(`========================================`);
  logger.info(`  ${appliedCount === 0 ? 'No new migrations' : `${appliedCount} migration(s) applied`}`);
  logger.info(`========================================\n`);

  await mongoose.disconnect();
}

// Rollback a specific migration
async function rollbackMigration(id?: string): Promise<void> {
  await mongoose.connect(MONGODB_URI);

  logger.info(`\n========================================`);
  logger.info(`  RisnaEstate Migration Rollback`);
  logger.info(`========================================\n`);

  const migrations = await loadMigrations();
  const applied = await getAppliedMigrations();
  const appliedIds = applied.map(m => m.id);

  let targetMigration: Migration | undefined;

  if (id) {
    // Rollback specific migration
    targetMigration = migrations.find(m => m.id === id);
    if (!targetMigration) {
      logger.error(`Migration ${id} not found`);
      await mongoose.disconnect();
      process.exit(1);
    }
  } else {
    // Rollback last applied migration
    const sortedApplied = applied.sort((a, b) =>
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    if (sortedApplied.length === 0) {
      logger.info('No migrations to rollback\n');
      await mongoose.disconnect();
      return;
    }

    const lastApplied = sortedApplied[0];
    targetMigration = migrations.find(m => m.id === lastApplied.id);

    if (!targetMigration) {
      logger.error(`Migration ${lastApplied.id} not found in files`);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  logger.info(`Rolling back: ${targetMigration.id} - ${targetMigration.name}\n`);

  try {
    await targetMigration.down();
    await removeMigration(targetMigration.id);
    logger.info(`✅ Migration ${targetMigration.id} rolled back successfully\n`);
  } catch (err: any) {
    logger.error(`❌ Rollback failed: ${err.message}\n`);
    throw err;
  }

  logger.info(`========================================\n`);

  await mongoose.disconnect();
}

// Show migration status
async function showStatus(): Promise<void> {
  await mongoose.connect(MONGODB_URI);

  logger.info(`\n========================================`);
  logger.info(`  Migration Status`);
  logger.info(`========================================\n`);

  const migrations = await loadMigrations();
  const applied = await getAppliedMigrations();
  const appliedIds = applied.map(m => m.id);

  logger.info(`Migration ID  | Status  | Name`);
  logger.info(`------------- | ------- | ----`);

  for (const migration of migrations) {
    const status = appliedIds.includes(migration.id) ? '✅ Applied' : '⏳ Pending';
    logger.info(`${migration.id.padEnd(14)} | ${status.padEnd(7)} | ${migration.name}`);
  }

  const appliedCount = applied.length;
  const pendingCount = migrations.length - appliedCount;

  logger.info(`\n----------------------------------------`);
  logger.info(`Total: ${migrations.length} | Applied: ${appliedCount} | Pending: ${pendingCount}`);
  logger.info(`========================================\n`);

  await mongoose.disconnect();
}

// Main entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'rollback':
      const rollbackId = args[1];
      await rollbackMigration(rollbackId);
      break;
    case 'status':
      await showStatus();
      break;
    default:
      await runMigrations();
  }
}

main().catch(err => {
  logger.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});