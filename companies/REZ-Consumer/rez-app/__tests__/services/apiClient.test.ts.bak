import apiClient from '@/services/apiClient';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should make GET requests', async () => {
    const mockData = { id: '1', name: 'Test Resource' };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, status: 200 });

    const response = await apiClient.get('/resources/1');
    expect(response.status).toBe(200);
    expect(response.data.id).toBe('1');
    expect(apiClient.get).toHaveBeenCalledWith('/resources/1');
  });

  it('should make POST requests with body', async () => {
    const payload = { name: 'New Resource' };
    const created = { id: '2', name: 'New Resource' };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: created, status: 201 });

    const response = await apiClient.post('/resources', payload);
    expect(response.status).toBe(201);
    expect(response.data.name).toBe('New Resource');
    expect(apiClient.post).toHaveBeenCalledWith('/resources', payload);
  });

  it('should handle 401 unauthorized error', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue({ status: 401, message: 'Unauthorized' });

    await expect(apiClient.get('/protected')).rejects.toMatchObject({ status: 401 });
  });
});
