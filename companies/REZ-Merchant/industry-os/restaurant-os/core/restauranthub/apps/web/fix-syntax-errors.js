import logger from './utils/logger';

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function fixSyntaxErrors(filePath) {
  logger.info(`Fixing syntax errors in ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix common syntax patterns that cause "Unexpected token" errors

  // Pattern 1: Fix arrow functions returning JSX that are missing proper structure
  // Look for const renderXxx = () => ( followed by JSX but missing proper function context
  const arrowFunctionPattern = /const\s+(\w+)\s*=\s*\(\)\s*=>\s*\(/g;
  let matches = [...content.matchAll(arrowFunctionPattern)];

  for (let match of matches) {
    const functionName = match[1];
    const startIndex = match.index;

    // Find the opening parenthesis after the arrow
    let parenCount = 0;
    let endIndex = -1;
    let inJSX = false;

    for (let i = startIndex + match[0].length; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === '(' && !inJSX) {
        parenCount++;
      } else if (char === ')' && !inJSX) {
        parenCount--;
        if (parenCount === -1) {
          endIndex = i;
          break;
        }
      } else if (char === '<' && nextChar && nextChar.match(/[A-Z]/)) {
        inJSX = true;
        parenCount = 1; // Reset for JSX
      } else if (char === '>' && inJSX) {
        // Look for matching closing tag or self-closing
        let j = i + 1;
        let tagCount = 1;
        while (j < content.length && tagCount > 0) {
          if (content[j] === '<' && content[j + 1] === '/') {
            tagCount--;
          } else if (content[j] === '<' && content[j + 1] && content[j + 1].match(/[A-Z]/)) {
            tagCount++;
          }
          j++;
        }
        if (tagCount === 0) {
          inJSX = false;
        }
      }
    }
  }

  // Pattern 2: Fix malformed component return statements
  // Look for cases where JSX appears outside of proper return context
  const returnStatementFixes = [
    {
      // Fix missing return statements before JSX
      pattern: /(\s+)(const\s+\w+\s*=\s*\(\)\s*=>\s*)\n(\s*)(<[A-Z]\w*)/g,
      replacement: '$1$2(\n$3$4'
    },
    {
      // Fix missing closing parentheses for arrow functions
      pattern: /(const\s+\w+\s*=\s*\(\)\s*=>\s*\(\s*<[^>]+>[\s\S]*?<\/[^>]+>)\s*(?!\s*\))/g,
      replacement: '$1\n  )'
    }
  ];

  returnStatementFixes.forEach(fix => {
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      changed = true;
    }
  });

  // Pattern 3: Fix function structure issues
  const structuralFixes = [
    {
      // Fix cases where arrow function JSX is not properly wrapped
      pattern: /(const\s+render\w+\s*=\s*\(\)\s*=>\s*)\n(\s*)(<\w+)/g,
      replacement: '$1(\n$2$3'
    },
    {
      // Fix missing semicolons at end of function declarations
      pattern: /(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{[^}]+\})\s*(?!\s*;)/g,
      replacement: '$1;'
    }
  ];

  structuralFixes.forEach(fix => {
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      changed = true;
    }
  });

  // Pattern 4: Fix specific known problematic patterns
  const specificFixes = [
    {
      // Fix onChange handlers that end with extra braces
      pattern: /onChange=\{[^}]*\}\}/g,
      replacement: (match) => match.replace(/\}\}$/, '}')
    },
    {
      // Fix cases where JSX elements appear after function closing without proper structure
      pattern: /(\}\s*;?\s*\n\s*)(const\s+render\w+\s*=\s*\(\)\s*=>\s*)\n(\s*)(<[A-Z])/g,
      replacement: '$1$2(\n$3$4'
    }
  ];

  specificFixes.forEach(fix => {
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    logger.info(`Fixed syntax errors in ${filePath}`);
    return true;
  }
  return false;
}

// Fix the specific files mentioned in the error
const filesToFix = [
  '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/components/checkout/delivery-slot-selector.tsx',
  '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/components/profiles/restaurant-profile.tsx',
  '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/components/reviews/review-system.tsx',
  '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/auth/change-password/page.tsx',
  '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/auth/forgot-password/page.tsx'
];

let fixedCount = 0;
for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    if (fixSyntaxErrors(file)) {
      fixedCount++;
    }
  } else {
    logger.info(`File not found: ${file}`);
  }
}

logger.info(`Fixed syntax errors in ${fixedCount} files`);