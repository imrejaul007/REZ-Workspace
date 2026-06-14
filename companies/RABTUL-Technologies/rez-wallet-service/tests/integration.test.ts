/**
 * RABTUL-Technologies - Integration Tests
 * Tests all infrastructure services
 */

import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Service URLs
const AUTH_API = process.env.AUTH_API || 'https://rez-auth.onrender.com';
const WALLET_API = process.env.WALLET_API || 'https://rez-wallet.onrender.com';
const PAYMENT_API = process.env.PAYMENT_API || 'https://rez-payment.onrender.com';
const NOTIF_API = process.env.NOTIF_API || 'https://rez-notifications.onrender.com';

describe('RABTUL-Technologies Integration Tests', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // ========== AUTH SERVICE ==========
  describe('rez-auth-service', () => {
    test('POST /api/auth/register - User registration', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { user_id: 'user123', token: 'jwt_token' } });
      const res = await axios.post(`${AUTH_API}/api/auth/register`, {
        phone: '919876543210',
        name: 'Test User'
      });
      expect(res.data.user_id).toBe('user123');
    });

    test('POST /api/auth/login - User login', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { token: 'jwt_token', refreshToken: 'refresh' } });
      const res = await axios.post(`${AUTH_API}/api/auth/login`, {
        phone: '919876543210',
        otp: '123456'
      });
      expect(res.data.token).toBeDefined();
    });

    test('POST /api/auth/verify - Token verification', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { valid: true, user_id: 'user123' } });
      const res = await axios.post(`${AUTH_API}/api/auth/verify`, {
        token: 'jwt_token'
      });
      expect(res.data.valid).toBe(true);
    });
  });

  // ========== WALLET SERVICE ==========
  describe('rez-wallet-service', () => {
    test('POST /api/wallet/create - Create wallet', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { wallet_id: 'wallet123', balance: 0 } });
      const res = await axios.post(`${WALLET_API}/api/wallet/create`, { user_id: 'user123' });
      expect(res.data.wallet_id).toBe('wallet123');
    });

    test('GET /api/wallet/:userId - Get wallet', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { balance: 1000, currency: 'INR' } });
      const res = await axios.get(`${WALLET_API}/api/wallet/user123`);
      expect(res.data.balance).toBe(1000);
    });

    test('POST /api/wallet/add - Add funds', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true, new_balance: 1500 } });
      const res = await axios.post(`${WALLET_API}/api/wallet/add`, {
        user_id: 'user123', amount: 500
      });
      expect(res.data.new_balance).toBe(1500);
    });

    test('POST /api/wallet/earn - External earn (from other services)', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });
      const res = await axios.post(`${WALLET_API}/api/wallet/earn`, {
        user_id: 'user123',
        amount: 100,
        source: 'referral',
        reason: 'Referral bonus'
      });
      expect(res.data.success).toBe(true);
    });

    test('POST /api/wallet/transfer - Transfer funds', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });
      const res = await axios.post(`${WALLET_API}/api/wallet/transfer`, {
        from_user_id: 'user123',
        to_user_id: 'user456',
        amount: 100
      });
      expect(res.data.success).toBe(true);
    });

    test('GET /api/wallet/:userId/transactions - Transaction history', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { transactions: [{ id: 'tx1', amount: 100 }, { id: 'tx2', amount: 200 }] }
      });
      const res = await axios.get(`${WALLET_API}/api/wallet/user123/transactions`);
      expect(res.data.transactions.length).toBe(2);
    });
  });

  // ========== PAYMENT SERVICE ==========
  describe('rez-payment-service', () => {
    test('POST /api/payments/create - Create payment', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { payment_id: 'pay123', amount: 500 } });
      const res = await axios.post(`${PAYMENT_API}/api/payments/create`, {
        user_id: 'user123',
        amount: 500,
        method: 'upi'
      });
      expect(res.data.payment_id).toBe('pay123');
    });

    test('POST /api/payments/verify - Verify payment', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { status: 'success' } });
      const res = await axios.post(`${PAYMENT_API}/api/payments/verify`, {
        payment_id: 'pay123'
      });
      expect(res.data.status).toBe('success');
    });

    test('POST /api/payments/refund - Process refund', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { refund_id: 'ref123' } });
      const res = await axios.post(`${PAYMENT_API}/api/payments/refund`, {
        payment_id: 'pay123',
        amount: 500
      });
      expect(res.data.refund_id).toBe('ref123');
    });
  });

  // ========== NOTIFICATIONS SERVICE ==========
  describe('rez-notifications-service', () => {
    test('POST /api/notifications/send - Send notification', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { notification_id: 'notif123' } });
      const res = await axios.post(`${NOTIF_API}/api/notifications/send`, {
        user_id: 'user123',
        title: 'Test',
        body: 'Test notification',
        channel: 'push'
      });
      expect(res.data.notification_id).toBe('notif123');
    });

    test('POST /api/notifications/bulk - Bulk send', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { sent: 100, failed: 2 } });
      const res = await axios.post(`${NOTIF_API}/api/notifications/bulk`, {
        user_ids: ['user1', 'user2'],
        title: 'Bulk test',
        body: 'Testing bulk'
      });
      expect(res.data.sent).toBe(100);
    });

    test('GET /api/notifications/:userId - User notifications', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { notifications: [{ id: 'n1' }, { id: 'n2' }] }
      });
      const res = await axios.get(`${NOTIF_API}/api/notifications/user123`);
      expect(res.data.notifications.length).toBe(2);
    });
  });
});
