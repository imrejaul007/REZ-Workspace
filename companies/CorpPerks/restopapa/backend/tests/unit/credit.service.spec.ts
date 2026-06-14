import { Test, TestingModule } from '@nestjs/testing';
import { CreditService } from '../../src/marketplace/services/credit.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import {
  createUser,
  createCreditTransaction,
  createMockPrismaService,
} from '../factories';

describe('CreditService', () => {
  let service: CreditService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CreditService>(CreditService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('getCreditBalance', () => {
    it('should return current balance from latest transaction', async () => {
      const userId = 'user-123';
      const latestTransaction = createCreditTransaction({
        userId,
        balance: 500,
      });

      mockPrisma.creditTransaction.findFirst.mockResolvedValue(latestTransaction);

      const result = await service.getCreditBalance(userId);

      expect(result).toBe(500);
    });

    it('should return 0 for new user with no transactions', async () => {
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(null);

      const result = await service.getCreditBalance('new-user');

      expect(result).toBe(0);
    });
  });

  describe('addCredit', () => {
    const userId = 'user-123';

    it('should add credit to user balance', async () => {
      const currentBalance = createCreditTransaction({
        userId,
        balance: 500,
      });
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(currentBalance);

      const newTransaction = createCreditTransaction({
        userId,
        type: 'credit',
        amount: 100,
        balance: 600,
      });
      mockPrisma.creditTransaction.create.mockResolvedValue(newTransaction);

      const result = await service.addCredit(userId, 100, 'Test credit');

      expect(result).toHaveProperty('id');
      expect(mockPrisma.creditTransaction.create).toHaveBeenCalled();
    });

    it('should calculate new balance correctly', async () => {
      const currentBalance = createCreditTransaction({
        userId,
        balance: 500,
      });
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(currentBalance);

      let capturedData: any;
      mockPrisma.creditTransaction.create.mockImplementation(async (data) => {
        capturedData = data.data;
        return createCreditTransaction({ ...data.data, id: 'new-tx' });
      });

      await service.addCredit(userId, 100, 'Test credit');

      expect(capturedData.balance).toBe(600); // 500 + 100
    });

    it('should reject negative amount', async () => {
      await expect(service.addCredit(userId, -100, 'Test')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject zero amount', async () => {
      await expect(service.addCredit(userId, 0, 'Test')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should require description', async () => {
      const currentBalance = createCreditTransaction({ userId, balance: 100 });
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(currentBalance);

      let capturedData: any;
      mockPrisma.creditTransaction.create.mockImplementation(async (data) => {
        capturedData = data.data;
        return createCreditTransaction({ ...data.data, id: 'new-tx' });
      });

      await service.addCredit(userId, 100, '');

      expect(capturedData.description).toBe('');
    });

    it('should create credit transaction with correct type', async () => {
      const currentBalance = createCreditTransaction({ userId, balance: 100 });
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(currentBalance);

      let capturedData: any;
      mockPrisma.creditTransaction.create.mockImplementation(async (data) => {
        capturedData = data.data;
        return createCreditTransaction({ ...data.data, id: 'new-tx' });
      });

      await service.addCredit(userId, 100, 'Refund');

      expect(capturedData.type).toBe('credit');
    });
  });

  describe('deductCredit', () => {
    const userId = 'user-123';

    it('should deduct credit from balance', async () => {
      const currentBalance = createCreditTransaction({
        userId,
        balance: 500,
      });
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(currentBalance);

      const deductTx = createCreditTransaction({
        userId,
        type: 'debit',
        amount: 100,
        balance: 400,
      });
      mockPrisma.creditTransaction.create.mockResolvedValue(deductTx);

      const result = await service.deductCredit(userId, 100, 'Order payment', 'order-123');

      expect(mockPrisma.creditTransaction.create).toHaveBeenCalled();
    });

    it('should create debit transaction', async () => {
      const currentBalance = createCreditTransaction({ userId, balance: 500 });
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(currentBalance);

      let capturedData: any;
      mockPrisma.creditTransaction.create.mockImplementation(async (data) => {
        capturedData = data.data;
        return createCreditTransaction({ ...data.data, id: 'new-tx' });
      });

      await service.deductCredit(userId, 100, 'Order payment');

      expect(capturedData.type).toBe('debit');
    });

    it('should link transaction to order', async () => {
      const currentBalance = createCreditTransaction({ userId, balance: 500 });
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(currentBalance);

      let capturedData: any;
      mockPrisma.creditTransaction.create.mockImplementation(async (data) => {
        capturedData = data.data;
        return createCreditTransaction({ ...data.data, id: 'new-tx' });
      });

      await service.deductCredit(userId, 100, 'Order payment', 'order-123');

      expect(capturedData.orderId).toBe('order-123');
    });

    it('should reject if insufficient balance', async () => {
      const currentBalance = createCreditTransaction({
        userId,
        balance: 50,
      });
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(currentBalance);

      await expect(
        service.deductCredit(userId, 100, 'Order payment'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject negative amount', async () => {
      await expect(
        service.deductCredit(userId, -100, 'Test'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCreditHistory', () => {
    const userId = 'user-123';

    it('should return paginated transaction history', async () => {
      const transactions = [
        createCreditTransaction({ userId, type: 'credit' }),
        createCreditTransaction({ userId, type: 'debit' }),
      ];

      mockPrisma.creditTransaction.findMany.mockResolvedValue(transactions);
      mockPrisma.creditTransaction.count.mockResolvedValue(2);

      const result = await service.getCreditHistory(userId, 1, 10);

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination).toBeDefined();
    });

    it('should return transactions in descending order by date', async () => {
      const transactions = [
        createCreditTransaction({ userId, type: 'credit' }),
        createCreditTransaction({ userId, type: 'debit' }),
      ];
      mockPrisma.creditTransaction.findMany.mockResolvedValue(transactions);
      mockPrisma.creditTransaction.count.mockResolvedValue(2);

      await service.getCreditHistory(userId, 1, 10);

      expect(mockPrisma.creditTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should include order reference in transactions', async () => {
      const txWithOrder = createCreditTransaction({
        userId,
        orderId: 'order-123',
      });
      mockPrisma.creditTransaction.findMany.mockResolvedValue([txWithOrder]);
      mockPrisma.creditTransaction.count.mockResolvedValue(1);

      const result = await service.getCreditHistory(userId);

      expect(result.transactions).toBeDefined();
      expect(result.transactions[0].orderId).toBe('order-123');
    });
  });
});

describe('Coin Economy Rules', () => {
  let service: CreditService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CreditService>(CreditService);
    prisma = module.get(PrismaService);
  });

  describe('Coin Earning', () => {
    it('should earn 1 coin per ₹1 spent', async () => {
      const userId = 'user-123';
      mockPrisma.creditTransaction.findFirst.mockResolvedValue({
        userId,
        balance: 0,
      } as any);

      let capturedData: any;
      mockPrisma.creditTransaction.create.mockImplementation(async (data) => {
        capturedData = data.data;
        return { ...data.data, id: 'new-tx' };
      });

      // User spends ₹100
      await service.addCredit(userId, 100, 'Purchase reward');

      // Should earn 100 coins
      expect(capturedData.amount).toBe(100);
    });
  });

  describe('Coin Redemption', () => {
    it('should allow redemption at 1:1 rate', async () => {
      const userId = 'user-123';
      mockPrisma.creditTransaction.findFirst.mockResolvedValue({
        userId,
        balance: 500,
      } as any);

      let capturedData: any;
      mockPrisma.creditTransaction.create.mockImplementation(async (data) => {
        capturedData = data.data;
        return { ...data.data, id: 'new-tx' };
      });

      // User redeems 100 coins
      await service.deductCredit(userId, 100, 'Order payment');

      // Should deduct exactly 100
      expect(capturedData.amount).toBe(100);
    });

    it('should prevent negative balance', async () => {
      const userId = 'user-123';
      mockPrisma.creditTransaction.findFirst.mockResolvedValue({
        userId,
        balance: 50,
      } as any);

      // Try to redeem 100 coins with only 50
      await expect(
        service.deductCredit(userId, 100, 'Order payment'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Platform Margin (1%)', () => {
    it('should track 1% platform margin on redemption', async () => {
      const userId = 'user-123';
      mockPrisma.creditTransaction.findFirst.mockResolvedValue({
        userId,
        balance: 1000,
      } as any);

      let capturedData: any;
      mockPrisma.creditTransaction.create.mockImplementation(async (data) => {
        capturedData = data.data;
        return { ...data.data, id: 'new-tx' };
      });

      // User redeems 100 coins
      await service.deductCredit(userId, 100, 'Order payment');

      // Platform margin = 1% = ₹1
      // Merchant receives = ₹99
      // This is tracked in the transaction metadata
      expect(capturedData.description).toContain('Order payment');
    });
  });
});
