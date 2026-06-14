import logger from './utils/logger';

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixFile(filePath) {
  logger.info(`Fixing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Pattern 1: Fix onCheckedChange={(checked) => (e) => setFunction(e.target.value)(checked === true)}
  const pattern1 = /onCheckedChange=\{[^}]*\(checked\)[^}]*=>[^}]*\(e\)[^}]*=>[^}]*set(\w+)\(e\.target\.value\)[^}]*\(checked === true\)[^}]*\}/g;
  const replacement1 = (match, setterName) => `onChange={(e) => set${setterName}(e.target.value)}`;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, replacement1);
    changed = true;
  }

  // Pattern 2: Fix onCheckedChange={(checked) => (e) => setFunction(prev => ({ ...prev, property: e.target.value (checked === true)}))}
  const pattern2 = /onCheckedChange=\{[^}]*\(checked\)[^}]*=>[^}]*\(e\)[^}]*=>[^}]*set(\w+)\(prev[^}]*=>[^}]*\{[^}]*\.\.\.prev,[^}]*(\w+):[^}]*e\.target\.value[^}]*\(checked === true\)[^}]*\}\)[^}]*\)/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, (match, setterName, propName) => `onChange={(e) => set${setterName}(prev => ({ ...prev, ${propName}: e.target.value }))}`);
    changed = true;
  }

  // Pattern 3: Fix simpler onCheckedChange patterns
  const pattern3 = /onCheckedChange=\{[^}]*\(checked\)[^}]*=>[^}]*\(e\)[^}]*=>[^}]*e\.target\.value[^}]*\(checked === true\)[^}]*\}/g;
  if (pattern3.test(content)) {
    content = content.replace(pattern3, 'onChange={(e) => e.target.value}');
    changed = true;
  }

  // Pattern 4: Fix Badge size props
  const pattern4 = /<Badge[^>]*size="[^"]*"[^>]*>/g;
  if (pattern4.test(content)) {
    content = content.replace(pattern4, (match) => {
      // Remove size prop and add appropriate className
      let newMatch = match.replace(/\s*size="[^"]*"/, '');
      if (!newMatch.includes('className=')) {
        newMatch = newMatch.replace('>', ' className="px-2 py-1 text-xs">');
      }
      return newMatch;
    });
    changed = true;
  }

  // Pattern 5: Fix Select components with onCheckedChange
  const pattern5 = /<(Select|select)[^>]*onCheckedChange[^>]*>/g;
  if (pattern5.test(content)) {
    content = content.replace(pattern5, (match) => {
      return match.replace('onCheckedChange', 'onChange');
    });
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    logger.info(`Fixed ${filePath}`);
    return true;
  }
  return false;
}

function findTsxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTsxFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

const webDir = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web';
const tsxFiles = findTsxFiles(webDir);

logger.info(`Found ${tsxFiles.length} TypeScript files`);

let fixedCount = 0;
for (const file of tsxFiles) {
  if (fixFile(file)) {
    fixedCount++;
  }
}

logger.info(`Fixed ${fixedCount} files`);