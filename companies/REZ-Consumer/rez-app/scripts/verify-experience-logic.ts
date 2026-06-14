import logger from './utils/logger';


/**
 * Verification Script
 * Checks consistency of themes and slug handling
 */
import { EXPERIENCE_THEMES, getTheme } from '../constants/experienceThemes';

const TEST_CASES = [
    'sample-trial',
    '60-min-delivery',
    'fast-delivery', // Alias check
    'luxury',
    'organic',
    'men',
    'unknown-slug', // Fallback check
    'dining', // Generic check
];

logger.info('🔍 Starting Deep Verification of Experience Logic...\n');

let passed = 0;
let total = TEST_CASES.length;

TEST_CASES.forEach(slug => {
    const theme = getTheme(slug);

    logger.info(`Testing slug: "${slug}"`);

    if (theme) {
        if (slug === 'unknown-slug' && theme.bg === '#E0F2FE') {
            logger.info('  ✅ Correctly fell back to default');
            passed++;
        } else if (slug === 'fast-delivery' && theme.bg === '#FFEDD5') {
            logger.info('  ✅ Alias "fast-delivery" resolved to 60-min orange theme');
            passed++;
        } else if (theme.gradientColors && theme.gradientColors.length >= 2) {
            logger.info(`  ✅ Theme found: ${theme.bg} (Gradient OK)`);
            passed++;
        } else {
            logger.info('  ❌ Theme found but missing properties');
        }
    } else {
        logger.info('  ❌ No theme returned (Should fallback)');
    }
    logger.info('---');
});

logger.info(`\n📊 Verification Result: ${passed}/${total} Passed`);

if (passed === total) {
    logger.info('✅ ALL CHECKS PASSED. Logic is robust.');
    process.exit(0);
} else {
    logger.info('❌ SOME CHECKS FAILED.');
    process.exit(1);
}
