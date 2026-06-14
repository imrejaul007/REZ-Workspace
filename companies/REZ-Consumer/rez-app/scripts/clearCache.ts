import logger from './utils/logger';

/**
 * Clear Frontend Cache
 *
 * This script clears all cached data in AsyncStorage to ensure
 * the app fetches fresh data from the backend.
 *
 * Run this if you're seeing old/stale data after backend changes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearAllCache() {
  logger.info('🧹 Starting cache clear operation...\n');

  try {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    logger.info(`📋 Found ${keys.length} cached items:\n`);

    // Show what will be cleared
    keys.forEach((key, index) => {
      logger.info(`   ${index + 1}. ${key}`);
    });

    logger.info('\n🗑️  Clearing all cached data...');

    // Clear all
    await AsyncStorage.clear();

    logger.info('✅ Cache cleared successfully!\n');
    logger.info('💡 Next steps:');
    logger.info('   1. Restart your app (shake device and reload)');
    logger.info('   2. Or restart the dev server (npm start)');
    logger.info('   3. Check console logs for "REAL ObjectId ✅" message');

  } catch (error) {
    logger.error('❌ Failed to clear cache:', error);
  }
}

async function clearSpecificCache(pattern: string) {
  logger.info(`🧹 Clearing cache items matching pattern: "${pattern}"\n`);

  try {
    const keys = await AsyncStorage.getAllKeys();
    const matchingKeys = keys.filter(key => key.includes(pattern));

    if (matchingKeys.length === 0) {
      logger.info(`ℹ️  No cache items found matching "${pattern}"`);
      return;
    }

    logger.info(`📋 Found ${matchingKeys.length} matching items:\n`);
    matchingKeys.forEach((key, index) => {
      logger.info(`   ${index + 1}. ${key}`);
    });

    logger.info('\n🗑️  Clearing matched items...');
    await AsyncStorage.multiRemove(matchingKeys);

    logger.info('✅ Cache cleared successfully!');

  } catch (error) {
    logger.error('❌ Failed to clear cache:', error);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length > 0) {
  clearSpecificCache(args[0]);
} else {
  clearAllCache();
}

// Export for use in app
export { clearAllCache, clearSpecificCache };
