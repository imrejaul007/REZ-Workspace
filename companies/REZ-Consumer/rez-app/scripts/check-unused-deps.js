import logger from './utils/logger';

#!/usr/bin/env node

/**
 * Check for unused dependencies in package.json
 * This script searches for imports of each dependency across the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

logger.info('🔍 Checking for unused dependencies...\n');

// Read package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);

const dependencies = Object.keys(packageJson.dependencies || {});
const devDependencies = Object.keys(packageJson.devDependencies || {});

// Directories to search
const searchDirs = ['app', 'components', 'services', 'hooks', 'utils', 'contexts', 'types'];

// Dependencies to skip (always needed but not imported directly)
const skipDeps = [
  'react',
  'react-dom',
  'react-native',
  'expo',
  'expo-router',
  'expo-modules-core',
  'expo-status-bar',
  'expo-splash-screen',
  'expo-system-ui',
];

// Check if dependency is used
function isDependencyUsed(dep) {
  if (skipDeps.includes(dep)) {
    return { used: true, count: -1, reason: 'Core dependency (always needed)' };
  }

  try {
    // Search for imports
    const searchPattern = `from ['"]${dep}`;
    let count = 0;

    for (const dir of searchDirs) {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) continue;

      try {
        const result = execSync(
          `grep -r "${searchPattern}" "${dirPath}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true`,
          { encoding: 'utf8' }
        );
        const lines = result.split('\n').filter(line => line.trim());
        count += lines.length;
      } catch (error) {
        // Grep found nothing, continue
      }
    }

    return {
      used: count > 0,
      count,
      reason: count > 0 ? `${count} occurrences` : 'Not found in imports'
    };
  } catch (error) {
    return { used: true, count: -1, reason: 'Error checking (assuming used)' };
  }
}

// Check production dependencies
logger.info('📦 Production Dependencies:\n');
const unusedProduction = [];
const usedProduction = [];

dependencies.forEach((dep) => {
  const { used, count, reason } = isDependencyUsed(dep);

  if (!used) {
    logger.info(`❌ UNUSED: ${dep}`);
    logger.info(`   Reason: ${reason}\n`);
    unusedProduction.push(dep);
  } else if (count > 0) {
    usedProduction.push({ dep, count });
  }
});

// Check dev dependencies
logger.info('\n🔧 Dev Dependencies:\n');
const unusedDev = [];

devDependencies.forEach((dep) => {
  // Dev deps are used in build/test, harder to check
  // Just list them
  logger.info(`ℹ️  ${dep} (dev dependency - manual check needed)`);
});

// Summary
logger.info('\n' + '='.repeat(60));
logger.info('📊 SUMMARY\n');
logger.info(`Total Production Dependencies: ${dependencies.length}`);
logger.info(`Used: ${usedProduction.length}`);
logger.info(`Unused: ${unusedProduction.length}`);
logger.info(`Skipped (Core): ${dependencies.filter(d => skipDeps.includes(d)).length}\n`);

if (unusedProduction.length > 0) {
  logger.info('⚠️  Unused Production Dependencies:');
  unusedProduction.forEach(dep => {
    logger.info(`   - ${dep}`);
  });
  logger.info('\n💡 To remove:');
  logger.info(`   npm uninstall ${unusedProduction.join(' ')}\n`);

  // Estimate size savings
  logger.info('📉 Estimated Size Savings:');
  const sizesEstimate = {
    'inline-style-prefixer': '150KB',
    'css-in-js-utils': '50KB',
    'react-native-worklets': '200KB',
    'ajv': '180KB',
    'react-router-dom': '350KB',
    'lucide-react': '1.2MB',
  };

  let totalEstimate = 0;
  unusedProduction.forEach(dep => {
    const size = sizesEstimate[dep] || '~100KB';
    logger.info(`   ${dep}: ${size}`);
    if (size.includes('MB')) {
      totalEstimate += parseFloat(size) * 1024;
    } else {
      totalEstimate += parseInt(size);
    }
  });

  if (totalEstimate > 0) {
    if (totalEstimate > 1024) {
      logger.info(`\n   Total: ~${(totalEstimate / 1024).toFixed(2)} MB`);
    } else {
      logger.info(`\n   Total: ~${totalEstimate} KB`);
    }
  }
} else {
  logger.info('✅ No unused production dependencies found!');
}

logger.info('\n' + '='.repeat(60));

// Most used dependencies
logger.info('\n📈 Most Used Dependencies:\n');
usedProduction
  .sort((a, b) => b.count - a.count)
  .slice(0, 10)
  .forEach(({ dep, count }) => {
    logger.info(`   ${dep}: ${count} imports`);
  });

logger.info('\n✅ Dependency check complete!\n');

// Exit with error if unused deps found
if (unusedProduction.length > 0) {
  process.exit(1);
}
