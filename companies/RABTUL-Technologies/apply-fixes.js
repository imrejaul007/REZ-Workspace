#!/usr/bin/env node
/**
 * Automated fix script for RABTUL services
 * Applies 404 handlers, error handlers, health endpoints, and rate limiting
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/rejaulkarim/Documents/ReZ Full App/RABTUL-Technologies';

// Service configurations for fixes
const fixes = {
  'REZ-cache-service': {
    serviceName: 'REZ Cache Service',
    add404: true,
    addErrorHandler: true,
    addHealthEndpoint: true,
    addRateLimit: true
  },
  'REZ-retry-service': {
    serviceName: 'REZ Retry Service',
    add404: true,
    addErrorHandler: true,
    addHealthEndpoint: true,
    addRateLimit: true
  },
  'REZ-returns-service': {
    serviceName: 'REZ Returns Service',
    add404: true,
    addErrorHandler: true,
    addHealthEndpoint: true,
    addRateLimit: true
  },
  'REZ-graph-service': {
    serviceName: 'REZ Graph Service',
    add404: true,
    addErrorHandler: false, // has error handler
    addHealthEndpoint: true,
    addRateLimit: true
  },
  'REZ-secrets-manager': {
    serviceName: 'REZ Secrets Manager',
    add404: true,
    addErrorHandler: false, // has error handler
    addHealthEndpoint: false, // has health endpoint
    addCors: true
  },
  'REZ-ai-agent-studio': {
    serviceName: 'REZ AI Agent Studio',
    add404: true,
    addErrorHandler: false, // has error handler
    addHealthEndpoint: true,
    addRateLimit: true
  },
  'REZ-agent-observability': {
    serviceName: 'REZ Agent Observability',
    add404: true,
    addErrorHandler: false, // has error handler
    addHealthEndpoint: false, // has health endpoint
    addRateLimit: false // has rate limit
  }
};

console.log('\n=== Applying Automated Fixes ===\n');

for (const [serviceName, fixConfig] of Object.entries(fixes)) {
  const servicePath = path.join(BASE_DIR, serviceName);
  const srcPath = path.join(servicePath, 'src');
  const indexPath = path.join(srcPath, 'index.ts');
  
  if (!fs.existsSync(indexPath)) {
    console.log(`[SKIP] ${serviceName} - index.ts not found`);
    continue;
  }
  
  console.log(`[UPDATING] ${serviceName}`);
  
  let content = fs.readFileSync(indexPath, 'utf8');
  let modifications = [];
  
  // 1. Add rate limiting imports
  if (fixConfig.addRateLimit && !content.includes('rateLimiter') && !content.includes('rateLimit')) {
    // Add import after helmet import
    content = content.replace(
      /import helmet from ['"]helmet['"];?/,
      `import helmet from 'helmet';\nimport rateLimit from 'express-rate-limit';`
    );
    modifications.push('rate limit import');
    
    // Add rate limiter after helmet()
    content = content.replace(
      /app\.use\(helmet\(\)\);/,
      `app.use(helmet());\n\n// Rate limiting\nconst rateLimiter = rateLimit({\n  windowMs: 15 * 60 * 1000,\n  max: 100,\n  standardHeaders: true,\n  legacyHeaders: false,\n  message: { success: false, error: 'Too many requests' }\n});\napp.use(rateLimiter);`
    );
    modifications.push('rate limiter middleware');
  }
  
  // 2. Add CORS if needed
  if (fixConfig.addCors && !content.includes('cors(')) {
    content = content.replace(
      /import helmet from ['"]helmet['"];?/,
      `import helmet from 'helmet';\nimport cors from 'cors';`
    );
    modifications.push('cors import');
    
    content = content.replace(
      /app\.use\(helmet\(\)\);/,
      `app.use(helmet());\napp.use(cors());`
    );
    modifications.push('cors middleware');
  }
  
  // 3. Add health endpoint before routes
  if (fixConfig.addHealthEndpoint && !content.includes("app.get('/health'")) {
    const healthEndpoint = `
// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: '${fixConfig.serviceName}',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

`;
    
    // Insert before first route or after middleware
    if (content.includes("app.use('/api")) {
      content = content.replace("app.use('/api", healthEndpoint + "app.use('/api");
    } else if (content.includes("app.get('/api")) {
      content = content.replace("app.get('/api", healthEndpoint + "app.get('/api");
    } else {
      // Insert after middleware section
      content = content.replace(
        /(app\.use\(express\.json\(\)\);[\s\S]*?)(app\.(get|post|put|patch|delete)\()/,
        `$1${healthEndpoint}$2`
      );
    }
    modifications.push('health endpoint');
  }
  
  // 4. Add 404 handler before error handler
  if (fixConfig.add404 && !content.match(/app\.use\(\(_req.*res\.status\(404\)/)) {
    const notFoundHandler = `
// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

`;
    
    // Find error handler and insert before it
    if (content.includes('app.use((err: Error')) {
      content = content.replace(
        /(\/\/ Error handler\napp\.use\(\(err: Error)/,
        notFoundHandler + '$1'
      );
    } else if (content.includes('app.listen')) {
      // Insert before app.listen
      content = content.replace(
        /(app\.listen\()/,
        notFoundHandler + '$1'
      );
    }
    modifications.push('404 handler');
  }
  
  // Write updated content
  if (modifications.length > 0) {
    fs.writeFileSync(indexPath, content);
    console.log(`  [MODIFIED] ${modifications.join(', ')}`);
  } else {
    console.log(`  [NO_CHANGE] Already has required middleware`);
  }
}

console.log('\n=== Fixes Applied ===');
console.log('\nNext steps:');
console.log('1. Run npm install in updated service directories');
console.log('2. Test each service with: curl http://localhost:<PORT>/health');
console.log('\n');
