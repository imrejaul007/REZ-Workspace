#!/usr/bin/env node
/**
 * Batch fix console.log/error/warn/info statements
 * Replaces with structured logging using @rez/shared logger
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to scan (exclude backups, node_modules, .next, .git)
const SCAN_DIRS = [
  'RABTUL-Technologies',
  'REZ-Intelligence',
  'REZ-Consumer',
  'REZ-Merchant',
  'REZ-Media',
  'StayOwn-Hospitality',
  'CorpPerks',
];

const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'PORT-CHANGE-BACKUP',
  'CLEANUP-BACKUP',
  'Archive',
];

const EXCLUDE_FILES = [
  '.test.ts',
  '.spec.ts',
  '.test.js',
  '.spec.js',
];

// Console patterns to replace
const patterns = [
  // console.log
  {
    regex: /console\.log\(`([^`]*)`\)/g,
    replace: (match, template) => `logger.info(\`${template}\`)`,
  },
  {
    regex: /console\.log\("([^"]*)"\)/g,
    replace: (match, message) => `logger.info("${message}")`,
  },
  {
    regex: /console\.log\('([^']*)'\)/g,
    replace: (match, message) => `logger.info('${message}')`,
  },
  // console.error
  {
    regex: /console\.error\(`([^`]*)`\)/g,
    replace: (match, template) => `logger.error(\`${template}\`)`,
  },
  {
    regex: /console\.error\("([^"]*)"\)/g,
    replace: (match, message) => `logger.error("${message}")`,
  },
  {
    regex: /console\.error\('([^']*)'\)/g,
    replace: (match, message) => `logger.error('${message}')`,
  },
  // console.warn
  {
    regex: /console\.warn\(`([^`]*)`\)/g,
    replace: (match, template) => `logger.warn(\`${template}\`)`,
  },
  {
    regex: /console\.warn\("([^"]*)"\)/g,
    replace: (match, message) => `logger.warn("${message}")`,
  },
  {
    regex: /console\.warn\('([^']*)'\)/g,
    replace: (match, message) => `logger.warn('${message}')`,
  },
  // console.info
  {
    regex: /console\.info\(`([^`]*)`\)/g,
    replace: (match, template) => `logger.info(\`${template}\`)`,
  },
  {
    regex: /console\.info\("([^"]*)"\)/g,
    replace: (match, message) => `logger.info("${message}")`,
  },
  {
    regex: /console\.info\('([^']*)'\)/g,
    replace: (match, message) => `logger.info('${message}')`,
  },
  // Debug statements (console.debug)
  {
    regex: /console\.debug\(`([^`]*)`\)/g,
    replace: (match, template) => `logger.debug(\`${template}\`)`,
  },
  // String concatenation patterns
  {
    regex: /console\.log\([^)]+\+[^)]+\)/g,
    replace: (match) => {
      // Extract the variable and convert to logger.info
      return match.replace('console.log(', 'logger.info(');
    },
  },
];

// Complex patterns with variables
const complexPatterns = [
  // console.log with variables like: logger.info(`message ${var}`)
  {
    regex: /console\.log\(`([^`]*)\$\{([^}]+)\}`([^`]*)\$\{([^}]+)\}`([^`]*)\`\)/g,
    replace: 'logger.info(`$1${$2}$3${$4}$5`, { $2, $4 })',
  },
  // console.log with one variable
  {
    regex: /console\.log\(`([^`]*)\$\{([^}]+)\}`([^`]*)\`\)/g,
    replace: 'logger.info(`$1${$2}$3`, { $2 })',
  },
];

function shouldExclude(filePath) {
  for (const exclude of EXCLUDE_DIRS) {
    if (filePath.includes(exclude)) return true;
  }
  for (const ext of EXCLUDE_FILES) {
    if (filePath.endsWith(ext)) return true;
  }
  return false;
}

function processFile(filePath) {
  if (shouldExclude(filePath)) return { changes: 0, skipped: true };

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    let changes = 0;

    // Check if file has console statements
    if (!content.includes('console.')) return { changes: 0, skipped: true };

    // Check if already has logger import
    const hasLoggerImport = content.includes("import logger from") ||
                            content.includes("import { logger }") ||
                            content.includes("from './logger'") ||
                            content.includes("from \"@rez/shared\"") ||
                            content.includes("from './config/logger'") ||
                            content.includes("from './utils/logger'");

    // Apply simple patterns
    for (const pattern of patterns) {
      const newContent = content.replace(pattern.regex, pattern.replace);
      if (newContent !== content) {
        content = newContent;
        changes++;
      }
    }

    // Apply complex patterns
    for (const pattern of complexPatterns) {
      const newContent = content.replace(pattern.regex, pattern.replace);
      if (newContent !== content) {
        content = newContent;
        changes++;
      }
    }

    if (changes > 0) {
      // Add logger import if missing
      if (!hasLoggerImport && !content.match(/from\s+['"].*logger['"]/)) {
        // Check if it has express/express imports to add after
        if (content.includes("from 'express'") || content.includes('from "express"')) {
          content = content.replace(
            /from ['"]express['"]/,
            "import logger from './utils/logger';\nimport $&"
          );
        } else {
          content = `import logger from './utils/logger';\n\n${content}`;
        }
      }

      fs.writeFileSync(filePath, content);
      return { changes, skipped: false, filePath };
    }

    return { changes: 0, skipped: true };
  } catch (error) {
    return { changes: 0, skipped: true, error: error.message };
  }
}

function scanDirectory(dir, results = { files: [], changes: 0, errors: [] }) {
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        scanDirectory(fullPath, results);
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
        const result = processFile(fullPath);
        if (result.changes > 0) {
          results.files.push(result);
          results.changes += result.changes;
        }
        if (result.error) {
          results.errors.push({ file: fullPath, error: result.error });
        }
      }
    }
  }

  return results;
}

// Main execution
logger.info('🔍 Scanning for console.* statements...\n');

const baseDir = '/Users/rejaulkarim/Documents/ReZ Full App';
let allResults = { files: [], changes: 0, errors: [] };

for (const scanDir of SCAN_DIRS) {
  const fullPath = path.join(baseDir, scanDir);
  if (fs.existsSync(fullPath)) {
    logger.info(`Scanning ${scanDir}...`);
    allResults = scanDirectory(fullPath, allResults);
  }
}

logger.info(`\n✅ Results:`);
logger.info(`   Files modified: ${allResults.files.length}`);
logger.info(`   Total changes: ${allResults.changes}`);

if (allResults.files.length > 0) {
  logger.info(`\n📝 Modified files:`);
  allResults.files.slice(0, 20).forEach(f => {
    const relPath = f.filePath.replace(baseDir + '/', '');
    logger.info(`   - ${relPath} (${f.changes} changes)`);
  });
  if (allResults.files.length > 20) {
    logger.info(`   ... and ${allResults.files.length - 20} more`);
  }
}

if (allResults.errors.length > 0) {
  logger.info(`\n⚠️  Errors:`);
  allResults.errors.forEach(e => {
    logger.info(`   - ${e.file}: ${e.error}`);
  });
}

process.exit(0);
