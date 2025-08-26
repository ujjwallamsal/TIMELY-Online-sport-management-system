import { useState, useEffect, useRef } from 'react';
import { useNotifications } from './NotificationSystem';

export default function LiveLeaderboard({ 
  eventId, 
  participants = [], 
  matches = [] 
}) {
  const { addNotification } = useNotifications();
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    calculateLeaderboard();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [participants, matches]);

  const calculateLeaderboard = () => {
    const standings = participants.map(participant => {
      const participantMatches = matches.filter(match => 
        (match.team_a?.id === participant.id || match.team_b?.id === participant.id) &&
        match.status === 'COMPLETED'
      );

      let played = 0;
      let won = 0;
      let lost = 0;
      let drawn = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      let points = 0;

      participantMatches.forEach(match => {
        const isTeamA = match.team_a?.id === participant.id;
        const teamScore = isTeamA ? match.team_a_score : match.team_b_score;
        const opponentScore = isTeamA ? match.team_b_score : match.team_a_score;

        played++;
        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) {
          won++;
          points += 3;
        } else if (teamScore < opponentScore) {
          lost++;
        } else {
          drawn++;
          points += 1;
        }
      });

      const goalDifference = goalsFor - goalsAgainst;

      return {
        ...participant,
        played,
        won,
        lost,
        drawn,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points
      };
    });

    // Sort by points, then goal difference, then goals scored
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalsFor;
      return b.goalsFor - a.goalsFor;
    });

    // Add position
    standings.forEach((participant, index) => {
      participant.position = index + 1;
    });

    setLeaderboard(standings);
  };

  const connectWebSocket = () => {
    if (!eventId) return;

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = '127.0.0.1';
    const ws = new WebSocket(`${proto}://${host}:8000/ws/events/${eventId}/`);
    
    ws.onopen = () => {
      console.log('Connected to event WebSocket for leaderboard');
      setIsLive(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsLive(false);
    };

    ws.onclose = () => {
      setIsLive(false);
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'match_update':
        // Recalculate leaderboard when match updates
        calculateLeaderboard();
        break;
      case 'score_updated':
        // Recalculate leaderboard when scores change
        calculateLeaderboard();
        addNotification({
          type: 'info',
          title: 'Score Updated',
          message: 'Leaderboard has been updated'
        });
        break;
      default:
        break;
    }
  };

  const getPositionBadge = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return position;
  };

  const getPositionColor = (position) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800';
    if (position === 2) return 'bg-gray-100 text-gray-800';
    if (position === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-white';
  };

  const getFormIndicator = (participant) => {
    const recentMatches = matches
      .filter(match => 
        (match.team_a?.id === participant.id || match.team_b?.id === participant.id) &&
        match.status === 'COMPLETED'
      )
      .slice(-5)
      .reverse();

    return recentMatches.map(match => {
      const isTeamA = match.team_a?.id === participant.id;
      const teamScore = isTeamA ? match.team_a_score : match.team_b_score;
      const opponentScore = isTeamA ? match.team_b_score : match.team_a_score;

      if (teamScore > opponentScore) return 'W';
      if (teamScore < opponentScore) return 'L';
      return 'D';
    }).join('');
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3>Live Leaderboard</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isLive ? 'Live Updates' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      <div className="card-body">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-gray-600">No participants yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Pos</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Team</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">P</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">W</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">D</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">L</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">GF</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">GA</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">GD</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">Pts</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">Form</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((participant) => (
                  <tr 
                    key={participant.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${getPositionColor(participant.position)}`}
                  >
                    <td className="py-3 px-4 font-bold text-gray-800">
                      {getPositionBadge(participant.position)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {participant.name?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {participant.name || 'Team'}
                          </div>
                          {participant.division && (
                            <div className="text-sm text-gray-500">
                              {participant.division}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-gray-700">
                      {participant.played}
                    </td>
                    <td className="py-3 px-2 text-center text-green-600 font-medium">
                      {participant.won}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600 font-medium">
                      {participant.drawn}
                    </td>
                    <td className="py-3 px-2 text-center text-red-600 font-medium">
                      {participant.lost}
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-gray-700">
                      {participant.goalsFor}
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-gray-700">
                      {participant.goalsAgainst}
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-gray-700">
                      <span className={participant.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {participant.goalDifference >= 0 ? '+' : ''}{participant.goalDifference}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-gray-800">
                      {participant.points}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex gap-1 justify-center">
                        {getFormIndicator(participant).split('').map((result, index) => (
                          <span
                            key={index}
                            className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-100 text-green-700' :
                              result === 'L' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-100 rounded"></span>
              <span>🥇 1st Place</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-100 rounded"></span>
              <span>🥈 2nd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-100 rounded"></span>
              <span>🥉 3rd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">W</span>
              <span>Win</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold">L</span>
              <span>Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-bold">D</span>
              <span>Draw</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">+GD</span>
              <span>Positive Goal Difference</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-600">-GD</span>
              <span>Negative Goal Difference</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
