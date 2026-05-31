/**
 * HOJAI AI Support Agent - Logger Utility
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Structured logging with context and correlation
 */
function formatLogEntry(entry) {
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? ` [ERROR: ${entry.error.message}]` : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.service}] ${entry.message}${contextStr}${errorStr}`;
}
function createLogger(serviceName, minLevel = 'info') {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    const minLevelIndex = levels.indexOf(minLevel);
    function shouldLog(level) {
        return levels.indexOf(level) >= minLevelIndex;
    }
    function log(level, message, context, error) {
        if (!shouldLog(level))
            return;
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            service: serviceName,
            message,
            context,
        };
        if (error) {
            entry.error = {
                message: error.message,
                stack: error.stack,
                name: error.name,
            };
        }
        const formatted = formatLogEntry(entry);
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
            case 'fatal':
                console.error(formatted);
                break;
        }
        // In production, you would send to your logging service
        // Example: sendToLogService(entry);
    }
    return {
        debug: (message, context) => log('debug', message, context),
        info: (message, context) => log('info', message, context),
        warn: (message, context) => log('warn', message, context),
        error: (message, context, error) => log('error', message, context, error),
        fatal: (message, context, error) => log('fatal', message, context, error),
    };
}
export { createLogger };
//# sourceMappingURL=logger.js.map