import test from 'node:test';
import assert from 'node:assert/strict';
import mpesaStkpushHandler from '../api/mpesa/stkpush.js';
import orderStatusHandler from '../api/order/status.js';

function createMockRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    },
  };
}

test('mpesa stkpush rejects unsupported methods', async () => {
  const req = { method: 'GET' };
  const res = createMockRes();
  await mpesaStkpushHandler(req, res);
  assert.equal(res.statusCode, 405);
});

test('mpesa stkpush validates body fields', async () => {
  const req = { method: 'POST', body: { phone: '123', amount: 0, orderId: 'bad-id' } };
  const res = createMockRes();
  await mpesaStkpushHandler(req, res);
  assert.equal(res.statusCode, 400);
});

test('order status endpoint rejects invalid webhook payload', async () => {
  const req = { method: 'POST', body: { order_id: 'invalid', status: 'paid' }, headers: {} };
  const res = createMockRes();
  await orderStatusHandler(req, res);
  assert.equal(res.statusCode, 400);
});
