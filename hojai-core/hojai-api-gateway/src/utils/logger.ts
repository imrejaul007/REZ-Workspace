/**
 * Hojai Core - Logger Utility
 */

export function createLogger(service: string) {
  return {
    info: (event: string, data?: Record<string, unknown>) => {
      console.log(JSON.stringify({ level: 'info', service, event, timestamp: new Date().toISOString(), ...data }));
    },
    error: (event: string, data?: Record<string, unknown>) => {
      console.error(JSON.stringify({ level: 'error', service, event, timestamp: new Date().toISOString(), ...data }));
    },
    warn: (event: string, data?: Record<string, unknown>) => {
      console.warn(JSON.stringify({ level: 'warn', service, event, timestamp: new Date().toISOString(), ...data }));
    },
    debug: (event: string, data?: Record<string, unknown>) => {
      if (process.env.DEBUG === 'true') {
        console.log(JSON.stringify({ level: 'debug', service, event, timestamp: new Date().toISOString(), ...data }));
      }
    }
  };
}
