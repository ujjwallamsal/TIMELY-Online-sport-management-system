import React from 'react';
import { Camera, Image, Video } from 'lucide-react';
import { useGalleryAlbums, useGalleryMedia } from '../../api/queries';

const GalleryList: React.FC = () => {
  const { data: albums, isLoading: albumsLoading } = useGalleryAlbums();
  const { data: media, isLoading: mediaLoading } = useGalleryMedia();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Gallery</h1>
          <p className="text-gray-600">
            Browse photos and videos from our sports events.
          </p>
        </div>

        {/* Albums Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Albums</h2>
          {albumsLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : albums && albums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album: any) => (
                <div key={album.id} className="card hover:shadow-lg transition-shadow">
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      {album.cover ? (
                        <img
                          src={album.cover}
                          alt={album.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Camera className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {album.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {album.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(album.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {album.media_count || 0} items
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No albums available at the moment.</p>
            </div>
          )}
        </div>

        {/* Media Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Media</h2>
          {mediaLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : media && media.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {media.map((item: any) => (
                <div key={item.id} className="card hover:shadow-lg transition-shadow">
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      {item.media_type === 'video' ? (
                        <Video className="h-12 w-12 text-gray-400" />
                      ) : (
                        <Image className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 capitalize">
                      {item.media_type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No media available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryList;
