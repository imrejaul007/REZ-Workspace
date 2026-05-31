/**
 * HOJAI Embedding Service - Logger Utility
 * Version: 1.0.0 | Date: May 30, 2026
 */
class Logger {
    serviceName;
    constructor(serviceName) {
        this.serviceName = serviceName;
    }
    formatLog(level, event, data) {
        return {
            timestamp: new Date().toISOString(),
            level,
            service: this.serviceName,
            event,
            message: this.getMessage(level, event, data),
            ...(data || {}),
        };
    }
    getMessage(level, event, data) {
        const base = `[${this.serviceName}] ${event}`;
        if (data && Object.keys(data).length > 0) {
            const dataStr = Object.entries(data)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                .join(' ');
            return `${base} ${dataStr}`;
        }
        return base;
    }
    output(entry) {
        const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
        const output = `${prefix} ${entry.message}`;
        switch (entry.level) {
            case 'error':
                console.error(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            default:
                console.log(output);
        }
        // Also output structured JSON for log aggregation
        if (process.env['NODE_ENV'] === 'production') {
            console.log(JSON.stringify(entry));
        }
    }
    debug(event, data) {
        this.output(this.formatLog('debug', event, data));
    }
    info(event, data) {
        this.output(this.formatLog('info', event, data));
    }
    warn(event, data) {
        this.output(this.formatLog('warn', event, data));
    }
    error(event, data) {
        this.output(this.formatLog('error', event, data));
    }
}
export function createLogger(serviceName) {
    return new Logger(serviceName);
}
//# sourceMappingURL=logger.js.map