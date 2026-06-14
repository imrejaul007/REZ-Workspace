const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readSource(...segments) {
  return fs.readFileSync(path.join(__dirname, '..', ...segments), 'utf8');
}

test('payment verify endpoints remain internal-only', () => {
  const source = readSource('src', 'routes', 'paymentRoutes.ts');

  assert.match(source, /router\.post\('\/pay\/verify', requireInternalToken, verifyHandler\)/);
  assert.match(source, /router\.post\('\/api\/razorpay\/verify-payment', requireInternalToken, verifyHandler\)/);
  assert.match(source, /Intentionally not exposed to normal authenticated users\./);
  assert.match(source, /Keeping this path internal-only prevents a signature-oracle regression\./);
});

test('payment refund route remains restricted to authenticated merchant or admin roles', () => {
  const source = readSource('src', 'routes', 'paymentRoutes.ts');

  assert.match(source, /const allowedRoles = \['merchant', 'admin', 'super_admin', 'operator'\]/);
  assert.match(source, /router\.post\('\/pay\/refund', requireAuth, refundHandler\)/);
  assert.match(source, /router\.post\('\/api\/payment\/refund', requireAuth, refundHandler\)/);
});
