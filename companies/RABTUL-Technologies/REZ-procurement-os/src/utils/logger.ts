export default {
  info: (message: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] INFO: ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(`[${new Date().toISOString()}] WARN: ${message}`, ...args),
  debug: (message: string, ...args: unknown[]) => console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, ...args)
};
