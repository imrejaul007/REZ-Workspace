/**
 * GENIE Relationship Service - Logger Utility
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Structured JSON logging
 */
/**
 * Create a structured logger for a service
 */
export function createLogger(service) {
    return {
        info: (event, data) => {
            console.log(JSON.stringify({
                level: 'info',
                service,
                event,
                timestamp: new Date().toISOString(),
                ...data,
            }));
        },
        warn: (event, data) => {
            console.warn(JSON.stringify({
                level: 'warn',
                service,
                event,
                timestamp: new Date().toISOString(),
                ...data,
            }));
        },
        error: (event, data) => {
            console.error(JSON.stringify({
                level: 'error',
                service,
                event,
                timestamp: new Date().toISOString(),
                ...data,
            }));
        },
        debug: (event, data) => {
            if (process.env.NODE_ENV === 'development') {
                console.log(JSON.stringify({
                    level: 'debug',
                    service,
                    event,
                    timestamp: new Date().toISOString(),
                    ...data,
                }));
            }
        },
    };
}
export default createLogger;
//# sourceMappingURL=logger.js.map