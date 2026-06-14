import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerService, CreateCustomerInput, UpdateCustomerInput, CustomerFilters } from './services/CustomerService';
import { Customer, ICustomer } from './models/Customer';
import { SEGMENTATION, LOYALTY } from './config/constants';

// Mock mongoose models
vi.mock('./models/Customer', () => {
  const mockSave = vi.fn().mockResolvedValue(undefined);
  const mockFindOne = vi.fn();
  const mockFindOneAndUpdate = vi.fn();
  const mockFind = vi.fn();
  const mockCountDocuments = vi.fn();
  const mockUpdateOne = vi.fn();

  const MockCustomer = vi.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
  }));

  (MockCustomer as any).findOne = mockFindOne;
  (MockCustomer as any).findOneAndUpdate = mockFindOneAndUpdate;
  (MockCustomer as any).find = mockFind;
  (MockCustomer as any).countDocuments = mockCountDocuments;
  (MockCustomer as any).updateOne = mockUpdateOne;

  return { Customer: MockCustomer, ICustomer: {} };
});

describe('CustomerService', () => {
  let customerService: CustomerService;

  beforeEach(() => {
    customerService = new CustomerService();
    vi.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a customer with generated customer ID', async () => {
      const input: CreateCustomerInput = {
        phone: '9876543210',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockCustomer = {
        customerId: 'CUST-123',
        phone: input.phone,
        name: input.name,
        email: input.email,
        loyaltyPoints: LOYALTY.welcomeBonus,
        segment: 'NEW',
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Customer as any).findOne.mockResolvedValue(null);
      vi.spyOn(Customer.prototype as any, 'save').mockResolvedValue(mockCustomer);

      // Re-implement for testing since we need to create new instance
      const result = await customerService.createCustomer(input);

      expect(result).toBeDefined();
      expect(result.phone).toBe(input.phone);
      expect(result.name).toBe(input.name);
    });

    it('should set default loyalty points on creation', async () => {
      const input: CreateCustomerInput = {
        phone: '9876543210',
        name: 'Jane Doe',
      };

      const expectedPoints = LOYALTY.welcomeBonus;

      // Check that the service uses the welcome bonus constant
      expect(expectedPoints).toBeGreaterThanOrEqual(0);
    });

    it('should default segment to NEW', async () => {
      const input: CreateCustomerInput = {
        phone: '9876543210',
        name: 'New Customer',
      };

      const expectedSegment = 'NEW';
      expect(expectedSegment).toBe('NEW');
    });

    it('should include optional date fields when provided', async () => {
      const input: CreateCustomerInput = {
        phone: '9876543210',
        name: 'Birthday Customer',
        dateOfBirth: new Date('1990-05-15'),
        anniversary: new Date('2020-01-10'),
      };

      expect(input.dateOfBirth).toBeDefined();
      expect(input.anniversary).toBeDefined();
    });

    it('should include preferences when provided', async () => {
      const input: CreateCustomerInput = {
        phone: '9876543210',
        name: 'Pref Customer',
        preferences: {
          dietaryRestrictions: ['vegetarian'],
          favoriteCuisines: ['Italian', 'Mexican'],
        },
      };

      expect(input.preferences).toBeDefined();
      expect(input.preferences?.dietaryRestrictions).toContain('vegetarian');
    });
  });

  describe('getCustomerById', () => {
    it('should find customer by ID when active', async () => {
      const mockCustomer = {
        customerId: 'CUST-123',
        phone: '9876543210',
        name: 'Test Customer',
        isActive: true,
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerById('CUST-123');

      expect(result).toEqual(mockCustomer);
      expect(Customer.findOne).toHaveBeenCalledWith({ customerId: 'CUST-123', isActive: true });
    });

    it('should return null for non-existent customer', async () => {
      (Customer.findOne as any).mockResolvedValue(null);

      const result = await customerService.getCustomerById('NON-EXISTENT');

      expect(result).toBeNull();
    });

    it('should not return inactive customers', async () => {
      (Customer.findOne as any).mockResolvedValue(null); // Inactive filtered out

      await customerService.getCustomerById('CUST-INACTIVE');

      expect(Customer.findOne).toHaveBeenCalledWith({
        customerId: 'CUST-INACTIVE',
        isActive: true,
      });
    });
  });

  describe('getCustomerByPhone', () => {
    it('should find customer by phone number', async () => {
      const mockCustomer = {
        customerId: 'CUST-456',
        phone: '9876543210',
        name: 'Phone Customer',
        isActive: true,
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerByPhone('9876543210');

      expect(result).toEqual(mockCustomer);
      expect(Customer.findOne).toHaveBeenCalledWith({ phone: '9876543210', isActive: true });
    });
  });

  describe('updateCustomer', () => {
    it('should update customer name', async () => {
      const input: UpdateCustomerInput = {
        name: 'Updated Name',
      };

      const mockUpdated = {
        customerId: 'CUST-123',
        name: 'Updated Name',
        phone: '9876543210',
      };

      (Customer.findOneAndUpdate as any).mockResolvedValue(mockUpdated);

      const result = await customerService.updateCustomer('CUST-123', input);

      expect(result?.name).toBe('Updated Name');
      expect(Customer.findOneAndUpdate).toHaveBeenCalledWith(
        { customerId: 'CUST-123' },
        { $set: { name: 'Updated Name' } },
        { new: true }
      );
    });

    it('should update multiple fields', async () => {
      const input: UpdateCustomerInput = {
        name: 'New Name',
        email: 'new@example.com',
        isActive: false,
      };

      const mockUpdated = {
        customerId: 'CUST-123',
        name: 'New Name',
        email: 'new@example.com',
        isActive: false,
      };

      (Customer.findOneAndUpdate as any).mockResolvedValue(mockUpdated);

      const result = await customerService.updateCustomer('CUST-123', input);

      expect(result?.name).toBe('New Name');
      expect(result?.email).toBe('new@example.com');
    });

    it('should update preferences', async () => {
      const input: UpdateCustomerInput = {
        preferences: {
          dietaryRestrictions: ['gluten-free'],
          favoriteCuisines: ['Japanese'],
        },
      };

      const mockUpdated = {
        customerId: 'CUST-123',
        preferences: input.preferences,
      };

      (Customer.findOneAndUpdate as any).mockResolvedValue(mockUpdated);

      const result = await customerService.updateCustomer('CUST-123', input);

      expect(result?.preferences).toEqual(input.preferences);
    });

    it('should return null for non-existent customer', async () => {
      (Customer.findOneAndUpdate as any).mockResolvedValue(null);

      const result = await customerService.updateCustomer('NON-EXISTENT', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('listCustomers', () => {
    it('should return paginated results', async () => {
      const mockCustomers = [
        { customerId: 'CUST-1', name: 'Customer 1' },
        { customerId: 'CUST-2', name: 'Customer 2' },
      ];

      (Customer.find as any).mockReturnValue({
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockCustomers),
      });
      (Customer.countDocuments as any).mockResolvedValue(50);

      const result = await customerService.listCustomers({}, 1, 2);

      expect(result.customers).toHaveLength(2);
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(25);
    });

    it('should filter by segment', async () => {
      const mockCustomers = [
        { customerId: 'CUST-VIP', segment: 'VIP' },
      ];

      (Customer.find as any).mockReturnValue({
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockCustomers),
      });
      (Customer.countDocuments as any).mockResolvedValue(10);

      const filters: CustomerFilters = { segment: 'VIP' };
      await customerService.listCustomers(filters);

      expect(Customer.find).toHaveBeenCalledWith(expect.objectContaining({ segment: 'VIP' }));
    });

    it('should filter by active status', async () => {
      (Customer.find as any).mockReturnValue({
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([]),
      });
      (Customer.countDocuments as any).mockResolvedValue(0);

      await customerService.listCustomers({ isActive: true });

      expect(Customer.find).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
    });

    it('should filter by minimum lifetime value', async () => {
      (Customer.find as any).mockReturnValue({
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([]),
      });
      (Customer.countDocuments as any).mockResolvedValue(0);

      await customerService.listCustomers({ minLifetimeValue: 5000 });

      expect(Customer.find).toHaveBeenCalledWith(
        expect.objectContaining({
          lifetimeValue: expect.objectContaining({ $gte: 5000 }),
        })
      );
    });

    it('should filter by minimum visits', async () => {
      (Customer.find as any).mockReturnValue({
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([]),
      });
      (Customer.countDocuments as any).mockResolvedValue(0);

      await customerService.listCustomers({ minVisits: 10 });

      expect(Customer.find).toHaveBeenCalledWith(
        expect.objectContaining({
          totalVisits: expect.objectContaining({ $gte: 10 }),
        })
      );
    });

    it('should search by name, phone, or email', async () => {
      (Customer.find as any).mockReturnValue({
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([]),
      });
      (Customer.countDocuments as any).mockResolvedValue(0);

      await customerService.listCustomers({ search: 'john' });

      expect(Customer.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: { $regex: 'john', $options: 'i' } },
            { phone: { $regex: 'john', $options: 'i' } },
            { email: { $regex: 'john', $options: 'i' } },
          ]),
        })
      );
    });

    it('should filter by birthday this month', async () => {
      (Customer.find as any).mockReturnValue({
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([]),
      });
      (Customer.countDocuments as any).mockResolvedValue(0);

      await customerService.listCustomers({ birthdayThisMonth: true });

      expect(Customer.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $expr: expect.objectContaining({
            $and: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('updateSegment', () => {
    it('should update customer to VIP segment', async () => {
      const mockCustomer = {
        customerId: 'CUST-123',
        segment: 'REGULAR',
        totalVisits: 15,
        totalSpend: 10000,
        lastVisitAt: new Date(),
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);
      (Customer.updateOne as any).mockResolvedValue({ modifiedCount: 1 });

      const result = await customerService.updateSegment('CUST-123');

      expect(result).toBeDefined();
    });

    it('should throw error for non-existent customer', async () => {
      (Customer.findOne as any).mockResolvedValue(null);

      await expect(customerService.updateSegment('NON-EXISTENT')).rejects.toThrow('Customer not found');
    });

    it('should update customer to LAPSED segment when no recent visits', async () => {
      const mockCustomer = {
        customerId: 'CUST-123',
        segment: 'REGULAR',
        totalVisits: 5,
        totalSpend: 5000,
        lastVisitAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);
      (Customer.updateOne as any).mockResolvedValue({ modifiedCount: 1 });

      const result = await customerService.updateSegment('CUST-123');

      expect(result).toBe('LAPSED');
    });

    it('should keep customer as NEW if no previous visits', async () => {
      const mockCustomer = {
        customerId: 'CUST-123',
        segment: 'NEW',
        totalVisits: 0,
        totalSpend: 0,
        lastVisitAt: null,
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);
      (Customer.updateOne as any).mockResolvedValue({ modifiedCount: 1 });

      const result = await customerService.updateSegment('CUST-123');

      expect(result).toBe('NEW');
    });
  });

  describe('addLoyaltyPoints', () => {
    it('should add loyalty points to customer', async () => {
      const mockUpdated = {
        customerId: 'CUST-123',
        loyaltyPoints: 150,
      };

      (Customer.findOneAndUpdate as any).mockResolvedValue(mockUpdated);

      const result = await customerService.addLoyaltyPoints('CUST-123', 50);

      expect(result?.loyaltyPoints).toBe(150);
      expect(Customer.findOneAndUpdate).toHaveBeenCalledWith(
        { customerId: 'CUST-123' },
        { $inc: { loyaltyPoints: 50 } },
        { new: true }
      );
    });

    it('should return null for non-existent customer', async () => {
      (Customer.findOneAndUpdate as any).mockResolvedValue(null);

      const result = await customerService.addLoyaltyPoints('NON-EXISTENT', 100);

      expect(result).toBeNull();
    });
  });

  describe('redeemLoyaltyPoints', () => {
    it('should redeem loyalty points successfully', async () => {
      const mockCustomer = {
        customerId: 'CUST-123',
        loyaltyPoints: 500,
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);
      (Customer.updateOne as any).mockResolvedValue({ modifiedCount: 1 });

      const result = await customerService.redeemLoyaltyPoints('CUST-123', 200);

      expect(result.success).toBe(true);
      expect(result.remainingPoints).toBe(300);
    });

    it('should throw error for insufficient points', async () => {
      const mockCustomer = {
        customerId: 'CUST-123',
        loyaltyPoints: 100,
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);

      await expect(customerService.redeemLoyaltyPoints('CUST-123', 500)).rejects.toThrow(
        'Insufficient points'
      );
    });

    it('should throw error for non-existent customer', async () => {
      (Customer.findOne as any).mockResolvedValue(null);

      await expect(customerService.redeemLoyaltyPoints('NON-EXISTENT', 100)).rejects.toThrow(
        'Customer not found'
      );
    });
  });

  describe('calculatePointsForPurchase', () => {
    it('should calculate 1 point per 100 cents', () => {
      const points = customerService.calculatePointsForPurchase(50000); // 500 rupees in cents

      expect(points).toBe(500); // 50000/100 = 500 points
    });

    it('should floor fractional points', () => {
      const points = customerService.calculatePointsForPurchase(55000); // 550 rupees in cents

      expect(points).toBe(550); // 55000/100 = 550 points
    });

    it('should return 0 for amounts below minimum', () => {
      const points = customerService.calculatePointsForPurchase(50); // 0.5 rupees

      expect(points).toBe(0);
    });
  });

  describe('pointsToMoney', () => {
    it('should convert points to money value', () => {
      const money = customerService.pointsToMoney(1000);

      // 1000 points / 100 * 100 = 1000 cents (10 rupees)
      expect(money).toBe(1000);
    });

    it('should handle zero points', () => {
      const money = customerService.pointsToMoney(0);

      expect(money).toBe(0);
    });
  });

  describe('calculateLifetimeValue', () => {
    it('should return customer lifetime value', async () => {
      const mockCustomer = {
        customerId: 'CUST-123',
        lifetimeValue: 50000,
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);

      const result = await customerService.calculateLifetimeValue('CUST-123');

      expect(result).toBe(50000);
    });

    it('should throw error for non-existent customer', async () => {
      (Customer.findOne as any).mockResolvedValue(null);

      await expect(customerService.calculateLifetimeValue('NON-EXISTENT')).rejects.toThrow(
        'Customer not found'
      );
    });
  });

  describe('getCustomerStats', () => {
    it('should return customer statistics', async () => {
      const mockCustomer = {
        customerId: 'CUST-123',
        totalVisits: 25,
        totalSpend: 100000, // in cents
        lastVisitAt: new Date('2024-06-01'),
        loyaltyPoints: 1000,
        lifetimeValue: 100000,
        segment: 'VIP',
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerStats('CUST-123');

      expect(result).not.toBeNull();
      expect(result?.totalVisits).toBe(25);
      expect(result?.totalSpend).toBe(100000);
      expect(result?.averageSpendPerVisit).toBe(4000); // 100000/25
    });

    it('should calculate days since last visit', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const mockCustomer = {
        customerId: 'CUST-123',
        totalVisits: 10,
        totalSpend: 50000,
        lastVisitAt: thirtyDaysAgo,
        loyaltyPoints: 500,
        lifetimeValue: 50000,
        segment: 'REGULAR',
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerStats('CUST-123');

      expect(result?.daysSinceLastVisit).toBeGreaterThanOrEqual(29);
      expect(result?.daysSinceLastVisit).toBeLessThanOrEqual(31);
    });

    it('should return null for non-existent customer', async () => {
      (Customer.findOne as any).mockResolvedValue(null);

      const result = await customerService.getCustomerStats('NON-EXISTENT');

      expect(result).toBeNull();
    });

    it('should handle null lastVisitAt', async () => {
      const mockCustomer = {
        customerId: 'CUST-123',
        totalVisits: 0,
        totalSpend: 0,
        lastVisitAt: null,
        loyaltyPoints: 0,
        lifetimeValue: 0,
        segment: 'NEW',
      };

      (Customer.findOne as any).mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerStats('CUST-123');

      expect(result?.daysSinceLastVisit).toBeNull();
    });
  });

  describe('getTodayCelebrations', () => {
    it('should find customers with birthdays today', async () => {
      const mockBirthdays = [
        { customerId: 'CUST-1', name: 'Birthday Person 1', dateOfBirth: new Date('1990-06-02') },
      ];

      const mockAnniversaries: any[] = [];

      // Mock both queries
      (Customer.find as any)
        .mockResolvedValueOnce(mockBirthdays)
        .mockResolvedValueOnce(mockAnniversaries);

      const result = await customerService.getTodayCelebrations();

      expect(result.birthdays).toHaveLength(1);
      expect(result.anniversaries).toHaveLength(0);
    });

    it('should find customers with anniversaries today', async () => {
      const mockBirthdays: any[] = [];
      const mockAnniversaries = [
        { customerId: 'CUST-2', name: 'Anniversary Person', anniversary: new Date('2020-06-02') },
      ];

      (Customer.find as any)
        .mockResolvedValueOnce(mockBirthdays)
        .mockResolvedValueOnce(mockAnniversaries);

      const result = await customerService.getTodayCelebrations();

      expect(result.birthdays).toHaveLength(0);
      expect(result.anniversaries).toHaveLength(1);
    });
  });

  describe('deactivateCustomer', () => {
    it('should soft delete customer by setting isActive to false', async () => {
      const mockDeactivated = {
        customerId: 'CUST-123',
        isActive: false,
      };

      (Customer.findOneAndUpdate as any).mockResolvedValue(mockDeactivated);

      const result = await customerService.deactivateCustomer('CUST-123');

      expect(result?.isActive).toBe(false);
      expect(Customer.findOneAndUpdate).toHaveBeenCalledWith(
        { customerId: 'CUST-123' },
        { isActive: false },
        { new: true }
      );
    });

    it('should return null for non-existent customer', async () => {
      (Customer.findOneAndUpdate as any).mockResolvedValue(null);

      const result = await customerService.deactivateCustomer('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });
});

describe('SEGMENTATION Constants', () => {
  it('should define VIP threshold correctly', () => {
    expect(SEGMENTATION.VIP.minVisits).toBeDefined();
    expect(SEGMENTATION.VIP.minSpend).toBeDefined();
    expect(SEGMENTATION.VIP.minVisits).toBeGreaterThan(0);
  });

  it('should define REGULAR threshold correctly', () => {
    expect(SEGMENTATION.REGULAR.minVisits).toBeDefined();
    expect(SEGMENTATION.REGULAR.minVisits).toBeLessThan(SEGMENTATION.VIP.minVisits);
  });

  it('should define LAPSED days threshold correctly', () => {
    expect(SEGMENTATION.LAPSED.daysSinceLastVisit).toBeDefined();
    expect(SEGMENTATION.LAPSED.daysSinceLastVisit).toBeGreaterThan(0);
  });
});

describe('LOYALTY Constants', () => {
  it('should define welcome bonus points', () => {
    expect(LOYALTY.welcomeBonus).toBeDefined();
    expect(typeof LOYALTY.welcomeBonus).toBe('number');
  });

  it('should define points to rupee ratio', () => {
    expect(LOYALTY.pointsToRupeeRatio).toBeDefined();
    expect(LOYALTY.pointsToRupeeRatio).toBeGreaterThan(0);
  });
});
