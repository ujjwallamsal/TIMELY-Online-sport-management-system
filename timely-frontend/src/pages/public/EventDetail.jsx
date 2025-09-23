import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  UserGroupIcon,
  TrophyIcon,
  PhotoIcon,
  NewspaperIcon,
  TicketIcon,
  ArrowLeftIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { getPublicEvent, getPublicEventFixtures, getPublicEventResults, getPublicEventLeaderboard } from '../../services/api.js';
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [fixtures, setFixtures] = useState([]);
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (event) {
      fetchTabData();
    }
  }, [activeTab, event]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await getPublicEvent(id);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async () => {
    try {
      switch (activeTab) {
        case 'schedule':
          const fixturesResponse = await getPublicEventFixtures(id);
          setFixtures(fixturesResponse.data.results || []);
          break;
        case 'results':
          const resultsResponse = await getPublicEventResults(id);
          setResults(resultsResponse.data.results || []);
          break;
        case 'leaderboard':
          const leaderboardResponse = await getPublicEventLeaderboard(id);
          setLeaderboard(leaderboardResponse.data.leaderboard || []);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} data:`, error);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: CalendarIcon },
    { id: 'schedule', name: 'Schedule', icon: ClockIcon },
    { id: 'results', name: 'Results', icon: TrophyIcon },
    { id: 'leaderboard', name: 'Leaderboard', icon: UserGroupIcon },
    { id: 'announcements', name: 'Announcements', icon: BellIcon },
    { id: 'media', name: 'Media', icon: PhotoIcon },
    { id: 'news', name: 'News', icon: NewspaperIcon },
    { id: 'tickets', name: 'Tickets', icon: TicketIcon },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-8">The event you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="h-5 w-5 mr-3" />
            <span>{formatDate(event.start_date)}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <ClockIcon className="h-5 w-5 mr-3" />
            <span>{formatTime(event.start_date)}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPinIcon className="h-5 w-5 mr-3" />
            <span>{event.venue?.name || 'TBA'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <UserGroupIcon className="h-5 w-5 mr-3" />
            <span>{event.sport?.name || 'Sport'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
        <p className="text-gray-600 leading-relaxed">{event.description}</p>
      </div>

      {event.venue && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Information</h3>
          <div className="space-y-2">
            <p className="font-medium text-gray-900">{event.venue.name}</p>
            <p className="text-gray-600">{event.venue.address}</p>
            {event.venue.city && event.venue.state && (
              <p className="text-gray-600">{event.venue.city}, {event.venue.state}</p>
            )}
            {event.venue.capacity && (
              <p className="text-gray-600">Capacity: {event.venue.capacity} people</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSchedule = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Event Schedule</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {fixtures.length > 0 ? (
          fixtures.map((fixture) => (
            <div key={fixture.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{fixture.title || 'Match'}</p>
                  <p className="text-sm text-gray-600">{fixture.venue?.name || 'TBA'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(fixture.start_at)}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    fixture.status === 'completed' ? 'bg-green-100 text-green-800' :
                    fixture.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {fixture.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No schedule available yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Event Results</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {results.length > 0 ? (
          results.map((result) => (
            <div key={result.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{result.fixture?.title || 'Match'}</p>
                  <p className="text-sm text-gray-600">{result.fixture?.venue?.name || 'TBA'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {result.score_home} - {result.score_away}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    result.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <TrophyIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No results available yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {leaderboard.length > 0 ? (
          leaderboard.map((entry, index) => (
            <div key={index} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">{entry.name}</p>
                  <p className="text-sm text-gray-600">{entry.team || 'Individual'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{entry.points || 0} pts</p>
                <p className="text-sm text-gray-600">{entry.wins || 0}W - {entry.losses || 0}L</p>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No leaderboard available yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMedia = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center text-gray-500">
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p>Media gallery coming soon</p>
      </div>
    </div>
  );

  const renderNews = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center text-gray-500">
        <NewspaperIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p>News and updates coming soon</p>
      </div>
    </div>
  );

  const renderTickets = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center text-gray-500">
        <TicketIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p>Ticket information coming soon</p>
      </div>
    </div>
  );

  const renderAnnouncements = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Announcements</h3>
        <RealtimeAnnouncements 
          eventId={id}
          showInDashboard={false}
          maxAnnouncements={10}
          autoHide={false}
        />
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'schedule':
        return renderSchedule();
      case 'results':
        return renderResults();
      case 'leaderboard':
        return renderLeaderboard();
      case 'announcements':
        return renderAnnouncements();
      case 'media':
        return renderMedia();
      case 'news':
        return renderNews();
      case 'tickets':
        return renderTickets();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/"
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                <p className="text-gray-600">{event.sport?.name || 'Sport'} • {formatDate(event.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'published' ? 'bg-green-100 text-green-800' :
                event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {event.status}
              </span>
              {event.registration_fee && (
                <span className="text-lg font-semibold text-gray-900">
                  ${event.registration_fee}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EventDetail;