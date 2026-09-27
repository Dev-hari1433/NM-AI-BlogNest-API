/**
 * Input Sanitization Middleware
 * Sanitizes req.body, req.query, and req.params to prevent Cross-Site Scripting (XSS),
 * HTML tag injection, and unwanted leading/trailing whitespace.
 */

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  return str
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: URI schemes
    .replace(/javascript\s*:/gi, '')
    // Remove common inline event handlers (onload=, onerror=, onclick=)
    .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove dangerous HTML tags while leaving safe text
    .replace(/<[/]?(script|iframe|embed|object|meta|link|style)[^>]*>/gi, '')
    .trim();
};

const sanitizeValue = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === 'object' && value.constructor === Object) {
    const cleanObject = {};
    for (const key of Object.keys(value)) {
      const cleanKey = sanitizeString(key);
      cleanObject[cleanKey] = sanitizeValue(value[key]);
    }
    return cleanObject;
  }

  return value;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }

  next();
};

module.exports = sanitizeMiddleware;
module.exports.sanitizeString = sanitizeString;
module.exports.sanitizeValue = sanitizeValue;
