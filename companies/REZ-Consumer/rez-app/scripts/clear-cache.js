import logger from './utils/logger';

#!/usr/bin/env node

/**
 * Clear all Metro bundler and Expo caches
 * Run this script when experiencing bundling issues or stuck builds
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const pathsToClean = [
  // Metro cache
  path.join(projectRoot, 'node_modules/.cache'),
  path.join(projectRoot, '.metro'),
  
  // Expo cache
  path.join(projectRoot, '.expo'),
  path.join(projectRoot, '.expo-shared'),
  
  // Web cache
  path.join(projectRoot, '.expo/web'),
  
  // Watchman cache (if exists)
  path.join(projectRoot, '.watchmanconfig'),
  
  // Build artifacts
  path.join(projectRoot, 'dist'),
  path.join(projectRoot, 'build'),
];

logger.info('🧹 Clearing all caches...\n');

let cleanedCount = 0;
let errorCount = 0;

pathsToClean.forEach((cleanPath) => {
  try {
    if (fs.existsSync(cleanPath)) {
      logger.info(`  Removing: ${path.relative(projectRoot, cleanPath)}`);
      fs.rmSync(cleanPath, { recursive: true, force: true });
      cleanedCount++;
    }
  } catch (error) {
    console.error(`  ❌ Error removing ${cleanPath}:`, error.message);
    errorCount++;
  }
});

// Clear npm cache (optional, but can help)
try {
  logger.info('\n  Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit', cwd: projectRoot });
  logger.info('  ✅ npm cache cleared');
} catch (error) {
  logger.info('  ⚠️  Could not clear npm cache (this is optional)');
}

// Clear watchman (if installed)
try {
  logger.info('\n  Clearing watchman...');
  execSync('watchman watch-del-all', { stdio: 'inherit', cwd: projectRoot });
  logger.info('  ✅ watchman cleared');
} catch (error) {
  logger.info('  ℹ️  Watchman not installed or not running (this is optional)');
}

// Windows-specific: Clear temp Metro files
if (process.platform === 'win32') {
  try {
    const tempMetro = path.join(require('os').tmpdir(), 'metro-*');
    logger.info('\n  Clearing Windows temp Metro files...');
    // Note: This might fail if files are locked, which is okay
    logger.info('  ℹ️  Windows temp files will be cleared on next restart');
  } catch (error) {
    // Ignore errors for temp cleanup
  }
}

logger.info(`\n✅ Cache clearing complete!`);
logger.info(`   Cleaned: ${cleanedCount} directories`);
if (errorCount > 0) {
  logger.info(`   Errors: ${errorCount}`);
}
logger.info('\n💡 Next steps:');
logger.info('   1. Run: npm install');
logger.info('   2. Run: npm start -- --clear');
logger.info('   3. If still stuck, try: npm run start:clear');

