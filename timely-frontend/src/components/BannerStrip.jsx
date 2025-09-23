import React, { useState, useEffect } from 'react';
import { getPublicBanners } from '../services/api.js';

const BannerStrip = () => {
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000); // Rotate every 5 seconds

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await getPublicBanners();
      setBanners(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = (banner) => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  const goToBanner = (index) => {
    setCurrentBanner(index);
  };

  const goToPrevious = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  if (loading) {
    return (
      <div className="w-full h-32 bg-gray-100 animate-pulse rounded-lg"></div>
    );
  }

  if (error || banners.length === 0) {
    return null; // Don't show anything if there are no banners or error
  }

  return (
    <div className="relative w-full bg-white border-b border-gray-200">
      <div className="relative overflow-hidden">
        {/* Banner Container */}
        <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentBanner * 100}%)` }}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="w-full flex-shrink-0 relative"
            >
              <div
                className={`w-full h-32 md:h-40 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity ${
                  banner.link_url ? 'cursor-pointer' : 'cursor-default'
                }`}
                onClick={() => handleBannerClick(banner)}
              >
                {banner.image ? (
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {banner.title}
                    </h3>
                    {banner.link_url && (
                      <p className="text-blue-600 hover:text-blue-700">
                        Click to learn more →
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows (only show if multiple banners) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all"
              aria-label="Previous banner"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all"
              aria-label="Next banner"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots Indicator (only show if multiple banners) */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToBanner(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentBanner
                    ? 'bg-white shadow-md'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => setBanners([])}
        className="absolute top-2 right-2 bg-black bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-1 transition-all"
        aria-label="Close banners"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default BannerStrip;
