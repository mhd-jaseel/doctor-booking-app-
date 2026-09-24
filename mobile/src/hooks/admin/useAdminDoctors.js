import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import { appCache } from '../../utils/cache';

export const useAdminDoctors = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  const cacheKey = `admin:doctors:p${page}:l${initialLimit}:${search}:${statusFilter}`;
  const cached = appCache.get(cacheKey);

  const [doctors, setDoctors] = useState(cached?.data?.doctors || []);
  const [pagination, setPagination] = useState(
    cached?.data?.pagination || {
      currentPage: 1,
      limit: initialLimit,
      totalItems: cached?.data?.doctors?.length || 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  );
  const [loading, setLoading] = useState(!cached?.data?.doctors?.length);
  const [error, setError] = useState(null);

  const fetchDoctors = useCallback(
    async (targetPage = page, searchTerm = search, currentStatus = statusFilter) => {
      const currentCacheKey = `admin:doctors:p${targetPage}:l${limit}:${searchTerm}:${currentStatus}`;
      const cacheHit = appCache.get(currentCacheKey);

      if (cacheHit?.data?.doctors?.length > 0) {
        setDoctors(cacheHit.data.doctors);
        if (cacheHit.data.pagination) setPagination(cacheHit.data.pagination);
        setLoading(false);
      } else if (doctors.length === 0) {
        setLoading(true);
      }

      setError(null);
      try {
        const params = {
          page: targetPage,
          limit,
          isAdmin: true,
        };
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }
        if (currentStatus === 'ACTIVE') {
          params.status = 'active';
        } else if (currentStatus === 'INACTIVE') {
          params.status = 'inactive';
        } else {
          params.status = 'all';
        }

        const res = await adminService.getDoctors(params);
        const data = res?.data || res || {};
        const fetchedDoctors = data.doctors || [];
        const fetchedPagination = res?.pagination || data.pagination || pagination;

        setDoctors(fetchedDoctors);
        if (res?.pagination || data.pagination) {
          setPagination(fetchedPagination);
        }
        appCache.set(currentCacheKey, {
          doctors: fetchedDoctors,
          pagination: fetchedPagination,
        });
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
    fetchDoctors(page, search, statusFilter);
  }, [page, search, statusFilter]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1); // Reset page on search
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const invalidateDoctorCaches = () => {
    appCache.invalidatePrefix('admin:doctors');
    appCache.invalidatePrefix('doctors:user');
    appCache.invalidatePrefix('doctor:detail');
    appCache.invalidatePrefix('home:top_doctors');
  };

  const saveDoctor = async (doctorData, editingId = null) => {
    if (editingId) {
      await adminService.updateDoctor(editingId, doctorData);
    } else {
      await adminService.createDoctor(doctorData);
    }
    invalidateDoctorCaches();
    await fetchDoctors(page, search, statusFilter);
  };

  const toggleStatus = async (id, targetStatus) => {
    await adminService.toggleDoctorStatus(id, { isActive: targetStatus });
    invalidateDoctorCaches();
    await fetchDoctors(page, search, statusFilter);
  };

  const deleteDoctor = async (id) => {
    await adminService.deleteDoctor(id);
    invalidateDoctorCaches();
    await fetchDoctors(page, search, statusFilter);
  };

  const assignFacility = async (doctorId, facilityId) => {
    await adminService.assignDoctorFacility(doctorId, facilityId);
    invalidateDoctorCaches();
    await fetchDoctors(page, search, statusFilter);
  };

  const removeFacility = async (doctorId, facilityId) => {
    await adminService.removeDoctorFacility(doctorId, facilityId);
    invalidateDoctorCaches();
    await fetchDoctors(page, search, statusFilter);
  };

  return {
    doctors,
    page,
    setPage,
    search,
    setSearch: handleSearchChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    pagination,
    loading,
    error,
    refresh: () => fetchDoctors(1, search, statusFilter),
    saveDoctor,
    toggleStatus,
    deleteDoctor,
    assignFacility,
    removeFacility,
  };
};
