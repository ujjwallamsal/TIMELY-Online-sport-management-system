/**
 * MediaAdmin page for moderating media content.
 * Provides tabs for different statuses and bulk moderation actions.
 */
import React, { useState, useEffect } from 'react';
import { mediaAPI } from '../../services/api.js';
import MediaCard from '../components/MediaCard';
import MediaFilters from '../components/MediaFilters';

const MediaAdmin = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    search: '',
    kind: '',
    event: '',
    fixture: '',
    uploader: ''
  });
  
  const [selectedMedia, setSelectedMedia] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  const tabs = [
    { id: 'pending', label: 'Pending Review', count: 0 },
    { id: 'approved', label: 'Approved', count: 0 },
    { id: 'rejected', label: 'Rejected', count: 0 },
    { id: 'hidden', label: 'Hidden', count: 0 }
  ];

  // Load media data
  const loadMedia = async (page = 1, status = activeTab, newFilters = filters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        page_size: pagination.pageSize,
        status,
        ...newFilters
      };
      
      const response = await mediaAPI.listMedia(params);
      setMedia(response.data.results || []);
      setPagination({
        page: response.data.page || 1,
        pageSize: response.data.page_size || 12,
        total: response.data.count || 0,
        totalPages: Math.ceil((response.data.count || 0) / (response.data.page_size || 12))
      });
    } catch (err) {
      console.error('Error loading media:', err);
      setError('Failed to load media. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load media on component mount and when filters/tab change
  useEffect(() => {
    loadMedia(1, activeTab, filters);
  }, [activeTab, filters]);

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSelectedMedia(new Set());
    setBulkAction('');
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    loadMedia(newPage, activeTab, filters);
  };

  // Handle media selection
  const handleMediaSelect = (mediaId, selected) => {
    const newSelected = new Set(selectedMedia);
    if (selected) {
      newSelected.add(mediaId);
    } else {
      newSelected.delete(mediaId);
    }
    setSelectedMedia(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedMedia.size === media.length) {
      setSelectedMedia(new Set());
    } else {
      setSelectedMedia(new Set(media.map(m => m.id)));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedMedia.size === 0) return;

    setLoading(true);
    try {
      const promises = Array.from(selectedMedia).map(mediaId => {
        switch (bulkAction) {
          case 'approve':
            return mediaAPI.approveMedia(mediaId);
          case 'reject':
            return mediaAPI.rejectMedia(mediaId, 'Bulk rejection');
          case 'hide':
            return mediaAPI.hideMedia(mediaId);
          case 'delete':
            return mediaAPI.deleteMedia(mediaId);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      
      // Reload media
      await loadMedia(pagination.page, activeTab, filters);
      setSelectedMedia(new Set());
      setBulkAction('');
    } catch (err) {
      console.error('Bulk action error:', err);
      setError('Failed to perform bulk action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual media updates
  const handleMediaUpdate = (updatedMedia) => {
    setMedia(prev => prev.map(m => m.id === updatedMedia.id ? updatedMedia : m));
  };

  const handleMediaDelete = (deletedId) => {
    setMedia(prev => prev.filter(m => m.id !== deletedId));
    setSelectedMedia(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(deletedId);
      return newSelected;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Media Moderation</h1>
          <p className="mt-2 text-gray-600">
            Review and moderate uploaded media content
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters sidebar */}
          <div className="lg:col-span-1">
            <MediaFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Bulk actions */}
            {selectedMedia.size > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedMedia.size} item{selectedMedia.size !== 1 ? 's' : ''} selected
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select action</option>
                      {activeTab === 'pending' && (
                        <>
                          <option value="approve">Approve</option>
                          <option value="reject">Reject</option>
                        </>
                      )}
                      {activeTab === 'approved' && (
                        <option value="hide">Hide</option>
                      )}
                      <option value="delete">Delete</option>
                    </select>
                    
                    <button
                      onClick={handleBulkAction}
                      disabled={!bulkAction}
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {pagination.total} media items
                </h2>
                
                {media.length > 0 && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMedia.size === media.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Select all</span>
                  </label>
                )}
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => loadMedia(pagination.page, activeTab, filters)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                    <div className="aspect-video bg-gray-200"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Media grid */}
            {!loading && !error && (
              <>
                {media.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No media found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No media items match your current filters.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {media.map((item) => (
                      <div key={item.id} className="relative">
                        <input
                          type="checkbox"
                          checked={selectedMedia.has(item.id)}
                          onChange={(e) => handleMediaSelect(item.id, e.target.checked)}
                          className="absolute top-2 left-2 z-10 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <MediaCard
                          media={item}
                          onUpdate={handleMediaUpdate}
                          onDelete={handleMediaDelete}
                          showActions={true}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaAdmin;
