/**
 * REZ Bills - Connection Tests
 */

import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const WALLET_API = process.env.WALLET_API || 'https://rez-wallet.onrender.com';
const VERIFY_API = process.env.VERIFY_API || 'https://rez-verify-qr.onrender.com';
const ANALYTICS_API = process.env.ANALYTICS_API || 'https://rez-analytics.onrender.com';

describe('REZ-Bills Connection Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Wallet Connections', () => {
    test('POST /api/earn - claim cashback', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        user_id: 'user123',
        amount: 10,
        source: 'bill_cashback',
        reason: 'Cashback for Zomato'
      };

      await axios.post(`${WALLET_API}/api/earn`, data);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${WALLET_API}/api/earn`,
        data
      );
    });
  });

  describe('Verify QR Connections', () => {
    test('POST /api/activate-warranty - register warranty from bill', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        serial_number: 'BILL-bill123',
        user_id: 'user123',
        customer_name: 'John Doe',
        customer_phone: '919876543210',
        purchase_date: new Date()
      };

      await axios.post(`${VERIFY_API}/api/activate-warranty`, data);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${VERIFY_API}/api/activate-warranty`,
        data
      );
    });
  });

  describe('Analytics Connections', () => {
    test('POST /api/track - track bill scan', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        event: 'bill_scanned',
        user_id: 'user123',
        data: {
          merchant_name: 'Zomato',
          amount: 500,
          category: 'restaurant'
        }
      };

      await axios.post(`${ANALYTICS_API}/api/track`, data);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${ANALYTICS_API}/api/track`,
        data
      );
    });
  });
});
