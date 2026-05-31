/**
 * HOJAI Research Assistant - Logger Utility
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Structured logging for the research assistant service
 */
/**
 * Create a logger instance for a specific service
 */
export function createLogger(serviceName) {
    const formatLogEntry = (level, message, data) => {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            service: serviceName,
            message,
            ...(data && { data }),
        };
        return JSON.stringify(entry);
    };
    const log = (level, message, data) => {
        const formatted = formatLogEntry(level, message, data);
        switch (level) {
            case 'debug':
                console.debug(formatted);
                break;
            case 'info':
                console.info(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            case 'error':
                console.error(formatted);
                break;
        }
    };
    return {
        debug: (message, data) => log('debug', message, data),
        info: (message, data) => log('info', message, data),
        warn: (message, data) => log('warn', message, data),
        error: (message, data) => log('error', message, data),
    };
}
export default createLogger;
//# sourceMappingURL=logger.js.map