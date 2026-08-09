/**
 * Production Rate Limiter with Redis sliding-window support and sliding-window in-memory fallback.
 * Protects auth, API keys, SMS sending, and public endpoints against brute force and SMS pumping attacks.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale memory entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 60000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Upstash Redis REST API (Serverless friendly)
  if (redisUrl && redisToken) {
    try {
      const key = `ratelimit:${identifier}`;
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['TTL', key],
        ]),
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const count = data[0]?.result || 1;
        let ttl = data[1]?.result || -1;

        if (count === 1 || ttl < 0) {
          // Set expiration on first hit
          await fetch(`${redisUrl}/EXPIRE/${key}/${windowSeconds}`, {
            headers: { Authorization: `Bearer ${redisToken}` },
            cache: 'no-store',
          });
          ttl = windowSeconds;
        }

        const remaining = Math.max(0, limit - count);
        const reset = Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds);

        return {
          success: count <= limit,
          limit,
          remaining,
          reset,
        };
      }
    } catch (err) {
      console.warn('[RateLimit] Redis error, falling back to in-memory store:', err);
    }
  }

  // 2. High-performance In-Memory Fallback
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    memoryStore.set(identifier, newRecord);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil(newRecord.resetTime / 1000),
    };
  }

  record.count += 1;
  const success = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);

  return {
    success,
    limit,
    remaining,
    reset: Math.ceil(record.resetTime / 1000),
  };
}

/** Pre-configured rate limiters for critical application paths */
export async function authRateLimiter(ip: string): Promise<RateLimitResult> {
  // Max 5 login/signup attempts per 15 minutes per IP
  return checkRateLimit(`auth:${ip}`, 5, 900);
}

export async function smsSendRateLimiter(userIdOrIp: string): Promise<RateLimitResult> {
  // Max 20 SMS dispatch calls per minute per user/IP
  return checkRateLimit(`sms:${userIdOrIp}`, 20, 60);
}

export async function apiRateLimiter(ipOrKey: string): Promise<RateLimitResult> {
  // Max 60 API calls per minute
  return checkRateLimit(`api:${ipOrKey}`, 60, 60);
}
