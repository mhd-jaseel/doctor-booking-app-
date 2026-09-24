import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';

export const useAdminUsers = (initialLimit = 10) => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [search, setSearch] = useState('');
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

  const fetchUsers = useCallback(async (targetPage = page, searchTerm = search) => {
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

      const res = await adminService.getAllUsers(params);
      const data = res?.data || res || {};
      setUsers(data.users || []);
      if (res?.pagination || data.pagination) {
        setPagination(res.pagination || data.pagination);
      }
      setPage(targetPage);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, search]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1); // Reset page on search change
  };

  const toggleUserStatus = async (id) => {
    await adminService.toggleUserStatus(id);
    await fetchUsers(page, search);
  };

  const fetchUserDetails = async (id) => {
    const res = await adminService.getUserDetails(id);
    return res.data;
  };

  return {
    users,
    page,
    setPage,
    search,
    setSearch: handleSearchChange,
    pagination,
    loading,
    error,
    refresh: () => fetchUsers(1, search),
    toggleUserStatus,
    fetchUserDetails,
  };
};
