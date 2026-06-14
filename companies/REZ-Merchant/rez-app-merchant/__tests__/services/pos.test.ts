jest.mock('../../services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock('../../services/storage', () => ({
  storageService: { getAuthToken: jest.fn().mockResolvedValue('test-token') },
  COOKIE_AUTH_ENABLED: false,
}));
jest.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-1234',
  getRandomValues: (arr: Uint8Array) => arr,
}));

import { apiClient } from '../../services/api/client';
const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;

let posService: any;
let generateUPILink: any;
beforeAll(async () => {
  const mod = require('../../services/api/pos');
  posService = mod.posService;
  generateUPILink = mod.generateUPILink;
});

describe('POSService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createBill sends bill data', async () => {
    mockPost.mockResolvedValue({ success: true, data: { _id: 'b1', total: 300, billId: 'b1' } });
    // createBill takes positional args: items, customerPhone, storeId, discount, discountPercent, splitCount, tableNumber, lineItems, coinRedemption, clientTxnId
    const result = await posService.createBill([{ name: 'Coffee', price: 150, quantity: 2 }]);
    expect(mockPost).toHaveBeenCalled();
  });

  it('quickBill creates with amount only', async () => {
    mockPost.mockResolvedValue({ success: true, data: { _id: 'b2', total: 300 } });
    const result = await posService.quickBill(300, 'Quick sale');
    expect(mockPost).toHaveBeenCalled();
  });

  it('checkPaymentStatus returns status', async () => {
    mockGet.mockResolvedValue({ success: true, data: { billId: 'b1', status: 'paid' } });
    const result = await posService.checkPaymentStatus('b1');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('b1'));
  });

  it('markAsPaid marks bill as paid', async () => {
    mockPost.mockResolvedValue({ success: true, data: { billId: 'b1', status: 'paid' } });
    const result = await posService.markAsPaid('b1', 'cash');
    expect(mockPost).toHaveBeenCalled();
  });

  it('getRecentBills returns paginated list', async () => {
    mockGet.mockResolvedValue({ success: true, data: { bills: [{ _id: 'b1' }], total: 1 } });
    const result = await posService.getRecentBills(1, 's1');
    expect(mockGet).toHaveBeenCalled();
  });

  it('refundBill processes refund', async () => {
    mockPost.mockResolvedValue({ success: true, data: { _id: 'b1', status: 'refunded' } });
    const result = await posService.refundBill('b1', 'Customer request', 200);
    expect(mockPost).toHaveBeenCalled();
  });

  it('cancelBill cancels bill', async () => {
    mockPost.mockResolvedValue({ success: true });
    await posService.cancelBill('b1');
    expect(mockPost).toHaveBeenCalled();
  });
});

describe('generateUPILink', () => {
  it('generates valid UPI deep link', async () => {
    mockPost.mockResolvedValue({ success: true, data: { transactionRef: 'TEST-REF-123' } });
    const link = await generateUPILink({
      vpa: 'store@upi',
      payeeName: 'Test Store',
      amount: 500,
      note: 'REZ-001',
    });
    expect(link).toContain('upi://pay');
    expect(link).toContain('pa=store%40upi');
    expect(link).toContain('am=500.00');
    expect(link).toContain('tr=TEST-REF-123');
  });
});
