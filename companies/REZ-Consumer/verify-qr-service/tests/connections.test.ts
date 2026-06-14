/**
 * REZ Verify QR - Connection Tests
 * Tests all external service integrations
 */

import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Service URLs (from environment)
const MERCHANT_API = process.env.MERCHANT_API || 'https://rez-merchant.onrender.com';
const WALLET_API = process.env.WALLET_API || 'https://rez-wallet.onrender.com';
const AGENT_API = process.env.AGENT_API || 'https://REZ-agent.onrender.com';
const INTELLIGENCE_API = process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com';

describe('verify-qr-service Connection Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('REZ-Merchant Connections', () => {
    test('GET /api/products/serial/:serial - fetch product', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          serial_number: 'TEST123',
          brand: 'TestBrand',
          model: 'TestModel',
          warranty_months: 12
        }
      });

      const response = await axios.get(`${MERCHANT_API}/api/products/serial/TEST123`);

      expect(response.data.serial_number).toBe('TEST123');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${MERCHANT_API}/api/products/serial/TEST123`,
        expect.any(Object)
      );
    });

    test('POST /api/customers/link-warranty - link warranty', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        user_id: 'user123',
        warranty_id: 'warranty456',
        serial_number: 'TEST123',
        activated_at: new Date()
      };

      await axios.post(`${MERCHANT_API}/api/customers/link-warranty`, data);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${MERCHANT_API}/api/customers/link-warranty`,
        data,
        expect.any(Object)
      );
    });

    test('POST /api/warranty/activated - notify activation', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        serial_number: 'TEST123',
        merchant_id: 'merchant123',
        user_id: 'user123',
        activated_at: new Date(),
        warranty_expiry: new Date()
      };

      await axios.post(`${MERCHANT_API}/api/warranty/activated`, data);

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    test('POST /api/warranty/claim-filed - notify claim', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        warranty_id: 'warranty123',
        serial_number: 'TEST123',
        claim_type: 'defective'
      };

      await axios.post(`${MERCHANT_API}/api/warranty/claim-filed`, data);

      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('REZ-Wallet Connections', () => {
    test('POST /api/earn - add cashback', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        user_id: 'user123',
        amount: 25,
        source: 'warranty_activation',
        reason: 'Warranty activated'
      };

      await axios.post(`${WALLET_API}/api/earn`, data);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${WALLET_API}/api/earn`,
        data
      );
    });
  });

  describe('REZ-Agent Connections', () => {
    test('POST /agent/whatsapp/send - send WhatsApp', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        phone: '919876543210',
        template: 'warranty_activated',
        params: {
          brand: 'TestBrand',
          serial: 'TEST123',
          expiry: '2027-05-12'
        },
        user_id: 'user123'
      };

      await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, data);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${AGENT_API}/api/agent/whatsapp/send`,
        data
      );
    });

    test('POST /agent/workflow/trigger - trigger workflow', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        trigger: 'claim_filed',
        user_id: 'user123',
        data: { claim_id: 'claim123' },
        workflow: { steps: [] }
      };

      await axios.post(`${AGENT_API}/api/agent/workflow/trigger`, data);

      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('REZ-Intelligence Connections', () => {
    test('POST /intent/track - track scan intent', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        user_id: 'user123',
        intent_type: 'warranty_verification',
        entities: {
          product: 'TEST123',
          brand: 'TestBrand'
        },
        action: 'scan'
      };

      await axios.post(`${INTELLIGENCE_API}/api/intent/track`, data);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${INTELLIGENCE_API}/api/intent/track`,
        data
      );
    });

    test('POST /fraud/verify-qr - ML fraud check', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { fraud_score: 0.2 }
      });

      const data = {
        serial_number: 'TEST123',
        user_id: 'user123',
        device_fingerprint: 'device123',
        activation_count: 5
      };

      await axios.post(`${INTELLIGENCE_API}/api/fraud/verify-qr`, data);

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    test('POST /attribution/track - track conversion', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const data = {
        event_type: 'verify_qr_activate',
        user_id: 'user123',
        entities: { product: { id: 'TEST123', brand: 'TestBrand' } },
        value: 1000
      };

      await axios.post(`${INTELLIGENCE_API}/api/attribution/track`, data);

      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });
});
