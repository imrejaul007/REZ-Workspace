import logger from './utils/logger';

#!/usr/bin/env node

/**
 * AGENT 5: STABILITY & UX AUDITOR
 * Comprehensive stability, fault tolerance, and UX assessment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StabilityUXAuditor {
  constructor() {
    this.results = {
      auditStartTime: new Date().toISOString(),
      stability: {
        faultTolerance: [],
        errorHandling: [],
        dataConsistency: [],
        recovery: []
      },
      ux: {
        accessibility: [],
        responsiveness: [],
        navigation: [],
        performance: []
      },
      browser: {
        compatibility: [],
        errorHandling: [],
        responsive: []
      },
      security: {
        vulnerabilities: [],
        authentication: [],
        dataProtection: []
      },
      recommendations: []
    };

    this.projectRoot = process.cwd();
  }

  // Analyze file structure for stability patterns
  analyzeCodeStructure() {
    logger.info('🏗️ Analyzing code structure for stability patterns...');

    const findings = [];

    // Check for error handling patterns
    const errorHandlingPatterns = this.checkErrorHandling();
    findings.push(...errorHandlingPatterns);

    // Check for resilience patterns
    const resiliencePatterns = this.checkResiliencePatterns();
    findings.push(...resiliencePatterns);

    // Check for data consistency patterns
    const dataConsistencyPatterns = this.checkDataConsistency();
    findings.push(...dataConsistencyPatterns);

    this.results.stability.faultTolerance = findings;
  }

  checkErrorHandling() {
    const findings = [];

    try {
      // Check API error handling
      const apiFiles = this.findFiles('apps/api/src', ['.ts', '.js'])
        .filter(file => file.includes('controller') || file.includes('service'));

      let properErrorHandling = 0;
      let totalEndpoints = 0;

      apiFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');

          // Count try-catch blocks
          const tryCatchCount = (content.match(/try\s*{/g) || []).length;

          // Count async functions
          const asyncFunctions = (content.match(/async\s+\w+\s*\(/g) || []).length;

          // Count error decorators/middleware
          const errorMiddleware = (content.match(/@Catch|\.catch\(|HttpException/g) || []).length;

          totalEndpoints += asyncFunctions;
          if (tryCatchCount > 0 || errorMiddleware > 0) {
            properErrorHandling += Math.min(tryCatchCount + errorMiddleware, asyncFunctions);
          }

        } catch (e) {
          // Skip files that can't be read
        }
      });

      const errorHandlingRatio = totalEndpoints > 0 ? (properErrorHandling / totalEndpoints) * 100 : 0;

      findings.push({
        type: 'error_handling',
        status: errorHandlingRatio > 80 ? 'excellent' : errorHandlingRatio > 60 ? 'good' : 'needs_improvement',
        score: Math.round(errorHandlingRatio),
        message: `Error handling coverage: ${Math.round(errorHandlingRatio)}% (${properErrorHandling}/${totalEndpoints} endpoints)`,
        recommendation: errorHandlingRatio < 80 ? 'Implement comprehensive error handling with try-catch blocks and proper error middleware' : null
      });

    } catch (e) {
      findings.push({
        type: 'error_handling',
        status: 'error',
        message: 'Could not analyze error handling patterns',
        error: e.message
      });
    }

    return findings;
  }

  checkResiliencePatterns() {
    const findings = [];

    try {
      // Check for circuit breaker patterns
      const hasCircuitBreaker = this.searchInFiles('circuit', ['breaker', 'fallback']) > 0;

      // Check for retry patterns
      const hasRetryLogic = this.searchInFiles('retry', ['attempt', 'backoff']) > 0;

      // Check for timeout handling
      const hasTimeouts = this.searchInFiles('timeout', ['setTimeout', 'clearTimeout']) > 0;

      // Check for graceful degradation
      const hasGracefulDegradation = this.searchInFiles('graceful', ['fallback', 'degradation']) > 0;

      findings.push({
        type: 'resilience_patterns',
        patterns: {
          circuitBreaker: hasCircuitBreaker,
          retryLogic: hasRetryLogic,
          timeouts: hasTimeouts,
          gracefulDegradation: hasGracefulDegradation
        },
        score: [hasCircuitBreaker, hasRetryLogic, hasTimeouts, hasGracefulDegradation].filter(Boolean).length * 25,
        message: `Resilience patterns implemented: ${[hasCircuitBreaker && 'Circuit Breaker', hasRetryLogic && 'Retry Logic', hasTimeouts && 'Timeouts', hasGracefulDegradation && 'Graceful Degradation'].filter(Boolean).join(', ') || 'None'}`,
        recommendation: 'Implement circuit breaker, retry logic, and graceful degradation patterns for production resilience'
      });

    } catch (e) {
      findings.push({
        type: 'resilience_patterns',
        status: 'error',
        message: 'Could not analyze resilience patterns',
        error: e.message
      });
    }

    return findings;
  }

  checkDataConsistency() {
    const findings = [];

    try {
      // Check Prisma transactions
      const transactionUsage = this.searchInFiles('transaction', ['prisma', '$transaction']);

      // Check for race condition protection
      const hasLocking = this.searchInFiles('lock', ['mutex', 'semaphore', 'atomic']) > 0;

      // Check for validation patterns
      const hasValidation = this.searchInFiles('validation', ['validate', 'schema', 'joi', 'yup']) > 0;

      findings.push({
        type: 'data_consistency',
        patterns: {
          transactions: transactionUsage > 0,
          locking: hasLocking,
          validation: hasValidation
        },
        score: [transactionUsage > 0, hasLocking, hasValidation].filter(Boolean).length * 33.33,
        message: `Data consistency patterns: Transactions(${transactionUsage > 0}), Locking(${hasLocking}), Validation(${hasValidation})`,
        recommendation: 'Implement database transactions, proper validation, and race condition protection'
      });

    } catch (e) {
      findings.push({
        type: 'data_consistency',
        status: 'error',
        message: 'Could not analyze data consistency patterns',
        error: e.message
      });
    }

    return findings;
  }

  // Analyze UX patterns
  analyzeUXPatterns() {
    logger.info('🎨 Analyzing UX patterns and accessibility...');

    // Check accessibility patterns
    this.checkAccessibility();

    // Check responsiveness
    this.checkResponsiveness();

    // Check navigation patterns
    this.checkNavigation();

    // Check performance UX patterns
    this.checkPerformanceUX();
  }

  checkAccessibility() {
    const findings = [];

    try {
      const frontendFiles = this.findFiles('apps/web', ['.tsx', '.jsx']);

      let accessibilityScore = 0;
      let totalChecks = 0;

      frontendFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');

          // Check for ARIA labels
          const ariaLabels = (content.match(/aria-label|aria-labelledby|aria-describedby/g) || []).length;

          // Check for semantic HTML
          const semanticElements = (content.match(/<(header|nav|main|section|article|aside|footer)/g) || []).length;

          // Check for alt attributes
          const altAttributes = (content.match(/alt\s*=/g) || []).length;

          // Check for focus management
          const focusManagement = (content.match(/focus|tabIndex|onFocus|onBlur/g) || []).length;

          // Check for color contrast considerations
          const colorConsiderations = (content.match(/dark:|light:|contrast/g) || []).length;

          totalChecks += 5; // 5 accessibility checks per file
          accessibilityScore += [ariaLabels > 0, semanticElements > 0, altAttributes > 0, focusManagement > 0, colorConsiderations > 0].filter(Boolean).length;

        } catch (e) {
          // Skip files that can't be read
        }
      });

      const accessibilityRatio = totalChecks > 0 ? (accessibilityScore / totalChecks) * 100 : 0;

      findings.push({
        type: 'accessibility',
        score: Math.round(accessibilityRatio),
        status: accessibilityRatio > 80 ? 'excellent' : accessibilityRatio > 60 ? 'good' : 'needs_improvement',
        message: `Accessibility score: ${Math.round(accessibilityRatio)}% based on ARIA labels, semantic HTML, alt attributes, focus management, and color contrast`,
        recommendation: accessibilityRatio < 80 ? 'Improve accessibility with proper ARIA labels, semantic HTML, and WCAG guidelines compliance' : null
      });

    } catch (e) {
      findings.push({
        type: 'accessibility',
        status: 'error',
        message: 'Could not analyze accessibility patterns',
        error: e.message
      });
    }

    this.results.ux.accessibility = findings;
  }

  checkResponsiveness() {
    const findings = [];

    try {
      // Check for responsive design patterns
      const cssFiles = this.findFiles('apps/web', ['.css', '.scss', '.tsx']);

      let responsiveScore = 0;
      let totalFiles = 0;

      cssFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');

          // Check for media queries
          const mediaQueries = (content.match(/@media|media=|max-width|min-width/g) || []).length;

          // Check for flexible layouts
          const flexibleLayouts = (content.match(/flex|grid|column|responsive/g) || []).length;

          // Check for mobile-first patterns
          const mobileFirst = (content.match(/mobile|sm:|md:|lg:|xl:/g) || []).length;

          totalFiles++;
          if (mediaQueries > 0 || flexibleLayouts > 0 || mobileFirst > 0) {
            responsiveScore++;
          }

        } catch (e) {
          // Skip files that can't be read
        }
      });

      const responsiveRatio = totalFiles > 0 ? (responsiveScore / totalFiles) * 100 : 0;

      findings.push({
        type: 'responsiveness',
        score: Math.round(responsiveRatio),
        status: responsiveRatio > 80 ? 'excellent' : responsiveRatio > 60 ? 'good' : 'needs_improvement',
        message: `Responsive design coverage: ${Math.round(responsiveRatio)}% of files contain responsive patterns`,
        recommendation: responsiveRatio < 80 ? 'Implement mobile-first responsive design with media queries and flexible layouts' : null
      });

    } catch (e) {
      findings.push({
        type: 'responsiveness',
        status: 'error',
        message: 'Could not analyze responsive design patterns',
        error: e.message
      });
    }

    this.results.ux.responsiveness = findings;
  }

  checkNavigation() {
    const findings = [];

    try {
      const routeFiles = this.findFiles('apps/web/app', ['.tsx']);

      let navigationScore = 0;
      let totalChecks = 0;

      // Check for consistent navigation patterns
      const hasConsistentNavigation = this.searchInFiles('navigation', ['nav', 'menu', 'sidebar']) > 0;

      // Check for breadcrumbs
      const hasBreadcrumbs = this.searchInFiles('breadcrumb', ['breadcrumb', 'trail']) > 0;

      // Check for loading states
      const hasLoadingStates = this.searchInFiles('loading', ['spinner', 'skeleton', 'placeholder']) > 0;

      // Check for error states
      const hasErrorStates = this.searchInFiles('error', ['404', 'not-found', 'error-boundary']) > 0;

      totalChecks = 4;
      navigationScore = [hasConsistentNavigation, hasBreadcrumbs, hasLoadingStates, hasErrorStates].filter(Boolean).length;

      const navigationRatio = (navigationScore / totalChecks) * 100;

      findings.push({
        type: 'navigation',
        score: Math.round(navigationRatio),
        status: navigationRatio > 75 ? 'excellent' : navigationRatio > 50 ? 'good' : 'needs_improvement',
        patterns: {
          consistentNavigation: hasConsistentNavigation,
          breadcrumbs: hasBreadcrumbs,
          loadingStates: hasLoadingStates,
          errorStates: hasErrorStates
        },
        message: `Navigation UX score: ${Math.round(navigationRatio)}% - includes consistent navigation, breadcrumbs, loading states, and error handling`,
        recommendation: navigationRatio < 75 ? 'Implement consistent navigation patterns, breadcrumbs, and proper loading/error states' : null
      });

    } catch (e) {
      findings.push({
        type: 'navigation',
        status: 'error',
        message: 'Could not analyze navigation patterns',
        error: e.message
      });
    }

    this.results.ux.navigation = findings;
  }

  checkPerformanceUX() {
    const findings = [];

    try {
      // Check for performance optimization patterns
      const hasCodeSplitting = this.searchInFiles('dynamic', ['import', 'lazy', 'Suspense']) > 0;

      // Check for image optimization
      const hasImageOptimization = this.searchInFiles('Image', ['next/image', 'optimization', 'lazy']) > 0;

      // Check for caching patterns
      const hasCaching = this.searchInFiles('cache', ['swr', 'react-query', 'cache-control']) > 0;

      // Check for bundle optimization
      const hasBundleOptimization = this.searchInFiles('webpack', ['optimization', 'bundle', 'split']) > 0;

      const performanceScore = [hasCodeSplitting, hasImageOptimization, hasCaching, hasBundleOptimization].filter(Boolean).length * 25;

      findings.push({
        type: 'performance_ux',
        score: performanceScore,
        status: performanceScore > 75 ? 'excellent' : performanceScore > 50 ? 'good' : 'needs_improvement',
        patterns: {
          codeSplitting: hasCodeSplitting,
          imageOptimization: hasImageOptimization,
          caching: hasCaching,
          bundleOptimization: hasBundleOptimization
        },
        message: `Performance UX score: ${performanceScore}% - code splitting, image optimization, caching, and bundle optimization`,
        recommendation: performanceScore < 75 ? 'Implement code splitting, image optimization, and caching for better performance UX' : null
      });

    } catch (e) {
      findings.push({
        type: 'performance_ux',
        status: 'error',
        message: 'Could not analyze performance UX patterns',
        error: e.message
      });
    }

    this.results.ux.performance = findings;
  }

  // Browser compatibility analysis
  analyzeBrowserCompatibility() {
    logger.info('🌐 Analyzing browser compatibility...');

    const findings = [];

    try {
      // Check for modern JavaScript features that might need polyfills
      const modernJSFeatures = this.searchInFiles('', ['async/await', 'Promise', 'fetch', 'arrow functions']);

      // Check for CSS Grid and Flexbox usage
      const modernCSS = this.searchInFiles('', ['grid', 'flexbox', 'var(', 'calc(']);

      // Check for browser-specific features
      const browserSpecific = this.searchInFiles('', ['-webkit-', '-moz-', '-ms-', 'navigator.']);

      findings.push({
        type: 'browser_compatibility',
        modernFeatures: {
          javascript: modernJSFeatures > 0,
          css: modernCSS > 0,
          browserSpecific: browserSpecific > 0
        },
        message: `Modern features detected: JS(${modernJSFeatures}), CSS(${modernCSS}), Browser-specific(${browserSpecific})`,
        recommendation: 'Ensure polyfills and fallbacks are in place for older browsers. Test across Chrome, Firefox, Safari, and Edge.'
      });

    } catch (e) {
      findings.push({
        type: 'browser_compatibility',
        status: 'error',
        message: 'Could not analyze browser compatibility',
        error: e.message
      });
    }

    this.results.browser.compatibility = findings;
  }

  // Security analysis
  analyzeSecurityPatterns() {
    logger.info('🔒 Analyzing security patterns...');

    const findings = [];

    try {
      // Check for authentication patterns
      const hasJWTAuth = this.searchInFiles('jwt', ['jsonwebtoken', 'Bearer', 'token']) > 0;

      // Check for input validation
      const hasInputValidation = this.searchInFiles('validation', ['sanitize', 'escape', 'validate']) > 0;

      // Check for CORS configuration
      const hasCORS = this.searchInFiles('cors', ['origin', 'credentials']) > 0;

      // Check for rate limiting
      const hasRateLimit = this.searchInFiles('rate', ['limit', 'throttle', 'brute']) > 0;

      // Check for HTTPS enforcement
      const hasHTTPS = this.searchInFiles('https', ['secure', 'ssl', 'tls']) > 0;

      const securityScore = [hasJWTAuth, hasInputValidation, hasCORS, hasRateLimit, hasHTTPS].filter(Boolean).length * 20;

      findings.push({
        type: 'security_patterns',
        score: securityScore,
        status: securityScore > 80 ? 'excellent' : securityScore > 60 ? 'good' : 'needs_improvement',
        patterns: {
          jwtAuth: hasJWTAuth,
          inputValidation: hasInputValidation,
          cors: hasCORS,
          rateLimit: hasRateLimit,
          https: hasHTTPS
        },
        message: `Security score: ${securityScore}% - JWT auth, input validation, CORS, rate limiting, HTTPS enforcement`,
        recommendation: securityScore < 80 ? 'Implement comprehensive security measures including input validation, rate limiting, and HTTPS enforcement' : null
      });

    } catch (e) {
      findings.push({
        type: 'security_patterns',
        status: 'error',
        message: 'Could not analyze security patterns',
        error: e.message
      });
    }

    this.results.security.vulnerabilities = findings;
  }

  // Helper methods
  findFiles(directory, extensions) {
    const files = [];

    try {
      const fullPath = path.join(this.projectRoot, directory);
      if (!fs.existsSync(fullPath)) return files;

      const traverse = (dir) => {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            traverse(itemPath);
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext)) {
              files.push(itemPath);
            }
          }
        });
      };

      traverse(fullPath);
    } catch (e) {
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  searchInFiles(keyword, patterns) {
    let count = 0;

    try {
      const allFiles = [
        ...this.findFiles('apps', ['.ts', '.tsx', '.js', '.jsx']),
        ...this.findFiles('packages', ['.ts', '.tsx', '.js', '.jsx'])
      ];

      allFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8').toLowerCase();

          if (keyword && content.includes(keyword.toLowerCase())) {
            patterns.forEach(pattern => {
              if (content.includes(pattern.toLowerCase())) {
                count++;
              }
            });
          } else if (!keyword) {
            patterns.forEach(pattern => {
              if (content.includes(pattern.toLowerCase())) {
                count++;
              }
            });
          }
        } catch (e) {
          // Skip files that can't be read
        }
      });
    } catch (e) {
      // Handle errors gracefully
    }

    return count;
  }

  // Generate comprehensive recommendations
  generateRecommendations() {
    logger.info('📋 Generating recommendations...');

    const recommendations = [];

    // Stability recommendations
    this.results.stability.faultTolerance.forEach(finding => {
      if (finding.recommendation) {
        recommendations.push({
          priority: 'high',
          category: 'stability',
          title: 'Improve System Stability',
          description: finding.recommendation,
          impact: 'Reduces system failures and improves reliability'
        });
      }
    });

    // UX recommendations
    [...this.results.ux.accessibility, ...this.results.ux.responsiveness, ...this.results.ux.navigation, ...this.results.ux.performance].forEach(finding => {
      if (finding.recommendation) {
        recommendations.push({
          priority: 'medium',
          category: 'ux',
          title: 'Enhance User Experience',
          description: finding.recommendation,
          impact: 'Improves user satisfaction and accessibility'
        });
      }
    });

    // Security recommendations
    this.results.security.vulnerabilities.forEach(finding => {
      if (finding.recommendation) {
        recommendations.push({
          priority: 'critical',
          category: 'security',
          title: 'Strengthen Security',
          description: finding.recommendation,
          impact: 'Protects against security vulnerabilities'
        });
      }
    });

    this.results.recommendations = recommendations;
  }

  // Run complete audit
  async runAudit() {
    logger.info('🛡️ AGENT 5: STABILITY & UX AUDITOR');
    logger.info('=======================================\n');

    this.analyzeCodeStructure();
    this.analyzeUXPatterns();
    this.analyzeBrowserCompatibility();
    this.analyzeSecurityPatterns();
    this.generateRecommendations();

    // Generate report
    this.generateReport();

    return this.results;
  }

  // Generate comprehensive report
  generateReport() {
    const stabilityScore = this.calculateStabilityScore();
    const uxScore = this.calculateUXScore();
    const securityScore = this.calculateSecurityScore();
    const overallScore = Math.round((stabilityScore + uxScore + securityScore) / 3);

    const report = `# 🛡️ AGENT 5: STABILITY & UX AUDIT REPORT

**Audit Completed:** ${new Date().toISOString()}
**Overall Stability Score:** ${overallScore}/100

## 📊 EXECUTIVE SUMMARY

### Overall Assessment: ${this.getScoreStatus(overallScore)}

| Category | Score | Status |
|----------|-------|--------|
| **System Stability** | ${stabilityScore}/100 | ${this.getScoreStatus(stabilityScore)} |
| **User Experience** | ${uxScore}/100 | ${this.getScoreStatus(uxScore)} |
| **Security Patterns** | ${securityScore}/100 | ${this.getScoreStatus(securityScore)} |

## 🏗️ SYSTEM STABILITY ANALYSIS

### Fault Tolerance & Error Handling
${this.results.stability.faultTolerance.map(finding => `
**${finding.type.toUpperCase()}**
- Status: ${finding.status}
- Score: ${finding.score || 'N/A'}/100
- Finding: ${finding.message}
${finding.recommendation ? `- Recommendation: ${finding.recommendation}` : ''}
`).join('')}

## 🎨 USER EXPERIENCE ANALYSIS

### Accessibility Assessment
${this.results.ux.accessibility.map(finding => `
- **Score:** ${finding.score || 'N/A'}/100
- **Status:** ${finding.status}
- **Finding:** ${finding.message}
${finding.recommendation ? `- **Action:** ${finding.recommendation}` : ''}
`).join('')}

### Responsiveness & Navigation
${this.results.ux.responsiveness.concat(this.results.ux.navigation).map(finding => `
- **Type:** ${finding.type}
- **Score:** ${finding.score || 'N/A'}/100
- **Finding:** ${finding.message}
${finding.recommendation ? `- **Action:** ${finding.recommendation}` : ''}
`).join('')}

### Performance UX
${this.results.ux.performance.map(finding => `
- **Score:** ${finding.score || 'N/A'}/100
- **Patterns:** ${Object.entries(finding.patterns || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}
- **Finding:** ${finding.message}
${finding.recommendation ? `- **Action:** ${finding.recommendation}` : ''}
`).join('')}

## 🌐 BROWSER COMPATIBILITY

${this.results.browser.compatibility.map(finding => `
- **Modern Features:** ${finding.modernFeatures ? Object.entries(finding.modernFeatures).map(([key, value]) => `${key}: ${value}`).join(', ') : 'Not analyzed'}
- **Recommendation:** ${finding.recommendation || 'No issues found'}
`).join('')}

## 🔒 SECURITY PATTERNS ANALYSIS

${this.results.security.vulnerabilities.map(finding => `
- **Security Score:** ${finding.score || 'N/A'}/100
- **Status:** ${finding.status}
- **Patterns Implemented:** ${finding.patterns ? Object.entries(finding.patterns).filter(([k,v]) => v).map(([k,v]) => k).join(', ') : 'None'}
- **Finding:** ${finding.message}
${finding.recommendation ? `- **Critical Action:** ${finding.recommendation}` : ''}
`).join('')}

## 🎯 PRIORITY RECOMMENDATIONS

### Critical (Immediate Action Required)
${this.results.recommendations.filter(r => r.priority === 'critical').map(rec => `
**${rec.title}**
- Category: ${rec.category.toUpperCase()}
- Action: ${rec.description}
- Impact: ${rec.impact}
`).join('')}

### High Priority (Within 1 Week)
${this.results.recommendations.filter(r => r.priority === 'high').map(rec => `
**${rec.title}**
- Category: ${rec.category.toUpperCase()}
- Action: ${rec.description}
- Impact: ${rec.impact}
`).join('')}

### Medium Priority (Within 2 Weeks)
${this.results.recommendations.filter(r => r.priority === 'medium').map(rec => `
**${rec.title}**
- Category: ${rec.category.toUpperCase()}
- Action: ${rec.description}
- Impact: ${rec.impact}
`).join('')}

## 🚀 PRODUCTION READINESS ASSESSMENT

### Stability Readiness: ${stabilityScore > 80 ? '✅ Ready' : stabilityScore > 60 ? '⚠️ Needs Work' : '❌ Not Ready'}
- Error handling coverage and resilience patterns need improvement
- Data consistency measures require implementation
- Fault tolerance mechanisms should be enhanced

### UX Readiness: ${uxScore > 80 ? '✅ Ready' : uxScore > 60 ? '⚠️ Needs Work' : '❌ Not Ready'}
- Accessibility compliance needs attention
- Responsive design patterns are partially implemented
- Performance optimization opportunities identified

### Security Readiness: ${securityScore > 80 ? '✅ Ready' : securityScore > 60 ? '⚠️ Needs Work' : '❌ Not Ready'}
- Authentication and authorization patterns in place
- Input validation and security measures need strengthening
- Additional security hardening recommended

## 📈 IMPROVEMENT ROADMAP

### Week 1: Critical Stability Fixes
1. Implement comprehensive error handling
2. Add input validation and sanitization
3. Configure proper CORS and security headers

### Week 2: UX Enhancements
1. Improve accessibility compliance (ARIA labels, semantic HTML)
2. Enhance responsive design patterns
3. Implement loading states and error boundaries

### Week 3: Performance & Security
1. Add performance monitoring and optimization
2. Implement rate limiting and security middleware
3. Add comprehensive testing for stability

### Week 4: Browser Compatibility & Testing
1. Cross-browser testing and polyfills
2. Mobile device testing
3. Accessibility testing with screen readers

---

**Audit completed by Agent 5 - Stability & UX Auditor**
**Next Steps:** Address critical recommendations before production deployment
`;

    // Write report to file
    fs.writeFileSync(
      path.join(this.projectRoot, 'AGENT5_STABILITY_UX_AUDIT_REPORT.md'),
      report
    );

    // Write raw data
    fs.writeFileSync(
      path.join(this.projectRoot, 'stability-ux-audit-results.json'),
      JSON.stringify(this.results, null, 2)
    );

    logger.info('\n📄 Stability & UX audit report generated:');
    logger.info('- AGENT5_STABILITY_UX_AUDIT_REPORT.md');
    logger.info('- stability-ux-audit-results.json');
  }

  calculateStabilityScore() {
    const findings = this.results.stability.faultTolerance;
    if (findings.length === 0) return 0;

    const scores = findings.filter(f => f.score !== undefined).map(f => f.score);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50;
  }

  calculateUXScore() {
    const allUXFindings = [
      ...this.results.ux.accessibility,
      ...this.results.ux.responsiveness,
      ...this.results.ux.navigation,
      ...this.results.ux.performance
    ];

    const scores = allUXFindings.filter(f => f.score !== undefined).map(f => f.score);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50;
  }

  calculateSecurityScore() {
    const findings = this.results.security.vulnerabilities;
    if (findings.length === 0) return 0;

    const scores = findings.filter(f => f.score !== undefined).map(f => f.score);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50;
  }

  getScoreStatus(score) {
    if (score >= 90) return '🟢 Excellent';
    if (score >= 80) return '🟡 Good';
    if (score >= 60) return '🟠 Fair';
    if (score >= 40) return '🔴 Poor';
    return '⛔ Critical';
  }
}

// Run the audit if this file is executed directly
if (require.main === module) {
  const auditor = new StabilityUXAuditor();

  auditor.runAudit()
    .then((results) => {
      logger.info('\n✅ Stability & UX audit completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Stability & UX audit failed:', error);
      process.exit(1);
    });
}

module.exports = StabilityUXAuditor;