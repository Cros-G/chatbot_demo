"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ConflictError = exports.NotFoundError = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 400;
        this.code = 'VALIDATION_ERROR';
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 404;
        this.code = 'NOT_FOUND';
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 409;
        this.code = 'CONFLICT';
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
const errorHandler = (error, req, res, _next) => {
    console.error('Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body
    });
    const statusCode = error.statusCode || 500;
    const code = error.code || 'INTERNAL_SERVER_ERROR';
    res.status(statusCode).json({
        error: {
            code,
            message: error.message,
            ...(error.details && { details: error.details })
        }
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map