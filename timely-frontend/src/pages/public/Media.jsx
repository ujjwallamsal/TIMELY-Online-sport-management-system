import React, { useEffect, useState } from 'react';
import { publicAPI } from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Select from '../../components/ui/Select.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { 
  MagnifyingGlassIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

export default function Media() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    event: ''
  });
  const { push } = useToast();

  // Debounced search (300ms)
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchMedia = async () => {
    let active = true;
    setLoading(true);
    
    const params = {
      search: debouncedSearch,
      type: filters.type,
      event: filters.event
    };
    
    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });
    
    try {
      const data = await publicAPI.getMedia(params);
      if (!active) return;
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setItems(list);
    } catch (err) {
      if (active) {
        push({ type: 'error', title: 'Failed to load media', message: err.message || 'Please try again.' });
        setItems([]);
      }
    } finally {
      if (active) setLoading(false);
    }
    return () => { active = false; };
  };

  useEffect(() => {
    fetchMedia();
  }, [debouncedSearch, filters.type, filters.event]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getMediaIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'image':
      case 'photo':
        return <PhotoIcon className="h-6 w-6" />;
      case 'video':
        return <VideoCameraIcon className="h-6 w-6" />;
      default:
        return <DocumentIcon className="h-6 w-6" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Gallery</h1>
        <p className="text-gray-600">Browse photos and videos from our events</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search media..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <Select
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'image', label: 'Images' },
                { value: 'video', label: 'Videos' },
                { value: 'document', label: 'Documents' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
            <Input
              placeholder="Event ID"
              value={filters.event}
              onChange={(e) => handleFilterChange('event', e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', type: '', event: '' })}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No media found" description="Try adjusting your filters or check back later." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((m) => (
            <div key={m.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                {m.thumbnail_url || m.file_url ? (
                  <img 
                    src={m.thumbnail_url || m.file_url} 
                    alt={m.title || 'Media'} 
                    className="w-full h-40 object-cover" 
                  />
                ) : (
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    <div className="text-gray-400">
                      {getMediaIcon(m.type)}
                    </div>
                  </div>
                )}
                {m.type && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {m.type.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                  {m.title || 'Untitled'}
                </div>
                {m.description && (
                  <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {m.description}
                  </div>
                )}
                {m.event && (
                  <div className="text-xs text-blue-600">
                    Event #{m.event}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


