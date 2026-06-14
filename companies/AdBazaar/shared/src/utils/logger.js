"use strict";
/**
 * ReZ Shared Logger
 * Structured logging with winston
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createServiceLogger = createServiceLogger;
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, printf, colorize, errors } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    if (stack) {
        msg += `\n${stack}`;
    }
    return msg;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    transports: [
        new winston_1.default.transports.Console({
            format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
        }),
    ],
});
function createServiceLogger(serviceName) {
    return {
        info: (message, metadata) => exports.logger.info(message, { service: serviceName, ...metadata }),
        error: (message, error, metadata) => exports.logger.error(message, {
            service: serviceName,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            ...metadata,
        }),
        warn: (message, metadata) => exports.logger.warn(message, { service: serviceName, ...metadata }),
        debug: (message, metadata) => exports.logger.debug(message, { service: serviceName, ...metadata }),
    };
}
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map