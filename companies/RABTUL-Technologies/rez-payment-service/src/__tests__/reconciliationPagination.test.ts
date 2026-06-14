/**
 * TEST SUITE 7: Reconciliation Pagination
 *
 * Verifies that runReconciliation() processes ALL stuck payments via cursor-based
 * pagination (not just the first 50), handles all Razorpay statuses correctly,
 * skips erroring payments gracefully, and recoverStuckPayments works correctly.
 */

jest.setTimeout(10000);

import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePaymentDoc(index: number, overrides: Partial<any> = {}) {
  const _id = new mongoose.Types.ObjectId();
  return {
    _id,
    paymentId: `pay_recon_${index}`,
    orderId: `ord_recon_${index}`,
    user: new mongoose.Types.ObjectId(),
    amount: 100,
    currency: 'INR',
    status: 'processing',
    gatewayResponse: { transactionId: `gw_${index}`, gateway: 'razorpay', timestamp: new Date() },
    updatedAt: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Build 120 payment docs for pagination tests
const TOTAL_PAYMENTS = 120;
const allPayments = Array.from({ length: TOTAL_PAYMENTS }, (_, i) => makePaymentDoc(i));

// Cursor-based find: filter by _id > lastId, sort _id asc, limit 50
function buildMockFind(payments: any[]) {
  return function mockFind(query: Record<string, any>) {
    let results = [...payments];

    if (query._id && query._id.$gt) {
      const pivot = query._id.$gt.toString();
      results = results.filter((p) => p._id.toString() > pivot);
    }

    // Sort ascending by _id string
    results.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));

    return {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockImplementation((n: number) => ({
        lean: jest.fn().mockResolvedValue(results.slice(0, n)),
      })),
    };
  };
}

const mockPayment = {
  find: jest.fn().mockImplementation(buildMockFind(allPayments)),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
};

jest.mock('../models/Payment', () => ({ Payment: mockPayment }));

jest.mock('../models/TransactionAuditLog', () => ({
  PaymentAuditLog: {
    create: jest.fn().mockResolvedValue({}),
  },
  // Back-compat alias retained in model file; keep mock consistent
  TransactionAuditLog: {
    create: jest.fn().mockResolvedValue({}),
  },
}));

const mockGetPaymentDetails = jest.fn().mockResolvedValue({ status: 'captured' });
jest.mock('../services/razorpayService', () => ({
  getPaymentDetails: mockGetPaymentDetails,
}));

jest.mock('../config/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runReconciliation — cursor-based pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPaymentDetails.mockResolvedValue({ status: 'captured' });
    mockPayment.find.mockImplementation(buildMockFind(allPayments));
    mockPayment.updateOne.mockResolvedValue({ modifiedCount: 1 });
    mockPayment.updateMany.mockResolvedValue({ modifiedCount: 0 });
  });

  // 1. 120 stuck payments → ALL 120 are processed (not just 50)
  it('1. processes all 120 stuck payments across multiple pages', async () => {
    const { runReconciliation } = await import('../services/reconciliationService');

    const count = await runReconciliation();

    expect(count).toBe(TOTAL_PAYMENTS);
  });

  // 2. Payment.find is called at least 3 times for 120 payments
  it('2. Payment.find is called at least 3 times (3 pages of 50)', async () => {
    const { runReconciliation } = await import('../services/reconciliationService');

    await runReconciliation();

    // 120 / 50 = 3 full pages + 1 empty to terminate = minimum 3 non-empty calls
    expect(mockPayment.find.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  // 3. Cursor pagination — second call has _id.$gt set
  it('3. uses cursor pagination — subsequent calls include _id.$gt', async () => {
    const { runReconciliation } = await import('../services/reconciliationService');

    await runReconciliation();

    const calls = mockPayment.find.mock.calls;
    expect(calls[0][0]._id).toBeUndefined();
    if (calls.length > 1) {
      expect(calls[1][0]._id?.$gt).toBeDefined();
    }
  });

  // 4. Razorpay returns 'captured' → payment updated to 'completed'
  it('4. Razorpay "captured" → payment updated to "completed"', async () => {
    const singlePayment = makePaymentDoc(1000);
    mockPayment.find
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([singlePayment]) }),
      }))
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }));

    mockGetPaymentDetails.mockResolvedValue({ status: 'captured' });

    const { runReconciliation } = await import('../services/reconciliationService');
    await runReconciliation();

    expect(mockPayment.updateOne).toHaveBeenCalledWith(
      { _id: singlePayment._id, status: 'processing' },
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'completed' }),
      }),
    );
  });

  // 5. Razorpay returns 'failed' → payment updated to 'failed'
  it('5. Razorpay "failed" → payment updated to "failed"', async () => {
    const singlePayment = makePaymentDoc(2000);
    mockPayment.find
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([singlePayment]) }),
      }))
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }));

    mockGetPaymentDetails.mockResolvedValue({ status: 'failed' });

    const { runReconciliation } = await import('../services/reconciliationService');
    await runReconciliation();

    expect(mockPayment.updateOne).toHaveBeenCalledWith(
      { _id: singlePayment._id, status: 'processing' },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'failed',
          failureReason: 'Reconciled from gateway',
        }),
      }),
    );
  });

  // 6. Razorpay returns 'pending' → payment skipped, no update
  it('6. Razorpay "pending" → payment skipped, no update', async () => {
    const singlePayment = makePaymentDoc(3000);
    mockPayment.find
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([singlePayment]) }),
      }))
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }));

    mockGetPaymentDetails.mockResolvedValue({ status: 'pending' });

    const { runReconciliation } = await import('../services/reconciliationService');
    const count = await runReconciliation();

    expect(count).toBe(0);
    expect(mockPayment.updateOne).not.toHaveBeenCalled();
  });

  // 7. Razorpay throws for one payment → that payment skipped, others processed
  it('7. Razorpay error on one payment → that payment skipped, rest processed', async () => {
    const goodPayment1 = makePaymentDoc(4000);
    const errorPayment = makePaymentDoc(4001);
    const goodPayment2 = makePaymentDoc(4002);

    mockPayment.find
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([goodPayment1, errorPayment, goodPayment2]),
        }),
      }))
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }));

    mockGetPaymentDetails
      .mockResolvedValueOnce({ status: 'captured' })
      .mockRejectedValueOnce(new Error('Razorpay API timeout'))
      .mockResolvedValueOnce({ status: 'captured' });

    const { runReconciliation } = await import('../services/reconciliationService');
    const count = await runReconciliation();

    // 2 succeed, 1 errors — error should be swallowed
    expect(count).toBe(2);
    expect(mockPayment.updateOne).toHaveBeenCalledTimes(2);
  });

  // 8. Skips payments without gatewayResponse.transactionId
  it('8. payments without transactionId are skipped (no update)', async () => {
    const noGatewayId = {
      ...makePaymentDoc(5000),
      gatewayResponse: { gateway: 'razorpay', timestamp: new Date() }, // no transactionId
    };

    mockPayment.find
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([noGatewayId]) }),
      }))
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }));

    const { runReconciliation } = await import('../services/reconciliationService');
    const count = await runReconciliation();

    expect(count).toBe(0);
    expect(mockPayment.updateOne).not.toHaveBeenCalled();
  });

  // 9. Returns 0 when no stuck payments
  it('9. returns 0 when no stuck payments found', async () => {
    mockPayment.find.mockImplementationOnce(() => ({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    }));

    const { runReconciliation } = await import('../services/reconciliationService');
    const count = await runReconciliation();

    expect(count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// recoverStuckPayments tests
// ---------------------------------------------------------------------------

describe('recoverStuckPayments — expire pending payments >1 hour old', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPayment.updateMany.mockResolvedValue({ modifiedCount: 0 });
  });

  // 10. recoverStuckPayments expires pending payments older than 1 hour
  it('10. expires all pending payments older than 1 hour', async () => {
    mockPayment.updateMany.mockResolvedValue({ modifiedCount: 5 });

    const { recoverStuckPayments } = await import('../services/reconciliationService');
    const count = await recoverStuckPayments();

    expect(count).toBe(5);
    expect(mockPayment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' }),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'expired' }) }),
    );
  });

  // 11. recoverStuckPayments uses 1-hour cutoff
  it('11. recoverStuckPayments uses createdAt < 1 hour ago as filter', async () => {
    const { recoverStuckPayments } = await import('../services/reconciliationService');
    await recoverStuckPayments();

    const filterArg = mockPayment.updateMany.mock.calls[0][0];
    expect(filterArg.status).toBe('pending');
    expect(filterArg.createdAt.$lt).toBeDefined();

    const cutoffTime = filterArg.createdAt.$lt.getTime();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    // cutoff should be approximately 1 hour ago (allow 5s tolerance)
    expect(Math.abs(cutoffTime - oneHourAgo)).toBeLessThan(5000);
  });

  // 12. Returns 0 when no pending payments to expire
  it('12. returns 0 when no pending payments need expiring', async () => {
    mockPayment.updateMany.mockResolvedValue({ modifiedCount: 0 });

    const { recoverStuckPayments } = await import('../services/reconciliationService');
    const count = await recoverStuckPayments();

    expect(count).toBe(0);
  });
});
