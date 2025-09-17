import React, { useState, useEffect } from 'react';
import { 
  PhotoIcon, 
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';
import Skeleton, { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import EmptyState, { EmptyEvents } from '../../components/ui/EmptyState';

const PublicGallery = () => {
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    event: '',
    date_from: '',
    date_to: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);

  // Real-time updates will be implemented later
  const connectionStatus = 'connected';

  const fetchGallery = async (page = 1) => {
    try {
      setLoading(true);
      // TODO: Implement gallery API endpoint in backend
      // For now, show placeholder content
      const mockGallery = [
        {
          id: 1,
          caption: "Championship Victory",
          image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
          event_title: "Basketball Championship 2024",
          created_at: new Date().toISOString(),
          category: "award"
        },
        {
          id: 2,
          caption: "Team Action Shot",
          image_url: "https://images.unsplash.com/photo-1546519638-68e109450ff7?w=400&h=300&fit=crop",
          event_title: "Soccer Tournament",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          category: "action"
        },
        {
          id: 3,
          caption: "Group Photo",
          image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
          event_title: "Track & Field Meet",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          category: "group"
        },
        {
          id: 4,
          caption: "Event Highlights",
          image_url: "https://images.unsplash.com/photo-1546519638-68e109450ff7?w=400&h=300&fit=crop",
          event_title: "Swimming Competition",
          created_at: new Date(Date.now() - 259200000).toISOString(),
          category: "event"
        }
      ];
      
      setGallery(mockGallery);
      setPagination({
        page: 1,
        page_size: 12,
        count: mockGallery.length,
        previous: null,
        next: null
      });
    } catch (error) {
      console.error('Error fetching gallery:', error);
      setGallery([]);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates will be implemented later

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGallery(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchGallery(page);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-gray-50 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton className="h-10 w-full" key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Photo Gallery</h1>
              <p className="text-gray-600 mt-2">Browse through our collection of event photos and memories</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-500">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search photos..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="event">Event</option>
                  <option value="award">Award</option>
                  <option value="action">Action</option>
                  <option value="group">Group</option>
                </select>
              </div>

              {/* Event Filter */}
              <div>
                <select
                  value={filters.event}
                  onChange={(e) => handleFilterChange('event', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Events</option>
                  {/* This would be populated with actual events */}
                </select>
              </div>

              {/* Search Button */}
              <div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {gallery.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gallery.map(photo => (
                <div key={photo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-w-16 aspect-h-9 cursor-pointer" onClick={() => handleImageClick(photo)}>
                    <img
                      src={photo.image_url}
                      alt={photo.caption || 'Gallery photo'}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <EyeIcon className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <PhotoIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {photo.caption || 'Untitled Photo'}
                        </h3>
                        <p className="text-xs text-gray-500">{formatDate(photo.created_at)}</p>
                      </div>
                    </div>
                    
                    {photo.event_title && (
                      <div className="text-xs text-blue-600 font-medium">
                        {photo.event_title}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.count > pagination.page_size && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.count)} of {pagination.count} photos
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.previous}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {currentPage} of {Math.ceil(pagination.count / pagination.page_size)}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.next}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyEvents 
            title="No Photos Available"
            description="There are no photos available in the gallery at the moment."
            action={
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    category: '',
                    event: '',
                    date_from: '',
                    date_to: ''
                  });
                  fetchGallery(1);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Clear Filters
              </button>
            }
          />
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleCloseModal}>
          <div className="max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="relative">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.caption || 'Gallery photo'}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedImage.caption || 'Untitled Photo'}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Date: {formatDate(selectedImage.created_at)}</p>
                  {selectedImage.event_title && (
                    <p>Event: {selectedImage.event_title}</p>
                  )}
                  {selectedImage.photographer && (
                    <p>Photographer: {selectedImage.photographer}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicGallery;
