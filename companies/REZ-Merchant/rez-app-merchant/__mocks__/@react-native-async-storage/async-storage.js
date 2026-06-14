const store = {};

const asyncStorage = {
  setItem: jest.fn(async (key, value) => {
    store[key] = value;
  }),
  getItem: jest.fn(async (key) => store[key] || null),
  removeItem: jest.fn(async (key) => {
    delete store[key];
  }),
  multiGet: jest.fn(async (keys) => keys.map((k) => [k, store[k] || null])),
  multiSet: jest.fn(async (pairs) => {
    pairs.forEach(([k, v]) => { store[k] = v; });
  }),
  multiRemove: jest.fn(async (keys) => {
    keys.forEach((k) => { delete store[k]; });
  }),
  clear: jest.fn(async () => {
    Object.keys(store).forEach((k) => { delete store[k]; });
  }),
  getAllKeys: jest.fn(async () => Object.keys(store)),
};

export default asyncStorage;
module.exports = asyncStorage;
