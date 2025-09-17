import React, { useState, useMemo } from 'react';
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

const DataTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  onBulkAction,
  bulkActions = [],
  loading = false,
  emptyMessage = "No data available",
  className = ""
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle row selection
  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(item => item.id)));
    }
  };

  // Handle bulk action
  const handleBulkAction = (action) => {
    if (onBulkAction) {
      onBulkAction(action, Array.from(selectedRows));
    }
    setSelectedRows(new Set());
    setShowBulkActions(false);
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUpDownIcon className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4" />
      : <ChevronDownIcon className="h-4 w-4" />;
  };

  // Render cell content
  const renderCell = (item, column) => {
    if (column.render) {
      return column.render(item[column.key], item);
    }
    return item[column.key];
  };

  // Render action buttons
  const renderActions = (item) => (
    <div className="flex items-center space-x-2">
      {onView && (
        <button
          onClick={() => onView(item)}
          className="text-gray-400 hover:text-blue-600 transition-colors"
          title="View"
        >
          <EyeIcon className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={() => onEdit(item)}
          className="text-gray-400 hover:text-green-600 transition-colors"
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      )}
      {onApprove && (
        <button
          onClick={() => onApprove(item)}
          className="text-gray-400 hover:text-green-600 transition-colors"
          title="Approve"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
      )}
      {onReject && (
        <button
          onClick={() => onReject(item)}
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Reject"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(item)}
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No data</h3>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-sm rounded-lg border border-gray-200 ${className}`}>
      {/* Bulk actions */}
      {selectedRows.size > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-blue-700">
              {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {bulkActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleBulkAction(action)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  action.variant === 'danger'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {/* Select all checkbox */}
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              
              {/* Column headers */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              
              {/* Actions column */}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => (
              <tr
                key={item.id || index}
                className={`hover:bg-gray-50 ${
                  selectedRows.has(item.id) ? 'bg-blue-50' : ''
                }`}
              >
                {/* Select row checkbox */}
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(item.id)}
                    onChange={() => handleSelectRow(item.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                
                {/* Data cells */}
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                    {renderCell(item, column)}
                  </td>
                ))}
                
                {/* Actions cell */}
                <td className="px-4 py-3 text-sm text-gray-500">
                  {renderActions(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;