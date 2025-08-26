import { useState } from 'react';

export default function MatchManager({ 
  matches = [], 
  venues = [], 
  onUpdateMatch, 
  onDeleteMatch,
  onPublishFixtures 
}) {
  const [editingMatch, setEditingMatch] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRound, setFilterRound] = useState('all');

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'LIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoundLabel = (round) => {
    if (round === 1) return 'Final';
    if (round === 2) return 'Semi-Final';
    if (round === 3) return 'Quarter-Final';
    return `Round ${round}`;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'TBD';
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('en-AU', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTime;
    }
  };

  const handleEditMatch = (match) => {
    setEditingMatch({ ...match });
  };

  const handleSaveMatch = async () => {
    try {
      await onUpdateMatch(editingMatch.id, editingMatch);
      setEditingMatch(null);
    } catch (error) {
      console.error('Failed to update match:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
  };

  const filteredMatches = matches.filter(match => {
    if (filterStatus !== 'all' && match.status !== filterStatus) return false;
    if (filterRound !== 'all' && match.round !== parseInt(filterRound)) return false;
    return true;
  });

  const getMatchStats = () => {
    const total = matches.length;
    const scheduled = matches.filter(m => m.status === 'SCHEDULED').length;
    const live = matches.filter(m => m.status === 'LIVE').length;
    const completed = matches.filter(m => m.status === 'COMPLETED').length;
    
    return { total, scheduled, live, completed };
  };

  const stats = getMatchStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Match Management</h3>
              <p className="text-gray-600">Manage fixtures and match schedules</p>
            </div>
            <button
              onClick={onPublishFixtures}
              className="btn btn-primary btn-sm"
            >
              📢 Publish Fixtures
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-600">Total Matches</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              <div className="text-sm text-blue-600">Scheduled</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.live}</div>
              <div className="text-sm text-green-600">Live</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input"
              >
                <option value="all">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Round</label>
              <select
                value={filterRound}
                onChange={(e) => setFilterRound(e.target.value)}
                className="form-input"
              >
                <option value="all">All Rounds</option>
                {Array.from(new Set(matches.map(m => m.round))).sort().map(round => (
                  <option key={round} value={round}>{getRoundLabel(round)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="card">
        <div className="card-body">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">⚽</div>
              <p className="text-gray-600">No matches found with current filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map(match => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  {editingMatch?.id === match.id ? (
                    <MatchEditForm
                      match={editingMatch}
                      venues={venues}
                      onSave={handleSaveMatch}
                      onCancel={handleCancelEdit}
                      onChange={setEditingMatch}
                    />
                  ) : (
                    <MatchDisplay
                      match={match}
                      onEdit={() => handleEditMatch(match)}
                      onDelete={() => onDeleteMatch(match.id)}
                      getRoundLabel={getRoundLabel}
                      formatDateTime={formatDateTime}
                      getStatusColor={getStatusColor}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchDisplay({ match, onEdit, onDelete, getRoundLabel, formatDateTime, getStatusColor }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
            {match.status}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {getRoundLabel(match.round)}
          </span>
          {match.match_number && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Match {match.match_number}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{match.team_a?.name || 'TBD'}</span>
            <span className="text-gray-400">vs</span>
            <span className="font-medium">{match.team_b?.name || 'TBD'}</span>
          </div>
          
          <div className="text-sm text-gray-500">
            📅 {formatDateTime(match.scheduled_at)}
          </div>
          
          {match.venue && (
            <div className="text-sm text-gray-500">
              🏟️ {match.venue.name}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="btn btn-secondary btn-sm"
        >
          ✏️ Edit
        </button>
        <button
          onClick={onDelete}
          className="btn btn-danger btn-sm"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

function MatchEditForm({ match, venues, onSave, onCancel, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...match, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Team A</label>
          <input
            type="text"
            value={match.team_a?.name || ''}
            onChange={(e) => handleChange('team_a', { ...match.team_a, name: e.target.value })}
            className="form-input"
            placeholder="Team A Name"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Team B</label>
          <input
            type="text"
            value={match.team_b?.name || ''}
            onChange={(e) => handleChange('team_b', { ...match.team_b, name: e.target.value })}
            className="form-input"
            placeholder="Team B Name"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Date & Time</label>
          <input
            type="datetime-local"
            value={match.scheduled_at ? new Date(match.scheduled_at).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange('scheduled_at', e.target.value)}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Venue</label>
          <select
            value={match.venue?.id || ''}
            onChange={(e) => {
              const venue = venues.find(v => v.id === parseInt(e.target.value));
              handleChange('venue', venue);
            }}
            className="form-input"
          >
            <option value="">Select Venue</option>
            {venues.map(venue => (
              <option key={venue.id} value={venue.id}>{venue.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Status</label>
        <select
          value={match.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="form-input"
        >
          <option value="SCHEDULED">Scheduled</option>
          <option value="LIVE">Live</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="btn btn-primary"
        >
          💾 Save Changes
        </button>
        <button
          onClick={onCancel}
          className="btn btn-secondary"
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );
}
