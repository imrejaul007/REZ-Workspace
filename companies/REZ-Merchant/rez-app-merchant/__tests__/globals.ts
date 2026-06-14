// Global test setup
(global as unknown).__DEV__ = false;
(global as unknown).fetch = jest.fn();
(global as unknown).Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
};
