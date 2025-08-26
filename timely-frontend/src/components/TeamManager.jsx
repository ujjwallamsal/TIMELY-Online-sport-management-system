import { useState, useEffect } from 'react';
import { useNotifications } from './NotificationSystem';

export default function TeamManager({ 
  team, 
  onTeamUpdate, 
  onPlayerAdd, 
  onPlayerRemove,
  onPlayerUpdate,
  isCoach = false 
}) {
  const { addNotification } = useNotifications();
  const [players, setPlayers] = useState(team?.players || []);
  const [newPlayer, setNewPlayer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    jersey_number: '',
    date_of_birth: '',
    emergency_contact: ''
  });
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterPosition, setFilterPosition] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (team?.players) {
      setPlayers(team.players);
    }
  }, [team]);

  const handleAddPlayer = async () => {
    if (!newPlayer.first_name || !newPlayer.last_name || !newPlayer.email) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    try {
      const playerData = {
        ...newPlayer,
        id: Date.now(), // In real app, this would come from backend
        status: 'ACTIVE',
        joined_date: new Date().toISOString()
      };

      await onPlayerAdd?.(playerData);
      setPlayers(prev => [...prev, playerData]);
      setNewPlayer({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: '',
        jersey_number: '',
        date_of_birth: '',
        emergency_contact: ''
      });
      setShowAddForm(false);
      
      addNotification({
        type: 'success',
        title: 'Player Added',
        message: `${playerData.first_name} ${playerData.last_name} has been added to the team`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add player to team'
      });
    }
  };

  const handleUpdatePlayer = async (playerId, updates) => {
    try {
      await onPlayerUpdate?.(playerId, updates);
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      ));
      setEditingPlayer(null);
      
      addNotification({
        type: 'success',
        title: 'Player Updated',
        message: 'Player information has been updated'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update player information'
      });
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (!confirm('Are you sure you want to remove this player from the team?')) {
      return;
    }

    try {
      await onPlayerRemove?.(playerId);
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      
      addNotification({
        type: 'success',
        title: 'Player Removed',
        message: 'Player has been removed from the team'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to remove player from team'
      });
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesPosition = filterPosition === 'all' || player.position === filterPosition;
    const matchesSearch = player.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPosition && matchesSearch;
  });

  const getPositionColor = (position) => {
    switch (position) {
      case 'Goalkeeper': return 'bg-red-100 text-red-800';
      case 'Defender': return 'bg-blue-100 text-blue-800';
      case 'Midfielder': return 'bg-green-100 text-green-800';
      case 'Forward': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INJURED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="card">
        <div className="card-header">
          <h3>Team Overview</h3>
          {isCoach && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary btn-sm"
            >
              {showAddForm ? '❌ Cancel' : '👤 Add Player'}
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{players.length}</div>
              <div className="text-sm text-blue-600">Total Players</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {players.filter(p => p.status === 'ACTIVE').length}
              </div>
              <div className="text-sm text-green-600">Active Players</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {players.filter(p => p.status === 'INJURED').length}
              </div>
              <div className="text-sm text-red-600">Injured</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {players.filter(p => p.status === 'SUSPENDED').length}
              </div>
              <div className="text-sm text-yellow-600">Suspended</div>
            </div>
          </div>

          {/* Add Player Form */}
          {showAddForm && isCoach && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium mb-4">Add New Player</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    value={newPlayer.first_name}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, first_name: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    value={newPlayer.last_name}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, last_name: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={newPlayer.email}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, email: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    value={newPlayer.phone}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, phone: e.target.value }))}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, position: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">Select Position</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                    <option value="Defender">Defender</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Forward">Forward</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Jersey Number</label>
                  <input
                    type="number"
                    value={newPlayer.jersey_number}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, jersey_number: e.target.value }))}
                    className="form-input"
                    min="1"
                    max="99"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAddPlayer}
                  className="btn btn-primary"
                >
                  👤 Add Player
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="form-group">
              <label className="form-label">Position</label>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="form-input"
              >
                <option value="all">All Positions</option>
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Defender">Defender</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Forward">Forward</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                placeholder="Search players..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="card">
        <div className="card-header">
          <h3>Team Roster</h3>
          <span className="text-sm text-gray-600">
            {filteredPlayers.length} of {players.length} players
          </span>
        </div>
        <div className="card-body">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-gray-600">No players found with current filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlayers.map(player => (
                <div key={player.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  {editingPlayer?.id === player.id ? (
                    <PlayerEditForm
                      player={editingPlayer}
                      onSave={(updates) => handleUpdatePlayer(player.id, updates)}
                      onCancel={() => setEditingPlayer(null)}
                      onChange={setEditingPlayer}
                    />
                  ) : (
                    <PlayerDisplay
                      player={player}
                      onEdit={() => setEditingPlayer({ ...player })}
                      onRemove={() => handleRemovePlayer(player.id)}
                      isCoach={isCoach}
                      getPositionColor={getPositionColor}
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

function PlayerDisplay({ player, onEdit, onRemove, isCoach, getPositionColor, getStatusColor }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
          {player.jersey_number || player.first_name.charAt(0)}
        </div>
        
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h4 className="font-medium text-gray-800">
              {player.first_name} {player.last_name}
            </h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
              {player.position || 'N/A'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(player.status)}`}>
              {player.status}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 space-x-4">
            <span>📧 {player.email}</span>
            {player.phone && <span>📱 {player.phone}</span>}
            {player.joined_date && (
              <span>📅 Joined: {new Date(player.joined_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
      
      {isCoach && (
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="btn btn-secondary btn-sm"
          >
            ✏️ Edit
          </button>
          <button
            onClick={onRemove}
            className="btn btn-danger btn-sm"
          >
            🗑️ Remove
          </button>
        </div>
      )}
    </div>
  );
}

function PlayerEditForm({ player, onSave, onCancel, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...player, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input
            type="text"
            value={player.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input
            type="text"
            value={player.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Position</label>
          <select
            value={player.position}
            onChange={(e) => handleChange('position', e.target.value)}
            className="form-input"
          >
            <option value="">Select Position</option>
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Defender">Defender</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Forward">Forward</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            value={player.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="form-input"
          >
            <option value="ACTIVE">Active</option>
            <option value="INJURED">Injured</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => onSave(player)}
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
