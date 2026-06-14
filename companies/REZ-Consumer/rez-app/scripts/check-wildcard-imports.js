import logger from './utils/logger';

#!/usr/bin/env node

/**
 * Check for wildcard imports that should be optimized
 * Finds patterns like: import * as Something from 'module'
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

logger.info('🔍 Checking for wildcard imports...\n');

// Directories to check
const searchPattern = '{app,components,services,hooks,utils,contexts,types}/**/*.{ts,tsx,js,jsx}';

// Find all matching files
glob(searchPattern, { cwd: path.join(__dirname, '..') }, (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    process.exit(1);
  }

  const issues = [];
  const wildcardPattern = /import \* as (\w+) from ['"]([^'"]+)['"]/g;

  files.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    const content = fs.readFileSync(fullPath, 'utf8');

    let match;
    const fileIssues = [];

    // Reset regex
    wildcardPattern.lastIndex = 0;

    while ((match = wildcardPattern.exec(content)) !== null) {
      const [fullMatch, namespace, module] = match;
      fileIssues.push({
        namespace,
        module,
        line: content.substring(0, match.index).split('\n').length
      });
    }

    if (fileIssues.length > 0) {
      issues.push({
        file,
        imports: fileIssues
      });
    }
  });

  // Report results
  if (issues.length === 0) {
    logger.info('✅ No wildcard imports found!\n');
    process.exit(0);
  }

  logger.info(`❌ Found wildcard imports in ${issues.length} files:\n`);

  // Group by module for better reporting
  const byModule = {};

  issues.forEach(({ file, imports }) => {
    imports.forEach(({ namespace, module, line }) => {
      if (!byModule[module]) {
        byModule[module] = [];
      }
      byModule[module].push({ file, namespace, line });
    });
  });

  // Print grouped results
  Object.entries(byModule).forEach(([module, occurrences]) => {
    logger.info(`📦 Module: ${module}`);
    logger.info(`   Found in ${occurrences.length} locations:\n`);

    occurrences.forEach(({ file, namespace, line }) => {
      logger.info(`   ${file}:${line}`);
      logger.info(`   import * as ${namespace} from '${module}'\n`);
    });

    // Suggest optimization
    const suggestions = {
      'expo-camera': '{ Camera, CameraView, useCameraPermissions }',
      'expo-image-picker': '{ launchImageLibraryAsync, MediaTypeOptions }',
      'expo-clipboard': '{ setStringAsync, getStringAsync }',
      'expo-location': '{ getCurrentPositionAsync, requestForegroundPermissionsAsync }',
      'expo-sharing': '{ shareAsync, isAvailableAsync }',
      'expo-document-picker': '{ getDocumentAsync }',
    };

    if (suggestions[module]) {
      logger.info(`   💡 Suggested optimization:`);
      logger.info(`   import ${suggestions[module]} from '${module}'\n`);
    }

    logger.info('   ' + '-'.repeat(70) + '\n');
  });

  // Summary
  console.log('='.repeat(80));
  logger.info('📊 SUMMARY\n');
  logger.info(`Total files with wildcard imports: ${issues.length}`);
  logger.info(`Total wildcard imports: ${Object.values(byModule).flat().length}`);
  logger.info(`Unique modules: ${Object.keys(byModule).length}\n`);

  // Priority modules
  const priorityModules = [
    'expo-camera',
    'expo-image-picker',
    'expo-clipboard',
    'expo-location'
  ];

  const highPriority = Object.keys(byModule).filter(m => priorityModules.includes(m));

  if (highPriority.length > 0) {
    logger.info('⚠️  HIGH PRIORITY (Expo modules):');
    highPriority.forEach(module => {
      logger.info(`   - ${module} (${byModule[module].length} occurrences)`);
    });
    logger.info('');
  }

  // Breakdown by category
  logger.info('📁 Breakdown by Category:\n');

  const categories = {
    'Expo Modules': Object.keys(byModule).filter(m => m.startsWith('expo-')),
    'Services': Object.keys(byModule).filter(m => m.includes('services/')),
    'Utils': Object.keys(byModule).filter(m => m.includes('utils/')),
    'Other': Object.keys(byModule).filter(m =>
      !m.startsWith('expo-') && !m.includes('services/') && !m.includes('utils/')
    ),
  };

  Object.entries(categories).forEach(([category, modules]) => {
    if (modules.length > 0) {
      const count = modules.reduce((sum, m) => sum + byModule[m].length, 0);
      logger.info(`   ${category}: ${modules.length} modules, ${count} imports`);
    }
  });

  logger.info('\n' + '='.repeat(80));

  // Recommendations
  logger.info('\n💡 RECOMMENDATIONS\n');
  logger.info('1. Fix high-priority Expo module imports first');
  logger.info('2. Use the IMPORT_OPTIMIZATION_CHECKLIST.md for guidance');
  logger.info('3. Test each file after optimization');
  logger.info('4. Run this script again to verify fixes\n');

  logger.info('To fix automatically (experimental):');
  logger.info('   node scripts/fix-expo-imports.js\n');

  // Exit with error code
  process.exit(1);
});
