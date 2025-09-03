// components/Bracket.jsx
import React from 'react';

export default function Bracket({ matches }) {
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round_no]) {
      acc[match.round_no] = [];
    }
    acc[match.round_no].push(match);
    return acc;
  }, {});

  // Sort rounds
  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  // Get max matches in any round for grid layout
  const maxMatches = Math.max(...rounds.map(round => matchesByRound[round].length));

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'TBD';
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'border-gray-300 bg-gray-50';
      case 'scheduled':
        return 'border-blue-300 bg-blue-50';
      case 'published':
        return 'border-green-300 bg-green-50';
      case 'completed':
        return 'border-purple-300 bg-purple-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  if (rounds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">🏆</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bracket matches found</h3>
        <p className="text-gray-500">Generate knockout fixtures to see the bracket view.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Tournament Bracket</h2>
        
        {/* Bracket Grid */}
        <div 
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${rounds.length}, 1fr)`,
            gridTemplateRows: `repeat(${maxMatches}, 1fr)`
          }}
        >
          {rounds.map((roundNo, roundIndex) => {
            const roundMatches = matchesByRound[roundNo].sort((a, b) => a.sequence_no - b.sequence_no);
            
            return (
              <div key={roundNo} className="flex flex-col">
                {/* Round Header */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {roundNo === 1 ? 'First Round' : 
                     roundNo === 2 ? 'Quarter Finals' :
                     roundNo === 3 ? 'Semi Finals' :
                     roundNo === 4 ? 'Final' : `Round ${roundNo}`}
                  </h3>
                  <p className="text-sm text-gray-500">{roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}</p>
                </div>

                {/* Matches in this round */}
                <div className="space-y-4">
                  {roundMatches.map((match, matchIndex) => (
                    <div
                      key={match.id}
                      className={`border-2 rounded-lg p-4 ${getStatusColor(match.status)}`}
                    >
                      {/* Match Header */}
                      <div className="text-center mb-3">
                        <div className="text-sm font-medium text-gray-700">
                          Match {match.sequence_no}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(match.starts_at)}
                        </div>
                      </div>

                      {/* Teams */}
                      <div className="space-y-2">
                        {/* Home Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {match.team_home_detail?.name || 'TBD'}
                            </div>
                            <div className="text-xs text-gray-500">Home</div>
                          </div>
                          <div className="text-gray-400 font-bold text-lg">vs</div>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {match.team_away_detail?.name || 'TBD'}
                            </div>
                            <div className="text-xs text-gray-500">Away</div>
                          </div>
                        </div>
                      </div>

                      {/* Venue */}
                      {match.venue_detail && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            <div className="font-medium">{match.venue_detail.name}</div>
                            {match.venue_detail.city && (
                              <div>{match.venue_detail.city}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">
                            {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                          </span>
                          {match.duration_minutes && (
                            <span className="text-xs text-gray-500">
                              {match.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Status Legend</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-2"></div>
              <span className="text-gray-600">Draft</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-50 border border-blue-300 rounded mr-2"></div>
              <span className="text-gray-600">Scheduled</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-50 border border-green-300 rounded mr-2"></div>
              <span className="text-gray-600">Published</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-50 border border-purple-300 rounded mr-2"></div>
              <span className="text-gray-600">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
