/**
 * Dev-only logging utilities.
 * console.log and console.warn are silenced in production builds.
 * console.error is intentionally excluded — errors must always surface.
 */

const isDev: boolean =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

export const devLog: (...args: unknown[]) => void = isDev ? console.log.bind(console) : () => {};
export const devWarn: (...args: unknown[]) => void = isDev ? console.warn.bind(console) : () => {};
