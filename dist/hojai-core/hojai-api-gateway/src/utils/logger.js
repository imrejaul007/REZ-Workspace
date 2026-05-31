/**
 * Hojai Core - Logger Utility
 */
export function createLogger(service) {
    return {
        info: (event, data) => {
            console.log(JSON.stringify({ level: 'info', service, event, timestamp: new Date().toISOString(), ...data }));
        },
        error: (event, data) => {
            console.error(JSON.stringify({ level: 'error', service, event, timestamp: new Date().toISOString(), ...data }));
        },
        warn: (event, data) => {
            console.warn(JSON.stringify({ level: 'warn', service, event, timestamp: new Date().toISOString(), ...data }));
        },
        debug: (event, data) => {
            if (process.env.DEBUG === 'true') {
                console.log(JSON.stringify({ level: 'debug', service, event, timestamp: new Date().toISOString(), ...data }));
            }
        }
    };
}
//# sourceMappingURL=logger.js.map