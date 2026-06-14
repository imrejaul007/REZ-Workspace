import logger from './utils/logger';

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

logger.info('🔧 INTERFACE SYNTAX ERROR FIXER');
logger.info('================================');

function fixInterfaceIssues(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      logger.info(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    let fixes = 0;

    // Fix 1: Missing interface closing brace before const declarations
    // Look for interface definitions followed immediately by const without closing brace
    const interfacePattern = /(interface\s+\w+\s*\{[^}]*?\n)(\s*\/\/[^\n]*\n)?(\s*const\s+\w+)/g;
    content = content.replace(interfacePattern, (match, interfaceBody, comment, constDecl) => {
      // Check if the interface body already has a closing brace
      if (!interfaceBody.includes('}')) {
        fixes++;
        return interfaceBody + '}\n\n' + (comment || '') + constDecl;
      }
      return match;
    });

    // Fix 2: Missing function closing braces before return statements
    const functionPattern = /(function\s+\w+\([^)]*\)\s*\{[^}]*)\n(\s*if\s*\([^)]*\)\s*\{\s*return)/g;
    content = content.replace(functionPattern, (match, funcBody, returnBlock) => {
      if (!funcBody.endsWith('}')) {
        fixes++;
        return funcBody + '\n  }\n\n' + returnBlock;
      }
      return match;
    });

    // Fix 3: Component function definitions missing proper structure
    const componentPattern = /(export\s+default\s+function\s+\w+\([^)]*\)\s*\{[^{]*?)(\s*if\s*\([^)]*\)\s*\{)/g;
    content = content.replace(componentPattern, (match, componentStart, ifBlock) => {
      if (!componentStart.includes('return') && !componentStart.endsWith('}')) {
        fixes++;
        return componentStart + '\n' + ifBlock;
      }
      return match;
    });

    // Fix 4: Ensure proper interface structure with properties ending with semicolons
    const propPattern = /(\w+:\s*[^;,}]+)(\n\s*\/\/)/g;
    content = content.replace(propPattern, (match, prop, comment) => {
      if (!prop.endsWith(';')) {
        fixes++;
        return prop + ';' + comment;
      }
      return match;
    });

    // Write the file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      logger.info(`✅ Fixed interface syntax errors in ${filePath} (${fixes} patterns fixed)`);
      return true;
    } else {
      logger.info(`ℹ️  No interface syntax errors found in ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// List of files with known interface syntax errors
const problemFiles = [
  'app/admin/verification/page.tsx',
  'app/auth/forgot-password/page.tsx',
  'app/auth/setup-2fa/page.tsx',
  'app/community/page.tsx',
  'app/employee/jobs/[id]/page.tsx',
  'app/auth/login/page.tsx',
  'components/jobs/job-application-form.tsx',
  'app/jobs/page.tsx'
];

logger.info('🎯 Targeting files with interface syntax errors...\n');

let totalFixed = 0;
for (const file of problemFiles) {
  if (fixInterfaceIssues(file)) {
    totalFixed++;
  }
}

logger.info(`\n📊 Summary: Fixed interface syntax errors in ${totalFixed}/${problemFiles.length} files`);

if (totalFixed > 0) {
  logger.info('\n🎉 Interface syntax error fixes complete!');
  logger.info('💡 The application should now compile without interface syntax errors.');
} else {
  logger.info('\n⚠️  No interface syntax errors were found or fixed.');
  logger.info('💡 The compilation errors may be due to other issues.');
}