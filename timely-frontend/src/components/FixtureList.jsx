import React from 'react';
import { ClockIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const FixtureList = ({ fixtures, loading = false }) => {
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="text-center py-12">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No fixtures scheduled</h3>
        <p className="mt-1 text-sm text-gray-500">
          Fixtures will appear here once they are published by the event organizers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fixtures.map((fixture) => (
        <div
          key={fixture.id}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Round {fixture.round}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <ClockIcon className="h-4 w-4 mr-2" />
                <span>{formatDateTime(fixture.start_at)}</span>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fixture.status)}`}>
              {fixture.status}
            </span>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Home Team</div>
              <div className="font-semibold text-gray-900">
                {fixture.home_team_name || 'TBD'}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Away Team</div>
              <div className="font-semibold text-gray-900">
                {fixture.away_team_name || 'TBD'}
              </div>
            </div>
          </div>

          {/* Venue */}
          {fixture.venue_name && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2" />
              <span>{fixture.venue_name}</span>
            </div>
          )}

          {/* Phase */}
          <div className="mt-2 text-sm text-gray-500">
            Phase: {fixture.phase}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FixtureList;
