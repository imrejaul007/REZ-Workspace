import logger from './utils/logger';

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix specific critical syntax errors
function fixCriticalErrors() {
  const filesToFix = [
    'components/jobs/job-application-form.tsx',
    'app/auth/login/page.tsx',
    'app/jobs/page.tsx'
  ];

  for (const file of filesToFix) {
    try {
      const filePath = path.join(process.cwd(), file);
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;

      logger.info(`\n🔧 Fixing ${file}...`);

      // Fix job-application-form.tsx: Missing closing brace before case 2
      if (file.includes('job-application-form.tsx')) {
        // Look for the pattern where case 1 return statement is missing a closing brace
        const problemPattern = /(\s+)return \(\s*<div className="space-y-4">\s*<h3 className="text-lg font-semibold mb-4">Personal Information<\/h3>/;
        if (problemPattern.test(content)) {
          // Check if the function before renderStepContent is missing a closing brace
          const beforeRenderStep = content.indexOf('const renderStepContent = () => {');
          const beforeContent = content.substring(0, beforeRenderStep);
          const lastFunctionEnd = beforeContent.lastIndexOf('};');
          const lastBraceEnd = beforeContent.lastIndexOf('}');

          if (lastBraceEnd > lastFunctionEnd) {
            // There's a standalone brace, might be missing function closing brace
            const insertPos = beforeRenderStep;
            content = content.substring(0, insertPos) + '  };\n\n  ' + content.substring(insertPos);
            changed = true;
            logger.info('✅ Added missing function closing brace before renderStepContent');
          }
        }
      }

      // Fix auth/login/page.tsx: Missing closing brace for interface
      if (file.includes('auth/login/page.tsx')) {
        // Look for incomplete interface definitions
        const interfacePattern = /interface DemoAccount \{[^}]*bgColor: string;(?!\s*\})/;
        if (interfacePattern.test(content)) {
          content = content.replace(interfacePattern, (match) => match + '\n}');
          changed = true;
          logger.info('✅ Added missing interface closing brace');
        }

        // Look for missing function closing brace before return statement
        const functionPattern = /(\s+)return \(\s*<PageTransition>/;
        if (functionPattern.test(content)) {
          const returnPos = content.indexOf('return (\n    <PageTransition>');
          if (returnPos > 0) {
            const beforeReturn = content.substring(0, returnPos);
            const lastFunctionEnd = beforeReturn.lastIndexOf('};');
            const lastBrace = beforeReturn.lastIndexOf('}');

            if (lastBrace > lastFunctionEnd) {
              content = content.substring(0, returnPos) + '  };\n\n  ' + content.substring(returnPos);
              changed = true;
              logger.info('✅ Added missing function closing brace before return');
            }
          }
        }
      }

      // Fix app/jobs/page.tsx: Missing closing brace before return
      if (file.includes('app/jobs/page.tsx')) {
        const returnPattern = /(\s+)return \(\s*<DashboardLayout>/;
        if (returnPattern.test(content)) {
          const returnPos = content.indexOf('return (\n    <DashboardLayout>');
          if (returnPos > 0) {
            const beforeReturn = content.substring(0, returnPos);
            const lastFunctionEnd = beforeReturn.lastIndexOf('};');
            const lastBrace = beforeReturn.lastIndexOf('}');

            if (lastBrace > lastFunctionEnd) {
              content = content.substring(0, returnPos) + '  };\n\n  ' + content.substring(returnPos);
              changed = true;
              logger.info('✅ Added missing function closing brace before return');
            }
          }
        }
      }

      if (changed) {
        fs.writeFileSync(filePath, content);
        logger.info(`✅ Fixed ${file}`);
      } else {
        logger.info(`ℹ️  No changes needed for ${file}`);
      }

    } catch (error) {
      console.error(`❌ Error fixing ${file}:`, error.message);
    }
  }
}

fixCriticalErrors();
logger.info('\n🎉 Critical syntax error fixes complete!');