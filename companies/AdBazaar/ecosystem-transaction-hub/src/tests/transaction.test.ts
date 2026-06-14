import { Transaction } from '../models';
import { transactionService } from '../services/transaction';
import { redisService } from '../services/redis';

// Mock dependencies
jest.mock('../models', () => ({
  Transaction: {
    findByTransactionId: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

jest.mock('../services/redis', () => ({
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    publish: jest.fn(),
  },
}));

jest.mock('../services/rabtul', () => ({
  rabtulService: {
    deductFromWallet: jest.fn(),
    refundToWallet: jest.fn(),
  },
}));

jest.mock('../middleware/metrics', () => ({
  transactionsTotal: { inc: jest.fn() },
  transactionsAmount: { observe: jest.fn() },
  activeTransactions: { inc: jest.fn(), dec: jest.fn() },
  paymentProcessingDuration: { observe: jest.fn() },
}));

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateTransaction', () => {
    it('should create a new transaction with valid data', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockToJSON = jest.fn().mockReturnValue({
        transactionId: 'TXN-123',
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        type: 'order',
        amount: 100,
        currency: 'INR',
        status: 'initiated',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockTransaction = {
        save: mockSave,
        toJSON: mockToJSON,
      };

      (Transaction as any).mockImplementation(() => mockTransaction);

      const request = {
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        type: 'order' as const,
        amount: 100,
      };

      const result = await transactionService.initiateTransaction(request);

      expect(result).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should reject amount below minimum', async () => {
      const request = {
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        type: 'order' as const,
        amount: 0.5, // Below minimum of 1
      };

      await expect(transactionService.initiateTransaction(request)).rejects.toThrow();
    });

    it('should reject amount above maximum', async () => {
      const request = {
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        type: 'order' as const,
        amount: 2000000, // Above maximum of 1,000,000
      };

      await expect(transactionService.initiateTransaction(request)).rejects.toThrow();
    });
  });

  describe('getTransaction', () => {
    it('should return cached transaction if available', async () => {
      const cachedTransaction = {
        transactionId: 'TXN-123',
        adId: 'ad-123',
        status: 'initiated',
      };

      (redisService.get as jest.Mock).mockResolvedValue(cachedTransaction);

      const result = await transactionService.getTransaction('TXN-123');

      expect(result).toEqual(cachedTransaction);
      expect(Transaction.findByTransactionId).not.toHaveBeenCalled();
    });

    it('should fetch from database if not in cache', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);

      const dbTransaction = {
        toJSON: jest.fn().mockReturnValue({
          transactionId: 'TXN-123',
          adId: 'ad-123',
          status: 'initiated',
        }),
      };

      (Transaction.findByTransactionId as jest.Mock).mockResolvedValue(dbTransaction);

      const result = await transactionService.getTransaction('TXN-123');

      expect(result).toBeDefined();
      expect(Transaction.findByTransactionId).toHaveBeenCalledWith('TXN-123');
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should return null if transaction not found', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (Transaction.findByTransactionId as jest.Mock).mockResolvedValue(null);

      const result = await transactionService.getTransaction('TXN-NOTFOUND');

      expect(result).toBeNull();
    });
  });

  describe('confirmTransaction', () => {
    it('should throw error if transaction not found', async () => {
      (Transaction.findByTransactionId as jest.Mock).mockResolvedValue(null);

      await expect(
        transactionService.confirmTransaction('TXN-NOTFOUND', 'PAY-123')
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw error for invalid status transition', async () => {
      const mockTransaction = {
        transactionId: 'TXN-123',
        status: 'completed',
        toJSON: jest.fn(),
      };

      (Transaction.findByTransactionId as jest.Mock).mockResolvedValue(mockTransaction);

      await expect(
        transactionService.confirmTransaction('TXN-123', 'PAY-123')
      ).rejects.toThrow();
    });
  });

  describe('cancelTransaction', () => {
    it('should throw error if transaction not found', async () => {
      (Transaction.findByTransactionId as jest.Mock).mockResolvedValue(null);

      await expect(
        transactionService.cancelTransaction('TXN-NOTFOUND')
      ).rejects.toThrow('Transaction not found');
    });

    it('should refund wallet if transaction was completed with wallet', async () => {
      const mockTransaction = {
        transactionId: 'TXN-123',
        status: 'completed',
        paymentMethod: 'wallet',
        userId: 'user-123',
        amount: 100,
        type: 'order',
        metadata: {},
        save: jest.fn().mockResolvedValue(undefined),
        toJSON: jest.fn().mockReturnValue({
          transactionId: 'TXN-123',
          status: 'cancelled',
        }),
      };

      (Transaction.findByTransactionId as jest.Mock).mockResolvedValue(mockTransaction);
      (redisService.publish as jest.Mock).mockResolvedValue(true);

      const result = await transactionService.cancelTransaction('TXN-123', 'Customer request');

      expect(result.status).toBe('cancelled');
      expect(mockTransaction.metadata.cancellationReason).toBe('Customer request');
    });
  });

  describe('refundTransaction', () => {
    it('should throw error if transaction not found', async () => {
      (Transaction.findByTransactionId as jest.Mock).mockResolvedValue(null);

      await expect(
        transactionService.refundTransaction('TXN-NOTFOUND')
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw error if transaction is not completed', async () => {
      const mockTransaction = {
        transactionId: 'TXN-123',
        status: 'initiated',
      };

      (Transaction.findByTransactionId as jest.Mock).mockResolvedValue(mockTransaction);

      await expect(
        transactionService.refundTransaction('TXN-123')
      ).rejects.toThrow('Cannot refund transaction with status: initiated');
    });
  });

  describe('getUserTransactions', () => {
    it('should return paginated user transactions', async () => {
      const mockTransactions = [
        {
          toJSON: jest.fn().mockReturnValue({ transactionId: 'TXN-1' }),
        },
        {
          toJSON: jest.fn().mockReturnValue({ transactionId: 'TXN-2' }),
        },
      ];

      (Transaction.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      });

      (Transaction.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await transactionService.getUserTransactions('user-123', {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('getAdTransactions', () => {
    it('should return paginated ad transactions', async () => {
      const mockTransactions = [
        {
          toJSON: jest.fn().mockReturnValue({ transactionId: 'TXN-1', adId: 'ad-123' }),
        },
      ];

      (Transaction.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      });

      (Transaction.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await transactionService.getAdTransactions('ad-123', {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});