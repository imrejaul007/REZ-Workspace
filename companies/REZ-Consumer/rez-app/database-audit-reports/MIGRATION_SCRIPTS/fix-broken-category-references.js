import logger from './utils/logger';

/**
 * Fix Broken Category References
 *
 * PROBLEM: 7 products reference categories that don't exist
 * SOLUTION: Either create missing categories or update products to valid categories
 *
 * Priority: HIGH
 * Risk: MEDIUM
 * Affected: 7 products
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://work_db_user:RmptskyDLFNSJGCA@cluster0.ku78x6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'test';

async function analyzeAndFix() {
  const client = new MongoClient(MONGO_URI);

  try {
    logger.info('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const products = db.collection('products');
    const categories = db.collection('categories');

    // Step 1: Get all valid category IDs
    logger.info('\n📊 Analyzing data...');
    const validCategories = await categories.find({}).toArray();
    const validCategoryIds = new Set(validCategories.map(c => c._id.toString()));

    logger.info(`Found ${validCategories.length} valid categories`);

    // Step 2: Find products with invalid category references
    const allProducts = await products.find({ category: { $exists: true } }).toArray();
    const orphanedProducts = [];

    for (const product of allProducts) {
      if (product.category && !validCategoryIds.has(product.category.toString())) {
        orphanedProducts.push(product);
      }
    }

    logger.info(`\n⚠️  Found ${orphanedProducts.length} products with invalid category references:`);

    // Group by invalid category ID
    const missingCategories = {};
    orphanedProducts.forEach(product => {
      const catId = product.category.toString();
      if (!missingCategories[catId]) {
        missingCategories[catId] = [];
      }
      missingCategories[catId].push(product);
    });

    // Step 3: Display orphaned products
    logger.info('\n📋 Orphaned products by missing category:');
    for (const [catId, prods] of Object.entries(missingCategories)) {
      logger.info(`\nMissing Category ID: ${catId}`);
      logger.info(`Products affected: ${prods.length}`);
      prods.forEach(p => {
        logger.info(`  - ${p.name || p.title} (${p._id})`);
      });
    }

    // Step 4: Show available categories
    logger.info('\n📂 Available categories:');
    validCategories.forEach(cat => {
      logger.info(`  - ${cat.name} (${cat._id})`);
    });

    // Step 5: Suggest fix strategies
    logger.info('\n💡 Recommended fix strategies:');
    logger.info('1. OPTION A: Create missing categories');
    logger.info('2. OPTION B: Reassign products to existing categories');
    logger.info('3. OPTION C: Set products to default "Uncategorized" category');

    // Step 6: Implement OPTION C (safest - create "Uncategorized" and reassign)
    logger.info('\n🔄 Implementing OPTION C: Create "Uncategorized" category...');

    // Check if "Uncategorized" already exists
    let uncategorized = await categories.findOne({ slug: 'uncategorized' });

    if (!uncategorized) {
      logger.info('Creating "Uncategorized" category...');
      const result = await categories.insertOne({
        name: 'Uncategorized',
        slug: 'uncategorized',
        description: 'Products without assigned category',
        icon: '📦',
        isActive: true,
        sortOrder: 999,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      uncategorized = { _id: result.insertedId };
      logger.info(`✅ Created category: ${uncategorized._id}`);
    } else {
      logger.info(`✅ Using existing "Uncategorized" category: ${uncategorized._id}`);
    }

    // Step 7: Update orphaned products
    if (orphanedProducts.length > 0) {
      logger.info(`\n🔄 Updating ${orphanedProducts.length} products...`);

      const productIds = orphanedProducts.map(p => p._id);
      const updateResult = await products.updateMany(
        { _id: { $in: productIds } },
        { $set: { category: uncategorized._id } }
      );

      logger.info(`✅ Updated ${updateResult.modifiedCount} products`);
    }

    // Step 8: Verify fix
    logger.info('\n🔍 Verifying fix...');
    const stillOrphaned = [];

    const updatedProducts = await products.find({ _id: { $in: orphanedProducts.map(p => p._id) } }).toArray();

    for (const product of updatedProducts) {
      if (product.category && !validCategoryIds.has(product.category.toString()) && product.category.toString() !== uncategorized._id.toString()) {
        stillOrphaned.push(product);
      }
    }

    if (stillOrphaned.length === 0) {
      logger.info('✅ Verification passed - all products have valid categories!');
    } else {
      logger.info(`⚠️  Warning: ${stillOrphaned.length} products still orphaned`);
    }

    // Step 9: Create backup
    logger.info('\n💾 Creating backup...');
    const fs = require('fs');
    const backupPath = `./category-fix-backup-${Date.now()}.json`;
    fs.writeFileSync(backupPath, JSON.stringify({
      orphanedProducts,
      uncategorizedId: uncategorized._id,
      timestamp: new Date().toISOString()
    }, null, 2));
    logger.info(`Backup saved to: ${backupPath}`);

    logger.info('\n✨ Migration successful!');

    // Return summary
    return {
      totalOrphaned: orphanedProducts.length,
      uncategorizedId: uncategorized._id,
      fixed: updateResult?.modifiedCount || 0
    };

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    logger.info('\n🔌 Disconnected from MongoDB');
  }
}

// Alternative: Manual category assignment
async function assignCategories(mappings) {
  /**
   * Usage:
   * assignCategories({
   *   '68ee29d08c4fa11015d70340': '68ecdb9f55f086b04de299ef',  // Map missing cat to existing
   *   '68ee29d08c4fa11015d70342': '68ecdb9f55f086b04de299f0'
   * })
   */
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const products = db.collection('products');

    logger.info('🔄 Applying manual category mappings...');

    for (const [oldCatId, newCatId] of Object.entries(mappings)) {
      const result = await products.updateMany(
        { category: oldCatId },
        { $set: { category: new ObjectId(newCatId) } }
      );
      logger.info(`✅ Mapped ${oldCatId} → ${newCatId}: ${result.modifiedCount} products updated`);
    }

    logger.info('✅ Manual mapping complete!');

  } catch (error) {
    console.error('❌ Mapping failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run
if (require.main === module) {
  analyzeAndFix().catch(console.error);
}

module.exports = { analyzeAndFix, assignCategories };
