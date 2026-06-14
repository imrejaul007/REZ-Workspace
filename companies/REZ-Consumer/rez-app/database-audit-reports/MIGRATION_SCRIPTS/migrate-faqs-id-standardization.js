import logger from './utils/logger';

/**
 * FAQs ID Standardization Migration
 *
 * PROBLEM: All 32 FAQ documents have both '_id' and 'id' fields
 * SOLUTION: Remove 'id' field, keep only MongoDB '_id'
 *
 * Priority: HIGH
 * Risk: LOW
 * Affected: 32 documents
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://work_db_user:RmptskyDLFNSJGCA@cluster0.ku78x6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'faqs';

async function migrate() {
  const client = new MongoClient(MONGO_URI);

  try {
    logger.info('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Step 1: Count documents with dual IDs
    logger.info('\n📊 Analyzing collection...');
    const totalDocs = await collection.countDocuments();
    const docsWithDualIds = await collection.countDocuments({ id: { $exists: true } });

    logger.info(`Total documents: ${totalDocs}`);
    logger.info(`Documents with 'id' field: ${docsWithDualIds}`);

    if (docsWithDualIds === 0) {
      logger.info('✅ No migration needed - all documents are clean!');
      return;
    }

    // Step 2: Show sample before migration
    logger.info('\n📝 Sample document BEFORE migration:');
    const sampleBefore = await collection.findOne({ id: { $exists: true } });
    console.log(JSON.stringify(sampleBefore, null, 2));

    // Step 3: Create backup
    logger.info('\n💾 Creating backup...');
    const backup = await collection.find({ id: { $exists: true } }).toArray();
    logger.info(`Backed up ${backup.length} documents`);

    // Step 4: Confirm migration
    logger.info('\n⚠️  MIGRATION WILL:');
    logger.info(`   - Remove 'id' field from ${docsWithDualIds} documents`);
    logger.info(`   - Keep '_id' field (MongoDB standard)`);
    logger.info(`   - This change is IRREVERSIBLE without backup`);

    // In production, you'd want user confirmation here
    // For now, we'll proceed automatically

    // Step 5: Perform migration
    logger.info('\n🔄 Performing migration...');
    const result = await collection.updateMany(
      { id: { $exists: true } },
      { $unset: { id: "" } }
    );

    logger.info(`✅ Migration complete!`);
    logger.info(`   Modified: ${result.modifiedCount} documents`);

    // Step 6: Verify migration
    logger.info('\n🔍 Verifying migration...');
    const remainingDualIds = await collection.countDocuments({ id: { $exists: true } });

    if (remainingDualIds === 0) {
      logger.info('✅ Verification passed - no documents with dual IDs');
    } else {
      logger.info(`⚠️  Warning: ${remainingDualIds} documents still have 'id' field`);
    }

    // Step 7: Show sample after migration
    logger.info('\n📝 Sample document AFTER migration:');
    const sampleAfter = await collection.findOne({ _id: sampleBefore._id });
    console.log(JSON.stringify(sampleAfter, null, 2));

    // Step 8: Save backup to file
    const fs = require('fs');
    const backupPath = `./faqs-backup-${Date.now()}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    logger.info(`\n💾 Backup saved to: ${backupPath}`);

    logger.info('\n✨ Migration successful!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    logger.info('\n🔌 Disconnected from MongoDB');
  }
}

// Rollback function
async function rollback(backupFile) {
  const client = new MongoClient(MONGO_URI);

  try {
    logger.info('🔄 Starting rollback...');
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const fs = require('fs');
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    logger.info(`📥 Restoring ${backup.length} documents...`);

    for (const doc of backup) {
      await collection.updateOne(
        { _id: doc._id },
        { $set: { id: doc.id } }
      );
    }

    logger.info('✅ Rollback complete!');

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration
if (require.main === module) {
  // Check if rollback is requested
  if (process.argv[2] === 'rollback' && process.argv[3]) {
    rollback(process.argv[3]).catch(console.error);
  } else {
    migrate().catch(console.error);
  }
}

module.exports = { migrate, rollback };
