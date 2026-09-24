import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import { appCache } from '../../utils/cache';

export const useAdminFacilities = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  const cacheKey = `admin:facilities:p${page}:l${initialLimit}:${search}:${selectedType}:${statusFilter}`;
  const cached = appCache.get(cacheKey);

  const [facilities, setFacilities] = useState(cached?.data?.facilities || []);
  const [pagination, setPagination] = useState(
    cached?.data?.pagination || {
      currentPage: 1,
      limit: initialLimit,
      totalItems: cached?.data?.facilities?.length || 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  );
  const [loading, setLoading] = useState(!cached?.data?.facilities?.length);
  const [error, setError] = useState(null);

  const fetchFacilities = useCallback(
    async (targetPage = page, searchTerm = search, facilityType = selectedType, status = statusFilter) => {
      const currentCacheKey = `admin:facilities:p${targetPage}:l${limit}:${searchTerm}:${facilityType}:${status}`;
      const cacheHit = appCache.get(currentCacheKey);

      if (cacheHit?.data?.facilities?.length > 0) {
        setFacilities(cacheHit.data.facilities);
        if (cacheHit.data.pagination) setPagination(cacheHit.data.pagination);
        setLoading(false);
      } else if (facilities.length === 0) {
        setLoading(true);
      }

      setError(null);
      try {
        const params = {
          page: targetPage,
          limit,
          isAdmin: true,
        };
        if (status === 'ACTIVE') {
          params.status = 'active';
        } else if (status === 'INACTIVE') {
          params.status = 'inactive';
        } else {
          params.status = 'all';
        }

        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }
        if (facilityType && facilityType !== 'ALL') {
          params.facilityType = facilityType;
        }

        const res = await adminService.getFacilities(params);
        const data = res?.data || res || {};
        const fetchedHospitals = data.hospitals || [];
        const fetchedPagination = res?.pagination || data.pagination || pagination;

        setFacilities(fetchedHospitals);
        if (res?.pagination || data.pagination) {
          setPagination(fetchedPagination);
        }
        appCache.set(currentCacheKey, {
          facilities: fetchedHospitals,
          pagination: fetchedPagination,
        });
        setPage(targetPage);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search, selectedType, statusFilter]
  );

  useEffect(() => {
    fetchFacilities(page, search, selectedType, statusFilter);
  }, [page, search, selectedType, statusFilter]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const saveFacility = async (facilityData, editingId = null) => {
    if (editingId) {
      await adminService.updateFacility(editingId, facilityData);
    } else {
      await adminService.createFacility(facilityData);
    }
    // Invalidate facility caches across admin and user
    appCache.invalidatePrefix('admin:facilities');
    appCache.invalidatePrefix('facilities:category');
    appCache.invalidatePrefix('facility:detail');
    await fetchFacilities(page, search, selectedType, statusFilter);
  };

  const toggleStatus = async (id, targetStatus) => {
    await adminService.toggleFacilityStatus(id, { isActive: targetStatus });
    appCache.invalidatePrefix('admin:facilities');
    appCache.invalidatePrefix('facilities:category');
    appCache.invalidatePrefix('facility:detail');
    await fetchFacilities(page, search, selectedType, statusFilter);
  };

  const deleteFacility = async (id) => {
    await adminService.deleteFacility(id);
    appCache.invalidatePrefix('admin:facilities');
    appCache.invalidatePrefix('facilities:category');
    appCache.invalidatePrefix('facility:detail');
    await fetchFacilities(page, search, selectedType, statusFilter);
  };

  return {
    facilities,
    page,
    setPage,
    search,
    setSearch: handleSearchChange,
    selectedType,
    setSelectedType: handleTypeChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    pagination,
    loading,
    error,
    refresh: () => fetchFacilities(1, search, selectedType, statusFilter),
    saveFacility,
    toggleStatus,
    deleteFacility,
  };
};
