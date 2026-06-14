import logger from './utils/logger';

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to find TypeScript files
function findTSFiles(dir, files = []) {
  const dirFiles = fs.readdirSync(dir);

  for (const file of dirFiles) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('.next')) {
      findTSFiles(filePath, files);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      files.push(filePath);
    }
  }

  return files;
}

// Function to fix common function syntax errors
function fixFunctionSyntaxErrors(content) {
  let fixed = content;
  let changesMade = false;

  // Pattern 1: Missing closing brace in arrow functions before return statements
  // Look for patterns like: )} \n  return ( and add missing }
  const missingClosingBracePattern = /(\)\s*;\s*\n\s*)(return\s*\()/g;
  if (missingClosingBracePattern.test(fixed)) {
    // Only add if there are unclosed braces
    const beforeMatches = (fixed.match(/\{/g) || []).length;
    const afterMatches = (fixed.match(/\}/g) || []).length;
    if (beforeMatches > afterMatches) {
      fixed = fixed.replace(missingClosingBracePattern, '$1\n  };\n\n  $2');
      changesMade = true;
    }
  }

  // Pattern 2: Missing closing brace for onClick handlers
  const onClickPattern = /onClick=\{[^}]*=>\s*\{[^}]*\}\s*(?!\})/g;
  if (onClickPattern.test(fixed)) {
    fixed = fixed.replace(onClickPattern, (match) => {
      const openBraces = (match.match(/\{/g) || []).length;
      const closeBraces = (match.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        return match + '}';
      }
      return match;
    });
    changesMade = true;
  }

  // Pattern 3: Ensure proper component function structure
  // Fix components that have missing closing braces
  const componentPattern = /export\s+(function|const)\s+\w+[^{]*\{[\s\S]*?return\s*\(/;
  if (componentPattern.test(fixed)) {
    // Check for balanced braces in each component
    const lines = fixed.split('\n');
    const fixedLines = [];
    let braceCount = 0;
    let inComponent = false;
    let componentStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      fixedLines.push(line);

      // Track component starts
      if (line.includes('export function') || line.includes('export const')) {
        inComponent = true;
        componentStart = i;
        braceCount = 0;
      }

      // Count braces
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;

      // If we hit a return statement and have unbalanced braces, check if we need to close before return
      if (inComponent && line.trim().startsWith('return (') && braceCount > 1) {
        // Insert missing closing brace before return
        fixedLines.splice(-1, 0, '  };', '');
        braceCount--;
        changesMade = true;
      }

      // End of component
      if (inComponent && braceCount === 0 && line.includes('}') && i > componentStart + 3) {
        inComponent = false;
      }
    }

    if (changesMade) {
      fixed = fixedLines.join('\n');
    }
  }

  // Pattern 4: Fix malformed Button props
  const buttonPropsPattern = /(<Button[^>]*?)\s+size="[^"]*"\s+variant="[^"]*">([^}]+)\}/g;
  fixed = fixed.replace(buttonPropsPattern, (match, opening, content) => {
    if (!opening.includes('onClick') && content.includes('onClick')) {
      return opening + '>' + content;
    }
    return match;
  });

  // Pattern 5: Fix Arrow function syntax errors
  const arrowFunctionPattern = /onClick=\{[^}]*=>\s*[^}]*\s*(?!\})\s*$/gm;
  fixed = fixed.replace(arrowFunctionPattern, (match) => {
    if (!match.endsWith('}')) {
      return match + '}';
    }
    return match;
  });

  return { content: fixed, changed: changesMade };
}

// Main execution
const webDir = process.cwd();
logger.info('Scanning for TypeScript files with function syntax errors...');

const tsFiles = findTSFiles(webDir);
logger.info(`Found ${tsFiles.length} TypeScript files`);

let totalFixed = 0;

for (const filePath of tsFiles) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixFunctionSyntaxErrors(content);

    if (result.changed) {
      fs.writeFileSync(filePath, result.content);
      logger.info(`✅ Fixed function syntax errors in: ${path.relative(webDir, filePath)}`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

logger.info(`\n🎉 Function syntax error fix complete!`);
logger.info(`📊 Fixed ${totalFixed} files with function syntax errors`);