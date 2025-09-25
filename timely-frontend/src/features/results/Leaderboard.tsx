import React from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Medal, Award, Users, Target } from 'lucide-react';
import { useEvent } from '../../api/queries';

interface LeaderboardEntry {
  id: number;
  team_name: string;
  team_id: number;
  position: number;
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

const Leaderboard: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  
  const { data: event, isLoading, error } = useEvent(parseInt(eventId || '0'));
  const leaderboard = (event as any)?.leaderboard || [];

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-500">
          {position}
        </div>;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gray-50 border-gray-200';
      case 3:
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Leaderboard Not Available</h3>
            <p className="text-gray-500">No leaderboard data is available for this event yet.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
            <p className="text-gray-500">Results need to be recorded before the leaderboard can be generated.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Leaderboard</h1>
          <p className="text-gray-600">Current standings based on match results</p>
        </div>

        {/* Leaderboard Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-center">
                      <Target className="h-4 w-4 mr-1" />
                      Pts
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-center">
                      <Users className="h-4 w-4 mr-1" />
                      MP
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    W
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    D
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GF
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GA
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GD
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry: LeaderboardEntry) => (
                  <tr 
                    key={entry.id} 
                    className={`hover:bg-gray-50 transition-colors ${getPositionColor(entry.position)}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPositionIcon(entry.position)}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          #{entry.position}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.team_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-lg font-bold text-gray-900">
                        {entry.points}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {entry.matches_played}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {entry.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {entry.draws}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {entry.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {entry.goals_for}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {entry.goals_against}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      <span className={`font-medium ${
                        entry.goal_difference > 0 ? 'text-green-600' : 
                        entry.goal_difference < 0 ? 'text-red-600' : 
                        'text-gray-500'
                      }`}>
                        {entry.goal_difference > 0 ? '+' : ''}{entry.goal_difference}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-compact">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Scoring System</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Win: 3 points</div>
              <div>Draw: 1 point</div>
              <div>Loss: 0 points</div>
            </div>
          </div>
          
          <div className="card-compact">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Abbreviations</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Pts: Points</div>
              <div>MP: Matches Played</div>
              <div>W/D/L: Wins/Draws/Losses</div>
            </div>
          </div>
          
          <div className="card-compact">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Goals</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>GF: Goals For</div>
              <div>GA: Goals Against</div>
              <div>GD: Goal Difference</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
