import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  createFixture, generateFixtures, publishFixtures, regenerateFixtures,
  checkFixtureConflicts, deleteFixture, getFixtureSchedule
} from '../lib/api';
import { useNotifications } from '../components/NotificationSystem';

const Fixtures = () => {
  const { user, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  // Create a toast function using the notification system
  const toast = {
    success: (message) => addNotification({ type: 'success', title: 'Success', message }),
    error: (message) => addNotification({ type: 'error', title: 'Error', message }),
    info: (message) => addNotification({ type: 'info', title: 'Info', message })
  };
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [events, setEvents] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [venues, setVenues] = useState([]);

  // Form states
  const [createForm, setCreateForm] = useState({
    event: '',
    division: '',
    name: '',
    tournament_type: 'ROUND_ROBIN',
    rounds: 1,
    teams_per_match: 2,
    start_date: '',
    end_date: '',
    match_duration_minutes: 90,
    break_between_matches_minutes: 30,
    venues: [],
    max_matches_per_venue_per_day: 8,
    earliest_start_time: '09:00',
    latest_end_time: '22:00'
  });

  const [generateForm, setGenerateForm] = useState({
    generation_type: 'ROUND_ROBIN',
    rounds: 1,
    randomize_seeds: false,
    seed_teams: false,
    include_playoffs: false,
    group_size: 4,
    teams_per_group: 4,
    start_time: '09:00',
    end_time: '22:00',
    matches_per_day: 8,
    auto_assign_venues: true,
    venue_preferences: []
  });

  useEffect(() => {
    if (!isOrganizer) {
      navigate('/dashboard');
      return;
    }
    loadFixtures();
    loadFormData();
  }, [isOrganizer, navigate]);

  // Add fallback data for testing
  useEffect(() => {
    if (events.length === 0) {
      setEvents([
        { id: 1, name: 'Sample Event 1' },
        { id: 2, name: 'Sample Event 2' }
      ]);
    }
    if (divisions.length === 0) {
      setDivisions([
        { id: 1, name: 'Men\'s Division' },
        { id: 2, name: 'Women\'s Division' }
      ]);
    }
    if (venues.length === 0) {
      setVenues([
        { id: 1, name: 'Main Arena' },
        { id: 2, name: 'Training Ground' }
      ]);
    }
  }, [events.length, divisions.length, venues.length]);

  const loadFixtures = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/fixtures/');
      if (response.ok) {
        const data = await response.json();
        setFixtures(data);
      } else {
        console.error('Failed to load fixtures:', response.status);
        // Add sample data for testing
        setFixtures([
          {
            id: 1,
            name: 'Group A',
            event_name: 'Sample Event 1',
            division_name: 'Men\'s Division',
            tournament_type: 'ROUND_ROBIN',
            status: 'DRAFT',
            start_date: '2025-01-15',
            end_date: '2025-01-20',
            total_matches: 0,
            created_at: '2025-01-10T10:00:00Z'
          },
          {
            id: 2,
            name: 'Quarter Finals',
            event_name: 'Sample Event 2',
            division_name: 'Women\'s Division',
            tournament_type: 'KNOCKOUT',
            status: 'PROPOSED',
            start_date: '2025-01-25',
            end_date: '2025-01-30',
            total_matches: 8,
            created_at: '2025-01-12T14:00:00Z'
          }
        ]);
        toast.info('Loaded sample fixtures data');
      }
    } catch (error) {
      console.error('Error loading fixtures:', error);
      // Add sample data for testing
      setFixtures([
        {
          id: 1,
          name: 'Group A',
          event_name: 'Sample Event 1',
          division_name: 'Men\'s Division',
          tournament_type: 'ROUND_ROBIN',
          status: 'DRAFT',
          start_date: '2025-01-15',
          end_date: '2025-01-20',
          total_matches: 0,
          created_at: '2025-01-10T10:00:00Z'
        },
        {
          id: 2,
          name: 'Quarter Finals',
          event_name: 'Sample Event 2',
          division_name: 'Women\'s Division',
          tournament_type: 'KNOCKOUT',
          status: 'PROPOSED',
          start_date: '2025-01-25',
          end_date: '2025-01-30',
          total_matches: 8,
          created_at: '2025-01-12T14:00:00Z'
        }
      ]);
      toast.info('Loaded sample fixtures data');
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      // Load events, divisions, venues for form dropdowns
      const [eventsRes, divisionsRes, venuesRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/events/'),
        fetch('http://127.0.0.1:8000/api/divisions/'),
        fetch('http://127.0.0.1:8000/api/venues/')
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (eventsData.length > 0) setEvents(eventsData);
      }
      if (divisionsRes.ok) {
        const divisionsData = await divisionsRes.json();
        if (divisionsData.length > 0) setDivisions(divisionsData);
      }
      if (venuesRes.ok) {
        const venuesData = await venuesRes.json();
        if (venuesData.length > 0) setVenues(venuesData);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      // Fallback data will be set by useEffect
    }
  };

  const handleCreateFixture = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await createFixture(createForm);
      if (response && response.ok) {
        toast.success('Fixture created successfully!');
        setShowCreateForm(false);
        setCreateForm({
          event: '',
          division: '',
          name: '',
          tournament_type: 'ROUND_ROBIN',
          rounds: 1,
          teams_per_match: 2,
          start_date: '',
          end_date: '',
          match_duration_minutes: 90,
          break_between_matches_minutes: 30,
          venues: [],
          max_matches_per_venue_per_day: 8,
          earliest_start_time: '09:00',
          latest_end_time: '22:00'
        });
        loadFixtures();
      } else {
        const error = response ? await response.json() : { detail: 'Failed to create fixture' };
        toast.error(error.detail || 'Failed to create fixture');
      }
    } catch (error) {
      console.error('Error creating fixture:', error);
      toast.error('Failed to create fixture');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFixtures = async (e) => {
    e.preventDefault();
    if (!selectedFixture) return;

    setLoading(true);
    try {
      const response = await generateFixtures(selectedFixture.id, generateForm);
      if (response && response.ok) {
        const data = await response.json();
        toast.success(`Generated ${data.matches_count} matches successfully!`);
        setShowGenerateForm(false);
        setSelectedFixture(null);
        loadFixtures();
      } else {
        const error = response ? await response.json() : { detail: 'Failed to generate fixtures' };
        toast.error(error.detail || 'Failed to generate fixtures');
      }
    } catch (error) {
      console.error('Error generating fixtures:', error);
      toast.error('Failed to generate fixtures');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishFixtures = async (fixtureId) => {
    if (!window.confirm('Are you sure you want to publish these fixtures? This will make them visible to participants.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await publishFixtures(fixtureId, {
        publish_matches: true,
        send_notifications: true
      });
      if (response && response.ok) {
        toast.success('Fixtures published successfully!');
        loadFixtures();
      } else {
        const error = response ? await response.json() : { detail: 'Failed to publish fixtures' };
        toast.error(error.detail || 'Failed to publish fixtures');
      }
    } catch (error) {
      console.error('Error publishing fixtures:', error);
      toast.error('Failed to publish fixtures');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateFixtures = async (fixtureId) => {
    if (!window.confirm('Are you sure you want to regenerate fixtures? This will delete all existing matches.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await regenerateFixtures(fixtureId);
      if (response && response.ok) {
        toast.success('Fixtures reset to draft status');
        loadFixtures();
      } else {
        const error = response ? await response.json() : { detail: 'Failed to regenerate fixtures' };
        toast.error(error.detail || 'Failed to regenerate fixtures');
      }
    } catch (error) {
      console.error('Error regenerating fixtures:', error);
      toast.error('Failed to regenerate fixtures');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFixture = async (fixtureId) => {
    if (!window.confirm('Are you sure you want to delete this fixture? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await deleteFixture(fixtureId);
      if (response && response.ok) {
        toast.success('Fixture deleted successfully!');
        loadFixtures();
      } else {
        const error = response ? await response.json() : { detail: 'Failed to delete fixture' };
        toast.error(error.detail || 'Failed to delete fixture');
      }
    } catch (error) {
      console.error('Error deleting fixture:', error);
      toast.error('Failed to delete fixture');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PROPOSED': 'bg-yellow-100 text-yellow-800',
      'PUBLISHED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getTournamentTypeBadge = (type) => {
    const typeConfig = {
      'ROUND_ROBIN': 'bg-blue-100 text-blue-800',
      'KNOCKOUT': 'bg-purple-100 text-purple-800',
      'GROUP_STAGE': 'bg-indigo-100 text-indigo-800',
      'SWISS': 'bg-pink-100 text-pink-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig[type] || 'bg-gray-100 text-gray-800'}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  if (!isOrganizer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need organizer permissions to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tournament Fixtures</h1>
              <p className="mt-2 text-gray-600">
                Create and manage tournament fixtures for your events
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Fixture
            </button>
          </div>
        </div>

        {/* Fixtures List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Fixtures</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading fixtures...</p>
            </div>
          ) : fixtures.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No fixtures created yet.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first fixture
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {fixtures.map((fixture) => (
                <div key={fixture.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{fixture.name}</h3>
                        {getStatusBadge(fixture.status)}
                        {getTournamentTypeBadge(fixture.tournament_type)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Event:</span> {fixture.event_name}
                        </div>
                        <div>
                          <span className="font-medium">Division:</span> {fixture.division_name}
                        </div>
                        <div>
                          <span className="font-medium">Dates:</span> {fixture.start_date} - {fixture.end_date}
                        </div>
                        <div>
                          <span className="font-medium">Matches:</span> {fixture.total_matches || 0}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {fixture.status === 'DRAFT' && (
                        <button
                          onClick={() => {
                            setSelectedFixture(fixture);
                            setShowGenerateForm(true);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Generate
                        </button>
                      )}
                      
                      {fixture.status === 'PROPOSED' && (
                        <button
                          onClick={() => handlePublishFixtures(fixture.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Publish
                        </button>
                      )}
                      
                      {fixture.status === 'PROPOSED' && (
                        <button
                          onClick={() => handleRegenerateFixtures(fixture.id)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Regenerate
                        </button>
                      )}
                      
                      <Link
                        to={`/fixtures/${fixture.id}`}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        View
                      </Link>
                      
                      {fixture.status === 'DRAFT' && (
                        <button
                          onClick={() => handleDeleteFixture(fixture.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Fixture Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Fixture</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateFixture} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Event</label>
                    <select
                      value={createForm.event}
                      onChange={(e) => setCreateForm({...createForm, event: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Event</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>{event.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Division</label>
                    <select
                      value={createForm.division}
                      onChange={(e) => setCreateForm({...createForm, division: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Division</option>
                      {divisions.map(division => (
                        <option key={division.id} value={division.id}>{division.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fixture Name</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Group A, Quarter Finals"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tournament Type</label>
                    <select
                      value={createForm.tournament_type}
                      onChange={(e) => setCreateForm({...createForm, tournament_type: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ROUND_ROBIN">Round Robin</option>
                      <option value="KNOCKOUT">Knockout</option>
                      <option value="GROUP_STAGE">Group Stage + Knockout</option>
                      <option value="SWISS">Swiss System</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={createForm.start_date}
                      onChange={(e) => setCreateForm({...createForm, start_date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={createForm.end_date}
                      onChange={(e) => setCreateForm({...createForm, end_date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Match Duration (minutes)</label>
                    <input
                      type="number"
                      value={createForm.match_duration_minutes}
                      onChange={(e) => setCreateForm({...createForm, match_duration_minutes: parseInt(e.target.value)})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="30"
                      max="300"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Break Between Matches (minutes)</label>
                    <input
                      type="number"
                      value={createForm.break_between_matches_minutes}
                      onChange={(e) => setCreateForm({...createForm, break_between_matches_minutes: parseInt(e.target.value)})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="120"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Venues</label>
                  <div className="mt-2 space-y-2">
                    {venues.map(venue => (
                      <label key={venue.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={createForm.venues.includes(venue.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({...createForm, venues: [...createForm.venues, venue.id]});
                            } else {
                              setCreateForm({...createForm, venues: createForm.venues.filter(v => v !== venue.id)});
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{venue.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Fixture'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Generate Fixtures Modal */}
        {showGenerateForm && selectedFixture && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Generate Fixtures for {selectedFixture.name}</h3>
                <button
                  onClick={() => {
                    setShowGenerateForm(false);
                    setSelectedFixture(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleGenerateFixtures} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Generation Type</label>
                    <select
                      value={generateForm.generation_type}
                      onChange={(e) => setGenerateForm({...generateForm, generation_type: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ROUND_ROBIN">Round Robin</option>
                      <option value="KNOCKOUT">Knockout</option>
                      <option value="GROUP_STAGE">Group Stage + Knockout</option>
                      <option value="SWISS">Swiss System</option>
                    </select>
                  </div>
                  
                  {generateForm.generation_type === 'ROUND_ROBIN' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Number of Rounds</label>
                        <input
                          type="number"
                          value={generateForm.rounds}
                          onChange={(e) => setGenerateForm({...generateForm, rounds: parseInt(e.target.value)})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          max="10"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={generateForm.randomize_seeds}
                            onChange={(e) => setGenerateForm({...generateForm, randomize_seeds: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Randomize seeds for variety</span>
                        </label>
                      </div>
                    </>
                  )}
                  
                  {generateForm.generation_type === 'KNOCKOUT' && (
                    <>
                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={generateForm.seed_teams}
                            onChange={(e) => setGenerateForm({...generateForm, seed_teams: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Seed teams based on ranking</span>
                        </label>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={generateForm.include_playoffs}
                            onChange={(e) => setGenerateForm({...generateForm, include_playoffs: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Include playoff matches (3rd/4th place)</span>
                        </label>
                      </div>
                    </>
                  )}
                  
                  {generateForm.generation_type === 'GROUP_STAGE' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Number of Groups</label>
                        <input
                          type="number"
                          value={generateForm.group_size}
                          onChange={(e) => setGenerateForm({...generateForm, group_size: parseInt(e.target.value)})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="2"
                          max="8"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Teams per Group</label>
                        <input
                          type="number"
                          value={generateForm.teams_per_group}
                          onChange={(e) => setGenerateForm({...generateForm, teams_per_group: parseInt(e.target.value)})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="2"
                          max="8"
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGenerateForm(false);
                      setSelectedFixture(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate Fixtures'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fixtures;
