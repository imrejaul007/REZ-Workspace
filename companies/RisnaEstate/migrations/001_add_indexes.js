/**
 * RisnaEstate - MongoDB Migrations
 *
 * Run: node migrations/run.js
 */

const mongoose = require('mongoose');

// Connection configs
const DB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-property';

const migrations = [
  {
    name: '001_add_indexes',
    description: 'Add indexes to improve query performance',
    up: async () => {
      const db = mongoose.connection.db;

      // Property indexes
      await db.collection('properties').createIndexes([
        { key: { status: 1, country: 1 } },
        { key: { 'price.amount': 1 } },
        { key: { propertyType: 1, listingType: 1 } },
        { key: { city: 1, locality: 1 } },
        { key: { brokerId: 1, status: 1 } },
        { key: { tags: 1 } },
        { key: { createdAt: -1 } },
        { key: { featured: 1, status: 1 } }
      ]);

      // Lead indexes
      await db.collection('leads').createIndexes([
        { key: { phone: 1 } },
        { key: { email: 1 } },
        { key: { brokerId: 1, status: 1 } },
        { key: { segment: 1 } },
        { key: { 'aiScore.overall': -1 } },
        { key: { createdAt: -1 } },
        { key: { source: 1 } }
      ]);

      console.log('✓ Indexes created');
    },
    down: async () => {
      const db = mongoose.connection.db;

      await db.collection('properties').dropIndexes();
      await db.collection('leads').dropIndexes();

      console.log('✓ Indexes dropped');
    }
  },
  {
    name: '002_add_soft_delete',
    description: 'Add deletedAt field for soft delete',
    up: async () => {
      const db = mongoose.connection.db;

      const collections = ['properties', 'leads', 'visas', 'referrals', 'brokers', 'followups', 'sitevisits'];

      for (const collection of collections) {
        try {
          await db.collection(collection).updateMany(
            { deletedAt: { $exists: false } },
            { $set: { deletedAt: null } }
          );
          console.log(`✓ Added deletedAt to ${collection}`);
        } catch (err) {
          console.log(`⚠ ${collection}: ${err.message}`);
        }
      }
    },
    down: async () => {
      console.log('↩ Down migration not needed - deletedAt stays');
    }
  },
  {
    name: '003_add_timestamps',
    description: 'Ensure timestamps on all collections',
    up: async () => {
      const db = mongoose.connection.db;

      const collections = ['properties', 'leads', 'visas', 'referrals', 'brokers'];

      for (const collection of collections) {
        try {
          await db.collection(collection).updateMany(
            { createdAt: { $exists: false } },
            { $set: { createdAt: new Date() } }
          );
          await db.collection(collection).updateMany(
            { updatedAt: { $exists: false } },
            { $set: { updatedAt: new Date() } }
          );
          console.log(`✓ Added timestamps to ${collection}`);
        } catch (err) {
          console.log(`⚠ ${collection}: ${err.message}`);
        }
      }
    },
    down: async () => {
      console.log('↩ Down migration not needed');
    }
  }
];

async function run() {
  const command = process.argv[2] || 'up';

  console.log('======================================');
  console.log('  RisnaEstate Migrations');
  console.log('======================================\n');

  if (command === 'down') {
    console.log('Running DOWN migrations...\n');
    for (const migration of migrations.reverse()) {
      try {
        console.log(`Running: ${migration.name}`);
        await migration.down();
        console.log(`  ✓ ${migration.description}\n`);
      } catch (err) {
        console.error(`  ✗ Failed: ${err.message}\n`);
      }
    }
  } else {
    console.log('Running UP migrations...\n');
    for (const migration of migrations) {
      try {
        console.log(`Running: ${migration.name}`);
        await migration.up();
        console.log(`  ✓ ${migration.description}\n`);
      } catch (err) {
        console.error(`  ✗ Failed: ${err.message}\n`);
      }
    }
  }

  console.log('======================================');
  console.log('  Migrations complete');
  console.log('======================================');

  await mongoose.disconnect();
  process.exit(0);
}

// Connect and run
mongoose.connect(DB_URL)
  .then(() => {
    console.log(`Connected to ${DB_URL}\n`);
    run();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  });
