import logger from './utils/logger';

#!/usr/bin/env node

/**
 * Component API Migration Script
 * Fixes common component API issues across the codebase
 */

const fs = require('fs');
const path = require('path');

const COMPONENT_FIXES = {
  // Select component fixes
  SELECT_IMPORTS: {
    search: /import { Select } from ['"`]([^'"`]+)['"`];/g,
    replace: "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$1';"
  },

  SELECT_HTML_TO_RADIX: {
    // Fix Select with onChange + option elements
    search: /<Select\s+value={([^}]+)}\s+onChange={\(e\)\s*=>\s*([^}]+)\(e\.target\.value\)}\s*>\s*([\s\S]*?)<\/Select>/g,
    replace: (match, value, setter, content) => {
      const options = content.match(/<option\s+value=['"`]([^'"`]+)['"`]>([^<]+)<\/option>/g) || [];
      const selectItems = options.map(opt => {
        const [, optValue, optText] = opt.match(/<option\s+value=['"`]([^'"`]+)['"`]>([^<]+)<\/option>/) || [];
        return `                <SelectItem value="${optValue}">${optText}</SelectItem>`;
      }).join('\n');

      return `<Select value={${value}} onValueChange={${setter}}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
${selectItems}
              </SelectContent>
            </Select>`;
    }
  },

  // Checkbox component fixes
  CHECKBOX_ONCHANGE: {
    search: /onChange={\(checked\)\s*=>\s*([^}]+)\(checked\)}/g,
    replace: 'onCheckedChange={(checked) => $1(checked === true)}'
  },

  CHECKBOX_ONCHANGE_DIRECT: {
    search: /onChange={([^}]+)}/g,
    replace: 'onCheckedChange={(checked) => $1(checked === true)}'
  },

  // Switch component fixes
  SWITCH_SIZE_PROP: {
    search: /size=['"`]sm['"`]/g,
    replace: ''
  }
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Apply each fix
  Object.entries(COMPONENT_FIXES).forEach(([name, fix]) => {
    if (typeof fix.replace === 'function') {
      const newContent = content.replace(fix.search, fix.replace);
      if (newContent !== content) {
        content = newContent;
        changed = true;
        logger.info(`  ✓ Applied ${name} fix`);
      }
    } else {
      const newContent = content.replace(fix.search, fix.replace);
      if (newContent !== content) {
        content = newContent;
        changed = true;
        logger.info(`  ✓ Applied ${name} fix`);
      }
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    logger.info(`✅ Updated: ${filePath}`);
    return true;
  }

  return false;
}

function findFilesToMigrate(dir) {
  const files = [];

  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDir(fullPath);
      } else if (item.endsWith('.tsx') && !item.includes('.test.') && !item.includes('.spec.')) {
        files.push(fullPath);
      }
    }
  }

  scanDir(dir);
  return files;
}

function main() {
  const webDir = process.cwd();
  logger.info(`🔧 Starting component migration in: ${webDir}`);

  const files = findFilesToMigrate(webDir);
  logger.info(`📁 Found ${files.length} TypeScript React files`);

  let updatedCount = 0;

  for (const file of files) {
    const relativePath = path.relative(webDir, file);
    logger.info(`\n🔍 Checking: ${relativePath}`);

    try {
      if (migrateFile(file)) {
        updatedCount++;
      } else {
        logger.info(`  ⏭️  No changes needed`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${relativePath}:`, error.message);
    }
  }

  logger.info(`\n🎉 Migration complete!`);
  logger.info(`📊 Updated ${updatedCount} of ${files.length} files`);
}

if (require.main === module) {
  main();
}

module.exports = { migrateFile, COMPONENT_FIXES };