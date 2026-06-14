"use strict";
// ReZ Shared Utilities
// Common middleware, validators, and utilities for all ReZ services
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceLogger = exports.logger = exports.AppError = exports.createErrorResponse = exports.createSuccessResponse = exports.validateParams = exports.validateQuery = exports.validateBody = exports.requestLoggerMiddleware = exports.requestIdMiddleware = exports.notFoundHandler = exports.errorHandler = exports.rateLimitMiddleware = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
var auth_js_1 = require("./middleware/auth.js");
Object.defineProperty(exports, "authMiddleware", { enumerable: true, get: function () { return auth_js_1.authMiddleware; } });
Object.defineProperty(exports, "optionalAuthMiddleware", { enumerable: true, get: function () { return auth_js_1.optionalAuthMiddleware; } });
var rateLimit_js_1 = require("./middleware/rateLimit.js");
Object.defineProperty(exports, "rateLimitMiddleware", { enumerable: true, get: function () { return rateLimit_js_1.rateLimitMiddleware; } });
var errorHandler_js_1 = require("./middleware/errorHandler.js");
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return errorHandler_js_1.errorHandler; } });
Object.defineProperty(exports, "notFoundHandler", { enumerable: true, get: function () { return errorHandler_js_1.notFoundHandler; } });
var requestLogger_js_1 = require("./middleware/requestLogger.js");
Object.defineProperty(exports, "requestIdMiddleware", { enumerable: true, get: function () { return requestLogger_js_1.requestIdMiddleware; } });
Object.defineProperty(exports, "requestLoggerMiddleware", { enumerable: true, get: function () { return requestLogger_js_1.requestLoggerMiddleware; } });
var validation_js_1 = require("./middleware/validation.js");
Object.defineProperty(exports, "validateBody", { enumerable: true, get: function () { return validation_js_1.validateBody; } });
Object.defineProperty(exports, "validateQuery", { enumerable: true, get: function () { return validation_js_1.validateQuery; } });
Object.defineProperty(exports, "validateParams", { enumerable: true, get: function () { return validation_js_1.validateParams; } });
var response_js_1 = require("./utils/response.js");
Object.defineProperty(exports, "createSuccessResponse", { enumerable: true, get: function () { return response_js_1.createSuccessResponse; } });
Object.defineProperty(exports, "createErrorResponse", { enumerable: true, get: function () { return response_js_1.createErrorResponse; } });
var errors_js_1 = require("./utils/errors.js");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return errors_js_1.AppError; } });
var logger_js_1 = require("./utils/logger.js");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_js_1.logger; } });
Object.defineProperty(exports, "createServiceLogger", { enumerable: true, get: function () { return logger_js_1.createServiceLogger; } });
//# sourceMappingURL=index.js.map