/**
 * Redis Mock for Testing
 */

const store = new Map<string, string>();

export const mockRedis = {
  get: jest.fn(async (key: string) => store.get(key) || null),
  set: jest.fn(async (key: string, value: string) => {
    store.set(key, value);
    return 'OK';
  }),
  setex: jest.fn(async (key: string, ttl: number, value: string) => {
    store.set(key, value);
    return 'OK';
  }),
  del: jest.fn(async (key: string) => {
    store.delete(key);
    return 1;
  }),
  exists: jest.fn(async (key: string) => (store.has(key) ? 1 : 0)),
  incr: jest.fn(async (key: string) => {
    const val = parseInt(store.get(key) || '0') + 1;
    store.set(key, val.toString());
    return val;
  }),
  decr: jest.fn(async (key: string) => {
    const val = parseInt(store.get(key) || '0') - 1;
    store.set(key, val.toString());
    return val;
  }),
  expire: jest.fn(async () => 1),
  ttl: jest.fn(async () => -1),
  keys: jest.fn(async (pattern: string) => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(store.keys()).filter(k => regex.test(k));
  }),
  flushall: jest.fn(async () => {
    store.clear();
    return 'OK';
  }),
  quit: jest.fn(async () => 'OK'),
  ping: jest.fn(async () => 'PONG'),
};

// Reset function for tests
export const resetMockRedis = () => {
  store.clear();
  Object.values(mockRedis).forEach(fn => {
    if (jest.isMockFunction(fn)) {
      fn.mockClear();
    }
  });
};

export default mockRedis;
