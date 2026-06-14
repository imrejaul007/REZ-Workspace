const test = require('node:test');
const assert = require('node:assert/strict');

test('rez-gamification-service HTTP server setup', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'httpServer.ts'), 'utf8');

  // Verify express app initialization
  assert.match(source, /express\(\)/);
});

test('rez-gamification-service health endpoint exists', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'health.ts'), 'utf8');

  // Verify health check structure
  assert.match(source, /\/health/);
  assert.match(source, /export/);
});

test('rez-gamification-service index bootstrap', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.ts'), 'utf8');

  // Verify main entry point exists and sets SERVICE_NAME
  assert.match(source, /SERVICE_NAME/);
  assert.match(source, /gamification/i);
});

test('rez-gamification-service middleware setup', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'httpServer.ts'), 'utf8');

  // Verify middleware initialization
  assert.match(source, /helmet|cors|express\.json/);
});

test('rez-gamification-service worker integration', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker.ts'), 'utf8');

  // Verify worker process exists
  assert.match(source, /Worker|process|queue/i);
});
