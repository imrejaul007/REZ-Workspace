import logger from './utils/logger';

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixSyntaxErrors() {
  const filesToFix = [
    '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/auth/login/page.tsx',
    '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/components/jobs/job-application-form.tsx',
    '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/admin/verification/page.tsx',
    '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/auth/forgot-password/page.tsx',
    '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/auth/setup-2fa/page.tsx',
    '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/community/page.tsx',
    '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/employee/jobs/[id]/page.tsx'
  ];

  filesToFix.forEach(filePath => {
    try {
      if (!fs.existsSync(filePath)) {
        logger.info(`⏭️ Skipping ${path.basename(filePath)} - file doesn't exist`);
        return;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      let hasChanges = false;

      // Fix common patterns from the TypeScript errors

      // 1. Fix missing closing braces in onClick handlers
      content = content.replace(
        /onClick=\{[^}]*\}\s*className=/g,
        (match) => {
          const fixed = match.replace(/\}\s*className=/, '}}\n                          className=');
          return fixed;
        }
      );

      // 2. Fix malformed JSX with / and stray attributes
      content = content.replace(
        /<([a-zA-Z]+[a-zA-Z0-9]*)\s+([^>]*)\s+\/\s+(size|variant|className)="[^"]*"\s*>/g,
        '<$1 $2 />'
      );

      // 3. Fix malformed rightIcon or other icon props
      content = content.replace(
        /rightIcon=\{[^}]*<([a-zA-Z]+)\s+[^}]*\/\s+(size|variant|className)="[^"]*"\s*>\s*:\s*[^}]*\}/g,
        (match) => {
          // Extract the icon component and fix it
          const iconMatch = match.match(/<([a-zA-Z]+)\s+([^}]*?)\s+\/\s+/);
          if (iconMatch) {
            const iconName = iconMatch[1];
            const iconProps = iconMatch[2].replace(/\s+(size|variant|className)="[^"]*"/g, '');
            return `rightIcon={!isLoading ? <${iconName} ${iconProps} /> : undefined}`;
          }
          return match;
        }
      );

      // 4. Fix stray closing braces and missing opening braces
      content = content.replace(/^\s*\}\s*$/gm, '');

      // 5. Fix malformed Button components with stray size/variant attributes
      content = content.replace(
        /<Button([^>]*?)\/\s+(size|variant|className)="[^"]*"\s*>/g,
        '<Button$1>'
      );

      // 6. Fix missing closing parentheses in function calls
      content = content.replace(
        /(\w+)\(\s*([^)]*)\s*\n\s*className=/g,
        '$1($2)\n                          className='
      );

      // 7. Fix expression syntax issues
      content = content.replace(/\{\s*\{\s*\}/g, '{}');

      // 8. Fix malformed conditional expressions
      content = content.replace(
        /\?\s*\(\s*<([^>]+)>\s*:\s*undefined\s*\)/g,
        '? <$1> : undefined'
      );

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        logger.info(`✅ Fixed syntax errors in ${path.basename(filePath)}`);
        hasChanges = true;
      } else {
        logger.info(`ℹ️ No syntax issues found in ${path.basename(filePath)}`);
      }

    } catch (error) {
      console.error(`❌ Error fixing ${path.basename(filePath)}:`, error.message);
    }
  });
}

logger.info('🔧 Fixing final syntax errors...');
fixSyntaxErrors();
logger.info('✅ Final syntax error fixes completed');