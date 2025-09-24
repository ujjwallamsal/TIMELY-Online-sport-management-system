import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Select from '../../components/ui/Select.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { 
  MagnifyingGlassIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  FolderIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

export default function Media() {
  const [activeTab, setActiveTab] = useState('albums'); // 'albums' or 'media'
  const [albums, setAlbums] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: ''
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

  const fetchAlbums = async () => {
    let active = true;
    setLoading(true);
    
    try {
      const data = await api.getAlbums();
      if (!active) return;
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setAlbums(list);
    } catch (err) {
      if (active) {
        push({ type: 'error', title: 'Failed to load albums', message: err.message || 'Please try again.' });
        setAlbums([]);
      }
    } finally {
      if (active) setLoading(false);
    }
    return () => { active = false; };
  };

  const fetchMedia = async () => {
    let active = true;
    setLoading(true);
    
    const params = {
      search: debouncedSearch,
      media_type: filters.type
    };
    
    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });
    
    try {
      const data = await api.getMedia(params);
      if (!active) return;
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setMedia(list);
    } catch (err) {
      if (active) {
        push({ type: 'error', title: 'Failed to load media', message: err.message || 'Please try again.' });
        setMedia([]);
      }
    } finally {
      if (active) setLoading(false);
    }
    return () => { active = false; };
  };

  useEffect(() => {
    if (activeTab === 'albums') {
      fetchAlbums();
    } else {
      fetchMedia();
    }
  }, [activeTab, debouncedSearch, filters.type]);

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

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `http://127.0.0.1:8000${image}`;
  };

  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEyMCA4MEwxNDAgMTAwTDEyMCAxMjBMMTAwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4MCIgeT0iODAiPgo8cGF0aCBkPSJNMjAgMjBMMzAgMTBMMzAgMzBMMjAgMjBaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo8L3N2Zz4K';
  };

  const currentItems = activeTab === 'albums' ? albums : media;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Gallery</h1>
        <p className="text-gray-600">Browse photos and videos from our events</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('albums')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'albums'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FolderIcon className="h-5 w-5 inline mr-2" />
              Albums
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'media'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PhotoIcon className="h-5 w-5 inline mr-2" />
              All Media
            </button>
          </nav>
        </div>
      </div>

      {/* Filters - only show for media tab */}
      {activeTab === 'media' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  { value: 'video', label: 'Videos' }
                ]}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ search: '', type: '' })}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <EmptyState 
          title={activeTab === 'albums' ? 'No albums found' : 'No media found'} 
          description={activeTab === 'albums' ? 'Check back later for new albums.' : 'Try adjusting your filters or check back later.'} 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeTab === 'albums' ? (
            // Albums view
            albums.map((album) => (
              <div key={album.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  {album.cover ? (
                    <img 
                      src={getImageUrl(album.cover)} 
                      alt={album.title} 
                      className="w-full h-48 object-cover" 
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <FolderIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {album.media_count} items
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                    {album.title}
                  </div>
                  {album.description && (
                    <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {album.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(album.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Media view
            media.map((m) => (
              <div key={m.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  {m.file_url ? (
                    <img 
                      src={m.file_url} 
                      alt={m.title || 'Media'} 
                      className="w-full h-40 object-cover" 
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-400">
                        {getMediaIcon(m.media_type)}
                      </div>
                    </div>
                  )}
                  {m.media_type && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {m.media_type.toUpperCase()}
                    </div>
                  )}
                  {m.media_type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayIcon className="h-8 w-8 text-white bg-black bg-opacity-50 rounded-full p-2" />
                    </div>
                  )}
                </div>
                <div className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                    {m.title || 'Untitled'}
                  </div>
                  {m.album_title && (
                    <div className="text-xs text-blue-600 mb-1">
                      {m.album_title}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(m.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


