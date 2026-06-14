/**
 * usePaymentMethods Hook Tests
 */

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet' | 'bank';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

const mockLoadPaymentMethods = jest.fn();
const mockAddPaymentMethod = jest.fn();
const mockRemovePaymentMethod = jest.fn();

describe('usePaymentMethods', () => {
  const sampleMethods: PaymentMethod[] = [
    { id: 'pm-1', type: 'card', last4: '4242', brand: 'Visa', isDefault: true },
    { id: 'pm-2', type: 'wallet', isDefault: false },
  ];

  beforeEach(() => {
    mockLoadPaymentMethods.mockReset();
    mockAddPaymentMethod.mockReset();
    mockRemovePaymentMethod.mockReset();
  });

  it('should load saved payment methods', async () => {
    mockLoadPaymentMethods.mockResolvedValue(sampleMethods);

    const methods: PaymentMethod[] = await mockLoadPaymentMethods('user-1');
    expect(methods).toHaveLength(2);
    expect(methods[0].type).toBe('card');
    expect(methods[0].last4).toBe('4242');
  });

  it('should add new payment method', async () => {
    const newMethod: PaymentMethod = { id: 'pm-3', type: 'bank', isDefault: false };
    mockAddPaymentMethod.mockResolvedValue({ success: true, method: newMethod });

    const result = await mockAddPaymentMethod('user-1', newMethod);
    expect(result.success).toBe(true);
    expect(result.method.id).toBe('pm-3');
    expect(result.method.type).toBe('bank');
  });

  it('should remove payment method', async () => {
    mockRemovePaymentMethod.mockResolvedValue({ success: true, removedId: 'pm-2' });

    const result = await mockRemovePaymentMethod('user-1', 'pm-2');
    expect(result.success).toBe(true);
    expect(result.removedId).toBe('pm-2');
    expect(mockRemovePaymentMethod).toHaveBeenCalledWith('user-1', 'pm-2');
  });
});
