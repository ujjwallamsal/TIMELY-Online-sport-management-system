// src/components/ui/LiveDot.jsx
import React from 'react';

const LiveDot = ({ 
  isConnected, 
  connectionStatus, 
  className = '' 
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-400';
      case 'connecting':
        return 'bg-yellow-400 animate-pulse';
      case 'polling':
        return 'bg-blue-400';
      case 'disconnected':
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      case 'polling':
        return 'Polling';
      case 'disconnected':
      default:
        return 'Offline';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      <span className="text-xs text-gray-600 font-medium">
        {getStatusText()}
      </span>
    </div>
  );
};

export default LiveDot;
