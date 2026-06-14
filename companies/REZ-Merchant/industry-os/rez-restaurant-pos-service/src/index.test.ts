import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BillingService } from './services/BillingService';
import { InventoryService } from './services/InventoryService';
import { Bill, BillStatus, IBill } from './models/Bill';
import { Payment, PaymentStatus } from './models/Payment';

// Mock mongoose models
vi.mock('./models/Bill', () => {
  const mockSave = vi.fn().mockResolvedValue(undefined);
  const MockBill = vi.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
  }));
  (MockBill as any).findOne = vi.fn();
  (MockBill as any).find = vi.fn();
  (MockBill as any).countDocuments = vi.fn();
  (MockBill as any).status = {};
  return {
    Bill: MockBill,
    BillStatus: {
      OPEN: 'OPEN',
      CLOSED: 'CLOSED',
      CANCELLED: 'CANCELLED',
    },
    IBill: {},
  };
});

vi.mock('./models/Payment', () => {
  const MockPayment = vi.fn();
  (MockPayment as any).find = vi.fn();
  return {
    Payment: MockPayment,
    PaymentStatus: {
      COMPLETED: 'COMPLETED',
      PENDING: 'PENDING',
      FAILED: 'FAILED',
    },
    PaymentMethod: {},
  };
});

describe('BillingService', () => {
  let billingService: BillingService;

  beforeEach(() => {
    billingService = new BillingService();
    vi.clearAllMocks();
  });

  describe('createBill', () => {
    it('should create a bill with correct bill ID format', async () => {
      const input = {
        restaurantId: 'rest-123',
        createdBy: 'user-1',
        items: [
          {
            itemId: 'item-1',
            name: 'Burger',
            quantity: 2,
            unitPrice: 150,
          },
        ],
      };

      const result = await billingService.createBill(input);

      expect(result.billId).toMatch(/^BILL-[A-Z0-9]{8}$/);
      expect(result.status).toBe('OPEN');
    });

    it('should calculate subtotal correctly', async () => {
      const input = {
        restaurantId: 'rest-123',
        createdBy: 'user-1',
        items: [
          { itemId: 'item-1', name: 'Burger', quantity: 2, unitPrice: 150 },
          { itemId: 'item-2', name: 'Fries', quantity: 1, unitPrice: 80 },
        ],
      };

      const result = await billingService.createBill(input);

      expect(result.subtotal).toBe(380); // 2*150 + 1*80
    });

    it('should calculate tax at 18% by default', async () => {
      const input = {
        restaurantId: 'rest-123',
        createdBy: 'user-1',
        items: [
          { itemId: 'item-1', name: 'Pizza', quantity: 1, unitPrice: 500 },
        ],
      };

      const result = await billingService.createBill(input);

      // Tax should be 18% of (500 - 0 discount) = 90
      expect(result.totalTaxAmount).toBe(90);
      expect(result.grandTotal).toBe(590); // 500 + 90
    });

    it('should apply percentage discount correctly', async () => {
      const input = {
        restaurantId: 'rest-123',
        createdBy: 'user-1',
        items: [
          { itemId: 'item-1', name: 'Pizza', quantity: 1, unitPrice: 500, discount: 10 }, // 10% off
        ],
      };

      const result = await billingService.createBill(input);

      // Discount = 500 * 10% = 50
      // Taxable = 500 - 50 = 450
      // Tax = 450 * 18% = 81
      expect(result.items[0].discount).toBe(10);
      expect(result.items[0].totalAmount).toBe(531); // 450 + 81
    });

    it('should apply offer discounts to bill total', async () => {
      const input = {
        restaurantId: 'rest-123',
        createdBy: 'user-1',
        items: [
          { itemId: 'item-1', name: 'Pizza', quantity: 1, unitPrice: 1000 },
        ],
        offersApplied: [
          {
            offerId: 'offer-1',
            offerName: 'Festival Discount',
            discountType: 'PERCENTAGE',
            discountValue: 15,
          },
        ],
      };

      const result = await billingService.createBill(input);

      expect(result.offersApplied).toHaveLength(1);
      expect(result.offersApplied[0].discountAmount).toBe(150); // 15% of 1000
      expect(result.totalDiscount).toBe(150);
    });

    it('should handle fixed offer discounts', async () => {
      const input = {
        restaurantId: 'rest-123',
        createdBy: 'user-1',
        items: [
          { itemId: 'item-1', name: 'Combo', quantity: 1, unitPrice: 500 },
        ],
        offersApplied: [
          {
            offerId: 'offer-flat',
            offerName: 'Flat 50 Off',
            discountType: 'FIXED',
            discountValue: 50,
          },
        ],
      };

      const result = await billingService.createBill(input);

      expect(result.offersApplied[0].discountAmount).toBe(50);
    });

    it('should include customer info in bill', async () => {
      const input = {
        restaurantId: 'rest-123',
        createdBy: 'user-1',
        customerId: 'cust-1',
        customerName: 'John Doe',
        customerPhone: '9876543210',
        items: [
          { itemId: 'item-1', name: 'Burger', quantity: 1, unitPrice: 200 },
        ],
      };

      const result = await billingService.createBill(input);

      expect(result.customerId).toBe('cust-1');
      expect(result.customerName).toBe('John Doe');
      expect(result.customerPhone).toBe('9876543210');
    });
  });

  describe('addItemToBill', () => {
    it('should add item to existing bill and update totals', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'OPEN',
        items: [
          { itemId: 'item-1', name: 'Burger', quantity: 1, unitPrice: 150, taxRate: 18, taxAmount: 27, discount: 0, totalAmount: 177 },
        ],
        subtotal: 150,
        totalTaxAmount: 27,
        totalDiscount: 0,
        grandTotal: 177,
        tipAmount: 0,
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      const newItem = {
        itemId: 'item-2',
        name: 'Fries',
        quantity: 2,
        unitPrice: 80,
      };

      const result = await billingService.addItemToBill('BILL-123', newItem, 'user-1');

      expect(result.items).toHaveLength(2);
      expect(result.subtotal).toBe(310); // 150 + 160
      expect(mockBill.save).toHaveBeenCalled();
    });

    it('should throw error for non-existent bill', async () => {
      (Bill.findOne as any).mockResolvedValue(null);

      await expect(
        billingService.addItemToBill('BILL-INVALID', { itemId: 'item-1', name: 'Test', quantity: 1, unitPrice: 100 }, 'user-1')
      ).rejects.toThrow('Bill BILL-INVALID not found');
    });

    it('should throw error for closed bill', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'CLOSED',
        items: [],
        subtotal: 0,
        totalTaxAmount: 0,
        totalDiscount: 0,
        grandTotal: 0,
        tipAmount: 0,
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      await expect(
        billingService.addItemToBill('BILL-123', { itemId: 'item-1', name: 'Test', quantity: 1, unitPrice: 100 }, 'user-1')
      ).rejects.toThrow('Cannot add items to a closed or cancelled bill');
    });
  });

  describe('removeItemFromBill', () => {
    it('should remove item and recalculate totals', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'OPEN',
        items: [
          { itemId: 'item-1', name: 'Burger', quantity: 1, unitPrice: 150, taxRate: 18, taxAmount: 27, discount: 0, totalAmount: 177 },
          { itemId: 'item-2', name: 'Fries', quantity: 2, unitPrice: 80, taxRate: 18, taxAmount: 28.8, discount: 0, totalAmount: 188.8 },
        ],
        subtotal: 310,
        totalTaxAmount: 55.8,
        totalDiscount: 0,
        grandTotal: 365.8,
        tipAmount: 0,
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      const result = await billingService.removeItemFromBill('BILL-123', 'item-2', 'user-1');

      expect(result.items).toHaveLength(1);
      expect(result.subtotal).toBe(150);
    });

    it('should throw error for non-existent item', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'OPEN',
        items: [],
        subtotal: 0,
        totalTaxAmount: 0,
        totalDiscount: 0,
        grandTotal: 0,
        tipAmount: 0,
        save: vi.fn(),
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      await expect(
        billingService.removeItemFromBill('BILL-123', 'item-invalid', 'user-1')
      ).rejects.toThrow('Item item-invalid not found in bill');
    });
  });

  describe('applyDiscount', () => {
    it('should apply bill-level percentage discount', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'OPEN',
        items: [],
        subtotal: 500,
        totalTaxAmount: 90,
        totalDiscount: 0,
        grandTotal: 590,
        tipAmount: 0,
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      const result = await billingService.applyDiscount({
        billId: 'BILL-123',
        discountType: 'BILL_LEVEL',
        discountType2: 'PERCENTAGE',
        discountValue: 10,
        discountName: '10% Off',
      });

      expect(result.totalDiscount).toBe(50); // 10% of 500
      expect(result.grandTotal).toBe(540); // 500 - 50 + 90
    });

    it('should apply item-level fixed discount', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'OPEN',
        items: [
          { itemId: 'item-1', name: 'Pizza', quantity: 1, unitPrice: 400 },
        ],
        subtotal: 400,
        totalTaxAmount: 72,
        totalDiscount: 0,
        grandTotal: 472,
        tipAmount: 0,
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      const result = await billingService.applyDiscount({
        billId: 'BILL-123',
        discountType: 'ITEM_LEVEL',
        itemId: 'item-1',
        discountType2: 'FIXED',
        discountValue: 50,
        discountName: 'Fixed 50 Off',
      });

      expect(result.totalDiscount).toBe(50);
    });
  });

  describe('applyTip', () => {
    it('should add fixed tip amount', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'OPEN',
        items: [],
        subtotal: 500,
        totalTaxAmount: 90,
        totalDiscount: 0,
        grandTotal: 590,
        tipAmount: 0,
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      const result = await billingService.applyTip({
        billId: 'BILL-123',
        tipAmount: 50,
        tipType: 'FIXED',
      });

      expect(result.tipAmount).toBe(50);
      expect(result.grandTotal).toBe(640); // 590 + 50
    });

    it('should calculate percentage tip correctly', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'OPEN',
        items: [],
        subtotal: 500,
        totalTaxAmount: 90,
        totalDiscount: 0,
        grandTotal: 590,
        tipAmount: 0,
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      const result = await billingService.applyTip({
        billId: 'BILL-123',
        tipAmount: 10,
        tipType: 'PERCENTAGE',
      });

      expect(result.tipAmount).toBe(59); // 10% of 590
    });
  });

  describe('closeBill', () => {
    it('should close an open bill', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'OPEN',
        subtotal: 500,
        totalTaxAmount: 90,
        totalDiscount: 0,
        grandTotal: 590,
        tipAmount: 0,
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      const result = await billingService.closeBill('BILL-123', 'manager-1');

      expect(result.status).toBe('CLOSED');
      expect(result.closedAt).toBeInstanceOf(Date);
    });

    it('should throw error for already closed bill', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'CLOSED',
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      await expect(
        billingService.closeBill('BILL-123', 'manager-1')
      ).rejects.toThrow('Bill is not in OPEN status');
    });
  });

  describe('cancelBill', () => {
    it('should cancel an open bill', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'OPEN',
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      const result = await billingService.cancelBill('BILL-123', 'manager-1', 'Customer requested');

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw error for already closed bill', async () => {
      const mockBill = {
        billId: 'BILL-123',
        status: 'CLOSED',
      };

      (Bill.findOne as any).mockResolvedValue(mockBill);

      await expect(
        billingService.cancelBill('BILL-123', 'manager-1')
      ).rejects.toThrow('Cannot cancel a closed bill');
    });
  });
});

describe('InventoryService', () => {
  let inventoryService: InventoryService;

  beforeEach(() => {
    inventoryService = new InventoryService();
  });

  describe('addIngredient', () => {
    it('should add a new ingredient with auto-generated ID', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Salt',
        category: 'Spices',
        unit: 'kg',
        currentStock: 10,
        minStock: 5,
        reorderLevel: 15,
        cost: 20,
      });

      expect(ingredient.id).toMatch(/^ing-[a-z0-9]{8}$/);
      expect(ingredient.name).toBe('Salt');
      expect(ingredient.status).toBe('in_stock');
    });

    it('should set status to in_stock when above reorder level', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Tomatoes',
        category: 'Vegetables',
        unit: 'kg',
        currentStock: 100,
        minStock: 10,
        reorderLevel: 30,
        cost: 40,
      });

      expect(ingredient.status).toBe('in_stock');
    });

    it('should set status to low_stock when at or below reorder level', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Onions',
        category: 'Vegetables',
        unit: 'kg',
        currentStock: 25,
        minStock: 10,
        reorderLevel: 25,
        cost: 25,
      });

      expect(ingredient.status).toBe('low_stock');
    });

    it('should set status to critical when at or below 50% of min stock', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Chicken',
        category: 'Meat',
        unit: 'kg',
        currentStock: 4,
        minStock: 10,
        reorderLevel: 20,
        cost: 200,
      });

      expect(ingredient.status).toBe('critical');
    });

    it('should set status to out_of_stock when stock is zero', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Pasta',
        category: 'Grains',
        unit: 'kg',
        currentStock: 0,
        minStock: 5,
        reorderLevel: 15,
        cost: 50,
      });

      expect(ingredient.status).toBe('out_of_stock');
    });
  });

  describe('updateIngredient', () => {
    it('should update ingredient and recalculate status', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Sugar',
        category: 'Baking',
        unit: 'kg',
        currentStock: 20,
        minStock: 10,
        reorderLevel: 25,
        cost: 45,
      });

      const updated = inventoryService.updateIngredient(ingredient.id, {
        currentStock: 5,
      });

      expect(updated?.currentStock).toBe(5);
      expect(updated?.status).toBe('low_stock');
    });

    it('should return undefined for non-existent ingredient', () => {
      const result = inventoryService.updateIngredient('invalid-id', { currentStock: 10 });
      expect(result).toBeUndefined();
    });

    it('should not allow changing ingredient ID', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Milk',
        category: 'Dairy',
        unit: 'l',
        currentStock: 50,
        minStock: 10,
        reorderLevel: 30,
        cost: 60,
      });

      const originalId = ingredient.id;
      const updated = inventoryService.updateIngredient(originalId, { id: 'new-id' });

      expect(updated?.id).toBe(originalId);
    });
  });

  describe('adjustStock', () => {
    it('should increase stock on purchase', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Rice',
        category: 'Grains',
        unit: 'kg',
        currentStock: 30,
        minStock: 20,
        reorderLevel: 50,
        cost: 45,
      });

      const movement = inventoryService.adjustStock(
        ingredient.id,
        20,
        'purchase',
        'user-1',
        'Restocking from supplier'
      );

      expect(movement?.newStock).toBe(50);
      expect(movement?.type).toBe('purchase');
    });

    it('should decrease stock on usage', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Oil',
        category: 'Oils',
        unit: 'l',
        currentStock: 50,
        minStock: 5,
        reorderLevel: 20,
        cost: 180,
      });

      const movement = inventoryService.adjustStock(
        ingredient.id,
        10,
        'usage',
        'user-1',
        'Used for cooking'
      );

      expect(movement?.newStock).toBe(40);
      expect(movement?.type).toBe('usage');
    });

    it('should not go below zero on waste', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Cheese',
        category: 'Dairy',
        unit: 'kg',
        currentStock: 5,
        minStock: 3,
        reorderLevel: 10,
        cost: 400,
      });

      const movement = inventoryService.adjustStock(
        ingredient.id,
        10,
        'waste',
        'user-1'
      );

      expect(movement?.newStock).toBe(0);
    });

    it('should return undefined for non-existent ingredient', () => {
      const result = inventoryService.adjustStock('invalid-id', 10, 'purchase', 'user-1');
      expect(result).toBeUndefined();
    });

    it('should record movement with correct previous and new stock', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Flour',
        category: 'Baking',
        unit: 'kg',
        currentStock: 25,
        minStock: 10,
        reorderLevel: 30,
        cost: 35,
      });

      const movement = inventoryService.adjustStock(
        ingredient.id,
        15,
        'purchase',
        'user-1'
      );

      expect(movement?.previousStock).toBe(25);
      expect(movement?.newStock).toBe(40);
    });
  });

  describe('getIngredientsByCategory', () => {
    it('should return only ingredients in specified category', () => {
      inventoryService.addIngredient({
        name: 'Beef',
        category: 'Meat',
        unit: 'kg',
        currentStock: 20,
        minStock: 5,
        reorderLevel: 15,
        cost: 500,
      });

      const vegetables = inventoryService.getIngredientsByCategory('Vegetables');
      const allIngredients = inventoryService.getAllIngredients();

      // Default ingredients include Vegetables category
      expect(vegetables.length).toBeGreaterThan(0);
      expect(vegetables.every(i => i.category === 'Vegetables')).toBe(true);
    });
  });

  describe('getLowStockIngredients', () => {
    it('should return ingredients with low, critical, or out of stock status', () => {
      inventoryService.addIngredient({
        name: 'Spare Part',
        category: 'Supplies',
        unit: 'pcs',
        currentStock: 2,
        minStock: 10,
        reorderLevel: 20,
        cost: 100,
      });

      const lowStock = inventoryService.getLowStockIngredients();

      expect(lowStock.some(i => i.name === 'Spare Part')).toBe(true);
    });
  });

  describe('getMovements', () => {
    it('should return stock movements with pagination', () => {
      const ingredient = inventoryService.addIngredient({
        name: 'Water',
        category: 'Beverages',
        unit: 'l',
        currentStock: 100,
        minStock: 20,
        reorderLevel: 50,
        cost: 5,
      });

      inventoryService.adjustStock(ingredient.id, 50, 'purchase', 'user-1');
      inventoryService.adjustStock(ingredient.id, 20, 'usage', 'user-2');

      const movements = inventoryService.getMovements(ingredient.id);
      expect(movements.length).toBe(2);
      expect(movements[0].type).toBe('usage'); // Most recent first
    });

    it('should filter movements by ingredient', () => {
      const ing1 = inventoryService.addIngredient({
        name: 'Item1',
        category: 'Cat1',
        unit: 'pcs',
        currentStock: 50,
        minStock: 10,
        reorderLevel: 25,
        cost: 10,
      });

      const ing2 = inventoryService.addIngredient({
        name: 'Item2',
        category: 'Cat2',
        unit: 'pcs',
        currentStock: 50,
        minStock: 10,
        reorderLevel: 25,
        cost: 10,
      });

      inventoryService.adjustStock(ing1.id, 10, 'purchase', 'user-1');
      inventoryService.adjustStock(ing2.id, 10, 'purchase', 'user-1');

      const ing1Movements = inventoryService.getMovements(ing1.id);
      expect(ing1Movements.length).toBe(1);
      expect(ing1Movements[0].ingredientId).toBe(ing1.id);
    });
  });

  describe('calculatePortions', () => {
    it('should calculate maximum portions possible from ingredients', () => {
      const rice = inventoryService.addIngredient({
        name: 'Basmati Rice',
        category: 'Grains',
        unit: 'kg',
        currentStock: 5,
        minStock: 2,
        reorderLevel: 10,
        cost: 150,
      });

      const vegetables = inventoryService.addIngredient({
        name: 'Mixed Veg',
        category: 'Vegetables',
        unit: 'kg',
        currentStock: 3,
        minStock: 1,
        reorderLevel: 5,
        cost: 100,
      });

      // Create recipe that needs 1kg rice and 0.5kg veg per portion
      const recipe = inventoryService.addRecipe({
        name: 'Veg Pulao',
        ingredients: [
          { ingredientId: rice.id, quantity: 1 },
          { ingredientId: vegetables.id, quantity: 0.5 },
        ],
        yield: 4, // 4 portions per batch
      });

      const portions = inventoryService.calculatePortions(recipe.id);

      // Rice: 5kg / 1kg = 5 portions
      // Veg: 3kg / 0.5kg = 6 portions
      // Min = 5 portions
      expect(portions).toBe(5);
    });

    it('should return 0 for non-existent recipe', () => {
      const result = inventoryService.calculatePortions('invalid-recipe-id');
      expect(result).toBe(0);
    });
  });

  describe('usePortion', () => {
    it('should deduct ingredients when making portions', () => {
      const rice = inventoryService.addIngredient({
        name: 'Fried Rice Base',
        category: 'Grains',
        unit: 'kg',
        currentStock: 10,
        minStock: 2,
        reorderLevel: 5,
        cost: 100,
      });

      const egg = inventoryService.addIngredient({
        name: 'Eggs',
        category: 'Protein',
        unit: 'pcs',
        currentStock: 20,
        minStock: 5,
        reorderLevel: 15,
        cost: 8,
      });

      const recipe = inventoryService.addRecipe({
        name: 'Egg Fried Rice',
        ingredients: [
          { ingredientId: rice.id, quantity: 1 },
          { ingredientId: egg.id, quantity: 2 },
        ],
        yield: 2,
      });

      const success = inventoryService.usePortion(recipe.id, 3, 'user-1');

      expect(success).toBe(true);

      const updatedRice = inventoryService.getIngredient(rice.id);
      expect(updatedRice?.currentStock).toBe(7); // 10 - 3

      const updatedEgg = inventoryService.getIngredient(egg.id);
      expect(updatedEgg?.currentStock).toBe(14); // 20 - 6
    });

    it('should fail when insufficient ingredients', () => {
      const flour = inventoryService.addIngredient({
        name: 'Flour',
        category: 'Baking',
        unit: 'kg',
        currentStock: 1,
        minStock: 2,
        reorderLevel: 5,
        cost: 40,
      });

      const recipe = inventoryService.addRecipe({
        name: 'Bread',
        ingredients: [{ ingredientId: flour.id, quantity: 2 }],
        yield: 1,
      });

      const success = inventoryService.usePortion(recipe.id, 1, 'user-1');

      expect(success).toBe(false);
    });
  });

  describe('getActiveAlerts', () => {
    it('should return only unacknowledged alerts', () => {
      const alert = inventoryService.addIngredient({
        name: 'Alert Test',
        category: 'Test',
        unit: 'pcs',
        currentStock: 0,
        minStock: 5,
        reorderLevel: 10,
        cost: 10,
      });

      const alerts = inventoryService.getActiveAlerts();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.ingredientId === alert.id && !a.acknowledged)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should calculate inventory statistics', () => {
      const stats = inventoryService.getStats();

      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('lowStock');
      expect(stats).toHaveProperty('critical');
      expect(stats).toHaveProperty('outOfStock');
      expect(stats).toHaveProperty('totalValue');
      expect(stats).toHaveProperty('expiringThisWeek');

      expect(stats.totalItems).toBeGreaterThan(0);
      expect(typeof stats.totalValue).toBe('number');
    });

    it('should calculate total inventory value correctly', () => {
      const stats = inventoryService.getStats();

      // Total value should be sum of (currentStock * cost) for all items
      const ingredients = inventoryService.getAllIngredients();
      let expectedTotal = 0;

      ingredients.forEach(ing => {
        expectedTotal += ing.currentStock * ing.cost;
      });

      expect(stats.totalValue).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('getPurchaseSuggestions', () => {
    it('should suggest purchase quantities for low stock items', () => {
      inventoryService.addIngredient({
        name: 'Low Stock Item',
        category: 'Test',
        unit: 'pcs',
        currentStock: 5,
        minStock: 10,
        reorderLevel: 25,
        cost: 20,
      });

      const suggestions = inventoryService.getPurchaseSuggestions();

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('ingredient');
      expect(suggestions[0]).toHaveProperty('suggested');
      expect(suggestions[0].suggested).toBeGreaterThan(0);
    });
  });
});
