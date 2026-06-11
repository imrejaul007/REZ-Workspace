jest.mock('../../services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from '../../services/api/client';
const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockPatch = apiClient.patch as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

let storeService: any;
beforeAll(async () => {
  storeService = (await import('../../services/api/stores')).default;
});

const MOCK_STORE = { _id: 's1', name: 'Test Cafe', isActive: true };

describe('StoreService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getStores returns store list', async () => {
    mockGet.mockResolvedValue({ success: true, data: { data: [MOCK_STORE], count: 1 } });
    const result = await storeService.getStores();
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('merchant/stores'));
  });

  it('getActiveStore returns current store', async () => {
    mockGet.mockResolvedValue({ success: true, data: MOCK_STORE });
    const result = await storeService.getActiveStore();
    expect(result).toBeDefined();
  });

  it('getStoreById fetches by ID', async () => {
    mockGet.mockResolvedValue({ success: true, data: MOCK_STORE });
    await storeService.getStoreById('s1');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('s1'));
  });

  it('createStore sends store data', async () => {
    mockPost.mockResolvedValue({ success: true, data: { _id: 's2', name: 'New Store' } });
    await storeService.createStore({ name: 'New Store', category: 'restaurant' });
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('stores'),
      expect.objectContaining({ name: 'New Store' })
    );
  });

  it('updateStore sends updates', async () => {
    mockPut.mockResolvedValue({ success: true, data: { ...MOCK_STORE, name: 'Updated' } });
    await storeService.updateStore('s1', { name: 'Updated' });
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining('s1'),
      expect.objectContaining({ name: 'Updated' })
    );
  });

  it('deleteStore removes store', async () => {
    mockDelete.mockResolvedValue({ success: true });
    await storeService.deleteStore('s1');
    expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining('s1'));
  });

  it('activateStore activates', async () => {
    mockPut.mockResolvedValue({ success: true, data: { ...MOCK_STORE, isActive: true } });
    await storeService.activateStore('s1');
    expect(mockPut).toHaveBeenCalled();
  });

  it('deactivateStore deactivates', async () => {
    mockPut.mockResolvedValue({ success: true, data: { ...MOCK_STORE, isActive: false } });
    await storeService.deactivateStore('s1');
    expect(mockPut).toHaveBeenCalled();
  });

  it('patchStore sends partial update', async () => {
    mockPatch.mockResolvedValue({ success: true, data: MOCK_STORE });
    await storeService.patchStore('s1', { isActive: false });
    expect(mockPatch).toHaveBeenCalledWith(
      expect.stringContaining('s1'),
      expect.objectContaining({ isActive: false })
    );
  });
});
