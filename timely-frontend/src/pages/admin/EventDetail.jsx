import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getEvent, getEventRegistrations, getEventFixtures, getEventResults } from '../../services/api';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [fixtures, setFixtures] = useState([]);
  const [results, setResults] = useState([]);
  const [registrations, setRegistrations] = useState([]);
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
      // Mock data - replace with actual API call
      const mockEvent = {
        id: id,
        title: 'Championship Finals 2024',
        description: 'The ultimate championship event featuring top athletes from around the region.',
        start_date: '2024-03-15T09:00:00Z',
        end_date: '2024-03-17T18:00:00Z',
        venue: {
          id: 1,
          name: 'Main Arena',
          address: '123 Sports Complex',
          city: 'Sports City',
          state: 'CA',
          capacity: 5000
        },
        sport: {
          id: 1,
          name: 'Basketball'
        },
        status: 'published',
        visibility: 'public',
        registration_fee: 50,
        max_participants: 32,
        current_registrations: 24,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-02-20T15:30:00Z'
      };
      setEvent(mockEvent);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async () => {
    try {
      switch (activeTab) {
        case 'registrations':
          // Mock registrations data
          const mockRegistrations = [
            { id: 1, user: { name: 'John Doe', email: 'john@example.com' }, registered_at: '2024-01-20T10:00:00Z', status: 'confirmed', payment_status: 'paid' },
            { id: 2, user: { name: 'Jane Smith', email: 'jane@example.com' }, registered_at: '2024-01-21T14:30:00Z', status: 'pending', payment_status: 'pending' },
            { id: 3, user: { name: 'Mike Johnson', email: 'mike@example.com' }, registered_at: '2024-01-22T09:15:00Z', status: 'confirmed', payment_status: 'paid' }
          ];
          setRegistrations(mockRegistrations);
          break;
        case 'fixtures':
          // Mock fixtures data
          const mockFixtures = [
            { id: 1, title: 'Semi-Final 1', start_at: '2024-03-15T10:00:00Z', venue: { name: 'Court A' }, status: 'scheduled' },
            { id: 2, title: 'Semi-Final 2', start_at: '2024-03-15T14:00:00Z', venue: { name: 'Court B' }, status: 'scheduled' },
            { id: 3, title: 'Final', start_at: '2024-03-16T16:00:00Z', venue: { name: 'Main Court' }, status: 'scheduled' }
          ];
          setFixtures(mockFixtures);
          break;
        case 'results':
          // Mock results data
          const mockResults = [
            { id: 1, fixture: { title: 'Semi-Final 1' }, score_home: 85, score_away: 78, is_verified: true },
            { id: 2, fixture: { title: 'Semi-Final 2' }, score_home: 92, score_away: 88, is_verified: false }
          ];
          setResults(mockResults);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} data:`, error);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'registrations', name: 'Registrations', icon: UsersIcon },
    { id: 'fixtures', name: 'Schedule', icon: ClockIcon },
    { id: 'results', name: 'Results', icon: TrophyIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
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

  const handleEdit = () => {
    navigate(`/admin/events/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      // Implement delete functionality
      console.log('Deleting event:', id);
      navigate('/admin/events');
    }
  };

  const handleStatusChange = (newStatus) => {
    // Implement status change functionality
    console.log('Changing status to:', newStatus);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-8">The event you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/admin/events"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Registrations</p>
              <p className="text-2xl font-semibold text-gray-900">{event.current_registrations}/{event.max_participants}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">${(event.current_registrations * event.registration_fee).toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Fixtures</p>
              <p className="text-2xl font-semibold text-gray-900">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Results</p>
              <p className="text-2xl font-semibold text-gray-900">2</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Details */}
      <Card className="p-6">
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
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
        <p className="text-gray-600 leading-relaxed">{event.description}</p>
      </Card>

      {event.venue && (
        <Card className="p-6">
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
        </Card>
      )}
    </div>
  );

  const renderRegistrations = () => (
    <Card>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Event Registrations</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {registrations.length > 0 ? (
          registrations.map((registration) => (
            <div key={registration.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{registration.user.name}</p>
                  <p className="text-sm text-gray-600">{registration.user.email}</p>
                  <p className="text-sm text-gray-500">Registered: {formatDateTime(registration.registered_at)}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {registration.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    registration.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {registration.payment_status}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No registrations yet</p>
          </div>
        )}
      </div>
    </Card>
  );

  const renderFixtures = () => (
    <Card>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Event Schedule</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {fixtures.length > 0 ? (
          fixtures.map((fixture) => (
            <div key={fixture.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{fixture.title}</p>
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
            <p>No fixtures scheduled yet</p>
          </div>
        )}
      </div>
    </Card>
  );

  const renderResults = () => (
    <Card>
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
                <div className="flex items-center space-x-4">
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
    </Card>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trends</h3>
        <div className="text-center text-gray-500">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>Analytics charts coming soon</p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analysis</h3>
        <div className="text-center text-gray-500">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>Revenue charts coming soon</p>
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'registrations':
        return renderRegistrations();
      case 'fixtures':
        return renderFixtures();
      case 'results':
        return renderResults();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/admin/events"
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
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
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="flex items-center text-red-600 border-red-300 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
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

      {/* Content */}
      {renderTabContent()}
    </div>
  );
};

export default EventDetail;
