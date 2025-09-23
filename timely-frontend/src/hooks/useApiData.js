import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook for fetching data from API with loading states and error handling
 */
export const useApiData = (apiFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    showErrorToast = true,
    onSuccess,
    onError,
    immediate = true
  } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err);
      if (showErrorToast) {
        console.error('API Error:', err.message || 'Failed to fetch data');
      }
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [apiFunction, showErrorToast, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Custom hook for paginated data with search and filters
 */
export const usePaginatedData = (apiFunction, initialParams = {}, options = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState(initialParams);

  const {
    showErrorToast = true,
    onSuccess,
    onError,
    immediate = true
  } = options;

  const fetchData = useCallback(async (page = 1, search = '', newFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        page_size: pagination.pageSize,
        search,
        ...newFilters
      };

      const result = await apiFunction(params);
      
      // Handle different response formats
      if (result.data && result.pagination) {
        // Already paginated response
        setData(result.data);
        setPagination(result.pagination);
      } else if (result.results) {
        // DRF paginated response
        setData(result.results);
        setPagination({
          page: result.page || page,
          pageSize: result.page_size || pagination.pageSize,
          total: result.count || 0,
          totalPages: Math.ceil((result.count || 0) / (result.page_size || pagination.pageSize)),
          hasNext: !!result.next,
          hasPrevious: !!result.previous,
          next: result.next,
          previous: result.previous
        });
      } else {
        // Simple array response
        setData(Array.isArray(result) ? result : [result]);
        setPagination(prev => ({ ...prev, total: Array.isArray(result) ? result.length : 1 }));
      }

      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err);
      if (showErrorToast) {
        console.error('API Error:', err.message || 'Failed to fetch data');
      }
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [apiFunction, pagination.pageSize, showErrorToast, onSuccess, onError]);

  const handlePageChange = useCallback((page) => {
    fetchData(page, searchTerm, filters);
  }, [fetchData, searchTerm, filters]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    fetchData(1, term, filters);
  }, [fetchData, filters]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    fetchData(1, searchTerm, newFilters);
  }, [fetchData, searchTerm]);

  const handleSort = useCallback((field, direction) => {
    const sortParam = direction === 'desc' ? `-${field}` : field;
    handleFiltersChange({ ...filters, ordering: sortParam });
  }, [filters, handleFiltersChange]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate]);

  return {
    data,
    pagination,
    loading,
    error,
    searchTerm,
    filters,
    handlePageChange,
    handleSearch,
    handleFiltersChange,
    handleSort,
    refetch: () => fetchData(pagination.page, searchTerm, filters)
  };
};

/**
 * Custom hook for CRUD operations
 */
export const useCrud = (apiFunctions, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    showSuccessToast = true,
    showErrorToast = true,
    onSuccess,
    onError
  } = options;

  const execute = useCallback(async (operation, ...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await operation(...args);
      
      if (showSuccessToast) {
        console.log('Operation completed successfully');
      }
      
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err);
      if (showErrorToast) {
        console.error('Operation failed:', err.message || 'Operation failed');
      }
      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccessToast, showErrorToast, onSuccess, onError]);

  const create = useCallback((data) => {
    return execute(apiFunctions.create, data);
  }, [execute, apiFunctions.create]);

  const update = useCallback((id, data) => {
    return execute(apiFunctions.update, id, data);
  }, [execute, apiFunctions.update]);

  const remove = useCallback((id) => {
    return execute(apiFunctions.delete, id);
  }, [execute, apiFunctions.delete]);

  const get = useCallback((id) => {
    return execute(apiFunctions.get, id);
  }, [execute, apiFunctions.get]);

  return {
    loading,
    error,
    create,
    update,
    remove,
    get
  };
};

export default useApiData;