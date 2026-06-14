import { logger } from '../../shared/logger';
/**
 * Database Migration Script
 *
 * Run with: npx tsx scripts/migrate.ts
 */

import mongoose from 'mongoose';

// Config
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/twinos';

interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'Create initial schemas',
    up: async () => {
      logger.info('Migration v1: Creating indexes...');

      // ProfessionalTwin indexes
      await mongoose.connection.collection('professionaltwins').createIndex({ twinId: 1 }, { unique: true });
      await mongoose.connection.collection('professionaltwins').createIndex({ ownerCorpId: 1 });
      await mongoose.connection.collection('professionaltwins').createIndex({ twinType: 1 });
      await mongoose.connection.collection('professionaltwins').createIndex({ status: 1 });
      await mongoose.connection.collection('professionaltwins').createIndex({ 'metrics.productivityMultiplier': -1 });

      // AccessGrant indexes
      await mongoose.connection.collection('accessgrants').createIndex({ grantId: 1 }, { unique: true });
      await mongoose.connection.collection('accessgrants').createIndex({ twinId: 1 });
      await mongoose.connection.collection('accessgrants').createIndex({ ownerCorpId: 1 });
      await mongoose.connection.collection('accessgrants').createIndex({ companyCorpId: 1 });
      await mongoose.connection.collection('accessgrants').createIndex({ isActive: 1 });

      // TwinReview indexes
      await mongoose.connection.collection('twinreviews').createIndex({ reviewId: 1 }, { unique: true });
      await mongoose.connection.collection('twinreviews').createIndex({ twinId: 1 });
      await mongoose.connection.collection('twinreviews').createIndex({ ownerCorpId: 1 });

      // SkillEvent indexes
      try {
        await mongoose.connection.collection('skillevents').createIndex({ eventId: 1 }, { unique: true });
        await mongoose.connection.collection('skillevents').createIndex({ corpId: 1 });
        await mongoose.connection.collection('skillevents').createIndex({ twinId: 1 });
        await mongoose.connection.collection('skillevents').createIndex({ skillName: 1 });
        await mongoose.connection.collection('skillevents').createIndex({ createdAt: -1 });
      } catch {
        logger.info('  SkillEvent collection not found, skipping...');
      }

      // Subscription indexes
      try {
        await mongoose.connection.collection('subscriptions').createIndex({ subscriptionId: 1 }, { unique: true });
        await mongoose.connection.collection('subscriptions').createIndex({ ownerCorpId: 1 });
        await mongoose.connection.collection('subscriptions').createIndex({ status: 1 });
      } catch {
        logger.info('  Subscription collection not found, skipping...');
      }

      logger.info('  Indexes created successfully');
    }
  },
  {
    version: 2,
    name: 'Add ownership fields to existing twins',
    up: async () => {
      logger.info('Migration v2: Adding ownership fields...');

      const result = await mongoose.connection.collection('professionaltwins').updateMany(
        { ownership: { $exists: false } },
        {
          $set: {
            ownership: {
              ownedBy: 'EMPLOYEE',
              transferRights: true,
              portability: true
            }
          }
        }
      );

      logger.info(`  Updated ${result.modifiedCount} twins`);
    }
  },
  {
    version: 3,
    name: 'Set default privacy settings',
    up: async () => {
      logger.info('Migration v3: Setting default privacy...');

      const result = await mongoose.connection.collection('professionaltwins').updateMany(
        { privacy: { $exists: false } },
        {
          $set: {
            privacy: {
              shareWithCurrentEmployer: true,
              shareWithFutureEmployer: true,
              showInResume: true,
              verifiedClaims: []
            }
          }
        }
      );

      logger.info(`  Updated ${result.modifiedCount} twins`);
    }
  },
  {
    version: 4,
    name: 'Initialize metrics',
    up: async () => {
      logger.info('Migration v4: Initializing metrics...');

      const result = await mongoose.connection.collection('professionaltwins').updateMany(
        { 'metrics.combinedScore': { $exists: false } },
        {
          $set: {
            'metrics.combinedScore': 50,
            'metrics.knowledgeScore': 0,
            'metrics.executionScore': 0,
            'metrics.reliabilityScore': 85,
            'metrics.productivityMultiplier': 1.0
          }
        }
      );

      logger.info(`  Updated ${result.modifiedCount} twins`);
    }
  },
  {
    version: 5,
    name: 'Add learning source tracking',
    up: async () => {
      logger.info('Migration v5: Adding learning sources...');

      const result = await mongoose.connection.collection('professionaltwins').updateMany(
        { 'learning.sources': { $exists: false } },
        {
          $set: {
            'learning.sources': [],
            'learning.totalTrainingHours': 0,
            'learning.lastActiveAt': new Date()
          }
        }
      );

      logger.info(`  Updated ${result.modifiedCount} twins`);
    }
  }
];

async function runMigrations() {
  logger.info('\n🔄 Starting database migrations...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`Connected to MongoDB: ${MONGODB_URI}\n`);

    // Get current version (stored in a meta collection)
    const meta = await mongoose.connection.collection('migrations').findOne({ _id: 'version' });
    const currentVersion = meta?.version || 0;

    logger.info(`Current migration version: ${currentVersion}`);
    logger.info(`Target migration version: ${migrations.length}\n`);

    // Run pending migrations
    for (const migration of migrations) {
      if (migration.version <= currentVersion) {
        logger.info(`⏭️  Skipping v${migration.version}: ${migration.name} (already applied)`);
        continue;
      }

      logger.info(`\n📦 Running v${migration.version}: ${migration.name}`);

      try {
        await migration.up();

        // Update version
        await mongoose.connection.collection('migrations').updateOne(
          { _id: 'version' },
          { $set: { version: migration.version } },
          { upsert: true }
        );

        logger.info(`✅ v${migration.version} completed`);
      } catch (error) {
        logger.error(`❌ v${migration.version} failed:`, error);
        throw error;
      }
    }

    logger.info('\n✅ All migrations completed successfully\n');
  } catch (error) {
    logger.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Rollback function
async function rollback() {
  logger.info('\n🔄 Rolling back migrations...\n');

  try {
    await mongoose.connect(MONGODB_URI);

    // Reset to version 0
    await mongoose.connection.collection('migrations').updateOne(
      { _id: 'version' },
      { $set: { version: 0 } },
      { upsert: true }
    );

    logger.info('✅ Rolled back to version 0\n');
  } catch (error) {
    logger.error('\n❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Seed function
async function seed() {
  logger.info('\n🌱 Seeding database...\n');

  try {
    await mongoose.connect(MONGODB_URI);

    // Sample employees
    const employees = [
      { corpId: 'CI-IND-SEED001', name: 'Rahul Sharma', role: 'Senior Backend Engineer', skills: ['Python', 'Go', 'Kubernetes'] },
      { corpId: 'CI-IND-SEED002', name: 'Priya Patel', role: 'Product Designer', skills: ['Figma', 'UI/UX', 'Design Systems'] },
      { corpId: 'CI-IND-SEED003', name: 'Amit Kumar', role: 'Sales Manager', skills: ['Negotiation', 'CRM', 'Presentations'] },
      { corpId: 'CI-IND-SEED004', name: 'Sneha Reddy', role: 'Data Scientist', skills: ['Python', 'ML', 'SQL'] },
      { corpId: 'CI-IND-SEED005', name: 'Vikram Singh', role: 'Marketing Lead', skills: ['SEO', 'Content Strategy', 'Analytics'] }
    ];

    const twinTypes = ['KNOWLEDGE', 'SKILL', 'CAREER', 'PRODUCTIVITY', 'EXECUTION'];

    let twinsCreated = 0;

    for (const emp of employees) {
      for (const twinType of twinTypes) {
        const twinId = `TWIN-${emp.corpId}-${twinType}`;

        // Check if exists
        const exists = await mongoose.connection.collection('professionaltwins').findOne({ twinId });
        if (exists) continue;

        // Create twin
        await mongoose.connection.collection('professionaltwins').insertOne({
          twinId,
          ownerCorpId: emp.corpId,
          ownerName: emp.name,
          twinType,
          ownership: {
            ownedBy: 'EMPLOYEE',
            transferRights: true,
            portability: true
          },
          learning: {
            sources: [],
            totalTrainingHours: Math.random() * 200,
            lastActiveAt: new Date()
          },
          knowledge: {
            domains: [emp.role],
            expertise: emp.skills,
            methodologies: [],
            tools: emp.skills,
            languages: ['English']
          },
          behavior: {
            workStyle: 'adaptive',
            communicationStyle: 'professional',
            decisionPattern: 'balanced',
            learningStyle: 'continuous',
            strengths: emp.skills.slice(0, 3),
            growthAreas: []
          },
          metrics: {
            productivityMultiplier: twinType === 'EXECUTION' ? 2.5 : 1.5,
            knowledgeScore: Math.round(50 + Math.random() * 40),
            executionScore: Math.round(50 + Math.random() * 40),
            reliabilityScore: Math.round(85 + Math.random() * 10),
            combinedScore: Math.round(60 + Math.random() * 30)
          },
          privacy: {
            shareWithCurrentEmployer: true,
            shareWithFutureEmployer: true,
            showInResume: twinType !== 'PRODUCTIVITY',
            verifiedClaims: emp.skills
          },
          status: 'ACTIVE',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        twinsCreated++;
      }
    }

    logger.info(`Created ${twinsCreated} sample twins\n`);
  } catch (error) {
    logger.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Main
const command = process.argv[2] || 'up';

switch (command) {
  case 'up':
    runMigrations();
    break;
  case 'down':
  case 'rollback':
    rollback();
    break;
  case 'seed':
    seed();
    break;
  case 'fresh':
    rollback().then(() => runMigrations()).then(() => seed());
    break;
  default:
    logger.info('Usage: npx tsx scripts/migrate.ts [up|down|seed|fresh]');
    process.exit(1);
}
