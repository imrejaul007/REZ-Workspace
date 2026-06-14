import request from 'supertest';

// Mock dependencies
jest.mock('../src/services/order.service');
jest.mock('../src/services/inventory.service');

describe('Order API', () => {
  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('POST /orders creates order', async () => {
    const order = {
      userId: 'user_123',
      items: [{ productId: 'prod_1', quantity: 2 }]
    };
    const res = await request(app).post('/orders').send(order);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('orderId');
  });

  test('GET /orders/:id returns order', async () => {
    const res = await request(app).get('/orders/ord_123');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });
});

describe('Order Lifecycle', () => {
  test('created → pending_payment', async () => {
    const order = await createOrder({ items: [] });
    expect(order.status).toBe('pending_payment');
  });

  test('payment webhook → paid', async () => {
    await webhook({ event: 'payment.captured' });
    const order = await getOrder();
    expect(order.status).toBe('paid');
  });
});
