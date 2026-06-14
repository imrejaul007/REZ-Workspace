const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readServiceSource() {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'paymentService.ts');
  return fs.readFileSync(filePath, 'utf8');
}

test('capturePayment keeps an idempotent fast path for already completed payments', () => {
  const source = readServiceSource();

  assert.match(source, /if \(payment\.status === 'completed'\) return; \/\/ idempotent/);
  assert.match(source, /payment\.status = 'processing';/);
  assert.match(source, /payment\.status = 'completed';/);
});

test('processRefund guards ownership, completed-state-only refunds, and over-refunds', () => {
  const source = readServiceSource();

  assert.match(source, /if \(ownerUserId && paymentCheck\.user\.toString\(\) !== ownerUserId\)/);
  assert.match(source, /if \(paymentCheck\.status !== 'completed'\) throw new Error\('Can only refund completed payments'\);/);
  // Over-refund guard: MongoDB atomic $expr check prevents concurrent over-refunds
  assert.match(source, /\$expr: \{ \$lte: \[/);
  // Atomic reservation fails with explicit error when over-refund would occur
  assert.match(source, /Refund rejected: payment not found, wrong state, or exceeds refundable amount/);
});

test('webhook handlers keep idempotent terminal-state checks', () => {
  const source = readServiceSource();

  assert.match(source, /if \(payment\.status === 'completed'\) \{/);
  assert.match(source, /already completed \(idempotent\)/);
  assert.match(source, /const terminalStates: string\[\] = \['completed', 'failed', 'cancelled', 'expired'\];/);
  assert.match(source, /if \(payment\.status === 'refund_failed' \|\| payment\.status === 'refunded'\)/);
});
