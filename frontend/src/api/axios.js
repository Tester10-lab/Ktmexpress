import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 10000,
});

// In-memory token store mapping role -> access token
const tokenStore = {};
// Map of in-flight refresh requests to avoid concurrent duplicate requests
const refreshPromises = {};

// Client-side in-memory response cache for GET requests
const responseCache = new Map();
// Client-side in-flight GET requests map to deduplicate concurrent calls
const inFlightRequests = new Map();

export const clearApiCache = (urlPattern) => {
  if (!urlPattern) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(urlPattern)) {
      responseCache.delete(key);
    }
  }
};

export const setAccessToken = (role, token) => {
  if (token) {
    tokenStore[role] = token;
  } else {
    delete tokenStore[role];
  }
};

export const getAccessToken = (role) => {
  return tokenStore[role];
};

const getActiveRole = () => {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/vendor')) return 'vendor';
  if (path.startsWith('/dispatcher')) return 'dispatcher';
  if (path.startsWith('/rider')) return 'rider';
  return localStorage.getItem('last_active_role') || 'vendor';
};

api.interceptors.request.use(
  (config) => {
    const activeRole = getActiveRole();
    const token = getAccessToken(activeRole);
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Automatic cache busting on write operations
    if (['post', 'put', 'patch', 'delete'].includes((config.method || '').toLowerCase())) {
      clearApiCache();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally & cache management
api.interceptors.response.use(
  (response) => {
    const config = response.config;
    if ((config.method || '').toLowerCase() === 'get' && config.cache !== false) {
      const ttl = typeof config.cache === 'number' ? config.cache : 15000; // default 15s cache
      const cacheKey = `${config.url}:${JSON.stringify(config.params || {})}`;
      responseCache.set(cacheKey, {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        expires: Date.now() + ttl,
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh') || url.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const activeRole = getActiveRole();

      if (!refreshPromises[activeRole]) {
        refreshPromises[activeRole] = axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          { role: activeRole },
          { withCredentials: true }
        ).then(res => {
          delete refreshPromises[activeRole];
          return res.data;
        }).catch(err => {
          delete refreshPromises[activeRole];
          throw err;
        });
      }

      try {
        const data = await refreshPromises[activeRole];
        setAccessToken(activeRole, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (err) {
        setAccessToken(activeRole, null);
        localStorage.removeItem(`${activeRole}_user`);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }

    const message = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : null) || error.message || 'Something went wrong';

    return Promise.reject({
      message,
      status: error.response?.status,
      errors: error.response?.data?.errors || [],
      response: error.response,
    });
  }
);

/**
 * Enhanced GET helper with in-memory caching and request deduplication
 */
const originalGet = api.get.bind(api);
api.get = function (url, config = {}) {
  const method = 'get';
  const shouldCache = config.cache !== false && !config.bypassCache;
  const cacheKey = `${url}:${JSON.stringify(config.params || {})}`;

  if (shouldCache && responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    if (cached.expires > Date.now()) {
      return Promise.resolve({
        data: cached.data,
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers,
        config,
        cached: true,
      });
    } else {
      responseCache.delete(cacheKey);
    }
  }

  // Deduplicate in-flight concurrent requests for the exact same endpoint
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const requestPromise = originalGet(url, config).finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

export default api;
