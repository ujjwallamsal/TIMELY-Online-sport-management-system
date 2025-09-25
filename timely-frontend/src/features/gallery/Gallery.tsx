import React, { useState } from 'react';
import { Camera, Image, Video, Play, Download, Eye } from 'lucide-react';
import { usePublicGalleryMedia } from '../../api/queries';

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
}

const Gallery: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: media, isLoading, error } = usePublicGalleryMedia({
    limit: 50,
  });

  const categories = [
    { id: 'all', name: 'All Media', count: media?.length || 0 },
    { id: 'images', name: 'Photos', count: media?.filter((item: MediaItem) => item.media_type === 'image').length || 0 },
    { id: 'videos', name: 'Videos', count: media?.filter((item: MediaItem) => item.media_type === 'video').length || 0 },
  ];

  const filteredMedia = media?.filter((item: MediaItem) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'images') return item.media_type === 'image';
    if (selectedCategory === 'videos') return item.media_type === 'video';
    return true;
  });

  const handleDownload = (mediaItem: MediaItem) => {
    // Mock download functionality
    console.log('Downloading media:', mediaItem.id);
    // In a real app, this would trigger a download
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Gallery</h3>
            <p className="text-gray-500">There was an error loading the gallery media.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!media || media.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Media Available</h3>
            <p className="text-gray-500">Photos and videos from events will appear here.</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Gallery</h1>
          <p className="text-xl text-gray-600">
            Explore photos and videos from our sports events
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia?.map((mediaItem) => (
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
            </div>
          ))}
        </div>

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
