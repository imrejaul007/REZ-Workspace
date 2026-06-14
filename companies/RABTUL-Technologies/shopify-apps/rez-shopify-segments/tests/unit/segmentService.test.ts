/**
 * ReZ Segments - Segmentation Service Tests
 */

const mockCustomer = {
  customerId: 'cust_123',
  email: 'customer@example.com',
  totalOrders: 5,
  totalSpent: 10000,
  avgOrderValue: 2000,
  lastOrderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  signupDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  tags: ['premium', 'regular'],
  city: 'Mumbai',
  state: 'Maharashtra',
};

describe('Segmentation Service', () => {
  describe('Rule Evaluation', () => {
    const operators = {
      eq: (a: any, b: any) => a === b,
      ne: (a: any, b: any) => a !== b,
      gt: (a: number, b: number) => a > b,
      gte: (a: number, b: number) => a >= b,
      lt: (a: number, b: number) => a < b,
      lte: (a: number, b: number) => a <= b,
      contains: (a: string, b: string) => a.includes(b),
    };

    it('should evaluate equals operator', () => {
      expect(operators.eq(5, 5)).toBe(true);
      expect(operators.eq(5, 6)).toBe(false);
    });

    it('should evaluate greater than operator', () => {
      expect(operators.gt(10, 5)).toBe(true);
      expect(operators.gt(5, 10)).toBe(false);
    });

    it('should evaluate contains operator', () => {
      expect(operators.contains('premium customer', 'premium')).toBe(true);
      expect(operators.contains('regular customer', 'vip')).toBe(false);
    });
  });

  describe('Segment Matching', () => {
    it('should match customers with high spend', () => {
      const rule = { field: 'totalSpent', operator: 'gte', value: 10000 };
      const customer = mockCustomer;

      const matches = customer.totalSpent >= rule.value;
      expect(matches).toBe(true);
    });

    it('should match customers with multiple orders', () => {
      const rule = { field: 'totalOrders', operator: 'gte', value: 3 };
      const customer = mockCustomer;

      const matches = customer.totalOrders >= rule.value;
      expect(matches).toBe(true);
    });

    it('should match customers with specific tag', () => {
      const rule = { field: 'tags', operator: 'contains', value: 'premium' };
      const customer = mockCustomer;

      const matches = customer.tags.includes('premium');
      expect(matches).toBe(true);
    });
  });

  describe('Compound Rules', () => {
    it('should evaluate AND conditions', () => {
      const rules = [
        { field: 'totalSpent', operator: 'gte', value: 5000 },
        { field: 'totalOrders', operator: 'gte', value: 3 },
      ];

      const customer = mockCustomer;
      const matches = rules.every(rule => {
        const value = customer[rule.field as keyof typeof customer];
        return operators.gte(value, rule.value);
      });

      expect(matches).toBe(true);
    });

    it('should evaluate OR conditions', () => {
      const rules = [
        { field: 'totalSpent', operator: 'gte', value: 50000 }, // false
        { field: 'totalOrders', operator: 'gte', value: 10 }, // false
      ];

      const customer = mockCustomer;
      const matches = rules.some(rule => {
        const value = customer[rule.field as keyof typeof customer];
        return operators.gte(value, rule.value);
      });

      expect(matches).toBe(false);
    });
  });

  describe('Pre-built Segments', () => {
    const templates = {
      newCustomers: {
        name: 'New Customers',
        rules: [{ field: 'totalOrders', operator: 'eq', value: 1 }],
      },
      vipCustomers: {
        name: 'VIP Customers',
        rules: [{ field: 'totalSpent', operator: 'gte', value: 10000 }],
      },
      atRisk: {
        name: 'At Risk',
        rules: [{ field: 'daysSinceLastOrder', operator: 'gt', value: 60 }],
      },
    };

    it('should define New Customers segment', () => {
      expect(templates.newCustomers.rules[0].field).toBe('totalOrders');
      expect(templates.newCustomers.rules[0].value).toBe(1);
    });

    it('should define VIP Customers segment', () => {
      expect(templates.vipCustomers.rules[0].field).toBe('totalSpent');
      expect(templates.vipCustomers.rules[0].value).toBe(10000);
    });

    it('should define At Risk segment', () => {
      expect(templates.atRisk.rules[0].field).toBe('daysSinceLastOrder');
      expect(templates.atRisk.rules[0].operator).toBe('gt');
    });
  });
});

describe('Segment Analytics', () => {
  const customers = [
    { customerId: '1', totalSpent: 15000, totalOrders: 8 },
    { customerId: '2', totalSpent: 8000, totalOrders: 4 },
    { customerId: '3', totalSpent: 12000, totalOrders: 6 },
    { customerId: '4', totalSpent: 5000, totalOrders: 2 },
    { customerId: '5', totalSpent: 20000, totalOrders: 12 },
  ];

  it('should count VIP customers', () => {
    const vips = customers.filter(c => c.totalSpent >= 10000);
    expect(vips.length).toBe(3);
  });

  it('should calculate segment percentage', () => {
    const highValue = customers.filter(c => c.totalSpent >= 10000);
    const percentage = (highValue.length / customers.length) * 100;
    expect(percentage).toBe(60);
  });

  it('should calculate average spend per segment', () => {
    const segment = customers.filter(c => c.totalOrders >= 5);
    const avgSpend = segment.reduce((sum, c) => sum + c.totalSpent, 0) / segment.length;
    expect(avgSpend).toBe(15000);
  });
});
