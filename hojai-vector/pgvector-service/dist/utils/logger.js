/**
 * HOJAI pgvector Service - Logger Utility
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Structured logging for the pgvector service
 */
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
export function createLogger(serviceName) {
    const log = (level, message, meta) => {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            service: serviceName,
            message,
            ...meta,
        };
        const logMessage = JSON.stringify(entry);
        switch (level) {
            case 'debug':
                console.debug(logMessage);
                break;
            case 'info':
                console.info(logMessage);
                break;
            case 'warn':
                console.warn(logMessage);
                break;
            case 'error':
                console.error(logMessage);
                break;
        }
    };
    const logger = {
        debug: (message, meta) => log('debug', message, meta),
        info: (message, meta) => log('info', message, meta),
        warn: (message, meta) => log('warn', message, meta),
        error: (message, meta) => log('error', message, meta),
        child: (meta) => {
            return createLogger(serviceName);
        },
    };
    return logger;
}
//# sourceMappingURL=logger.js.map