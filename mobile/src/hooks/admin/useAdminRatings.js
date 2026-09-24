import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';

export const useAdminRatings = (initialLimit = 10) => {
  const [ratingsData, setRatingsData] = useState({
    doctorRatings: [],
    hospitalRatings: [],
    recentRatings: [],
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
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

  const fetchRatings = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getRatings({ page: targetPage, limit });
      const data = res?.data || res || {};
      setRatingsData(data);
      if (res?.pagination || data.pagination) {
        setPagination(res.pagination || data.pagination);
      }
      setPage(targetPage);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchRatings(page);
  }, [page]);

  return {
    ratingsData,
    page,
    setPage,
    pagination,
    loading,
    error,
    refresh: () => fetchRatings(1),
  };
};
