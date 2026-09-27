/**
 * Structured Server Logging Utility
 * Provides timestamps, log levels, and automatic redacting of sensitive credentials
 * (passwords, JWT secrets, Gemini API keys, Bearer tokens).
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'jwt',
  'jwt_secret',
  'secret',
  'authorization',
  'gemini_api_key',
  'apikey',
  'api_key',
  'cookie'
];

/**
 * Recursively clone and mask sensitive keys in objects
 */
const redactSensitiveData = (data) => {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Mask Bearer tokens
    if (/bearer\s+[a-zA-Z0-9.\-_]+/i.test(data)) {
      return data.replace(/bearer\s+[a-zA-Z0-9.\-_]+/gi, 'Bearer [REDACTED]');
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  if (typeof data === 'object') {
    const clean = {};
    for (const key of Object.keys(data)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.some(k => lower.includes(k))) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = redactSensitiveData(data[key]);
      }
    }
    return clean;
  }

  return data;
};

const formatLog = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  let metaStr = '';
  if (meta !== undefined) {
    const safeMeta = redactSensitiveData(meta);
    metaStr = typeof safeMeta === 'object' ? ` ${JSON.stringify(safeMeta)}` : ` ${safeMeta}`;
  }
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const logger = {
  info: (message, meta) => {
    console.log(formatLog('info', message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatLog('warn', message, meta));
  },
  error: (message, meta) => {
    console.error(formatLog('error', message, meta));
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog('debug', message, meta));
    }
  },

  // Express HTTP request logger middleware
  requestLogger: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      const message = `${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`;

      if (process.env.NODE_ENV !== 'test') {
        if (statusCode >= 500) {
          logger.error(message);
        } else if (statusCode >= 400) {
          logger.warn(message);
        } else {
          logger.info(message);
        }
      }
    });
    next();
  },

  redactSensitiveData
};

module.exports = logger;
