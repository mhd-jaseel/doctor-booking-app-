/**
 * CacheService: Lightweight in-memory stale-while-revalidate cache
 * Supports scoped keys, TTL expiration, invalidation patterns, and safe cache retrieval.
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Set a cached value with timestamp and TTL
   */
  set(key, data, ttl = this.defaultTTL) {
    if (!key) return;
    this.cache.set(key, {
      data,
      cachedAt: Date.now(),
      ttl,
    });
  }

  /**
   * Get cached data and freshness status
   */
  get(key) {
    if (!key || !this.cache.has(key)) return null;

    const entry = this.cache.get(key);
    const now = Date.now();
    const isExpired = now - entry.cachedAt > entry.ttl;

    return {
      data: entry.data,
      cachedAt: entry.cachedAt,
      isExpired,
    };
  }

  /**
   * Check if cache has key (regardless of freshness)
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Remove specific key
   */
  remove(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix or regex pattern
   * E.g. invalidatePrefix('doctors'), invalidatePrefix('facilities'), invalidatePrefix('admin:schedules')
   */
  invalidatePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear user-specific protected data on logout
   */
  clearUserData(userId) {
    for (const key of this.cache.keys()) {
      if (
        key.startsWith('user:') ||
        key.startsWith('appointments:') ||
        key.startsWith('notifications:') ||
        (userId && key.includes(userId))
      ) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear admin-specific protected data on admin logout
   */
  clearAdminData() {
    for (const key of this.cache.keys()) {
      if (key.startsWith('admin:')) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear everything
   */
  clearAll() {
    this.cache.clear();
  }
}

export const appCache = new CacheService();
