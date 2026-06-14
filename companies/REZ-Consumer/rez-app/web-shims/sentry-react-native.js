// Web shim for @sentry/react-native
// @sentry/react-native has "browser": null — it's native-only.
// On web, use @sentry/browser instead (or no-ops if not needed).
// All functions are safe no-ops so the app boots without crashes.

export const init = () => {};
export const wrap = (Component) => Component;
export const captureException = () => {};
export const captureMessage = () => {};
export const captureEvent = () => {};
export const addBreadcrumb = () => {};
export const setUser = () => {};
export const setTag = () => {};
export const setExtra = () => {};
export const setContext = () => {};
export const configureScope = () => {};
export const withScope = (callback) => { try { callback({ setTag: () => {}, setExtra: () => {}, setUser: () => {}, setContext: () => {}, setLevel: () => {} }); } catch (_) {} };
export const startTransaction = () => ({ finish: () => {}, setStatus: () => {}, setData: () => {} });
export const getCurrentHub = () => ({ configureScope: () => {}, captureException: () => {}, captureMessage: () => {} });
export const ReactNavigationInstrumentation = class {};
export const ReactNativeTracing = class {};
export const TimeToInitialDisplay = () => null;
export const TimeToFullDisplay = () => null;
export const ErrorBoundary = ({ children }) => children;
export const withErrorBoundary = (Component) => Component;
export const withProfiler = (Component) => Component;
export const createReduxEnhancer = () => (next) => next;
export const Severity = { Fatal: 'fatal', Error: 'error', Warning: 'warning', Info: 'info', Debug: 'debug' };

export default {
  init, wrap, captureException, captureMessage, captureEvent,
  addBreadcrumb, setUser, setTag, setExtra, setContext,
  configureScope, withScope, startTransaction, getCurrentHub,
  ReactNavigationInstrumentation, ReactNativeTracing,
  TimeToInitialDisplay, TimeToFullDisplay,
  ErrorBoundary, withErrorBoundary, withProfiler,
  createReduxEnhancer, Severity,
};
