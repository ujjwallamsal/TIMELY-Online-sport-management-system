import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../api/ENDPOINTS';
import { api } from '../api/client';

interface EndpointStatus {
  endpoint: string;
  status: 'pending' | 'ok' | 'error';
  statusCode?: number;
  error?: string;
}

export const EndpointProbe: React.FC = () => {
  const [statuses, setStatuses] = useState<EndpointStatus[]>([]);
  const [isProbing, setIsProbing] = useState(false);

  const probeEndpoint = async (endpoint: string): Promise<EndpointStatus> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}${endpoint}`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        }
      });
      
      const statusCode = response.status;
      const isOk = statusCode === 200 || statusCode === 401 || statusCode === 403;
      
      return {
        endpoint,
        status: isOk ? 'ok' : 'error',
        statusCode,
        error: isOk ? undefined : `HTTP ${statusCode}`
      };
    } catch (error) {
      return {
        endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const probeAllEndpoints = async () => {
    setIsProbing(true);
    setStatuses([]);

    const endpointsToProbe = [
      ENDPOINTS.health,
      ENDPOINTS.docs,
      ENDPOINTS.schema,
      ENDPOINTS.login,
      ENDPOINTS.refresh,
      ENDPOINTS.register,
      ENDPOINTS.me,
      ENDPOINTS.users,
      ENDPOINTS.events,
      ENDPOINTS.venues,
      ENDPOINTS.sports,
      ENDPOINTS.publicEvents,
      ENDPOINTS.registrations,
      ENDPOINTS.fixtures,
      ENDPOINTS.results,
      ENDPOINTS.news,
      ENDPOINTS.galleryAlbums,
      ENDPOINTS.galleryMedia,
      ENDPOINTS.checkout,
      ENDPOINTS.myTickets,
      ENDPOINTS.verify,
      ENDPOINTS.notifications,
      ENDPOINTS.threads,
      ENDPOINTS.messages,
    ];

    const results: EndpointStatus[] = [];
    
    for (const endpoint of endpointsToProbe) {
      const status = await probeEndpoint(endpoint);
      results.push(status);
      setStatuses([...results]);
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsProbing(false);
  };

  const getStatusColor = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'ok': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'ok': return '✓';
      case 'error': return '✗';
      default: return '⏳';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Endpoint Status Probe</h3>
        <button
          onClick={probeAllEndpoints}
          disabled={isProbing}
          className="btn btn-primary btn-sm"
        >
          {isProbing ? 'Probing...' : 'Probe All'}
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {statuses.length === 0 && !isProbing && (
          <p className="text-gray-500 text-sm">Click "Probe All" to check endpoint status</p>
        )}
        
        {statuses.map((status, index) => (
          <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <span className={getStatusColor(status.status)}>
                {getStatusIcon(status.status)}
              </span>
              <span className="text-sm font-mono">{status.endpoint}</span>
            </div>
            <div className="text-sm">
              {status.statusCode && (
                <span className="text-gray-500 mr-2">HTTP {status.statusCode}</span>
              )}
              {status.error && (
                <span className="text-red-600">{status.error}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {statuses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-green-600 font-semibold">
                {statuses.filter(s => s.status === 'ok').length}
              </div>
              <div className="text-gray-500">Working</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-semibold">
                {statuses.filter(s => s.status === 'error').length}
              </div>
              <div className="text-gray-500">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 font-semibold">
                {statuses.length}
              </div>
              <div className="text-gray-500">Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
