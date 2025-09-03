// components/MatchRow.jsx
import React from 'react';

export default function MatchRow({ match, canManage, onReschedule }) {
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'TBD';
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'scheduled':
        return 'Scheduled';
      case 'published':
        return 'Published';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const handleReschedule = () => {
    onReschedule(match);
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center">
          <span className="font-medium">R{match.round_no}</span>
          <span className="ml-1 text-gray-500">M{match.sequence_no}</span>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {match.team_home_detail?.name || 'TBD'}
            </div>
            <div className="text-gray-500 text-xs">Home</div>
          </div>
          <div className="text-gray-400 font-bold">vs</div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {match.team_away_detail?.name || 'TBD'}
            </div>
            <div className="text-gray-500 text-xs">Away</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div>
          <div className="font-medium">
            {formatDateTime(match.starts_at)}
          </div>
          {match.duration_minutes && (
            <div className="text-gray-500 text-xs">
              {match.duration_minutes} min
            </div>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {match.venue_detail ? (
          <div>
            <div className="font-medium">{match.venue_detail.name}</div>
            {match.venue_detail.city && (
              <div className="text-gray-500 text-xs">{match.venue_detail.city}</div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">TBD</span>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(match.status)}`}>
          {getStatusDisplay(match.status)}
        </span>
      </td>
      
      {canManage && (
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReschedule}
              className="text-blue-600 hover:text-blue-900 focus:outline-none focus:underline"
            >
              Reschedule
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}
