/**
 * LightboxViewer component for full-screen media viewing.
 * Supports images and videos with navigation, captions, and accessibility.
 */
import React, { useEffect, useRef, useState } from 'react';

const LightboxViewer = ({ 
  media, 
  isOpen, 
  onClose, 
  onPrevious, 
  onNext,
  hasPrevious = false,
  hasNext = false,
  className = '' 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const lightboxRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (hasNext) onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasPrevious, hasNext, onClose, onPrevious, onNext]);

  // Focus management
  useEffect(() => {
    if (isOpen && lightboxRef.current) {
      lightboxRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !media) return null;

  return (
    <div
      ref={lightboxRef}
      className={`fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center ${className}`}
      onClick={handleBackdropClick}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      aria-describedby="lightbox-description"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-full"
        aria-label="Close lightbox"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation buttons */}
      {hasPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-full"
          aria-label="Previous media"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-full"
          aria-label="Next media"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Media content */}
      <div className="relative max-w-7xl max-h-full mx-4 flex flex-col items-center">
        {/* Media display */}
        <div className="relative max-w-full max-h-[80vh] flex items-center justify-center">
          {media.kind === 'video' ? (
            <video
              ref={videoRef}
              src={media.file_url}
              controls
              className="max-w-full max-h-full"
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => setVideoLoaded(true)} // Show error state
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              ref={imageRef}
              src={media.file_url}
              alt={media.title || 'Media content'}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)} // Show error state
            />
          )}
          
          {/* Loading indicator */}
          {!imageLoaded && !videoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Caption */}
        {(media.title || media.description) && (
          <div className="mt-4 max-w-2xl text-center">
            {media.title && (
              <h2 id="lightbox-title" className="text-xl font-semibold text-white mb-2">
                {media.title}
              </h2>
            )}
            {media.description && (
              <p id="lightbox-description" className="text-gray-300">
                {media.description}
              </p>
            )}
            
            {/* Metadata */}
            <div className="mt-3 text-sm text-gray-400">
              <span>by {media.uploader_name}</span>
              {media.created_at && (
                <span className="mx-2">•</span>
              )}
              {media.created_at && (
                <span>{new Date(media.created_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation info */}
      {(hasPrevious || hasNext) && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
          Use arrow keys or click the arrows to navigate
        </div>
      )}
    </div>
  );
};

export default LightboxViewer;
