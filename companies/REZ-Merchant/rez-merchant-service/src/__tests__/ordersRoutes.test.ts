jest.mock('../middleware/auth', () => ({
  merchantAuth: (_req: any, _res: any, next: any) => next(),
}));

const mockStoreFind = jest.fn();
const mockOrderCountDocuments = jest.fn();
const mockOrderAggregate = jest.fn();
const mockOrderFindOne = jest.fn();
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
const mockCacheDel = jest.fn();

jest.mock('../models/Store', () => ({
  Store: {
    find: (...args: any[]) => mockStoreFind(...args),
  },
}));

jest.mock('../models/Order', () => ({
  Order: {
    countDocuments: (...args: any[]) => mockOrderCountDocuments(...args),
    aggregate: (...args: any[]) => mockOrderAggregate(...args),
    findOne: (...args: any[]) => mockOrderFindOne(...args),
  },
}));

jest.mock('../config/redis', () => ({
  cacheGet: (...args: any[]) => mockCacheGet(...args),
  cacheSet: (...args: any[]) => mockCacheSet(...args),
  cacheDel: (...args: any[]) => mockCacheDel(...args),
}));

import ordersRouter from '../routes/orders';

describe('orders router', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    mockCacheDel.mockResolvedValue(undefined);
    mockStoreFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ _id: 'store-1' }]),
    });
    mockOrderCountDocuments.mockResolvedValue(0);
    mockOrderAggregate.mockResolvedValue([]);
    mockOrderFindOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
  });

  it('registers /stats/summary before /:id so the summary route is not shadowed', () => {
    const routeLayers = (ordersRouter as any).stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    const summaryIndex = routeLayers.findIndex((route: any) =>
      route.path === '/stats/summary' && route.methods.includes('get'));
    const orderByIdIndex = routeLayers.findIndex((route: any) =>
      route.path === '/:id' && route.methods.includes('get'));

    expect(summaryIndex).toBeGreaterThanOrEqual(0);
    expect(orderByIdIndex).toBeGreaterThanOrEqual(0);
    expect(summaryIndex).toBeLessThan(orderByIdIndex);
  });
});
