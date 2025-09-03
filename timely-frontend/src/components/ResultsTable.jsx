import React from 'react';
import { TrophyIcon, ClockIcon } from '@heroicons/react/24/outline';

const ResultsTable = ({ results, loading = false }) => {
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-6 py-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No results available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Results will appear here once matches are completed and scores are recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrophyIcon className="h-5 w-5 mr-2" />
          Match Results
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {results.map((result) => (
          <div key={result.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              {/* Teams and Score */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {result.home_team ? result.home_team.name : 'TBD'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {result.score_home} - {result.score_away}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {result.away_team ? result.away_team.name : 'TBD'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Match Details */}
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Round {result.fixture.round_no}</span>
                  </div>
                  <div>
                    {formatDateTime(result.fixture.starts_at)}
                  </div>
                  {result.fixture.venue && (
                    <div>
                      {result.fixture.venue}
                    </div>
                  )}
                </div>
                
                {/* Notes */}
                {result.notes && (
                  <div className="mt-2 text-sm text-gray-600 italic">
                    {result.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsTable;
