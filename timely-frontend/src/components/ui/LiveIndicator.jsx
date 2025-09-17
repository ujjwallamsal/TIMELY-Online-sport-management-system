import React from 'react';
import { WifiIcon, SignalSlashIcon, ClockIcon } from '@heroicons/react/24/outline';

const LiveIndicator = ({ status, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: WifiIcon,
          text: 'Live',
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          dotColor: 'bg-green-500'
        };
      case 'connecting':
        return {
          icon: ClockIcon,
          text: 'Connecting...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          dotColor: 'bg-yellow-500'
        };
      case 'polling':
        return {
          icon: ClockIcon,
          text: 'Polling',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          dotColor: 'bg-blue-500'
        };
      case 'disconnected':
      default:
        return {
          icon: SignalSlashIcon,
          text: 'Offline',
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          dotColor: 'bg-red-500'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color} ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.dotColor} ${status === 'connected' ? 'animate-pulse' : ''}`} />
      <Icon className="w-4 h-4" />
      <span>{config.text}</span>
    </div>
  );
};

export default LiveIndicator;
