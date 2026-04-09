import test from 'node:test';
import assert from 'node:assert/strict';
import { isUuidV4, normalizeKePhone, parsePositiveAmount, parseIsoTimestamp } from '../api/middleware/validation.js';
import { mapSystemBStatus } from '../api/order/status.js';

test('normalizes Kenyan phone numbers to 254 format', () => {
  assert.equal(normalizeKePhone('0712345678'), '254712345678');
  assert.equal(normalizeKePhone('254712345678'), '254712345678');
  assert.equal(normalizeKePhone('abc'), null);
});

test('validates positive amounts and timestamps', () => {
  assert.equal(parsePositiveAmount(100.2), 101);
  assert.equal(parsePositiveAmount(0), null);
  assert.equal(Boolean(parseIsoTimestamp('2026-04-09T19:05:51.067Z')), true);
  assert.equal(parseIsoTimestamp('bad-date'), null);
});

test('maps system B order statuses deterministically', () => {
  assert.equal(mapSystemBStatus('paid'), 'paid');
  assert.equal(mapSystemBStatus('delivered'), 'completed');
  assert.equal(mapSystemBStatus('unknown'), 'pending');
});

test('validates UUIDv4 order IDs', () => {
  assert.equal(isUuidV4('550e8400-e29b-41d4-a716-446655440000'), true);
  assert.equal(isUuidV4('550e8400-e29b-11d4-a716-446655440000'), false);
});
