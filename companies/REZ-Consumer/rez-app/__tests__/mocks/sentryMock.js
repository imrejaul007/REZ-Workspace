// Stub for @sentry/react-native
// The package requires native modules (RNSentry) that are unavailable in the
// Node/Jest test environment.  This stub satisfies imports without loading any
// native bindings.
module.exports = {
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  captureEvent: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
  setExtra: jest.fn(),
  withScope: jest.fn((cb) => cb({ setTag: jest.fn(), setContext: jest.fn() })),
  Severity: { Error: 'error', Warning: 'warning', Info: 'info', Debug: 'debug' },
  ReactNativeTracing: jest.fn(),
  wrap: jest.fn((component) => component),
  ErrorBoundary: ({ children }) => children,
};
