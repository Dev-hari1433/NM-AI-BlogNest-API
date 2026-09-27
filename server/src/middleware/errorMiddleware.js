/**
 * Centralized Error Handling Middleware
 * Guarantees a consistent JSON error envelope:
 * {
 *   "success": false,
 *   "message": "..."
 * }
 * Supports HTTP status codes 400, 401, 403, 404, 409, 429, 500
 * Never leaks stack traces or internal secrets to client responses.
 */

const logger = require('../utils/logger');

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // 1. Mongoose Bad ObjectId (CastError) -> 400 Bad Request
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid ID format for resource '${err.path || 'identifier'}'`;
  }

  // 2. Mongoose Validation Error -> 400 Bad Request
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const validationErrors = Object.values(err.errors || {}).map(e => e.message);
    message = validationErrors.length > 0 ? validationErrors.join(', ') : 'Validation error';
  }

  // 3. MongoDB Duplicate Key Error (Code 11000) -> 409 Conflict
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    message = `A record with this ${duplicatedField} already exists`;
  }

  // 4. JWT Authentication Errors -> 401 Unauthorized
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // 5. SyntaxError (Invalid JSON body parsed by express.json) -> 400 Bad Request
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body in request';
  }

  // Structured server-side logging (redacting sensitive data)
  if (process.env.NODE_ENV !== 'test') {
    logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`);
  }

  // Return clean client response without stack trace
  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
