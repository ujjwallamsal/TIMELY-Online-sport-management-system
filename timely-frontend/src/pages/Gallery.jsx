/**
 * Gallery page for public media viewing.
 * Displays approved media with filters, search, and lightbox viewing.
 */
import React, { useState, useEffect } from 'react';
import { mediaAPI } from '../lib/api';
import MediaCard from '../components/MediaCard';
import MediaFilters from '../components/MediaFilters';
import LightboxViewer from '../components/LightboxViewer';

const Gallery = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    featured: false
  });
  
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [showLightbox, setShowLightbox] = useState(false);

  // Load media data
  const loadMedia = async (page = 1, newFilters = filters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        page_size: pagination.pageSize,
        ...newFilters
      };
      
      const response = await mediaAPI.listPublicMedia(params);
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

  // Load media on component mount and when filters change
  useEffect(() => {
    loadMedia(1, filters);
  }, [filters]);

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    loadMedia(newPage, filters);
  };

  // Handle media card click
  const handleMediaClick = (clickedMedia) => {
    const index = media.findIndex(m => m.id === clickedMedia.id);
    setLightboxIndex(index);
    setLightboxMedia(clickedMedia);
    setShowLightbox(true);
  };

  // Handle lightbox navigation
  const handlePrevious = () => {
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1;
      setLightboxIndex(newIndex);
      setLightboxMedia(media[newIndex]);
    }
  };

  const handleNext = () => {
    if (lightboxIndex < media.length - 1) {
      const newIndex = lightboxIndex + 1;
      setLightboxIndex(newIndex);
      setLightboxMedia(media[newIndex]);
    }
  };

  const handleCloseLightbox = () => {
    setShowLightbox(false);
    setLightboxMedia(null);
    setLightboxIndex(-1);
  };

  // Handle media updates (from moderation actions)
  const handleMediaUpdate = (updatedMedia) => {
    setMedia(prev => prev.map(m => m.id === updatedMedia.id ? updatedMedia : m));
  };

  const handleMediaDelete = (deletedId) => {
    setMedia(prev => prev.filter(m => m.id !== deletedId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Media Gallery</h1>
          <p className="mt-2 text-gray-600">
            Browse photos and videos from our events
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
            {/* Results header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {pagination.total} media items
                </h2>
                {filters.featured && (
                  <p className="text-sm text-gray-600">Showing featured content</p>
                )}
              </div>
              
              {/* Sort options */}
              <div className="flex items-center space-x-2">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  id="sort"
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="-created_at">Newest first</option>
                  <option value="created_at">Oldest first</option>
                  <option value="title">Title A-Z</option>
                  <option value="-title">Title Z-A</option>
                </select>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => loadMedia(pagination.page, filters)}
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
                      Try adjusting your filters or check back later for new content.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {media.map((item) => (
                      <MediaCard
                        key={item.id}
                        media={item}
                        onUpdate={handleMediaUpdate}
                        onDelete={handleMediaDelete}
                        showActions={false} // Public gallery doesn't show moderation actions
                        onClick={() => handleMediaClick(item)}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                      />
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

      {/* Lightbox */}
      <LightboxViewer
        media={lightboxMedia}
        isOpen={showLightbox}
        onClose={handleCloseLightbox}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={lightboxIndex > 0}
        hasNext={lightboxIndex < media.length - 1}
      />
    </div>
  );
};

export default Gallery;
