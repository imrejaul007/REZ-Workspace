const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('payment service enforces authoritative order amount checks for order payments', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'paymentService.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /async function resolveAuthoritativeOrderAmount\(orderId: string\)/);
  assert.match(source, /if \(normalizedPurpose === 'order_payment'\)/);
  assert.match(source, /throw new Error\('Authoritative order amount not found'\)/);
  assert.match(source, /throw new Error\(`Amount mismatch: expected \$\{authoritativeAmount\}, got \$\{amount\}`\)/);
});

test('client-facing payment initiate route rejects non-order purposes without an authoritative amount source', () => {
  const filePath = path.join(__dirname, '..', 'src', 'routes', 'paymentRoutes.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /const publicPurpose = purpose \|\| 'order';/);
  assert.match(source, /if \(publicPurpose !== 'order'\)/);
  assert.match(source, /Client-facing payment initiation only supports order payments with server-verified amounts/);
  assert.match(source, /purpose: publicPurpose,/);
});

test('legacy Razorpay compat route requires an order reference before creating a payment order', () => {
  const filePath = path.join(__dirname, '..', 'src', 'routes', 'paymentRoutes.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /const orderRef = String\(orderId \|\| orderNumber \|\| notes\?\.orderId \|\| notes\?\.orderNumber \|\| ''\)\.trim\(\);/);
  assert.match(source, /if \(!orderRef\)/);
  assert.match(source, /orderId or orderNumber is required for Razorpay order creation/);
  assert.match(source, /await paymentService\.assertAuthoritativeOrderAmount\(orderRef, parsedOrderAmount\);/);
});
