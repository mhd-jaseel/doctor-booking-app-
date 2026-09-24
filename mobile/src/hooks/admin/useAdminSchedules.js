import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import { appCache } from '../../utils/cache';

export const useAdminSchedules = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const cacheKey = `admin:schedules:p${page}:l${initialLimit}`;
  const cached = appCache.get(cacheKey);

  const [schedules, setSchedules] = useState(cached?.data?.schedules || []);
  const [pagination, setPagination] = useState(
    cached?.data?.pagination || {
      currentPage: 1,
      limit: initialLimit,
      totalItems: cached?.data?.schedules?.length || 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  );
  const [loading, setLoading] = useState(!cached?.data?.schedules?.length);
  const [error, setError] = useState(null);

  const fetchSchedules = useCallback(
    async (targetPage = page) => {
      const currentCacheKey = `admin:schedules:p${targetPage}:l${limit}`;
      const cacheHit = appCache.get(currentCacheKey);

      if (cacheHit?.data?.schedules?.length > 0) {
        setSchedules(cacheHit.data.schedules);
        if (cacheHit.data.pagination) setPagination(cacheHit.data.pagination);
        setLoading(false);
      } else if (schedules.length === 0) {
        setLoading(true);
      }

      setError(null);
      try {
        const params = {
          page: targetPage,
          limit,
        };
        const res = await adminService.getSchedules(params);
        const data = res?.data || res || {};
        const fetchedSchedules = data.schedules || [];
        const fetchedPagination = res?.pagination || data.pagination || pagination;

        setSchedules(fetchedSchedules);
        if (res?.pagination || data.pagination) {
          setPagination(fetchedPagination);
        }
        appCache.set(currentCacheKey, {
          schedules: fetchedSchedules,
          pagination: fetchedPagination,
        });
        setPage(targetPage);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchSchedules(page);
  }, [page]);

  const invalidateScheduleCaches = () => {
    appCache.invalidatePrefix('admin:schedules');
    appCache.invalidatePrefix('schedules:doctor');
    appCache.invalidatePrefix('home:');
  };

  const createSchedule = async (scheduleData) => {
    await adminService.createSchedule(scheduleData);
    invalidateScheduleCaches();
    await fetchSchedules(page);
  };

  const updateSchedule = async (id, scheduleData) => {
    await adminService.updateSchedule(id, scheduleData);
    invalidateScheduleCaches();
    await fetchSchedules(page);
  };

  const deleteSchedule = async (id) => {
    await adminService.deleteSchedule(id);
    invalidateScheduleCaches();
    await fetchSchedules(page);
  };

  const toggleStatus = async (id) => {
    await adminService.toggleScheduleAvailability(id);
    invalidateScheduleCaches();
    await fetchSchedules(page);
  };

  const fetchWaitingList = async (scheduleId) => {
    const res = await adminService.getScheduleWaitingList(scheduleId);
    return res.data?.waitingList || [];
  };

  return {
    schedules,
    page,
    setPage,
    pagination,
    loading,
    error,
    refresh: () => fetchSchedules(1),
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleStatus,
    fetchWaitingList,
  };
};
