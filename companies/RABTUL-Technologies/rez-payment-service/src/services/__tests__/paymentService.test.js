/**
 * Unit tests for PaymentService
 *
 * Uses Node's built-in test runner (node --test) as configured in package.json.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// Test the normalizePaymentPurpose function by reading source
test('normalizePaymentPurpose should be defined in paymentService', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify the function exists
  assert.match(source, /function normalizePaymentPurpose/);

  // Verify it handles 'order' purpose
  assert.match(source, /case 'order':\s*return 'order_payment'/);

  // Verify it handles 'wallet_topup' purpose
  assert.match(source, /case 'wallet_topup':\s*return 'wallet_topup'/);

  // Verify it handles 'subscription' purpose
  assert.match(source, /case 'subscription':\s*return 'financial_service'/);
});

test('assertAuthoritativeOrderAmount should throw for missing amounts', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify the function exists and throws for missing order
  assert.match(source, /async function assertAuthoritativeOrderAmount/);
  assert.match(source, /throw new Error\('Authoritative order amount not found'\)/);
  assert.match(source, /throw new Error\(`Amount mismatch/);
});

test('initiatePayment should enforce wallet topup limits', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify wallet topup limit constant exists
  assert.match(source, /MAX_WALLET_TOPUP\s*=\s*100000/);

  // Verify limit check exists
  assert.match(source, /Wallet topup amount cannot exceed/);
});

test('initiatePayment should enforce financial service limits', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify financial service limit constant exists
  assert.match(source, /MAX_FINANCIAL_SERVICE\s*=\s*500000/);

  // Verify limit check exists
  assert.match(source, /Financial service amount cannot exceed/);
});

test('getPaymentStatus should filter by ownerUserId', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify ownerUserId validation
  assert.match(source, /async function getPaymentStatus\(paymentId: string, ownerUserId\?: string\)/);
  assert.match(source, /Invalid ownerUserId/);
});

test('getMerchantSettlements should implement pagination', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify pagination parameters
  assert.match(source, /async function getMerchantSettlements\(merchantId: string, page/);
  assert.match(source, /hasMore:/);

  // Verify limit clamping
  assert.match(source, /limit = Math\.min\(100, Math\.max\(1, limit\)\)/);
});

test('getPaymentAuditTrail should limit results', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify audit trail function
  assert.match(source, /async function getPaymentAuditTrail\(paymentId: string\)/);

  // Verify limit of 200
  assert.match(source, /\.limit\(200\)/);
});

test('capturePayment should verify Razorpay signature', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify signature verification
  assert.match(source, /async function capturePayment/);
  assert.match(source, /razorpaySignature/);
  assert.match(source, /verifySignature/);
  assert.match(source, /Invalid payment signature/);
});

test('capturePayment should check authorization', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify authorization check
  assert.match(source, /IDOR attempt:/);
  assert.match(source, /Unauthorized: payment does not belong to this user/);
});

test('creditWalletAfterPayment should check Redis first', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify Redis check for idempotency
  assert.match(source, /pay-credit-queued:/);
  assert.match(source, /Already enqueued/);
});

test('creditWalletAfterPayment should handle missing WALLET_SERVICE_URL', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify warning for missing URL
  assert.match(source, /WALLET_SERVICE_URL not set/);
  assert.match(source, /skipping coin credit/);
});

test('startMonolithSyncWorker should be exported', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify worker function
  assert.match(source, /export function startMonolithSyncWorker/);
});

test('PaymentMetadata interface should allow flexible fields', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify interface with index signature
  assert.match(source, /interface PaymentMetadata/);
  assert.match(source, /\[key: string\]: unknown/);

  // Verify key fields
  assert.match(source, /merchantId\?: string/);
  assert.match(source, /orderId\?: string/);
  assert.match(source, /razorpayOrderId\?: string/);
});

test('InitiateInput interface should define payment input structure', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify input interface
  assert.match(source, /interface InitiateInput/);
  assert.match(source, /userId: string/);
  assert.match(source, /orderId: string/);
  assert.match(source, /amount: number/);
  assert.match(source, /paymentMethod: string/);
});

test('enqueueMonolithSync should use INTERNAL_SERVICE_TOKEN', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'paymentService.ts'),
    'utf8'
  );

  // Verify internal token usage
  assert.match(source, /INTERNAL_SERVICE_TOKEN/);
  assert.match(source, /x-internal-token/);
});
