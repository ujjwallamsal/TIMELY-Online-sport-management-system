import { useState, useEffect, useRef } from 'react';
import { useNotifications } from './NotificationSystem';

export default function LiveMatchScorer({ 
  match, 
  onScoreUpdate, 
  onStatusUpdate,
  isOrganizer = false 
}) {
  const { addNotification } = useNotifications();
  const [score, setScore] = useState({
    team_a: match?.team_a_score || 0,
    team_b: match?.team_b_score || 0
  });
  const [status, setStatus] = useState(match?.status || 'SCHEDULED');
  const [isLive, setIsLive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (status === 'LIVE' && !isLive) {
      startMatch();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [status]);

  const startMatch = () => {
    setIsLive(true);
    setTimer(0);
    setIsPaused(false);
    
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setTimer(prev => prev + 1);
      }
    }, 1000);

    // Connect to WebSocket for real-time updates
    connectWebSocket();
  };

  const connectWebSocket = () => {
    if (!match?.id) return;

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = '127.0.0.1';
    const ws = new WebSocket(`${proto}://${host}:8000/ws/matches/${match.id}/`);
    
    ws.onopen = () => {
      console.log('Connected to match WebSocket');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to connect to live match updates'
      });
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'score_updated':
        setScore({
          team_a: data.team_a_score,
          team_b: data.team_b_score
        });
        addNotification({
          type: 'info',
          title: 'Score Updated',
          message: `Score updated by ${data.updated_by}`
        });
        break;
      case 'status_updated':
        setStatus(data.status);
        addNotification({
          type: 'info',
          title: 'Match Status',
          message: `Match status changed to ${data.status}`
        });
        break;
      default:
        break;
    }
  };

  const updateScore = (team, increment) => {
    if (!isOrganizer) return;

    const newScore = {
      ...score,
      [team]: Math.max(0, score[team] + increment)
    };

    setScore(newScore);

    // Send update via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'score_update',
        team_a_score: newScore.team_a,
        team_b_score: newScore.team_b,
        timestamp: new Date().toISOString()
      }));
    }

    // Call parent callback
    onScoreUpdate?.(newScore);
  };

  const updateStatus = (newStatus) => {
    if (!isOrganizer) return;

    setStatus(newStatus);

    // Send update via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'match_status',
        status: newStatus,
        timestamp: new Date().toISOString()
      }));
    }

    // Call parent callback
    onStatusUpdate?.(newStatus);

    if (newStatus === 'LIVE' && !isLive) {
      startMatch();
    } else if (newStatus === 'COMPLETED' && isLive) {
      endMatch();
    }
  };

  const endMatch = () => {
    setIsLive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'LIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Live Match Scoring</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
      <div className="card-body">
        {/* Match Timer */}
        {isLive && (
          <div className="text-center mb-6">
            <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
              {formatTime(timer)}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={togglePause}
                className="btn btn-secondary btn-sm"
              >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              <button
                onClick={() => updateStatus('COMPLETED')}
                className="btn btn-danger btn-sm"
              >
                🏁 End Match
              </button>
            </div>
          </div>
        )}

        {/* Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Team A */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-2">
              {match?.team_a?.name || 'Team A'}
            </div>
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {score.team_a}
            </div>
            {isOrganizer && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => updateScore('team_a', -1)}
                  className="btn btn-danger btn-sm"
                  disabled={score.team_a <= 0}
                >
                  -1
                </button>
                <button
                  onClick={() => updateScore('team_a', 1)}
                  className="btn btn-success btn-sm"
                >
                  +1
                </button>
              </div>
            )}
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <div className="text-4xl font-bold text-gray-400">VS</div>
          </div>

          {/* Team B */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-2">
              {match?.team_b?.name || 'Team B'}
            </div>
            <div className="text-6xl font-bold text-red-600 mb-4">
              {score.team_b}
            </div>
            {isOrganizer && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => updateScore('team_b', -1)}
                  className="btn btn-danger btn-sm"
                  disabled={score.team_b <= 0}
                >
                  -1
                </button>
                <button
                  onClick={() => updateScore('team_b', 1)}
                  className="btn btn-success btn-sm"
                >
                  +1
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Match Controls */}
        {isOrganizer && (
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Match Controls</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => updateStatus('SCHEDULED')}
                className={`btn btn-sm ${status === 'SCHEDULED' ? 'btn-primary' : 'btn-secondary'}`}
              >
                📅 Scheduled
              </button>
              <button
                onClick={() => updateStatus('LIVE')}
                className={`btn btn-sm ${status === 'LIVE' ? 'btn-primary' : 'btn-secondary'}`}
              >
                🔴 Live
              </button>
              <button
                onClick={() => updateStatus('COMPLETED')}
                className={`btn btn-sm ${status === 'COMPLETED' ? 'btn-primary' : 'btn-secondary'}`}
              >
                ✅ Completed
              </button>
              <button
                onClick={() => updateStatus('CANCELLED')}
                className={`btn btn-sm ${status === 'CANCELLED' ? 'btn-primary' : 'btn-secondary'}`}
              >
                ❌ Cancelled
              </button>
            </div>
          </div>
        )}

        {/* Match Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Venue:</span>
              <span className="ml-2 text-gray-600">{match?.venue?.name || 'TBD'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Round:</span>
              <span className="ml-2 text-gray-600">{match?.round || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Match ID:</span>
              <span className="ml-2 text-gray-600">{match?.id || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Updated:</span>
              <span className="ml-2 text-gray-600">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
