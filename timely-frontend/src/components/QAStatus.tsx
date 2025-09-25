import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

interface QAStatusProps {
  className?: string;
}

interface EndpointStatus {
  name: string;
  url: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  responseTime?: number;
  error?: string;
}

const QAStatus: React.FC<QAStatusProps> = ({ className = '' }) => {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const criticalEndpoints = [
    { name: 'Health Check', url: '/api/health/' },
    { name: 'Authentication', url: '/api/auth/login/' },
    { name: 'Events', url: '/api/events/' },
    { name: 'Users', url: '/api/users/' },
    { name: 'Registrations', url: '/api/registrations/' },
    { name: 'Fixtures', url: '/api/fixtures/' },
    { name: 'Results', url: '/api/results/' },
  ];

  const checkEndpoints = async () => {
    setIsChecking(true);
    setEndpoints(criticalEndpoints.map(ep => ({ ...ep, status: 'checking' as const })));

    const results = await Promise.allSettled(
      criticalEndpoints.map(async (endpoint) => {
        const startTime = Date.now();
        try {
          const response = await api.get(endpoint.url);
          const responseTime = Date.now() - startTime;
          
          return {
            ...endpoint,
            status: response.status === 200 ? 'success' : 'warning',
            responseTime,
          } as EndpointStatus;
        } catch (error: any) {
          const responseTime = Date.now() - startTime;
          return {
            ...endpoint,
            status: error.response?.status === 404 ? 'warning' : 'error',
            responseTime,
            error: error.message,
          } as EndpointStatus;
        }
      })
    );

    const endpointResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          ...criticalEndpoints[index],
          status: 'error' as const,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    setEndpoints(endpointResults);
    setLastChecked(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    checkEndpoints();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400 animate-pulse" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-800 bg-green-100';
      case 'error':
        return 'text-red-800 bg-red-100';
      case 'warning':
        return 'text-yellow-800 bg-yellow-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const successCount = endpoints.filter(ep => ep.status === 'success').length;
  const errorCount = endpoints.filter(ep => ep.status === 'error').length;
  const warningCount = endpoints.filter(ep => ep.status === 'warning').length;

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">API Status</h3>
        <button
          onClick={checkEndpoints}
          disabled={isChecking}
          className="btn btn-outline btn-sm inline-flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{successCount}</div>
          <div className="text-sm text-green-800">Working</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          <div className="text-sm text-yellow-800">Warnings</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          <div className="text-sm text-red-800">Errors</div>
        </div>
      </div>

      {/* Endpoint List */}
      <div className="space-y-2">
        {endpoints.map((endpoint, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(endpoint.status)}
              <div>
                <div className="text-sm font-medium text-gray-900">{endpoint.name}</div>
                <div className="text-xs text-gray-500">{endpoint.url}</div>
                {endpoint.error && (
                  <div className="text-xs text-red-600 mt-1">{endpoint.error}</div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {endpoint.responseTime && (
                <span className="text-xs text-gray-500">
                  {endpoint.responseTime}ms
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(endpoint.status)}`}>
                {endpoint.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {lastChecked && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default QAStatus;
