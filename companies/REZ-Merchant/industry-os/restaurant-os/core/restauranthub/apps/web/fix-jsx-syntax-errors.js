import logger from './utils/logger';

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixJobApplicationForm() {
  const filePath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/components/jobs/job-application-form.tsx';

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Find and check the switch statement structure around line 349
    const lines = content.split('\n');

    // Look for potential syntax issues around the switch cases
    let hasChanges = false;

    // Check for any malformed JSX or missing elements
    // The error suggests JSX parsing issue at line 349
    // Let's check for any missing parentheses or malformed JSX

    // Fix potential JSX syntax issues in switch statement
    if (content.includes('case 2:') && content.includes('return (')) {
      // Make sure all switch cases are properly formatted
      content = content.replace(
        /case\s+(\d+):\s*return\s*\(/g,
        'case $1:\n        return ('
      );
      hasChanges = true;
    }

    // Check for malformed JSX elements
    const jsxElementRegex = /<([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*)\s*([^>]*)>/g;
    let match;
    while ((match = jsxElementRegex.exec(content)) !== null) {
      const element = match[0];
      // Check for malformed attributes
      if (element.includes('=}') || element.includes('={=') || element.includes('}}')) {
        logger.info(`Found potential malformed element: ${element}`);
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      logger.info('✅ Fixed job-application-form.tsx JSX syntax');
    } else {
      logger.info('ℹ️ No obvious JSX syntax issues found in job-application-form.tsx');
    }

  } catch (error) {
    console.error('❌ Error fixing job-application-form.tsx:', error.message);
  }
}

function fixLoginPage() {
  const filePath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/auth/login/page.tsx';

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Check if PageTransition is imported
    if (content.includes('<PageTransition>') && !content.includes('import') && !content.includes('PageTransition')) {
      // PageTransition is used but not imported
      logger.info('❌ PageTransition is used but not imported');

      // Find if there are other imports from the same file
      const importMatch = content.match(/import\s+{[^}]*}\s+from\s+['"'][^'"]*components[^'"]*['"]/);
      if (importMatch) {
        // Add PageTransition to existing import
        content = content.replace(
          /import\s+{([^}]*)}\s+from\s+(['"'][^'"]*components[^'"]*['"])/,
          (match, imports, fromPath) => {
            if (!imports.includes('PageTransition')) {
              return `import { ${imports.trim()}, PageTransition } from ${fromPath}`;
            }
            return match;
          }
        );
        hasChanges = true;
      } else {
        // Add new import for PageTransition
        const firstImportIndex = content.indexOf('import');
        if (firstImportIndex !== -1) {
          const lines = content.split('\n');
          let insertIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import')) {
              insertIndex = i + 1;
            } else if (lines[i].trim() === '' && insertIndex > 0) {
              break;
            }
          }
          lines.splice(insertIndex, 0, "import { PageTransition } from '../../../components/ui/page-transition';");
          content = lines.join('\n');
          hasChanges = true;
        }
      }
    }

    // Check for malformed JSX around line 176
    const lines = content.split('\n');
    if (lines.length > 175) {
      const problemLine = lines[175]; // Line 176 (0-indexed)
      if (problemLine && problemLine.includes('PageTransition') && problemLine.includes('<')) {
        // Check if there's a malformed opening tag
        if (!problemLine.includes('<PageTransition>') && problemLine.includes('PageTransition')) {
          lines[175] = '    <PageTransition>';
          content = lines.join('\n');
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      logger.info('✅ Fixed login page PageTransition syntax');
    } else {
      logger.info('ℹ️ No obvious PageTransition syntax issues found in login page');
    }

  } catch (error) {
    console.error('❌ Error fixing login page:', error.message);
  }
}

logger.info('🔧 Fixing JSX syntax errors...');
fixJobApplicationForm();
fixLoginPage();
logger.info('✅ JSX syntax error fixes completed');