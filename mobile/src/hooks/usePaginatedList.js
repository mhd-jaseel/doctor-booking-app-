import { useState, useEffect, useCallback, useRef } from 'react';
import { appCache } from '../utils/cache';

/**
 * Reusable Pagination Hook with Stale-While-Revalidate In-Memory Caching
 *
 * @param {Function} fetchFunction - Async function returning { data: { items: [], ... }, pagination: {} }
 * @param {Object} options - Configuration options
 * @param {string} options.itemsKey - Key in data object containing array of records (e.g. 'users', 'appointments')
 * @param {Object} options.initialFilters - Initial filter query parameters
 * @param {number} options.initialLimit - Default limit per page (default: 10)
 * @param {boolean} options.appendMode - If true, appends new pages to existing list (mobile infinite scroll)
 * @param {string} options.cacheKeyPrefix - Optional cache key prefix for caching responses (e.g. 'doctors:list', 'hospitals:list')
 */
export const usePaginatedList = (
  fetchFunction,
  {
    itemsKey = 'items',
    initialFilters = {},
    initialLimit = 10,
    appendMode = false,
    cacheKeyPrefix = null,
  } = {}
) => {
  // Generate stable cache key for current filter + page
  const getCacheKey = (targetPage, currentFilters) => {
    if (!cacheKeyPrefix) return null;
    const filterStr = Object.keys(currentFilters || {})
      .sort()
      .map((k) => `${k}:${currentFilters[k]}`)
      .join('|');
    return `${cacheKeyPrefix}:p${targetPage}:l${initialLimit}:${filterStr}`;
  };

  // Check initial cache
  const initialCacheKey = getCacheKey(1, initialFilters);
  const cachedInitial = initialCacheKey ? appCache.get(initialCacheKey) : null;

  const [items, setItems] = useState(cachedInitial?.data?.items || []);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState(
    cachedInitial?.data?.pagination || {
      currentPage: 1,
      limit: initialLimit,
      totalItems: cachedInitial?.data?.items?.length || 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  );

  // If initial cache exists, we don't show blocking loading spinner
  const [loading, setLoading] = useState(!cachedInitial?.data?.items?.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Request concurrency guard: prevent duplicate concurrent page loads
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(
    async (targetPage = 1, customFilters = filters, isRefresh = false, isLoadMore = false) => {
      if (isFetchingRef.current && !isRefresh) return;
      isFetchingRef.current = true;

      const cacheKey = getCacheKey(targetPage, customFilters);

      // If we don't have items in state yet, check cache for immediate display
      if (!isRefresh && !isLoadMore && cacheKey) {
        const cached = appCache.get(cacheKey);
        if (cached && cached.data?.items?.length > 0) {
          setItems(cached.data.items);
          if (cached.data.pagination) setPagination(cached.data.pagination);
          setLoading(false);
        } else if (items.length === 0) {
          setLoading(true);
        }
      } else if (isRefresh) {
        setRefreshing(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      } else if (items.length === 0) {
        setLoading(true);
      }

      setError(null);

      try {
        const queryParams = {
          page: targetPage,
          limit,
          ...customFilters,
        };

        const res = await fetchFunction(queryParams);
        const dataPayload = res?.data || res || {};
        const fetchedItems = dataPayload[itemsKey] || dataPayload.items || [];
        const fetchedPagination = res?.pagination || dataPayload.pagination || {
          currentPage: targetPage,
          limit,
          totalItems: fetchedItems.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: targetPage > 1,
        };

        if (appendMode && targetPage > 1 && !isRefresh) {
          // Append mode: avoid duplicate items by ID
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i._id));
            const newUniqueItems = fetchedItems.filter((i) => !existingIds.has(i._id));
            const updated = [...prev, ...newUniqueItems];
            if (cacheKey) {
              appCache.set(cacheKey, { items: updated, pagination: fetchedPagination });
            }
            return updated;
          });
        } else {
          setItems(fetchedItems);
          if (cacheKey) {
            appCache.set(cacheKey, { items: fetchedItems, pagination: fetchedPagination });
          }
        }

        setPage(targetPage);
        setPagination(fetchedPagination);
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to load records.';
        setError(message);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [fetchFunction, filters, limit, itemsKey, appendMode, cacheKeyPrefix]
  );

  // Initial load or when page changes in table mode
  useEffect(() => {
    fetchData(page, filters);
  }, [page, filters]);

  // Handle external changes to initialFilters (e.g., React Navigation param changes reusing the same screen)
  useEffect(() => {
    setFilters(initialFilters);
    setPage(1);
    
    // Clear stale items immediately to prevent UI flashing incorrect category
    const newCacheKey = getCacheKey(1, initialFilters);
    const cached = newCacheKey ? appCache.get(newCacheKey) : null;
    
    if (cached && cached.data?.items?.length > 0) {
      setItems(cached.data.items);
      if (cached.data.pagination) setPagination(cached.data.pagination);
      setLoading(false);
    } else {
      setItems([]);
      setLoading(true);
    }
  }, [JSON.stringify(initialFilters), cacheKeyPrefix]);

  // Handle Search / Filter update: resets page to 1
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => {
      const merged = typeof newFilters === 'function' ? newFilters(prev) : { ...prev, ...newFilters };
      setPage(1);
      return merged;
    });
  }, []);

  // Pull-to-refresh
  const refresh = useCallback(() => {
    setPage(1);
    return fetchData(1, filters, true, false);
  }, [fetchData, filters]);

  // Load next page for mobile FlatLists
  const loadMore = useCallback(() => {
    if (!pagination.hasNextPage || loading || loadingMore || isFetchingRef.current) {
      return;
    }
    const nextPage = page + 1;
    fetchData(nextPage, filters, false, true);
  }, [pagination.hasNextPage, loading, loadingMore, page, filters, fetchData]);

  // Jump to specific page (for Admin pagination)
  const goToPage = useCallback(
    (targetPage) => {
      if (targetPage >= 1 && targetPage <= pagination.totalPages && targetPage !== page) {
        setPage(targetPage);
      }
    },
    [page, pagination.totalPages]
  );

  // Background silent refresh helper (does not show full-screen spinner)
  const silentRefresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      const queryParams = {
        page: 1,
        limit: appendMode ? Math.max(items.length, limit) : limit,
        ...filters,
      };
      const res = await fetchFunction(queryParams);
      const dataPayload = res?.data || res || {};
      const fetchedItems = dataPayload[itemsKey] || dataPayload.items || [];
      const fetchedPagination = res?.pagination || dataPayload.pagination;

      setItems(fetchedItems);
      if (fetchedPagination) {
        setPagination(fetchedPagination);
      }
      const cacheKey = getCacheKey(1, filters);
      if (cacheKey) {
        appCache.set(cacheKey, { items: fetchedItems, pagination: fetchedPagination });
      }
    } catch (e) {
      // ignore transient background fetch errors
    }
  }, [fetchFunction, filters, limit, itemsKey, appendMode, items.length, cacheKeyPrefix]);

  return {
    items,
    setItems,
    page,
    limit,
    setLimit,
    filters,
    updateFilters,
    pagination,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    loadMore,
    goToPage,
  };
};
