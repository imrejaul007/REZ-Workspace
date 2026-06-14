jest.mock('../../services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock('../../services/storage', () => ({
  storageService: { getAuthToken: jest.fn().mockResolvedValue('test-token') },
  COOKIE_AUTH_ENABLED: false,
}));

import { apiClient } from '../../services/api/client';
const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

let offersService: any;
beforeAll(async () => {
  const mod = require('../../services/api/offers');
  offersService = mod.offersService;
});

describe('OffersService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getStoreOffers returns deals list', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { deals: [{ _id: 'o1', title: '50% Off' }] },
    });
    const result = await offersService.getStoreOffers('s1');
    expect(result.success).toBe(true);
  });

  it('createOffer sends offer data', async () => {
    const offer = { title: 'Buy 1 Get 1', discountType: 'percentage', discountValue: 50 };
    mockPost.mockResolvedValue({ success: true, data: { _id: 'o2', ...offer } });
    const result = await offersService.createOffer(offer);
    expect(mockPost).toHaveBeenCalled();
  });

  it('updateOffer sends partial update', async () => {
    mockPut.mockResolvedValue({ success: true, data: { _id: 'o1', title: 'Updated' } });
    const result = await offersService.updateOffer('o1', { title: 'Updated' });
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining('o1'),
      expect.objectContaining({ title: 'Updated' })
    );
  });

  it('deleteOffer removes offer', async () => {
    mockDelete.mockResolvedValue({ success: true });
    const result = await offersService.deleteOffer('o1');
    expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining('o1'));
  });

  it('getOfferById fetches single offer', async () => {
    mockGet.mockResolvedValue({ success: true, data: { _id: 'o1', title: '50% Off' } });
    const result = await offersService.getOfferById('o1');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('o1'));
  });
});
