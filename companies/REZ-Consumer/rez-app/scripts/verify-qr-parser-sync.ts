import logger from './utils/logger';

/**
 * QR Parser Sync Verification
 *
 * Run with: npx ts-node scripts/verify-qr-parser-sync.ts
 *
 * Verifies that the consumer's hand-rolled qrPayload.ts produces the
 * same results as the backend's canonical parseQrPayload for a shared
 * set of test vectors. If results diverge, the implementations have
 * drifted and must be re-aligned before shipping.
 *
 * This script lives in the consumer repo. The companion script
 * (backend/scripts/verify-qr-parser-sync.ts) runs the same vectors
 * against the backend parser. Both must pass for the pair to be
 * considered in sync.
 */

import type { ParseResult } from '../utils/qr/qrPayload';
import * as path from 'path';

const BACKEND_REPO = path.resolve(__dirname, '../../rezbackend/rez-backend-master');

interface TestVector {
  description: string;
  raw: string;
  expected: {
    ok: boolean;
    intent?: string;
    reason?: string;
    issues?: string[];
  };
}

const VECTORS: TestVector[] = [
  // Store-visit
  {
    description: 'store-visit: minimal valid',
    raw: '{"intent":"store-visit","storeId":"store123","v":1}',
    expected: { ok: true, intent: 'store-visit' },
  },
  {
    description: 'store-visit: with slug',
    raw: '{"intent":"store-visit","storeId":"store456","storeSlug":"cafe-mumbai","v":1}',
    expected: { ok: true, intent: 'store-visit' },
  },
  // Pay-bill
  {
    description: 'pay-bill: full fields',
    raw: '{"intent":"pay-bill","storeId":"store789","billId":"bill001","amount":250,"v":1}',
    expected: { ok: true, intent: 'pay-bill' },
  },
  {
    description: 'pay-bill: amount=0 (valid)',
    raw: '{"intent":"pay-bill","storeId":"store789","amount":0,"v":1}',
    expected: { ok: true, intent: 'pay-bill' },
  },
  // Redeem-deal
  {
    description: 'redeem-deal: valid',
    raw: '{"intent":"redeem-deal","dealId":"deal001","v":1}',
    expected: { ok: true, intent: 'redeem-deal' },
  },
  // Optional field edge cases (Hard Risk #2: align consumer parser with Zod)
  {
    description: 'store-visit: optional storeSlug as empty string (reject)',
    raw: '{"intent":"store-visit","storeId":"store123","storeSlug":"","v":1}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'pay-bill: optional billId as empty string (reject)',
    raw: '{"intent":"pay-bill","storeId":"store789","billId":"","v":1}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'redeem-deal: optional storeId as empty string (reject)',
    raw: '{"intent":"redeem-deal","dealId":"deal001","storeId":"","v":1}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  // Redeem-voucher
  {
    description: 'redeem-voucher: valid',
    raw: '{"intent":"redeem-voucher","voucherId":"ABC123","v":1}',
    expected: { ok: true, intent: 'redeem-voucher' },
  },
  // Claim-stamp
  {
    description: 'claim-stamp: valid',
    raw: '{"intent":"claim-stamp","storeId":"store123","stampCardId":"sc001","v":1}',
    expected: { ok: true, intent: 'claim-stamp' },
  },
  // Event-checkin
  {
    description: 'event-checkin: valid',
    raw: '{"intent":"event-checkin","eventId":"evt001","v":1}',
    expected: { ok: true, intent: 'event-checkin' },
  },
  // Referral
  {
    description: 'referral: valid',
    raw: '{"intent":"referral","referralCode":"REF123","v":1}',
    expected: { ok: true, intent: 'referral' },
  },
  // Wallet-transfer
  {
    description: 'wallet-transfer: valid',
    raw: '{"intent":"wallet-transfer","toUserId":"user456","v":1}',
    expected: { ok: true, intent: 'wallet-transfer' },
  },
  // Short URL resolution marker
  {
    description: 'short-url marker (test harness artifact — resolves to not-json)',
    raw: '__SHORT_URL__',
    expected: { ok: false, reason: 'not-json' },
  },
  // Errors
  {
    description: 'empty string',
    raw: '',
    expected: { ok: false, reason: 'empty' },
  },
  {
    description: 'whitespace only',
    raw: '   ',
    expected: { ok: false, reason: 'empty' },
  },
  {
    description: 'not JSON',
    raw: 'not-a-json-string',
    expected: { ok: false, reason: 'not-json' },
  },
  {
    description: 'empty JSON object',
    raw: '{}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'missing intent field',
    raw: '{"storeId":"store123","v":1}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'unknown intent',
    raw: '{"intent":"unknown-intent","storeId":"store123","v":1}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'empty storeId',
    raw: '{"intent":"store-visit","storeId":"","v":1}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'storeId with whitespace only',
    raw: '{"intent":"store-visit","storeId":"   ","v":1}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'negative amount (reject)',
    raw: '{"intent":"pay-bill","storeId":"store123","amount":-50,"v":1}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'amount with whitespace (reject)',
    raw: '{"intent":"pay-bill","storeId":"store123","amount":"100","v":1}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'v:2 (unsupported version → distinct error)',
    raw: '{"intent":"store-visit","storeId":"store123","v":2}',
    expected: { ok: false, reason: 'unsupported-version' },
  },
  {
    description: 'v:0 (invalid version)',
    raw: '{"intent":"store-visit","storeId":"store123","v":0}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'missing v field',
    raw: '{"intent":"store-visit","storeId":"store123"}',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'null payload',
    raw: 'null',
    expected: { ok: false, reason: 'invalid-schema' },
  },
  {
    description: 'array payload',
    raw: '[]',
    expected: { ok: false, reason: 'invalid-schema' },
  },
];

async function main() {
  // Dynamically import the consumer parser
  const { parseQrPayload } = await import('../utils/qr/qrPayload');

  let passed = 0;
  let failed = 0;

  for (const vector of VECTORS) {
    const result = parseQrPayload(vector.raw) as ParseResult;
    // intent lives on payload, not at the top level of the result.
    const resultIntent = result.ok && 'intent' in (result.payload as Record<string, unknown>)
      ? String((result.payload as Record<string, unknown>).intent)
      : result.ok ? 'SHORT_URL' : (result as { reason: string }).reason;
    const expectedIntent = vector.expected.ok ? String(vector.expected.intent) : vector.expected.reason;

    if (result.ok === vector.expected.ok && resultIntent === expectedIntent) {
      logger.info(`  PASS  ${vector.description}`);
      passed++;
    } else {
      logger.info(`  FAIL  ${vector.description}`);
      logger.info(`         Consumer:  ok=${result.ok} ${result.ok ? 'intent=' + resultIntent : 'reason=' + (result as { reason: string }).reason}`);
      logger.info(`         Expected: ok=${vector.expected.ok} ${vector.expected.ok ? 'intent=' + vector.expected.intent : 'reason=' + vector.expected.reason}`);
      failed++;
    }
  }

  logger.info(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    logger.error('ERROR: Consumer QR parser has drifted from backend canonical implementation.');
    logger.error('Fix utils/qr/qrPayload.ts to match the expected outputs above.');
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error('Script error:', err);
  process.exit(1);
});
