import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  listTeams, 
  getTeam, 
  getTeamMembers, 
  getTeamEntries, 
  checkTeamEligibility,
  createTeamEntry,
  withdrawTeamEntry
} from '../lib/api';
import TeamRosterTable from '../components/TeamRosterTable';
import RosterMemberForm from '../components/RosterMemberForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const TeamDashboard = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('roster');
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);

  // WebSocket connection for realtime updates
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (teamId) {
      loadTeamData();
      setupWebSocket();
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [teamId]);

  const setupWebSocket = () => {
    try {
      const ws = new WebSocket(`ws://127.0.0.1:8000/ws/teams/${teamId}/`);
      
      ws.onopen = () => {
        console.log('Connected to team WebSocket');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        // Fallback to polling if WebSocket fails
        setTimeout(setupWebSocket, 30000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setSocket(ws);
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
      // Fallback to polling
      const pollInterval = setInterval(loadTeamData, 30000);
      return () => clearInterval(pollInterval);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'team.roster.updated':
        loadTeamMembers();
        break;
      case 'team.entry.status':
        loadTeamEntries();
        break;
      default:
        console.log('Unknown WebSocket message:', data);
    }
  };

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [teamResponse, membersResponse, entriesResponse] = await Promise.all([
        getTeam(teamId),
        getTeamMembers(teamId),
        getTeamEntries(teamId)
      ]);
      
      setTeam(teamResponse.data);
      setMembers(membersResponse.data);
      setEntries(entriesResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load team data');
      console.error('Error loading team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await getTeamMembers(teamId);
      setMembers(response.data);
    } catch (err) {
      console.error('Error loading team members:', err);
    }
  };

  const loadTeamEntries = async () => {
    try {
      const response = await getTeamEntries(teamId);
      setEntries(response.data);
    } catch (err) {
      console.error('Error loading team entries:', err);
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setShowMemberForm(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowMemberForm(true);
  };

  const handleMemberFormClose = () => {
    setShowMemberForm(false);
    setEditingMember(null);
    loadTeamMembers();
  };

  const handleCreateEntry = async () => {
    if (!selectedEvent) return;

    try {
      // Check eligibility first
      const eligibilityResponse = await checkTeamEligibility(
        teamId, 
        selectedEvent.id, 
        selectedDivision?.id
      );
      
      if (!eligibilityResponse.data.eligible) {
        setEligibilityResult(eligibilityResponse.data);
        return;
      }

      // Create entry
      await createTeamEntry(teamId, {
        event: selectedEvent.id,
        division: selectedDivision?.id || null
      });

      setShowEntryForm(false);
      setSelectedEvent(null);
      setSelectedDivision(null);
      setEligibilityResult(null);
      loadTeamEntries();
    } catch (err) {
      console.error('Error creating entry:', err);
      setError('Failed to create entry');
    }
  };

  const handleWithdrawEntry = async (entryId) => {
    try {
      await withdrawTeamEntry(entryId, 'Withdrawn by team manager');
      loadTeamEntries();
    } catch (err) {
      console.error('Error withdrawing entry:', err);
      setError('Failed to withdraw entry');
    }
  };

  const canManageTeam = () => {
    if (!team || !user) return false;
    return user.is_staff || 
           team.manager === user.id || 
           team.created_by === user.id ||
           members.some(m => m.user === user.id && m.can_manage_team);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested team could not be found.'}</p>
          <button
            onClick={() => navigate('/teams')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600 mt-1">{team.sport} • {team.active_members} active members</p>
              {team.description && (
                <p className="text-gray-700 mt-2">{team.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Manager</p>
              <p className="font-medium">{team.manager?.full_name || 'Unknown'}</p>
              {team.coach && (
                <>
                  <p className="text-sm text-gray-500 mt-2">Coach</p>
                  <p className="font-medium">{team.coach.full_name}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('roster')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'roster'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Roster
              </button>
              <button
                onClick={() => setActiveTab('entries')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'entries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Event Entries
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'roster' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Team Roster</h2>
                  {canManageTeam() && (
                    <button
                      onClick={handleAddMember}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Member
                    </button>
                  )}
                </div>
                
                <TeamRosterTable
                  members={members}
                  onEditMember={canManageTeam() ? handleEditMember : null}
                  onDeleteMember={canManageTeam() ? (id) => console.log('Delete member:', id) : null}
                />
              </div>
            )}

            {activeTab === 'entries' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Event Entries</h2>
                  {canManageTeam() && (
                    <button
                      onClick={() => setShowEntryForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Entry
                    </button>
                  )}
                </div>

                {entries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Event Entries</h3>
                    <p className="text-gray-500">This team hasn't entered any events yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{entry.event_name}</h3>
                            {entry.division_name && (
                              <p className="text-sm text-gray-600">{entry.division_name}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              Created {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                              entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              entry.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {entry.status_display}
                            </span>
                            {canManageTeam() && entry.status === 'pending' && (
                              <button
                                onClick={() => handleWithdrawEntry(entry.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Withdraw
                              </button>
                            )}
                          </div>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-gray-600 mt-2">{entry.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Member Form Modal */}
        {showMemberForm && (
          <RosterMemberForm
            teamId={teamId}
            member={editingMember}
            onClose={handleMemberFormClose}
          />
        )}

        {/* Entry Form Modal */}
        {showEntryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Event Entry</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event
                  </label>
                  <select
                    value={selectedEvent?.id || ''}
                    onChange={(e) => {
                      const eventId = e.target.value;
                      const event = { id: eventId, name: e.target.options[e.target.selectedIndex].text };
                      setSelectedEvent(event);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select an event...</option>
                    {/* This would be populated from events API */}
                    <option value="1">Basketball Tournament 2024</option>
                    <option value="2">Soccer Championship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Division (Optional)
                  </label>
                  <select
                    value={selectedDivision?.id || ''}
                    onChange={(e) => {
                      const divisionId = e.target.value;
                      const division = divisionId ? { id: divisionId, name: e.target.options[e.target.selectedIndex].text } : null;
                      setSelectedDivision(division);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No specific division</option>
                    <option value="1">Open Division</option>
                    <option value="2">Youth Division</option>
                  </select>
                </div>

                {eligibilityResult && !eligibilityResult.eligible && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Eligibility Issues:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {eligibilityResult.reasons.map((reason, index) => (
                        <li key={index}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEntryForm(false);
                    setSelectedEvent(null);
                    setSelectedDivision(null);
                    setEligibilityResult(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEntry}
                  disabled={!selectedEvent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDashboard;
