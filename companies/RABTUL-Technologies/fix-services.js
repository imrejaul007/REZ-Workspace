#!/usr/bin/env node
/**
 * RABTUL Core Services Security Fix Script
 * Run: node fix-services.js
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/rejaulkarim/Documents/ReZ Full App/RABTUL-Technologies';

// Service configurations
const services = {
  'REZ-cache-service': {
    port: 4319,
    needs: ['tsconfig', 'security-middleware', 'dev-script', '404-handler', 'error-handler']
  },
  'REZ-retry-service': {
    port: 3001,
    needs: ['tsconfig', 'security-middleware', '404-handler', 'error-handler']
  },
  'REZ-returns-service': {
    port: 4103,
    needs: ['tsconfig', 'security-middleware', '404-handler', 'error-handler', 'health-endpoint']
  },
  'REZ-graph-service': {
    port: 4129,
    needs: ['tsconfig', 'security-middleware', '404-handler', 'rate-limit']
  },
  'REZ-secrets-manager': {
    port: 3000,
    needs: ['tsconfig', 'cors', '404-handler']
  },
  'REZ-mfa-service': {
    port: null,
    needs: ['tsconfig']
  },
  'REZ-schedule-service': {
    port: 4080,
    needs: ['tsconfig']
  },
  'REZ-ai-agent-studio': {
    port: 4046,
    needs: ['rate-limit', '404-handler', 'health-endpoint', 'auth']
  },
  'REZ-agent-observability': {
    port: 4308,
    needs: ['auth', '404-handler']
  }
};

// tsconfig template
const tsconfigTemplate = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"],
  "ts-node": {
    "esm": true
  }
}
`;

// Security middleware template
const securityMiddlewareTemplate = `import rateLimit from 'express-rate-limit';

/**
 * General rate limiter for all requests
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests'
  }
});
`;

// Rate limit dependency check
const addRateLimitDependency = (pkgPath) => {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.dependencies?.['express-rate-limit']) {
    pkg.dependencies['express-rate-limit'] = '^7.1.5';
    pkg.devDependencies['@types/express-rate-limit'] = '^7.1.5';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    return true;
  }
  return false;
};

// Process each service
console.log('\n=== RABTUL Core Services Security Fix ===\n');

const results = {
  tsconfigAdded: [],
  middlewareAdded: [],
  depsAdded: [],
  needsManualUpdate: []
};

for (const [serviceName, config] of Object.entries(services)) {
  const servicePath = path.join(BASE_DIR, serviceName);
  const srcPath = path.join(servicePath, 'src');
  
  if (!fs.existsSync(servicePath)) {
    console.log(`[SKIP] ${serviceName} - Directory not found`);
    continue;
  }
  
  console.log(`[PROCESSING] ${serviceName}`);
  
  // 1. Create tsconfig.json
  if (config.needs.includes('tsconfig')) {
    const tsconfigPath = path.join(servicePath, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      fs.writeFileSync(tsconfigPath, tsconfigTemplate);
      results.tsconfigAdded.push(serviceName);
      console.log(`  [ADDED] tsconfig.json`);
    } else {
      console.log(`  [EXISTS] tsconfig.json`);
    }
  }
  
  // 2. Create middleware directory and security middleware
  if (config.needs.includes('security-middleware') || config.needs.includes('rate-limit')) {
    const middlewarePath = path.join(srcPath, 'middleware');
    if (!fs.existsSync(middlewarePath)) {
      fs.mkdirSync(middlewarePath, { recursive: true });
    }
    
    const securityPath = path.join(middlewarePath, 'security.ts');
    if (!fs.existsSync(securityPath)) {
      fs.writeFileSync(securityPath, securityMiddlewareTemplate);
      results.middlewareAdded.push(`${serviceName}/middleware/security.ts`);
      console.log(`  [ADDED] src/middleware/security.ts`);
    }
    
    // Add rate-limit dependency
    const pkgPath = path.join(servicePath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      if (addRateLimitDependency(pkgPath)) {
        results.depsAdded.push(serviceName);
        console.log(`  [ADDED] express-rate-limit dependency`);
      }
    }
  }
  
  // 3. Add dev script if missing
  const pkgPath = path.join(servicePath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let updated = false;
    
    if (!pkg.scripts?.dev) {
      const moduleType = pkg.type === 'module' ? 'tsx watch' : 'ts-node';
      pkg.scripts.dev = `${moduleType} src/index.ts`;
      updated = true;
      console.log(`  [ADDED] dev script`);
    }
    
    if (!pkg.scripts?.test && config.needs.includes('test')) {
      pkg.scripts.test = 'jest';
      updated = true;
      console.log(`  [ADDED] test script`);
    }
    
    if (updated) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }
  }
  
  // 4. Analyze index.ts for manual fixes needed
  const indexPath = path.join(srcPath, 'index.ts');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    const changes = [];
    
    // Check for 404 handler
    if (config.needs.includes('404-handler') && !content.match(/app\.use\(\(_req.*res\.status\(404\)/)) {
      changes.push('404 handler');
    }
    
    // Check for error handler
    if (config.needs.includes('error-handler') && !content.match(/app\.use\(\(err.*Error.*req.*Request/)) {
      changes.push('error handler');
    }
    
    // Check for health endpoint
    if (config.needs.includes('health-endpoint') && !content.includes("app.get('/health'")) {
      changes.push('health endpoint');
    }
    
    // Check for rate limiting
    if (config.needs.includes('rate-limit') && !content.includes('rateLimit') && !content.includes('rateLimiter')) {
      changes.push('rate limiting middleware');
    }
    
    // Check for cors
    if (config.needs.includes('cors') && !content.includes('cors(')) {
      changes.push('cors middleware');
    }
    
    if (changes.length > 0) {
      results.needsManualUpdate.push({ service: serviceName, changes });
      console.log(`  [MANUAL_FIX] Needs: ${changes.join(', ')}`);
    } else {
      console.log(`  [OK] All required middleware present`);
    }
  }
}

console.log('\n\n=== FIX SUMMARY ===\n');

console.log('tsconfig.json files added to:');
results.tsconfigAdded.forEach(s => console.log(`  - ${s}`));
if (results.tsconfigAdded.length === 0) console.log('  (none needed)');

console.log('\nMiddleware files added:');
results.middlewareAdded.forEach(m => console.log(`  - ${m}`));
if (results.middlewareAdded.length === 0) console.log('  (none needed)');

console.log('\nDependencies added to:');
results.depsAdded.forEach(s => console.log(`  - ${s}`));
if (results.depsAdded.length === 0) console.log('  (none needed)');

console.log('\n=== MANUAL FIXES REQUIRED ===');
results.needsManualUpdate.forEach(({ service, changes }) => {
  console.log(`\n${service}:`);
  changes.forEach(change => console.log(`  - Add ${change}`));
});

console.log('\n=== NEXT STEPS ===');
console.log('1. Run npm install in updated service directories');
console.log('2. Add the required middleware imports to index.ts');
console.log('3. Apply the middleware in the correct order:');
console.log('   helmet() -> cors() -> rateLimiter -> your routes -> 404 -> error handler');
console.log('\n');
