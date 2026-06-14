const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readSource() {
  return fs.readFileSync(path.join(__dirname, '..', 'src', 'httpServer.ts'), 'utf8');
}

test('order service defines the expected forward transition guards', () => {
  const source = readSource();

  assert.match(source, /const VALID_TRANSITIONS: Record<OrderStatus, readonly OrderStatus\[]> = \{/);
  assert.match(source, /placed:\s+\['confirmed', 'cancelled', 'cancelling'\]/);
  assert.match(source, /confirmed:\s+\['preparing', 'cancelled', 'cancelling'\]/);
  assert.match(source, /preparing:\s+\['ready', 'cancelled', 'cancelling'\]/);
  assert.match(source, /ready:\s+\['dispatched', 'cancelled', 'cancelling'\]/);
  assert.match(source, /out_for_delivery:\s+\['delivered', 'cancelled'\]/);
});

test('order status update path returns 422 for invalid transitions and 409 for concurrent conflicts', () => {
  const source = readSource();

  assert.match(source, /return res\.status\(422\)\.json\(\{/);
  assert.match(source, /allowedTransitions: allowed/);
  assert.match(source, /return res\.status\(409\)\.json\(\{/);
  assert.match(source, /Concurrent update conflict/);
  assert.match(source, /findOneAndUpdate\(\s*\{ _id: new mongoose\.Types\.ObjectId\(id\), status: currentStatus \}/s);
});

test('order cancel path only allows cancellable statuses and also uses concurrency guards', () => {
  const source = readSource();

  assert.match(source, /const cancellableStatuses: OrderStatus\[] = \['placed', 'confirmed', 'preparing', 'ready'\];/);
  assert.match(source, /Order in '\$\{currentStatus\}' state cannot be cancelled/);
  assert.match(source, /findOneAndUpdate\(\s*\{ _id: new mongoose\.Types\.ObjectId\(id\), status: currentStatus \}/s);
});
