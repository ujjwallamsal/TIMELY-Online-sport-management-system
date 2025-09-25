import React from 'react';
import type { WebSocketStatus } from '../api/websocket';

interface WebSocketStatusIndicatorProps {
  status: WebSocketStatus;
}

export const WebSocketStatusIndicator: React.FC<WebSocketStatusIndicatorProps> = ({ 
  status
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Live',
          className: 'bg-green-500 text-white',
          icon: '🟢'
        };
      case 'connecting':
      case 'reconnecting':
        return {
          label: 'Connecting...',
          className: 'bg-yellow-500 text-white animate-pulse',
          icon: '🟡'
        };
      case 'disconnected':
        return {
          label: 'Offline',
          className: 'bg-gray-500 text-white',
          icon: '⚫'
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-500 text-white',
          icon: '❓'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
      <span>{statusInfo.icon}</span>
      <span>{statusInfo.label}</span>
    </div>
  );
};

export default WebSocketStatusIndicator;
