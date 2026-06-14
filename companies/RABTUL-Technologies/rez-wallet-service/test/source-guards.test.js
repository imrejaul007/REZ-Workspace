const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readSource(...segments) {
  return fs.readFileSync(path.join(__dirname, '..', ...segments), 'utf8');
}

test('wallet internal auth fails closed when INTERNAL_SERVICE_TOKENS_JSON is missing', () => {
  const source = readSource('src', 'middleware', 'internalAuth.ts');

  assert.match(source, /if \(!scopedTokens && !legacyToken\) \{/);
  assert.match(source, /req\.headers\['x-internal-service'\] as string \| undefined/);
  assert.match(source, /INTERNAL_SERVICE_TOKENS_JSON/);
  assert.match(source, /res\.status\(503\)\.json\(\{ success: false, error: 'Internal auth not configured — set INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN' \}\);/);
  assert.match(source, /crypto\.timingSafeEqual/);
});

test('wallet creditCoins and debitCoins perform idempotency checks inside transactions', () => {
  const source = readSource('src', 'services', 'walletService.ts');

  assert.match(source, /const session = await mongoose\.startSession\(\);/);
  assert.match(source, /session\.startTransaction\(\);/);
  assert.match(source, /if \(opts\?\.idempotencyKey\) \{/);
  assert.match(source, /await CoinTransaction\.findOne\(\s*\{ idempotencyKey: opts\.idempotencyKey \}/s);
  assert.match(source, /await session\.abortTransaction\(\);\s*return \{ balance: existing\.balanceAfter, transactionId: existing\._id\.toString\(\) \};/s);
});

test('wallet debit path enforces frozen-wallet and insufficient-balance safeguards', () => {
  const source = readSource('src', 'services', 'walletService.ts');

  assert.match(source, /'balance\.available': \{ \$gte: amount \}/);
  assert.match(source, /isFrozen: \{ \$ne: true \}/);
  assert.match(source, /if \(walletForLimit\.isFrozen\) throw new Error\('Wallet is frozen'\);/);
  assert.match(source, /throw new Error\('Insufficient balance'\);/);
});
