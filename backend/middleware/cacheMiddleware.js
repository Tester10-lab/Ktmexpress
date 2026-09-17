// In-memory server-side TTL cache for expensive analytics and public read endpoints
const serverCache = new Map();

/**
 * Server-side in-memory caching middleware.
 *
 * @param {number} ttlSeconds - Time-to-live in seconds (default 30s)
 */
export const cacheResponse = (ttlSeconds = 30) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Allow cache bypass via header
    if (req.headers['x-bypass-cache'] || req.query.noCache) {
      return next();
    }

    const key = `${req.baseUrl || ''}${req.path}:${JSON.stringify(req.query)}:${req.user?.id || 'anon'}`;
    const cached = serverCache.get(key);

    if (cached && cached.expires > Date.now()) {
      res.setHeader('X-Server-Cache', 'HIT');
      return res.status(cached.status).json(cached.body);
    }

    // Intercept res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        serverCache.set(key, {
          status: res.statusCode,
          body,
          expires: Date.now() + ttlSeconds * 1000,
        });
      }
      res.setHeader('X-Server-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

/**
 * Purge cache entries matching a given pattern (or all if omitted).
 */
export const invalidateServerCache = (pattern) => {
  if (!pattern) {
    serverCache.clear();
    return;
  }
  for (const key of serverCache.keys()) {
    if (key.includes(pattern)) {
      serverCache.delete(key);
    }
  }
};

export default cacheResponse;
