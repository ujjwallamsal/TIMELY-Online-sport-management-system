import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon,
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';
import useSocket from '../../hooks/useSocket';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const TeamRegistration = ({ teamId, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [registrationData, setRegistrationData] = useState({
    team_id: teamId,
    event_id: '',
    division_id: '',
    notes: '',
    special_requirements: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/coach/`,
    {
      onMessage: (message) => {
        console.log('Received message:', message);
        handleRealtimeUpdate(message);
      }
    }
  );

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`teams/${teamId}/`);
      setTeam(response.data);
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('events/', {
        params: {
          status: 'published',
          page_size: 50
        }
      });
      setEvents(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    }
  };

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'registration_update':
        if (message.data.team_id === teamId) {
          // Refresh team data when registration status changes
          fetchTeamData();
        }
        break;
      default:
        break;
    }
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setRegistrationData(prev => ({
      ...prev,
      event_id: event.id,
      division_id: ''
    }));
    setSelectedDivision('');
  };

  const handleDivisionSelect = (divisionId) => {
    setSelectedDivision(divisionId);
    setRegistrationData(prev => ({
      ...prev,
      division_id: divisionId
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await api.post('teams/entries/', registrationData);
      
      setSuccess('Team registration submitted successfully!');
      setTimeout(() => {
        onComplete?.(response.data);
      }, 2000);
    } catch (error) {
      console.error('Error submitting team registration:', error);
      setError('Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getEventStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-green-100 text-green-800';
      case 'live': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
      fetchEvents();
    }
  }, [teamId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <SkeletonList items={5} />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState 
          title="Team Not Found"
          description="The team you're looking for doesn't exist."
          action={
            <button onClick={() => window.history.back()} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Go Back
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Registration</h1>
            <p className="text-gray-600 mt-2">Register {team.name} for events</p>
          </div>
          <LiveIndicator status={connectionStatus} />
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Team Info */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <UserGroupIcon className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Team Name</p>
              <p className="font-medium text-gray-900">{team.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Sport</p>
              <p className="font-medium text-gray-900 capitalize">{team.sport}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserGroupIcon className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Members</p>
              <p className="font-medium text-gray-900">{team.member_count || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Event</h2>
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventSelect(event)}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  selectedEvent?.id === event.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{event.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(event.start_datetime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{event.venue_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{formatPrice(event.price_cents)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            title="No Events Available"
            description="There are no published events available for registration."
          />
        )}
      </div>

      {/* Division Selection */}
      {selectedEvent && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Division</h2>
          {selectedEvent.divisions && selectedEvent.divisions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedEvent.divisions.map((division) => (
                <div
                  key={division.id}
                  onClick={() => handleDivisionSelect(division.id)}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    selectedDivision === division.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">{division.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{division.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Age Range: {division.min_age} - {division.max_age} years</p>
                    <p>Skill Level: {division.skill_level}</p>
                    <p>Max Teams: {division.max_teams}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No Divisions Available"
              description="This event doesn't have any divisions available for team registration."
            />
          )}
        </div>
      )}

      {/* Registration Details */}
      {selectedEvent && selectedDivision && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Details</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={registrationData.notes}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional notes for the organizers..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requirements (Optional)
                </label>
                <textarea
                  value={registrationData.special_requirements}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, special_requirements: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or accommodations needed..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Summary */}
      {selectedEvent && selectedDivision && (
        <div className="mb-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Event:</span>
              <span className="font-medium">{selectedEvent.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Division:</span>
              <span className="font-medium">
                {selectedEvent.divisions?.find(d => d.id === selectedDivision)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Team:</span>
              <span className="font-medium">{team.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Registration Fee:</span>
              <span className="font-medium">{formatPrice(selectedEvent.price_cents)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Team
        </button>
        
        {selectedEvent && selectedDivision && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Registration'}
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TeamRegistration;
