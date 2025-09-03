import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  generateFixtures, acceptFixtures, getEventFixtures, publishEventFixtures,
  rescheduleFixture, getFixtureConflicts, getEvents, getTeams
} from '../lib/api';
import { useToast } from '../hooks/useToast.jsx';
import { useSocket } from '../hooks/useSocket';
import FixtureRow from '../components/FixtureRow';

export default function Fixtures() {
  const { eventId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [proposal, setProposal] = useState(null);
  const [generationMode, setGenerationMode] = useState('rr');
  const [slotHints, setSlotHints] = useState({
    starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    spacing_minutes: 60
  });

  // WebSocket for realtime updates
  const { isConnected, lastMessage } = useSocket(
    eventId ? `fixtures:event:${eventId}` : null
  );

  // Load initial data
  useEffect(() => {
    loadEvents();
    if (eventId) {
      loadEventFixtures();
    }
  }, [eventId]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage);
      if (data.type === 'fixtures.updated' || data.type === 'fixtures.deleted') {
        loadEventFixtures();
      }
    }
  }, [lastMessage]);

  const loadEvents = async () => {
    try {
      const response = await getEvents({ page_size: 100 });
      setEvents(response.data.results || []);
      
      if (eventId) {
        const event = response.data.results?.find(e => e.id === parseInt(eventId));
        if (event) {
          setSelectedEvent(event);
          loadTeams(event.id);
        }
      }
    } catch (error) {
      showError('Failed to load events');
    }
  };

  const loadTeams = async (eventId) => {
    try {
      const response = await getTeams({ event: eventId, page_size: 100 });
      setTeams(response.data.results || []);
    } catch (error) {
      showError('Failed to load teams');
    }
  };

  const loadEventFixtures = async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      const response = await getEventFixtures(eventId);
      setFixtures(response.data.results || []);
    } catch (error) {
      showError('Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFixtures = async () => {
    if (!selectedEvent || selectedTeams.length < 2) {
      showError('Please select an event and at least 2 teams');
      return;
    }

    try {
      setLoading(true);
      const data = {
        event_id: selectedEvent.id,
        mode: generationMode,
        participants: selectedTeams.map(team => team.id),
        slot_hints: slotHints
      };

      const response = await generateFixtures(data);
      setProposal(response.data);
      setActiveTab('draft');
      showSuccess('Fixtures generated successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to generate fixtures');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFixtures = async () => {
    if (!proposal) return;

    try {
      setLoading(true);
      const data = {
        event_id: proposal.event_id,
        fixtures: proposal.fixtures
      };

      await acceptFixtures(data);
      setProposal(null);
      setActiveTab('draft');
      loadEventFixtures();
      showSuccess('Fixtures accepted and saved as draft');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to accept fixtures');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAll = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      await publishEventFixtures(eventId);
      loadEventFixtures();
      showSuccess('All fixtures published successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to publish fixtures');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (fixtureId, newData) => {
    try {
      setLoading(true);
      await rescheduleFixture(fixtureId, newData);
      loadEventFixtures();
      showSuccess('Fixture rescheduled successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to reschedule fixture');
    } finally {
      setLoading(false);
    }
  };

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
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canManage = selectedEvent && (
    selectedEvent.created_by === 'current_user' || 
    'is_staff' in window.currentUser
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fixtures & Scheduling</h1>
          <p className="mt-2 text-gray-600">
            Generate, manage, and publish tournament fixtures
          </p>
        </div>

        {/* Event Selection */}
        {!eventId && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            <select
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const event = events.find(ev => ev.id === parseInt(e.target.value));
                setSelectedEvent(event);
                if (event) {
                  loadTeams(event.id);
                }
              }}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an event...</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['generate', 'draft', 'published'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Generate Fixtures</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="rr"
                      checked={generationMode === 'rr'}
                      onChange={(e) => setGenerationMode(e.target.value)}
                      className="mr-2"
                    />
                    Round-Robin (everyone plays everyone)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="ko"
                      checked={generationMode === 'ko'}
                      onChange={(e) => setGenerationMode(e.target.value)}
                      className="mr-2"
                    />
                    Knockout (single elimination)
                  </label>
                </div>
              </div>

              {/* Team Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Teams ({selectedTeams.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {teams.map(team => (
                    <label key={team.id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        checked={selectedTeams.some(t => t.id === team.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeams([...selectedTeams, team]);
                          } else {
                            setSelectedTeams(selectedTeams.filter(t => t.id !== team.id));
                          }
                        }}
                        className="mr-2"
                      />
                      {team.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Slot Hints */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={slotHints.starts_at}
                  onChange={(e) => setSlotHints({...slotHints, starts_at: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spacing (minutes)
                </label>
                <input
                  type="number"
                  value={slotHints.spacing_minutes}
                  onChange={(e) => setSlotHints({...slotHints, spacing_minutes: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="30"
                  step="15"
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-6">
              <button
                onClick={handleGenerateFixtures}
                disabled={loading || !selectedEvent || selectedTeams.length < 2}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Fixtures'}
              </button>
            </div>
          </div>
        )}

        {/* Draft Tab */}
        {activeTab === 'draft' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Draft Fixtures</h2>
              {canManage && (
                <button
                  onClick={handlePublishAll}
                  disabled={loading || fixtures.filter(f => f.status === 'draft').length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Publishing...' : 'Publish All'}
                </button>
              )}
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading fixtures...</div>
              ) : fixtures.filter(f => f.status === 'draft').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No draft fixtures found. Generate some fixtures first.
                </div>
              ) : (
                <div className="space-y-4">
                  {fixtures.filter(f => f.status === 'draft').map(fixture => (
                    <FixtureRow
                      key={fixture.id}
                      fixture={fixture}
                      canManage={canManage}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Published Tab */}
        {activeTab === 'published' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Published Fixtures</h2>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading fixtures...</div>
              ) : fixtures.filter(f => f.status === 'published').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No published fixtures found.
                </div>
              ) : (
                <div className="space-y-4">
                  {fixtures.filter(f => f.status === 'published').map(fixture => (
                    <FixtureRow
                      key={fixture.id}
                      fixture={fixture}
                      canManage={canManage}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Proposal Preview */}
        {proposal && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Generated Fixtures Preview</h3>
            <div className="space-y-4">
              {proposal.fixtures.map((fixture, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">Round {fixture.round_no}</span>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(fixture.starts_at)} - {formatDateTime(fixture.ends_at)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{fixture.entries.find(e => e.side === 'home')?.team_name || 'TBD'}</span>
                    <span className="text-gray-500">vs</span>
                    <span>{fixture.entries.find(e => e.side === 'away')?.team_name || 'TBD'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex space-x-4">
              <button
                onClick={handleAcceptFixtures}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Accept & Save as Draft
              </button>
              <button
                onClick={() => setProposal(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* WebSocket Status */}
        <div className="mt-4 text-sm text-gray-500">
          {isConnected ? (
            <span className="text-green-600">● Live updates enabled</span>
          ) : (
            <span className="text-yellow-600">● Using polling fallback</span>
          )}
        </div>
      </div>
    </div>
  );
}