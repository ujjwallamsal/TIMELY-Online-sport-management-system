import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';

/**
 * Drilldown Table component for displaying paginated data with filtering and CSV export
 * @param {Object} props - Component props
 * @param {string} props.title - Table title
 * @param {Array} props.data - Table data array
 * @param {Array} props.columns - Column definitions
 * @param {Object} props.pagination - Pagination info
 * @param {Object} props.filters - Available filters
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onPageChange - Page change handler
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Function} props.onExport - CSV export handler
 * @param {Function} props.onRefresh - Refresh handler
 */
export default function DrilldownTable({
  title,
  data = [],
  columns = [],
  pagination = {},
  filters = {},
  loading = false,
  onPageChange,
  onFilterChange,
  onExport,
  onRefresh
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onFilterChange) {
      onFilterChange({ ...activeFilters, q: value || undefined });
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters, [filterKey]: value || undefined };
    setActiveFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle CSV export
  const handleExport = () => {
    if (onExport) {
      onExport(activeFilters);
    }
  };

  // Format cell value
  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) return '-';
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString();
    }
    
    if (column.type === 'datetime') {
      return new Date(value).toLocaleString();
    }
    
    if (column.type === 'currency') {
      return `$${(value / 100).toFixed(2)}`;
    }
    
    if (column.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (column.type === 'status') {
      return (
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${value === 'active' || value === 'confirmed' || value === 'paid' ? 'bg-green-100 text-green-800' :
            value === 'pending' || value === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            value === 'cancelled' || value === 'rejected' || value === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'}
        `}>
          {value}
        </span>
      );
    }
    
    return value;
  };

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {columns.map((column, index) => (
        <td key={index} className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          
          <div className="flex items-center space-x-3">
            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className={`
                  p-2 rounded-lg transition-colors
                  ${loading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }
                `}
              >
                <svg 
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </button>
            )}
            
            {/* Export button */}
            {onExport && (
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Filter toggle */}
          {Object.keys(filters).length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FunnelIcon className="w-4 h-4" />
              <span>Filters</span>
            </button>
          )}
        </div>

        {/* Filter dropdown */}
        {showFilters && Object.keys(filters).length > 0 && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(filters).map(([key, filter]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <select
                      value={activeFilters[key] || ''}
                      onChange={(e) => handleFilterChange(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      {filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={filter.type || 'text'}
                      value={activeFilters[key] || ''}
                      onChange={(e) => handleFilterChange(key, e.target.value)}
                      placeholder={filter.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                  `}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <ChevronUpDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : data.length > 0 ? (
              data.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCellValue(row[column.key], column)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-1">No data found</p>
                    <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.page_size) + 1} to{' '}
              {Math.min(pagination.page * pagination.page_size, pagination.count)} of{' '}
              {pagination.count} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange && onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className={`
                  p-2 rounded-lg transition-colors
                  ${pagination.page <= 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                  }
                `}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              
              <button
                onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className={`
                  p-2 rounded-lg transition-colors
                  ${pagination.page >= pagination.total_pages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                  }
                `}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
