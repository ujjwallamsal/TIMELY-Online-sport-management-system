import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      // Hide banner after 3 seconds when coming back online
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showBanner ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className={`flex items-center justify-center px-4 py-3 text-sm font-medium ${
          isOnline
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4 mr-2" />
            <span>Connection restored</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 mr-2" />
            <span>You're offline. Some features may be limited.</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
