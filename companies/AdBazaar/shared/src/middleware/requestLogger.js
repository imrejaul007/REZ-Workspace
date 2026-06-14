"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
exports.requestLoggerMiddleware = requestLoggerMiddleware;
const uuid_1 = require("uuid");
/**
 * Adds a unique request ID to each request
 */
function requestIdMiddleware(req, _res, next) {
    req.requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    next();
}
/**
 * Logs incoming requests and response times
 */
function requestLoggerMiddleware(req, res, next) {
    const startTime = Date.now();
    // Log incoming request
    console.log(JSON.stringify({
        level: 'info',
        type: 'request',
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
    }));
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(JSON.stringify({
            level: res.statusCode >= 400 ? 'warn' : 'info',
            type: 'response',
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
        }));
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map