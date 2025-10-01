import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Image, Video, Play, Download, Eye, Upload, Edit, Trash2, Search, Filter } from 'lucide-react';
import { usePublicGalleryMedia, useMyGalleryMedia } from '../../api/queries';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { useQueryClient } from '@tanstack/react-query';

interface MediaItem {
  id: number;
  title?: string;
  description?: string;
  media_type: 'image' | 'video';
  file_url?: string;
  thumbnail_url?: string;
  event_id?: number;
  event_name?: string;
  uploaded_at: string;
  uploaded_by?: string;
  is_public?: boolean;
  visibility?: 'private' | 'pending' | 'public';
}

const Gallery: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState<'public' | 'mine'>('public');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    album_id: '',
    visibility: 'private' as 'public' | 'private',
  });
  const [isUploading, setIsUploading] = useState(false);
  const { hasRole, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  // Initialize tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab') as 'public' | 'mine' | null;
    if (tab === 'public' || (tab === 'mine' && isAuthenticated)) {
      setActiveTab(tab);
    } else if (!isAuthenticated) {
      // Non-authenticated users should only see public tab
      setActiveTab('public');
    }
  }, [searchParams, isAuthenticated]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'public' | 'mine') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Mock data for now - replace with actual API calls
  const { data: publicMedia, isLoading: publicLoading } = usePublicGalleryMedia({
    limit: 50,
  });

  const { data: myMedia, isLoading: myLoading } = useMyGalleryMedia({
    limit: 50,
  });

  const media = activeTab === 'public' ? publicMedia : myMedia;
  const isLoading = activeTab === 'public' ? publicLoading : myLoading;

  // Ensure media is always an array to prevent crashes
  const mediaArray = Array.isArray(media) ? media : [];

  const filteredMedia = mediaArray.filter((item: MediaItem) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        item.title?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.event_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (typeFilter !== 'all' && item.media_type !== typeFilter) return false;

    return true;
  });

  const handleDownload = (mediaItem: MediaItem) => {
    // Mock download functionality
    console.log('Downloading media:', mediaItem.id);
    // In a real app, this would trigger a download
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      showError('No file selected', 'Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title || uploadForm.file.name);
      formData.append('description', uploadForm.description || '');
      formData.append('is_public', uploadForm.visibility === 'public' ? 'true' : 'false');
      formData.append('media_type', uploadForm.file.type.startsWith('image/') ? 'image' : 'video');
      if (uploadForm.album_id) formData.append('album_id', uploadForm.album_id.toString());

      // Use correct headers for multipart form data
      await api.post(ENDPOINTS.galleryMedia, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      showSuccess('Upload successful', 'Your media has been uploaded and will be reviewed.');
      
      // Create a notification
      try {
        await api.post(ENDPOINTS.notifications, {
          title: 'Media Uploaded',
          message: `Your media "${uploadForm.title || uploadForm.file.name}" has been uploaded successfully.`,
          type: 'success'
        });
      } catch (notifError) {
        console.warn('Failed to create notification:', notifError);
      }
      
      setShowUploadModal(false);
      setUploadForm({ file: null, title: '', description: '', album_id: '', visibility: 'private' });
      
      // Invalidate both public and private gallery queries
      queryClient.invalidateQueries({ queryKey: ['public', 'gallery-media'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-media'] });
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Failed to upload media';
      showError('Upload failed', errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (mediaId: number) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    
    try {
      await api.delete(ENDPOINTS.mediaItem(mediaId));
      showSuccess('Media deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['public', 'gallery-media'] });
    } catch (error) {
      showError('Delete failed', 'Please try again');
    }
  };

  const handleToggleVisibility = async (mediaId: number, currentVisibility: string) => {
    try {
      const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
      await api.patch(ENDPOINTS.mediaItem(mediaId), { is_public: newVisibility === 'public' });
      showSuccess(`Media ${newVisibility === 'public' ? 'made public' : 'made private'}`);
      queryClient.invalidateQueries({ queryKey: ['public', 'gallery-media'] });
    } catch (error) {
      showError('Update failed', 'Please try again');
    }
  };

  const getVisibilityBadge = (item: MediaItem) => {
    const visibility = item.visibility || (item.is_public ? 'public' : 'private');
    const colors = {
      private: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      public: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[visibility as keyof typeof colors]}`}>
        {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Gallery</h1>
              <p className="text-xl text-gray-600">
                {activeTab === 'public' 
                  ? 'Explore photos and videos from our sports events'
                  : 'Manage your personal media collection'
                }
              </p>
            </div>
            {activeTab === 'mine' && isAuthenticated && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('public')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'public'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Media (Public)
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => handleTabChange('mine')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'mine'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Gallery
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'image' | 'video')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </div>
        </div>

        {/* Media Grid */}
        {filteredMedia.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'public' ? 'No Public Media Available' : 'No Media in Your Gallery'}
            </h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'public' 
                ? 'Photos and videos from events will appear here when they are made public.'
                : 'Upload your first photo or video to get started.'
              }
            </p>
            {activeTab === 'mine' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Upload Media
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredMedia.map((mediaItem) => (
              <div
                key={mediaItem.id}
                className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedMedia(mediaItem)}
              >
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {mediaItem.media_type === 'image' ? (
                    <Image className="h-8 w-8 text-gray-400" />
                  ) : (
                    <Video className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMedia(mediaItem);
                      }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="h-4 w-4 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(mediaItem);
                      }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Download className="h-4 w-4 text-gray-700" />
                    </button>
                    {activeTab === 'mine' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Edit functionality would go here
                            console.log('Edit media:', mediaItem.id);
                          }}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="h-4 w-4 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(mediaItem.id);
                          }}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-gray-700" />
                        </button>
                      </>
                    )}
                    {hasRole(['ADMIN', 'ORGANIZER']) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const visibility = mediaItem.visibility || (mediaItem.is_public ? 'public' : 'private');
                          handleToggleVisibility(mediaItem.id, visibility);
                        }}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Toggle visibility"
                      >
                        {mediaItem.is_public ? '🔓' : '🔒'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Media Type Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    mediaItem.media_type === 'image'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {mediaItem.media_type === 'image' ? (
                      <Image className="h-3 w-3 inline mr-1" />
                    ) : (
                      <Play className="h-3 w-3 inline mr-1" />
                    )}
                    {mediaItem.media_type}
                  </span>
                </div>

                {/* Visibility Badge */}
                <div className="absolute top-2 right-2">
                  {getVisibilityBadge(mediaItem)}
                </div>

                {/* Title */}
                {mediaItem.title && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded truncate">
                      {mediaItem.title}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="max-w-md w-full mx-4">
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Upload Media</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File
                    </label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="Enter description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visibility
                    </label>
                    <select
                      value={uploadForm.visibility}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="private">Private (Only You)</option>
                      <option value="public">Public (Everyone)</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!uploadForm.file || isUploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Viewer Modal */}
        {selectedMedia && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="max-w-4xl max-h-[90vh] w-full mx-4">
              <div className="bg-white rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedMedia.title || `Media ${selectedMedia.id}`}
                    </h3>
                    {selectedMedia.event_name && (
                      <p className="text-sm text-gray-500">{selectedMedia.event_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Media Content */}
                <div className="p-4">
                  <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    {selectedMedia.media_type === 'image' ? (
                      <Image className="h-24 w-24 text-gray-400" />
                    ) : (
                      <Video className="h-24 w-24 text-gray-400" />
                    )}
                    <div className="absolute text-gray-500 mt-16">
                      {selectedMedia.media_type === 'image' ? 'Image Preview' : 'Video Preview'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedMedia.description && (
                  <div className="p-4 border-t border-gray-200">
                    <p className="text-gray-600">{selectedMedia.description}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Uploaded on {new Date(selectedMedia.uploaded_at).toLocaleDateString()}
                    {selectedMedia.uploaded_by && ` by ${selectedMedia.uploaded_by}`}
                  </div>
                  <button
                    onClick={() => handleDownload(selectedMedia)}
                    className="btn btn-primary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
