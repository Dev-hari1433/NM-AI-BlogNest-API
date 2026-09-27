/**
 * In-memory sliding window Rate Limiting Middleware
 * Protects endpoints against brute-force, denial-of-service, and credential stuffing attacks.
 */

const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // default 15 minutes
  const max = options.max || 100; // default 100 requests per window
  const message = options.message || 'Too many requests from this IP, please try again later';

  // In-memory store: Map<ip, { count: number, resetTime: number }>
  const hits = new Map();

  // Periodic cleanup of expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref(); // unref so it does not block node process exit

  return (req, res, next) => {
    // Skip rate limiting in test environment if disabled
    if (process.env.NODE_ENV === 'test' && options.skipInTest) {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown-ip';
    const now = Date.now();

    let record = hits.get(ip);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      hits.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        message
      });
    }

    next();
  };
};

// Global rate limiter: 200 requests per 15 minutes
const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later'
});

// Stricter auth rate limiter: 25 requests per 15 minutes
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many login or registration attempts from this IP, please try again in 15 minutes'
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  authLimiter
};
