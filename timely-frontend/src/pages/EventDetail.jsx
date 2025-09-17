import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  TrophyIcon,
  ClockIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getEvent, publishEvent, unpublishEvent, cancelEvent, listDivisions } from '../lib/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import useLiveChannel, { useEventResults, useEventSchedule, useEventAnnouncements } from '../hooks/useLiveChannel';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Real-time data
  const [leaderboard, setLeaderboard] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // Real-time hooks
  const { isConnected: resultsConnected, lastMessage: resultsMessage } = useEventResults(id, {
    onResultsUpdate: (data) => {
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    }
  });
  
  const { isConnected: scheduleConnected, lastMessage: scheduleMessage } = useEventSchedule(id, {
    onScheduleUpdate: (data) => {
      if (data.fixtures) {
        setFixtures(data.fixtures);
      }
    }
  });
  
  const { isConnected: announcementsConnected, lastMessage: announcementMessage } = useEventAnnouncements(id, {
    onAnnouncementUpdate: (data) => {
      if (data.announcement) {
        setAnnouncements(prev => [data.announcement, ...prev]);
      }
    }
  });

  useEffect(() => {
    fetchEvent();
    fetchDivisions();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEvent(id);
      setEvent(response.data);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await listDivisions(id);
      setDivisions(response.data);
    } catch (err) {
      console.error('Error fetching divisions:', err);
    }
  };

  const handleLifecycleAction = async (action) => {
    try {
      setActionLoading(true);
      
      switch (action) {
        case 'publish':
          await publishEvent(id);
          break;
        case 'unpublish':
          await unpublishEvent(id);
          break;
        case 'cancel':
          const reason = prompt('Reason for cancellation (optional):');
          await cancelEvent(id, reason || '');
          break;
        default:
          throw new Error('Invalid action');
      }
      
      // Refresh event data
      await fetchEvent();
    } catch (err) {
      console.error(`Error ${action}ing event:`, err);
      alert(`Failed to ${action} event. Please try again.`);
    } finally {
      setActionLoading(false);
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

  const formatFee = (feeCents) => {
    if (feeCents === 0) return 'Free';
    return `$${(feeCents / 100).toFixed(2)}`;
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = user && (
    user.role === 'ADMIN' || 
    (user.role === 'ORGANIZER' && event?.created_by === user.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Event not found</h3>
            <p className="mt-2 text-gray-500">
              The event you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <div className="mt-6">
              <Link
                to="/events"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/events"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Events
            </Link>
            
            {canEdit && (
              <div className="flex space-x-2">
                <Link
                  to={`/events/${event.id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{event.sport}</p>
            </div>
            
            <div className="flex flex-col gap-2 ml-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(event.phase)}`}>
                {event.phase}
              </span>
              {event.lifecycle_status !== 'published' && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.lifecycle_status)}`}>
                  {event.lifecycle_status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lifecycle actions for organizers/admins */}
        {canEdit && event.lifecycle_status !== 'cancelled' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Management</h3>
            <div className="flex flex-wrap gap-2">
              {event.lifecycle_status === 'draft' && (
                <Button
                  onClick={() => handleLifecycleAction('publish')}
                  loading={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Publish Event
                </Button>
              )}
              
              {event.lifecycle_status === 'published' && (
                <Button
                  onClick={() => handleLifecycleAction('unpublish')}
                  loading={actionLoading}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Unpublish Event
                </Button>
              )}
              
              {['draft', 'published'].includes(event.lifecycle_status) && (
                <Button
                  onClick={() => handleLifecycleAction('cancel')}
                  loading={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancel Event
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'details', name: 'Details', icon: CalendarIcon },
                { id: 'leaderboard', name: 'Leaderboard', icon: TrophyIcon },
                { id: 'schedule', name: 'Schedule', icon: ClockIcon },
                { id: 'announcements', name: 'Announcements', icon: SpeakerWaveIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isLive = (tab.id === 'leaderboard' && resultsConnected) ||
                              (tab.id === 'schedule' && scheduleConnected) ||
                              (tab.id === 'announcements' && announcementsConnected);
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                    {isLive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Live
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Content */}
            {activeTab === 'details' && (
              <>
                {/* Description */}
                {event.description && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}

                {/* Event details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Start Date & Time</p>
                        <p className="text-sm text-gray-600">{formatDate(event.start_datetime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">End Date & Time</p>
                        <p className="text-sm text-gray-600">{formatDate(event.end_datetime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{event.location}</p>
                      </div>
                    </div>
                    
                    {event.capacity > 0 && (
                      <div className="flex items-start">
                        <UserGroupIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Capacity</p>
                          <p className="text-sm text-gray-600">{event.capacity} participants</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Registration Fee</p>
                        <p className="text-sm text-gray-600">{formatFee(event.fee_cents)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divisions */}
                {divisions.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Divisions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {divisions.map((division) => (
                        <div key={division.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{division.name}</h3>
                          {division.sort_order > 0 && (
                            <p className="text-sm text-gray-600 mt-1">Order: {division.sort_order}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'leaderboard' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Leaderboard</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${resultsConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-600">
                      {resultsConnected ? 'Live Updates' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No results yet</p>
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
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, index) => (
                          <tr key={entry.team_id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-bold text-gray-800">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-800">
                                {entry.team_name}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center font-medium text-gray-700">
                              {entry.matches_played}
                            </td>
                            <td className="py-3 px-2 text-center text-green-600 font-medium">
                              {entry.w}
                            </td>
                            <td className="py-3 px-2 text-center text-gray-600 font-medium">
                              {entry.d}
                            </td>
                            <td className="py-3 px-2 text-center text-red-600 font-medium">
                              {entry.l}
                            </td>
                            <td className="py-3 px-2 text-center font-medium text-gray-700">
                              {entry.gf}
                            </td>
                            <td className="py-3 px-2 text-center font-medium text-gray-700">
                              {entry.ga}
                            </td>
                            <td className="py-3 px-2 text-center font-medium text-gray-700">
                              <span className={entry.gd >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {entry.gd >= 0 ? '+' : ''}{entry.gd}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center font-bold text-gray-800">
                              {entry.pts}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Schedule</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${scheduleConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-600">
                      {scheduleConnected ? 'Live Updates' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                {fixtures.length === 0 ? (
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No fixtures scheduled yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fixtures.map((fixture) => (
                      <div key={fixture.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="font-medium text-gray-900">
                                  {fixture.home_team?.name || 'TBD'}
                                </div>
                              </div>
                              <div className="text-gray-500">vs</div>
                              <div className="text-center">
                                <div className="font-medium text-gray-900">
                                  {fixture.away_team?.name || 'TBD'}
                                </div>
                              </div>
                            </div>
                            {fixture.venue && (
                              <div className="text-sm text-gray-600 mt-2">
                                <MapPinIcon className="h-4 w-4 inline mr-1" />
                                {fixture.venue.name}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(fixture.start_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(fixture.start_at).toLocaleTimeString()}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                              fixture.status === 'LIVE' ? 'bg-red-100 text-red-800' :
                              fixture.status === 'FINAL' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {fixture.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${announcementsConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-600">
                      {announcementsConnected ? 'Live Updates' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                {announcements.length === 0 ? (
                  <div className="text-center py-8">
                    <SpeakerWaveIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No announcements yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement, index) => (
                      <div key={announcement.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                            <p className="text-gray-600 mt-1">{announcement.message}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {new Date(announcement.timestamp).toLocaleString()}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                              announcement.priority === 'high' ? 'bg-red-100 text-red-800' :
                              announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {announcement.priority}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizer</h3>
              <p className="text-sm text-gray-600">
                {event.created_by_name || 'Unknown'}
              </p>
            </div>

            {/* Registration info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration</h3>
              <div className="space-y-2">
                {event.registration_open_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Opens</p>
                    <p className="text-sm text-gray-600">{formatDate(event.registration_open_at)}</p>
                  </div>
                )}
                {event.registration_close_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Closes</p>
                    <p className="text-sm text-gray-600">{formatDate(event.registration_close_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {user && event.lifecycle_status === 'published' && (
                  <Button 
                    onClick={() => navigate(`/events/${event.id}/register`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Register for Event
                  </Button>
                )}
                
                {!user && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Sign in to register for this event
                    </p>
                    <Link
                      to="/login"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;