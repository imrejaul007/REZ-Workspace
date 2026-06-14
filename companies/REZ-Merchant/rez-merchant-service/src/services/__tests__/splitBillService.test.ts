/**
 * Unit tests for SplitBillService
 */

import { SplitBillService, SplitInput } from '../splitBillService';
import { SplitMethod } from '../../models/SplitBill';

// Mock mongoose Types
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation((id: string) => id),
  },
}));

// Create mock functions
const mockSplitBillFindOne = jest.fn();
const mockSplitBillFindById = jest.fn();
const mockSplitBillFindByUserId = jest.fn();
const mockSplitBillFindPendingByUserId = jest.fn();
const mockSplitBillDeleteOne = jest.fn();
const mockSplitBillCreate = jest.fn();

// Mock the dependencies
jest.mock('../../models/SplitBill', () => ({
  SplitBill: {
    findOne: (...args: any[]) => mockSplitBillFindOne(...args),
    findById: (...args: any[]) => mockSplitBillFindById(...args),
    findByUserId: (...args: any[]) => mockSplitBillFindByUserId(...args),
    findPendingByUserId: (...args: any[]) => mockSplitBillFindPendingByUserId(...args),
    deleteOne: (...args: any[]) => mockSplitBillDeleteOne(...args),
    create: (...args: any[]) => mockSplitBillCreate(...args),
  },
}));

const mockOrderFindById = jest.fn();

jest.mock('../../models/Order', () => ({
  Order: {
    findById: (...args: any[]) => mockOrderFindById(...args),
  },
}));

jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('SplitBillService', () => {
  let service: SplitBillService;

  beforeEach(() => {
    service = new SplitBillService();
    jest.clearAllMocks();
  });

  describe('calculateFairSplit', () => {
    it('should calculate fair split equally among people', () => {
      const result = service.calculateFairSplit(100, 3);

      expect(result.perPerson).toBe(33);
      expect(result.remainder).toBe(1);
      expect(result.splits.length).toBe(3);
      expect(result.splits.reduce((sum, s) => sum + s.amount, 0)).toBe(100);
    });

    it('should distribute remainder to first N people', () => {
      const result = service.calculateFairSplit(10, 4);

      expect(result.perPerson).toBe(2);
      expect(result.remainder).toBe(2);
      expect(result.splits[0].amount).toBe(3);
      expect(result.splits[1].amount).toBe(3);
      expect(result.splits[2].amount).toBe(2);
      expect(result.splits[3].amount).toBe(2);
    });

    it('should handle zero remainder', () => {
      const result = service.calculateFairSplit(90, 3);

      expect(result.perPerson).toBe(30);
      expect(result.remainder).toBe(0);
      result.splits.forEach((split) => {
        expect(split.amount).toBe(30);
      });
    });

    it('should throw error for zero people', () => {
      expect(() => service.calculateFairSplit(100, 0)).toThrow(
        'Number of people must be greater than 0'
      );
    });

    it('should throw error for negative people', () => {
      expect(() => service.calculateFairSplit(100, -1)).toThrow(
        'Number of people must be greater than 0'
      );
    });

    it('should throw error for negative total', () => {
      expect(() => service.calculateFairSplit(-100, 3)).toThrow(
        'Total amount cannot be negative'
      );
    });

    it('should use default payment method', () => {
      const result = service.calculateFairSplit(100, 2, 'upi');

      expect(result.splits[0].method).toBe('upi');
      expect(result.splits[1].method).toBe('upi');
    });

    it('should handle single person split', () => {
      const result = service.calculateFairSplit(150, 1);

      expect(result.perPerson).toBe(150);
      expect(result.remainder).toBe(0);
      expect(result.splits.length).toBe(1);
      expect(result.splits[0].amount).toBe(150);
    });
  });

  describe('validateSplits', () => {
    it('should validate correct splits', () => {
      const splits: SplitInput[] = [
        { amount: 50, method: 'upi' },
        { amount: 50, method: 'card' },
      ];
      const result = service.validateSplits(100, splits);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalProvided).toBe(100);
    });

    it('should reject empty splits array', () => {
      const result = service.validateSplits(100, []);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one split is required');
    });

    it('should reject split with zero amount', () => {
      const splits: SplitInput[] = [{ amount: 0, method: 'upi' }];
      const result = service.validateSplits(100, splits);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Amount must be greater than 0'))).toBe(true);
    });

    it('should reject negative amount', () => {
      const splits: SplitInput[] = [{ amount: -10, method: 'upi' }];
      const result = service.validateSplits(100, splits);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Amount must be greater than 0'))).toBe(true);
    });

    it('should reject invalid payment method', () => {
      const splits: SplitInput[] = [{ amount: 100, method: 'bitcoin' as SplitMethod }];
      const result = service.validateSplits(100, splits);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid payment method'))).toBe(true);
    });

    it('should allow floating point totals with tolerance', () => {
      const splits: SplitInput[] = [
        { amount: 33.33, method: 'upi' },
        { amount: 33.33, method: 'upi' },
        { amount: 33.34, method: 'upi' },
      ];
      const result = service.validateSplits(100, splits);

      expect(result.isValid).toBe(true);
    });

    it('should reject totals that do not match', () => {
      const splits: SplitInput[] = [
        { amount: 40, method: 'upi' },
        { amount: 40, method: 'card' },
      ];
      const result = service.validateSplits(100, splits);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('does not match order total'))).toBe(true);
    });

    it('should handle valid cash payment method', () => {
      const splits: SplitInput[] = [{ amount: 100, method: 'cash' }];
      const result = service.validateSplits(100, splits);

      expect(result.isValid).toBe(true);
    });

    it('should handle wallet payment method', () => {
      const splits: SplitInput[] = [{ amount: 100, method: 'wallet' }];
      const result = service.validateSplits(100, splits);

      expect(result.isValid).toBe(true);
    });
  });

  describe('markPaid', () => {
    it('should mark split as paid successfully', async () => {
      const mockSplitEntry: any = {
        userId: 'user1',
        amount: 50,
        status: 'pending',
        method: 'upi',
        paidAt: undefined as Date | undefined,
      };
      const mockSplitBill: any = {
        _id: 'split123',
        splits: [
          mockSplitEntry,
          { userId: 'user2', amount: 50, status: 'pending', method: 'card' },
        ],
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockSplitBillFindById.mockResolvedValue(mockSplitBill);

      await service.markPaid('split123', 'user1');

      expect(mockSplitEntry.status).toBe('paid');
      expect(mockSplitEntry.paidAt).toBeDefined();
      expect(mockSplitBill.save).toHaveBeenCalled();
    });

    it('should throw error if split not found', async () => {
      mockSplitBillFindById.mockResolvedValue(null);

      await expect(service.markPaid('nonexistent', 'user1')).rejects.toThrow(
        'Split not found'
      );
    });

    it('should throw error if user split not found', async () => {
      const mockSplitBill = {
        _id: 'split123',
        splits: [{ userId: 'otherUser', amount: 100, status: 'pending' }],
      };

      mockSplitBillFindById.mockResolvedValue(mockSplitBill);

      await expect(service.markPaid('split123', 'user1')).rejects.toThrow(
        'No split found for user'
      );
    });

    it('should throw error if already paid', async () => {
      const mockSplitBill = {
        _id: 'split123',
        splits: [{ userId: 'user1', amount: 100, status: 'paid' }],
      };

      mockSplitBillFindById.mockResolvedValue(mockSplitBill);

      await expect(service.markPaid('split123', 'user1')).rejects.toThrow(
        'already paid'
      );
    });
  });

  describe('getSplitStatistics', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    it('should return statistics for existing split', async () => {
      const mockSplitBill = {
        _id: 'split123',
        totalAmount: 100,
        splits: [
          { userId: 'user1', amount: 50, status: 'paid' },
          { userId: 'user2', amount: 50, status: 'pending' },
        ],
      };

      mockSplitBillFindOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSplitBill),
      });

      const result = await service.getSplitStatistics(validObjectId);

      expect(result).toBeDefined();
      expect(result!.totalAmount).toBe(100);
      expect(result!.paidAmount).toBe(50);
      expect(result!.remainingAmount).toBe(50);
      expect(result!.paidSplits).toBe(1);
      expect(result!.pendingSplits).toBe(1);
      expect(result!.completionPercentage).toBe(50);
    });

    it('should return null for non-existent split', async () => {
      mockSplitBillFindOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getSplitStatistics(validObjectId);

      expect(result).toBeNull();
    });

    it('should calculate 0% completion for unpaid splits', async () => {
      const mockSplitBill = {
        _id: 'split123',
        totalAmount: 200,
        splits: [
          { userId: 'user1', amount: 100, status: 'pending' },
          { userId: 'user2', amount: 100, status: 'pending' },
        ],
      };

      mockSplitBillFindOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSplitBill),
      });

      const result = await service.getSplitStatistics(validObjectId);

      expect(result!.completionPercentage).toBe(0);
    });
  });

  describe('cancelSplit', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    it('should delete split successfully', async () => {
      mockSplitBillDeleteOne.mockResolvedValue({ deletedCount: 1 });

      await expect(
        service.cancelSplit(validObjectId)
      ).resolves.toBeUndefined();
    });

    it('should throw error if split not found', async () => {
      mockSplitBillDeleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(service.cancelSplit(validObjectId)).rejects.toThrow(
        'Split not found'
      );
    });
  });
});
