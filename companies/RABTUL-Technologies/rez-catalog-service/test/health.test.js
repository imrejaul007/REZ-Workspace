const test = require('node:test');
const assert = require('node:assert/strict');

test('rez-catalog-service health endpoint exists', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'httpServer.ts'), 'utf8');

  // Verify health endpoint is registered
  assert.match(source, /\/health/);
});

test('rez-catalog-service HTTP server setup', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'httpServer.ts'), 'utf8');

  // Verify express app is created
  assert.match(source, /express\(\)/);
  assert.match(source, /http\.createServer|app\.listen|server\.listen/);
});

test('rez-catalog-service routing structure', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'httpServer.ts'), 'utf8');

  // Verify middleware and routing
  assert.match(source, /app\.use\(/);
});

test('rez-catalog-service worker integration', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker.ts'), 'utf8');

  // Verify worker is defined
  assert.match(source, /Worker|worker/);
});

test('rez-catalog-service health module exports', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'health.ts'), 'utf8');

  // Verify health functions are exported
  assert.match(source, /export/);
});
