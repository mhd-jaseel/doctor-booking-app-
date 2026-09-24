import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';

export const useAdminAppointments = (initialLimit = 10) => {
  const [appointments, setAppointments] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: initialLimit,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(
    async (targetPage = page, searchTerm = search, currentStatus = statusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: targetPage,
          limit,
        };
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }
        if (currentStatus && currentStatus !== 'ALL') {
          params.status = currentStatus;
        }

        const res = await adminService.getAllAppointments(params);
        const data = res?.data || res || {};
        setAppointments(data.appointments || []);
        if (res?.pagination || data.pagination) {
          setPagination(res.pagination || data.pagination);
        }
        setPage(targetPage);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search, statusFilter]
  );

  useEffect(() => {
    fetchAppointments(page, search, statusFilter);
  }, [page, search, statusFilter]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1); // Reset page on search
  };

  const handleStatusChange = (st) => {
    setStatusFilter(st);
    setPage(1); // Reset page on filter
  };

  const cancelAppointment = async (id) => {
    await adminService.cancelAppointment(id);
    appCache.invalidatePrefix('admin:appointments');
    appCache.invalidatePrefix('admin:schedules');
    appCache.invalidatePrefix('schedules:');
    appCache.invalidatePrefix('appointments:');
    appCache.invalidatePrefix('notifications:');
    await fetchAppointments(page, search, statusFilter);
  };

  const updateAppointmentStatus = async (id, status) => {
    await adminService.updateAppointmentStatus(id, status);
    appCache.invalidatePrefix('admin:appointments');
    appCache.invalidatePrefix('admin:schedules');
    appCache.invalidatePrefix('appointments:');
    await fetchAppointments(page, search, statusFilter);
  };

  return {
    appointments,
    page,
    setPage,
    search,
    setSearch: handleSearchChange,
    statusFilter,
    setStatusFilter: handleStatusChange,
    pagination,
    loading,
    error,
    refresh: () => fetchAppointments(1, search, statusFilter),
    cancelAppointment,
    updateAppointmentStatus,
  };
};
