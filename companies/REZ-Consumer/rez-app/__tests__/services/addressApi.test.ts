// @ts-nocheck
import addressApi, { AddressType } from '@/services/addressApi';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockClient = require('@/services/apiClient').default;

// normaliseAddress maps _id → id, so mock data only needs to match the normalised shape

const mockAddress = {
  id: 'addr1',
  type: AddressType.HOME,
  title: 'Home',
  addressLine1: '123 MG Road',
  city: 'Bangalore',
  state: 'Karnataka',
  postalCode: '560001',
  country: 'India',
  isDefault: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('addressApi', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getUserAddresses', () => {
    it('returns list of addresses', async () => {
      // Backend wraps list as { addresses: [...] }
      mockClient.get.mockResolvedValueOnce({ success: true, data: { addresses: [mockAddress] } });
      const res = await addressApi.getUserAddresses();
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith('/addresses');
    });

    it('returns empty array when no addresses', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { addresses: [] } });
      const res = await addressApi.getUserAddresses();
      expect(res.data).toHaveLength(0);
    });

    it('re-throws on network error', async () => {
      // getUserAddresses does not catch errors — it propagates them
      mockClient.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(addressApi.getUserAddresses()).rejects.toThrow('Network error');
    });
  });

  describe('getAddressById', () => {
    it('returns address by id', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: mockAddress });
      const res = await addressApi.getAddressById('addr1');
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe('addr1');
    });

    it('handles not found', async () => {
      mockClient.get.mockResolvedValueOnce({ success: false, message: 'Address not found' });
      const res = await addressApi.getAddressById('invalid');
      expect(res.success).toBe(false);
    });
  });

  describe('createAddress', () => {
    it('creates address successfully', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true, data: mockAddress });
      const res = await addressApi.createAddress({
        type: AddressType.HOME,
        title: 'Home',
        addressLine1: '123 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
      });
      expect(res.success).toBe(true);
      expect(res.data?.city).toBe('Bangalore');
      expect(mockClient.post).toHaveBeenCalledWith('/addresses', expect.objectContaining({ city: 'Bangalore' }));
    });

    it('handles validation error', async () => {
      mockClient.post.mockResolvedValueOnce({ success: false, message: 'Invalid postal code' });
      const res = await addressApi.createAddress({ type: AddressType.HOME, title: 'Home', addressLine1: '123', city: 'City', state: 'State', postalCode: 'invalid' });
      expect(res.success).toBe(false);
    });
  });

  describe('updateAddress', () => {
    it('updates address fields', async () => {
      mockClient.put.mockResolvedValueOnce({ success: true, data: { ...mockAddress, city: 'Mumbai' } });
      const res = await addressApi.updateAddress('addr1', { city: 'Mumbai' });
      expect(res.success).toBe(true);
      expect(res.data?.city).toBe('Mumbai');
    });
  });

  describe('deleteAddress', () => {
    it('deletes address by id', async () => {
      // deleteAddress calls apiClient.delete directly (no normalisation)
      mockClient.delete.mockResolvedValueOnce({ success: true, data: { deletedId: 'addr1' } });
      const res = await addressApi.deleteAddress('addr1');
      expect(res.success).toBe(true);
      expect(mockClient.delete).toHaveBeenCalledWith('/addresses/addr1');
    });
  });

  describe('setDefaultAddress', () => {
    it('sets address as default', async () => {
      // setDefaultAddress uses PATCH /addresses/:id/default
      mockClient.patch.mockResolvedValueOnce({ success: true, data: { ...mockAddress, isDefault: true } });
      const res = await addressApi.setDefaultAddress('addr1');
      expect(res.success).toBe(true);
      expect(res.data?.isDefault).toBe(true);
      expect(mockClient.patch).toHaveBeenCalledWith('/addresses/addr1/default', {});
    });
  });
});
