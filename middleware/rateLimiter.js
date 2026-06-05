// Memory-based sliding window rate limiter middleware

const requestLogs = new Map(); // key -> Array of timestamps (ms)

/**
 * Memory Rate Limiter Middleware Builder
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 mins)
 * @param {number} options.max - Max requests allowed per window (default: 100)
 * @param {string} options.message - Error message to return when blocked
 */
export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const max = options.max || 100; // 100 requests default
  const message = options.message || 'Too many requests, please try again later.';

  // Cleanup old records periodically to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requestLogs.entries()) {
      const activeTimestamps = timestamps.filter(time => now - time < windowMs);
      if (activeTimestamps.length === 0) {
        requestLogs.delete(key);
      } else {
        requestLogs.set(key, activeTimestamps);
      }
    }
  }, 10 * 60 * 1000); // run cleanup every 10 minutes

  return (req, res, next) => {
    // Determine client key: check Authorization API key first, then fallback to IP
    const authHeader = req.headers['authorization'];
    const apiKey = authHeader && authHeader.split(' ')[1];
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = apiKey ? `api_key:${apiKey}` : `ip:${clientIp}`;

    const now = Date.now();
    if (!requestLogs.has(key)) {
      requestLogs.set(key, []);
    }

    const timestamps = requestLogs.get(key);
    
    // Filter timestamps within current window
    const windowStart = now - windowMs;
    const activeTimestamps = timestamps.filter(time => time > windowStart);

    if (activeTimestamps.length >= max) {
      res.status(429).json({
        error: message,
        limit: max,
        remaining: 0,
        retryAfterMs: Math.max(0, activeTimestamps[0] + windowMs - now)
      });
      return;
    }

    // Record request and save
    activeTimestamps.push(now);
    requestLogs.set(key, activeTimestamps);

    // Set headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - activeTimestamps.length);

    next();
  };
}
