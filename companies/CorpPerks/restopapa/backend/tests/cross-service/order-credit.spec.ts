import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../../src/marketplace/services/orders.service';
import { CreditService } from '../../src/marketplace/services/credit.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createOrder,
  createOrderItem,
  createProduct,
  createUser,
  createCreditTransaction,
  createMockPrismaService,
} from '../factories';

describe('Order + Credit Integration', () => {
  let ordersService: OrdersService;
  let creditService: CreditService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        CreditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    creditService = module.get<CreditService>(CreditService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('Credit Deduction on Order', () => {
    it('should deduct credit when creditUsed specified in order', async () => {
      const userId = 'user-123';
      const initialBalance = 500;

      // Set up user balance
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(
        createCreditTransaction({ userId, balance: initialBalance }),
      );

      // Set up products
      const product = createProduct({ id: 'product-1', priceRange: '₹300' });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

      // Track credit transaction creation
      let creditTxCreated = false;
      let debitAmount = 0;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            create: jest.fn().mockResolvedValue(createOrder({ userId, items: [] })),
          },
          creditTransaction: {
            create: jest.fn().mockImplementation(async (data) => {
              if (data.data.type === 'debit') {
                creditTxCreated = true;
                debitAmount = data.data.amount;
              }
              return createCreditTransaction(data.data);
            }),
          },
        };
        return callback(tx);
      });

      // Create order with 100 coins credit
      await ordersService.createOrder(userId, {
        userId,
        vendorId: 'vendor-123',
        items: [{ vendorOfferingId: 'product-1', quantity: 1, price: 300 }],
        totalAmount: 350,
        deliveryAddress: '123 Test St',
        paymentMethod: 'online',
        creditUsed: 100,
      });

      // Verify credit was deducted
      expect(creditTxCreated).toBe(true);
      expect(debitAmount).toBe(100);
    });

    it('should create debit transaction linked to order', async () => {
      const userId = 'user-123';
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(
        createCreditTransaction({ userId, balance: 500 }),
      );

      const product = createProduct({ id: 'product-1', priceRange: '₹200' });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

      let capturedTx: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            create: jest.fn().mockImplementation(async (data) => {
              return createOrder({ userId, items: [], id: 'order-123' });
            }),
          },
          creditTransaction: {
            create: jest.fn().mockImplementation(async (data) => {
              capturedTx = data.data;
              return createCreditTransaction(data.data);
            }),
          },
        };
        return callback(tx);
      });

      await ordersService.createOrder(userId, {
        userId,
        vendorId: 'vendor-123',
        items: [{ vendorOfferingId: 'product-1', quantity: 1, price: 200 }],
        totalAmount: 236,
        deliveryAddress: '123 Test St',
        paymentMethod: 'online',
        creditUsed: 50,
      });

      // Verify transaction
      expect(capturedTx).not.toBeNull();
      expect(capturedTx.type).toBe('debit');
      expect(capturedTx.amount).toBe(50);
      expect(capturedTx.orderId).toBe('order-123');
    });

    it('should create debit transaction when credit is used', async () => {
      const userId = 'user-123';

      // User has 50 coins
      mockPrisma.creditTransaction.findFirst.mockResolvedValue(
        createCreditTransaction({ userId, balance: 50 }),
      );

      const product = createProduct({ id: 'product-1', priceRange: '₹200' });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

      let debitTx: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            create: jest.fn().mockResolvedValue(createOrder({ userId, items: [] })),
          },
          creditTransaction: {
            create: jest.fn().mockImplementation(async (data) => {
              if (data.data.type === 'debit') {
                debitTx = data.data;
              }
              return createCreditTransaction(data.data);
            }),
          },
        };
        return callback(tx);
      });

      // Use 30 coins
      await ordersService.createOrder(userId, {
        userId,
        vendorId: 'vendor-123',
        items: [{ vendorOfferingId: 'product-1', quantity: 1, price: 200 }],
        totalAmount: 186,
        deliveryAddress: '123 Test St',
        paymentMethod: 'online',
        creditUsed: 30,
      });

      // Verify debit transaction was created
      expect(debitTx).not.toBeNull();
      expect(debitTx.type).toBe('debit');
    });
  });

  describe('Credit Refund on Cancellation', () => {
    it('should refund credit on order cancellation', async () => {
      const userId = 'user-123';
      const orderId = 'order-123';
      const creditUsed = 100;
      const initialBalance = 400; // After using 100 credits

      // Order with credit used
      const order = createOrder({
        id: orderId,
        userId,
        creditUsed,
        items: [createOrderItem()],
      });

      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(order);
      mockPrisma.marketplaceOrder.update.mockResolvedValue({
        ...order,
        status: 'cancelled',
      });

      let refundTx: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            update: jest.fn().mockResolvedValue({ ...order, status: 'cancelled' }),
          },
          creditTransaction: {
            create: jest.fn().mockImplementation(async (data) => {
              refundTx = data.data;
              return createCreditTransaction(data.data);
            }),
          },
        };
        return callback(tx);
      });

      await ordersService.cancelOrder(orderId, userId, "Test cancellation");

      // Verify refund transaction
      expect(refundTx).not.toBeNull();
      expect(refundTx.type).toBe('credit');
      expect(refundTx.amount).toBe(creditUsed);
      expect(refundTx.userId).toBe(userId);
      expect(refundTx.orderId).toBe(orderId);
    });

    it('should create credit transaction on refund', async () => {
      const userId = 'user-123';
      const orderId = 'order-123';
      const creditUsed = 50;

      const order = createOrder({
        id: orderId,
        userId,
        creditUsed,
        items: [createOrderItem()],
      });

      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(order);

      let createdTx: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            update: jest.fn().mockResolvedValue({ ...order, status: 'cancelled' }),
          },
          creditTransaction: {
            create: jest.fn().mockImplementation(async (data) => {
              createdTx = data.data;
              return createCreditTransaction(data.data);
            }),
          },
        };
        return callback(tx);
      });

      await ordersService.cancelOrder(orderId, userId, "Test cancellation");

      expect(createdTx.type).toBe('credit');
      expect(createdTx.amount).toBe(creditUsed);
    });
  });
});

describe('Order + Product Integration', () => {
  let ordersService: OrdersService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should verify product exists before order', async () => {
    const product = createProduct({ id: 'product-123', isActive: true });
    mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

    let capturedProductId: string | null = null;

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        marketplaceOrder: {
          create: jest.fn().mockImplementation(async (data) => {
            return createOrder({ items: data.data.items.create });
          }),
        },
        creditTransaction: { create: jest.fn().mockResolvedValue({}) },
      };
      return callback(tx);
    });

    await ordersService.createOrder('user-123', {
      userId: 'user-123',
      vendorId: 'vendor-123',
      items: [{ vendorOfferingId: 'product-123', quantity: 1, price: 100 }],
      totalAmount: 118,
      deliveryAddress: '123 Test St',
      paymentMethod: 'online',
    });

    // Verify product was looked up
    expect(mockPrisma.vendorOffering.findUnique).toHaveBeenCalledWith({
      where: { id: 'product-123' },
      include: expect.any(Object),
    });
  });

  it('should reject order for inactive product', async () => {
    const inactiveProduct = createProduct({ id: 'product-123', isActive: false });
    mockPrisma.vendorOffering.findUnique.mockResolvedValue(inactiveProduct);

    await expect(
      ordersService.createOrder('user-123', {
        userId: 'user-123',
        vendorId: 'vendor-123',
        items: [{ vendorOfferingId: 'product-123', quantity: 1, price: 100 }],
        totalAmount: 118,
        deliveryAddress: '123 Test St',
        paymentMethod: 'online',
      }),
    ).rejects.toThrow();
  });

  it('should preserve product price at order time', async () => {
    const product = createProduct({ id: 'product-123', priceRange: '₹250' });
    mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

    let orderItems: any[] = [];

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        marketplaceOrder: {
          create: jest.fn().mockImplementation(async (data) => {
            orderItems = data.data.items.create;
            return createOrder({ items: orderItems });
          }),
        },
        creditTransaction: { create: jest.fn().mockResolvedValue({}) },
      };
      return callback(tx);
    });

    await ordersService.createOrder('user-123', {
      userId: 'user-123',
      vendorId: 'vendor-123',
      items: [{ vendorOfferingId: 'product-123', quantity: 2, price: 250 }],
      totalAmount: 590,
      deliveryAddress: '123 Test St',
      paymentMethod: 'online',
    });

    // Verify price stored at order time
    expect(orderItems[0].unitPrice).toBe(250);
    expect(orderItems[0].totalPrice).toBe(500);
  });
});

describe('Full Purchase Flow', () => {
  let ordersService: OrdersService;
  let creditService: CreditService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        CreditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    creditService = module.get<CreditService>(CreditService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should complete: Add Credit → Create Order → Cancel → Refund', async () => {
    const userId = 'user-123';

    // Step 1: Add credit
    mockPrisma.creditTransaction.findFirst.mockResolvedValueOnce(null); // Initial balance = 0
    mockPrisma.creditTransaction.create.mockResolvedValue(
      createCreditTransaction({ userId, type: 'credit', amount: 1000, balance: 1000 }),
    );

    await creditService.addCredit(userId, 1000, 'Initial deposit');

    // Step 2: Create order with credit
    const product = createProduct({ id: 'product-1', priceRange: '₹500' });
    mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

    let creditDeducted = false;
    let orderId: string | null = null;

    mockPrisma.creditTransaction.findFirst
      .mockResolvedValueOnce(createCreditTransaction({ userId, balance: 1000 })) // Current balance
      .mockResolvedValueOnce(createCreditTransaction({ userId, balance: 900 })); // After deduction

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        marketplaceOrder: {
          create: jest.fn().mockImplementation(async (data) => {
            orderId = 'new-order-123';
            return createOrder({
              id: orderId,
              userId,
              creditUsed: 100,
              items: [],
            });
          }),
        },
        creditTransaction: {
          create: jest.fn().mockImplementation(async (data) => {
            if (data.data.type === 'debit') {
              creditDeducted = true;
            }
            return createCreditTransaction(data.data);
          }),
        },
      };
      return callback(tx);
    });

    await ordersService.createOrder(userId, {
      userId,
      vendorId: 'vendor-123',
      items: [{ vendorOfferingId: 'product-1', quantity: 1, price: 500 }],
      totalAmount: 590,
      deliveryAddress: '123 Test St',
      paymentMethod: 'online',
      creditUsed: 100,
    });

    expect(creditDeducted).toBe(true);
    expect(orderId).not.toBeNull();

    // Step 3: Cancel order
    const order = createOrder({
      id: orderId!,
      userId,
      creditUsed: 100,
      items: [createOrderItem()],
    });

    mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(order);

    let refundCreated = false;

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        marketplaceOrder: {
          update: jest.fn().mockResolvedValue({ ...order, status: 'cancelled' }),
        },
        creditTransaction: {
          create: jest.fn().mockImplementation(async (data) => {
            if (data.data.type === 'credit') {
              refundCreated = true;
            }
            return createCreditTransaction(data.data);
          }),
        },
      };
      return callback(tx);
    });

    await ordersService.cancelOrder(orderId!, userId, "Test cancellation");

    // Step 4: Verify refund
    expect(refundCreated).toBe(true);
  });
});
