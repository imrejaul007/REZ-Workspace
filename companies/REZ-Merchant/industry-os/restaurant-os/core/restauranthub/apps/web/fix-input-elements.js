import logger from './utils/logger';

#!/usr/bin/env node

/**
 * Fix Input Element Migration Script
 * Fixes incorrectly transformed Input and HTML elements
 */

const fs = require('fs');
const path = require('path');

const FIXES = [
  // Fix Input elements with incorrect onCheckedChange
  {
    name: 'Input onCheckedChange → onChange',
    search: /onCheckedChange=\{\(checked\)\s*=>\s*\(e\)\s*=>\s*([^(]+)\(e\.target\.value\)\(checked\s*===\s*true\)\}/g,
    replace: 'onChange={(e) => $1(e.target.value)}'
  },

  // Fix Input date elements
  {
    name: 'Input date onCheckedChange → onChange',
    search: /onCheckedChange=\{\(checked\)\s*=>\s*\(e\)\s*=>\s*([^}]+)\(checked\s*===\s*true\)\}/g,
    replace: 'onChange={(e) => $1}'
  },

  // Fix HTML select elements
  {
    name: 'Select onCheckedChange → onChange',
    search: /onCheckedChange=\{\(checked\)\s*=>\s*\(e\)\s*=>\s*([^(]+)\(e\.target\.value\)\(checked\s*===\s*true\)\}/g,
    replace: 'onChange={(e) => $1(e.target.value)}'
  },

  // Fix Checkbox with incorrect function calls
  {
    name: 'Checkbox function call fix',
    search: /onCheckedChange=\{\(checked\)\s*=>\s*\(\)\s*=>\s*([^(]+)\(([^)]+)\)\(checked\s*===\s*true\)\}/g,
    replace: 'onCheckedChange={(checked) => $1($2, checked === true)}'
  }
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  FIXES.forEach(fix => {
    const newContent = content.replace(fix.search, fix.replace);
    if (newContent !== content) {
      content = newContent;
      changed = true;
      logger.info(`  ✓ ${fix.name}`);
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

function main() {
  const webDir = process.cwd();
  logger.info('🔧 Fixing Input element issues...');

  // Find files with the problematic patterns
  const problematicFiles = [
    'app/admin/marketplace/products/page.tsx',
    'app/admin/reports/export/page.tsx',
    'components/payments/PaymentDashboard.tsx',
    'components/payments/PaymentHistory.tsx'
  ];

  let fixedCount = 0;

  problematicFiles.forEach(relativePath => {
    const fullPath = path.join(webDir, relativePath);
    if (fs.existsSync(fullPath)) {
      logger.info(`\n🔍 Fixing: ${relativePath}`);
      if (fixFile(fullPath)) {
        fixedCount++;
        logger.info(`✅ Fixed: ${relativePath}`);
      } else {
        logger.info(`⏭️  No changes needed`);
      }
    } else {
      logger.info(`❌ File not found: ${relativePath}`);
    }
  });

  logger.info(`\n🎉 Fixed ${fixedCount} files`);
}

if (require.main === module) {
  main();
}