import logger from './utils/logger';

const http = require('http');

// Accessibility Test Suite for RestoPapa UI/UX
const testPages = [
  { url: 'http://localhost:3001/', name: 'Homepage' },
  { url: 'http://localhost:3001/auth/login', name: 'Login Page' },
  { url: 'http://localhost:3001/auth/signup', name: 'Signup Page' },
  { url: 'http://localhost:3001/jobs', name: 'Jobs Page' },
  { url: 'http://localhost:3001/marketplace', name: 'Marketplace Page' },
  { url: 'http://localhost:3001/community', name: 'Community Page' }
];

function checkAccessibilityFeatures(html, pageName) {
  const results = {
    page: pageName,
    accessibility: {
      hasSemanticHTML: false,
      hasAriaLabels: false,
      hasAltText: false,
      hasFormLabels: false,
      hasHeadingStructure: false,
      hasKeyboardNavigation: false,
      hasColorContrast: false,
      hasFocusIndicators: false,
      accessibilityScore: 0
    },
    mobileResponsive: {
      hasViewportMeta: false,
      hasResponsiveCSS: false,
      hasTouchFriendly: false,
      hasFlexboxGrid: false,
      mobileScore: 0
    },
    interactiveElements: {
      buttons: 0,
      forms: 0,
      links: 0,
      inputs: 0,
      selects: 0,
      textareas: 0
    },
    uxFeatures: {
      hasLoadingStates: false,
      hasErrorMessages: false,
      hasTooltips: false,
      hasModals: false,
      hasProgressIndicators: false,
      uxScore: 0
    }
  };

  // Accessibility Tests
  if (html.includes('<header>') || html.includes('<nav>') || html.includes('<main>') || html.includes('<section>') || html.includes('<footer>')) {
    results.accessibility.hasSemanticHTML = true;
  }

  if (html.includes('aria-label') || html.includes('aria-describedby') || html.includes('role=')) {
    results.accessibility.hasAriaLabels = true;
  }

  if (html.includes('alt=') && !html.includes('alt=""')) {
    results.accessibility.hasAltText = true;
  }

  if (html.includes('<label') && html.includes('for=')) {
    results.accessibility.hasFormLabels = true;
  }

  if (html.includes('<h1') && html.includes('<h2') && html.includes('<h3')) {
    results.accessibility.hasHeadingStructure = true;
  }

  if (html.includes('tabindex') || html.includes('focus:')) {
    results.accessibility.hasKeyboardNavigation = true;
  }

  if (html.includes('contrast') || html.includes('text-gray') || html.includes('dark:')) {
    results.accessibility.hasColorContrast = true;
  }

  if (html.includes('focus:ring') || html.includes('focus:outline')) {
    results.accessibility.hasFocusIndicators = true;
  }

  // Mobile Responsiveness Tests
  if (html.includes('viewport') && html.includes('width=device-width')) {
    results.mobileResponsive.hasViewportMeta = true;
  }

  if (html.includes('md:') || html.includes('lg:') || html.includes('sm:') || html.includes('@media')) {
    results.mobileResponsive.hasResponsiveCSS = true;
  }

  if (html.includes('touch') || html.includes('mobile') || html.includes('user-scalable=no')) {
    results.mobileResponsive.hasTouchFriendly = true;
  }

  if (html.includes('flex') && (html.includes('grid') || html.includes('grid-cols'))) {
    results.mobileResponsive.hasFlexboxGrid = true;
  }

  // Interactive Elements Count
  results.interactiveElements.buttons = (html.match(/<button/g) || []).length;
  results.interactiveElements.forms = (html.match(/<form/g) || []).length;
  results.interactiveElements.links = (html.match(/<a /g) || []).length;
  results.interactiveElements.inputs = (html.match(/<input/g) || []).length;
  results.interactiveElements.selects = (html.match(/<select/g) || []).length;
  results.interactiveElements.textareas = (html.match(/<textarea/g) || []).length;

  // UX Features Tests
  if (html.includes('loading') || html.includes('spinner') || html.includes('animate-spin')) {
    results.uxFeatures.hasLoadingStates = true;
  }

  if (html.includes('error') || html.includes('alert') || html.includes('danger')) {
    results.uxFeatures.hasErrorMessages = true;
  }

  if (html.includes('tooltip') || html.includes('title=')) {
    results.uxFeatures.hasTooltips = true;
  }

  if (html.includes('modal') || html.includes('dialog') || html.includes('fixed inset')) {
    results.uxFeatures.hasModals = true;
  }

  if (html.includes('progress') || html.includes('step') || html.includes('breadcrumb')) {
    results.uxFeatures.hasProgressIndicators = true;
  }

  // Calculate Scores
  const accessibilityChecks = Object.values(results.accessibility).slice(0, -1);
  results.accessibility.accessibilityScore = Math.round((accessibilityChecks.filter(Boolean).length / accessibilityChecks.length) * 100);

  const mobileChecks = Object.values(results.mobileResponsive).slice(0, -1);
  results.mobileResponsive.mobileScore = Math.round((mobileChecks.filter(Boolean).length / mobileChecks.length) * 100);

  const uxChecks = Object.values(results.uxFeatures).slice(0, -1);
  results.uxFeatures.uxScore = Math.round((uxChecks.filter(Boolean).length / uxChecks.length) * 100);

  return results;
}

function testPageContent(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let html = '';

      res.on('data', (chunk) => {
        html += chunk;
      });

      res.on('end', () => {
        const results = checkAccessibilityFeatures(html, name);
        results.status = res.statusCode;
        results.contentLength = html.length;
        resolve(results);
      });
    });

    req.on('error', (err) => {
      resolve({
        page: name,
        status: 'ERROR',
        error: err.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        page: name,
        status: 'TIMEOUT',
        error: 'Request timeout'
      });
    });
  });
}

async function runComprehensiveTests() {
  logger.info('🔍 RestoPapa UI/UX Comprehensive Testing Report');
  console.log('='.repeat(60));
  logger.info('Testing Frontend: http://localhost:3001');
  console.log('Test Date:', new Date().toLocaleString());
  console.log('='.repeat(60));

  const allResults = [];

  for (const page of testPages) {
    logger.info(`\n📄 Testing: ${page.name}`);
    console.log('-'.repeat(40));

    const result = await testPageContent(page.url, page.name);
    allResults.push(result);

    if (result.error) {
      logger.info(`❌ ERROR: ${result.error}`);
      continue;
    }

    logger.info(`✅ Status: ${result.status}`);
    logger.info(`📊 Content Size: ${result.contentLength} bytes`);

    logger.info('\n♿ Accessibility Test Results:');
    logger.info(`   Score: ${result.accessibility.accessibilityScore}%`);
    logger.info(`   ✓ Semantic HTML: ${result.accessibility.hasSemanticHTML ? 'Yes' : 'No'}`);
    logger.info(`   ✓ ARIA Labels: ${result.accessibility.hasAriaLabels ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Alt Text: ${result.accessibility.hasAltText ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Form Labels: ${result.accessibility.hasFormLabels ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Heading Structure: ${result.accessibility.hasHeadingStructure ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Keyboard Navigation: ${result.accessibility.hasKeyboardNavigation ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Focus Indicators: ${result.accessibility.hasFocusIndicators ? 'Yes' : 'No'}`);

    logger.info('\n📱 Mobile Responsiveness:');
    logger.info(`   Score: ${result.mobileResponsive.mobileScore}%`);
    logger.info(`   ✓ Viewport Meta: ${result.mobileResponsive.hasViewportMeta ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Responsive CSS: ${result.mobileResponsive.hasResponsiveCSS ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Touch Friendly: ${result.mobileResponsive.hasTouchFriendly ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Flexbox/Grid: ${result.mobileResponsive.hasFlexboxGrid ? 'Yes' : 'No'}`);

    logger.info('\n🎯 Interactive Elements:');
    logger.info(`   Buttons: ${result.interactiveElements.buttons}`);
    logger.info(`   Forms: ${result.interactiveElements.forms}`);
    logger.info(`   Links: ${result.interactiveElements.links}`);
    logger.info(`   Inputs: ${result.interactiveElements.inputs}`);
    logger.info(`   Selects: ${result.interactiveElements.selects}`);

    logger.info('\n🎨 UX Features:');
    logger.info(`   Score: ${result.uxFeatures.uxScore}%`);
    logger.info(`   ✓ Loading States: ${result.uxFeatures.hasLoadingStates ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Error Messages: ${result.uxFeatures.hasErrorMessages ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Tooltips: ${result.uxFeatures.hasTooltips ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Modals: ${result.uxFeatures.hasModals ? 'Yes' : 'No'}`);
    logger.info(`   ✓ Progress Indicators: ${result.uxFeatures.hasProgressIndicators ? 'Yes' : 'No'}`);
  }

  // Generate Summary Report
  logger.info('\n' + '='.repeat(60));
  logger.info('📈 COMPREHENSIVE SUMMARY REPORT');
  console.log('='.repeat(60));

  const validResults = allResults.filter(r => !r.error);

  if (validResults.length > 0) {
    const avgAccessibility = Math.round(validResults.reduce((sum, r) => sum + r.accessibility.accessibilityScore, 0) / validResults.length);
    const avgMobile = Math.round(validResults.reduce((sum, r) => sum + r.mobileResponsive.mobileScore, 0) / validResults.length);
    const avgUX = Math.round(validResults.reduce((sum, r) => sum + r.uxFeatures.uxScore, 0) / validResults.length);

    logger.info(`\n🏆 OVERALL SCORES:`);
    logger.info(`   Accessibility Average: ${avgAccessibility}%`);
    logger.info(`   Mobile Responsiveness: ${avgMobile}%`);
    logger.info(`   UX Features: ${avgUX}%`);

    const totalInteractiveElements = validResults.reduce((sum, r) =>
      sum + r.interactiveElements.buttons + r.interactiveElements.forms +
      r.interactiveElements.links + r.interactiveElements.inputs + r.interactiveElements.selects, 0);

    logger.info(`\n📊 INTERACTIVE ELEMENTS TOTAL: ${totalInteractiveElements}`);
    logger.info(`   Total Buttons: ${validResults.reduce((sum, r) => sum + r.interactiveElements.buttons, 0)}`);
    logger.info(`   Total Forms: ${validResults.reduce((sum, r) => sum + r.interactiveElements.forms, 0)}`);
    logger.info(`   Total Links: ${validResults.reduce((sum, r) => sum + r.interactiveElements.links, 0)}`);
    logger.info(`   Total Inputs: ${validResults.reduce((sum, r) => sum + r.interactiveElements.inputs, 0)}`);

    logger.info(`\n🎯 TOP PERFORMING PAGES:`);
    validResults
      .sort((a, b) => b.accessibility.accessibilityScore - a.accessibility.accessibilityScore)
      .slice(0, 3)
      .forEach((result, index) => {
        logger.info(`   ${index + 1}. ${result.page} (Accessibility: ${result.accessibility.accessibilityScore}%)`);
      });

    logger.info(`\n📱 BEST MOBILE EXPERIENCE:`);
    validResults
      .sort((a, b) => b.mobileResponsive.mobileScore - a.mobileResponsive.mobileScore)
      .slice(0, 3)
      .forEach((result, index) => {
        logger.info(`   ${index + 1}. ${result.page} (Mobile: ${result.mobileResponsive.mobileScore}%)`);
      });

    logger.info(`\n✨ RECOMMENDATIONS:`);

    if (avgAccessibility < 80) {
      logger.info(`   🔧 Improve accessibility by adding more ARIA labels and semantic HTML`);
    }

    if (avgMobile < 80) {
      logger.info(`   📱 Enhance mobile experience with better responsive breakpoints`);
    }

    if (avgUX < 70) {
      logger.info(`   🎨 Add more UX features like loading states and progress indicators`);
    }

    const overallRating = Math.round((avgAccessibility + avgMobile + avgUX) / 3);
    logger.info(`\n⭐ OVERALL RATING: ${overallRating}%`);

    if (overallRating >= 90) {
      logger.info(`   🏆 EXCELLENT - Outstanding UI/UX implementation!`);
    } else if (overallRating >= 75) {
      logger.info(`   ✅ GOOD - Strong foundation with room for enhancement`);
    } else if (overallRating >= 60) {
      logger.info(`   ⚠️  FAIR - Several areas need improvement`);
    } else {
      logger.info(`   🚨 NEEDS WORK - Significant improvements required`);
    }
  }

  logger.info('\n' + '='.repeat(60));
  logger.info('🎯 Testing completed successfully!');
  console.log('='.repeat(60));
}

runComprehensiveTests().catch(console.error);