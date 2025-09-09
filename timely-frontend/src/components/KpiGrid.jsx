import { useState, useEffect } from 'react';
import KpiCard from './KpiCard';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  TrophyIcon, 
  CurrencyDollarIcon,
  BellIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

/**
 * KPI Grid component for displaying multiple KPI cards
 * @param {Object} props - Component props
 * @param {Object} props.kpis - KPI data object
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onDrilldown - Drilldown handler
 * @param {Function} props.onRefresh - Refresh handler
 */
export default function KpiGrid({ kpis, loading = false, onDrilldown, onRefresh }) {
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (kpis?.lastUpdated) {
      setLastUpdated(new Date(kpis.lastUpdated));
    }
  }, [kpis]);

  // Calculate totals for summary cards
  const totalUsers = kpis?.usersByRole ? 
    Object.values(kpis.usersByRole).reduce((sum, count) => sum + count, 0) : 0;
  
  const totalEvents = kpis?.eventsByStatus ? 
    Object.values(kpis.eventsByStatus).reduce((sum, count) => sum + count, 0) : 0;
  
  const totalRegistrations = kpis?.registrationsByStatus ? 
    Object.values(kpis.registrationsByStatus).reduce((sum, count) => sum + count, 0) : 0;

  // Format last updated time
  const formatLastUpdated = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Key Performance Indicators</h2>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {formatLastUpdated(lastUpdated)}
          </p>
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }
            `}
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <path 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users */}
        <KpiCard
          title="Total Users"
          value={totalUsers}
          subtitle="All registered users"
          icon="users"
          color="blue"
          loading={loading}
          onClick={() => onDrilldown && onDrilldown('users')}
        />

        {/* Total Events */}
        <KpiCard
          title="Total Events"
          value={totalEvents}
          subtitle="All events created"
          icon="events"
          color="green"
          loading={loading}
          onClick={() => onDrilldown && onDrilldown('events')}
        />

        {/* Total Registrations */}
        <KpiCard
          title="Total Registrations"
          value={totalRegistrations}
          subtitle="All event registrations"
          icon="registrations"
          color="purple"
          loading={loading}
          onClick={() => onDrilldown && onDrilldown('registrations')}
        />

        {/* Ticket Sales & Revenue */}
        <KpiCard
          title="Ticket Revenue"
          value={kpis?.tickets?.totalCents || 0}
          subtitle={`${kpis?.tickets?.count || 0} tickets sold`}
          icon="revenue"
          color="orange"
          loading={loading}
          onClick={() => onDrilldown && onDrilldown('orders')}
        />

        {/* Notifications Sent */}
        <KpiCard
          title="Notifications Sent"
          value={kpis?.notificationsSent || 0}
          subtitle="Total notifications delivered"
          icon="notifications"
          color="indigo"
          loading={loading}
        />

        {/* Recent Errors */}
        <KpiCard
          title="Recent Errors"
          value={kpis?.errorsRecent || 0}
          subtitle="Errors in last 24 hours"
          icon="errors"
          color="red"
          loading={loading}
        />
      </div>

      {/* Breakdown Cards */}
      {(kpis?.usersByRole || kpis?.eventsByStatus || kpis?.registrationsByStatus) && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown by Category</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Users by Role */}
            {kpis?.usersByRole && Object.keys(kpis.usersByRole).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Users by Role
                </h4>
                <div className="space-y-2">
                  {Object.entries(kpis.usersByRole).map(([role, count]) => (
                    <div key={role} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {role.toLowerCase().replace('_', ' ')}
                      </span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events by Status */}
            {kpis?.eventsByStatus && Object.keys(kpis.eventsByStatus).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-green-600" />
                  Events by Status
                </h4>
                <div className="space-y-2">
                  {Object.entries(kpis.eventsByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {status.toLowerCase()}
                      </span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registrations by Status */}
            {kpis?.registrationsByStatus && Object.keys(kpis.registrationsByStatus).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <TrophyIcon className="w-5 h-5 mr-2 text-purple-600" />
                  Registrations by Status
                </h4>
                <div className="space-y-2">
                  {Object.entries(kpis.registrationsByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {status.toLowerCase()}
                      </span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
