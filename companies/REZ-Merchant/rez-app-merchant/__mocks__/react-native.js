module.exports = {
  Platform: { OS: 'web', select: (obj) => obj.web || obj.default },
  Alert: { alert: jest.fn() },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  StyleSheet: { create: (styles) => styles },
  AppState: { currentState: 'active', addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
};
