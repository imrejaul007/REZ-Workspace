/**
 * Hojai Core - Logger Utility
 * Version: 1.0 | Date: May 29, 2026
 */
export function createLogger(config) {
    const name = typeof config === 'string' ? config : config.name;
    const level = typeof config === 'string' ? 'info' : config.level || 'info';
    const metadata = typeof config === 'string' ? {} : config.metadata || {};
    const format = (level, message, data) => {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            name,
            message,
            ...metadata,
            ...data
        });
    };
    return {
        debug: (message, data) => {
            if (shouldLog('debug', level)) {
                console.debug(format('debug', message, data));
            }
        },
        info: (message, data) => {
            if (shouldLog('info', level)) {
                console.info(format('info', message, data));
            }
        },
        warn: (message, data) => {
            if (shouldLog('warn', level)) {
                console.warn(format('warn', message, data));
            }
        },
        error: (message, data) => {
            if (shouldLog('error', level)) {
                console.error(format('error', message, data));
            }
        }
    };
}
function shouldLog(level, minLevel) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[minLevel];
}
//# sourceMappingURL=logger.js.map