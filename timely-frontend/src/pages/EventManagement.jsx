import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { 
  listEvents, 
  publishEvent, 
  unpublishEvent,
  deleteEvent 
} from '../../services/api.js';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  EyeIcon,
  PencilIcon,
  TrashIcon,
  EyeSlashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function EventManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!user || !['ADMIN', 'ORGANIZER'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadEvents();
  }, [user, navigate, currentPage, statusFilter, sportFilter]);

  async function loadEvents() {
    try {
      setLoading(true);
      
      const filters = {
        page: currentPage,
        search: searchTerm,
        status: statusFilter,
        sport_type: sportFilter
      };

      // If organizer, only show their events
      if (user.role === 'ORGANIZER') {
        filters.organizer = user.id;
      }

      const response = await listEvents({
        page: currentPage,
        q: searchTerm,
        sport: sportFilter,
        ...filters
      });
      
      setEvents(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / 20));
      
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadEvents();
  };

  const handlePublishToggle = async (eventId, currentStatus) => {
    try {
      setActionLoading(eventId);
      
      if (currentStatus === 'PUBLISHED') {
        await unpublishEvent(eventId);
      } else {
        await publishEvent(eventId);
      }
      
      // Reload events to reflect changes
      await loadEvents();
      
    } catch (error) {
      console.error('Error toggling event status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(eventId);
      await deleteEvent(eventId);
      
      // Reload events to reflect changes
      await loadEvents();
      
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': { variant: 'warning', text: 'Draft' },
      'PUBLISHED': { variant: 'success', text: 'Published' },
      'ONGOING': { variant: 'info', text: 'Live' },
      'COMPLETED': { variant: 'secondary', text: 'Completed' },
      'CANCELLED': { variant: 'danger', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (feeCents) => {
    if (!feeCents || feeCents === 0) return 'Free';
    return `$${(feeCents / 100).toFixed(2)}`;
  };

  if (!user || !['ADMIN', 'ORGANIZER'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Event Management
            </h1>
            <p className="text-xl text-gray-600">
              Manage your sports events, publish updates, and track registrations
              </p>
            </div>
          
          <Button 
            as={Link} 
            to="/create-event" 
            variant="primary" 
            size="lg"
            className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
              Create Event
          </Button>
        </div>

        {/* Filters & Search */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
          </div>
                
                <Input
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  as="select"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                  <option value="ONGOING">Live</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                </Input>
                
                <Input
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  as="select"
                >
                  <option value="">All Sports</option>
                  <option value="Soccer">Soccer</option>
                  <option value="Football">Football</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Athletics">Athletics</option>
                </Input>
                
                <Button type="submit" variant="primary" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <FunnelIcon className="w-5 h-5 mr-2" />
                  Filter
                </Button>
            </div>
            </form>
          </div>
        </Card>

        {/* Events List */}
          {loading ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          </Card>
        ) : events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => (
              <Card key={event.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300" hover>
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    {/* Event Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.name}</h3>
                          <div className="flex items-center space-x-4 text-gray-600 mb-3">
                            <div className="flex items-center">
                              <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
                              <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                            </div>
                            {event.venue_name && (
                              <div className="flex items-center">
                                <MapPinIcon className="w-5 h-5 mr-2 text-green-500" />
                                <span>{event.venue_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(event.status)}
                          <Badge variant="info">{event.sport_type}</Badge>
            </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="font-semibold text-gray-900">{event.capacity || '∞'}</div>
                          <div className="text-gray-600">Capacity</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="font-semibold text-gray-900">{formatPrice(event.fee_dollars * 100)}</div>
                          <div className="text-gray-600">Fee</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="font-semibold text-gray-900">{event.registration_count || 0}</div>
                          <div className="text-gray-600">Registered</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="font-semibold text-gray-900">
                            {event.is_registration_open ? 'Open' : 'Closed'}
                          </div>
                          <div className="text-gray-600">Registration</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:flex-col lg:space-x-0 lg:space-y-2">
                      <Button
                        as={Link}
                        to={`/events/${event.id}`}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      
                      <Button
                        as={Link}
                        to={`/events/${event.id}/edit`}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      
                      <Button
                        onClick={() => handlePublishToggle(event.id, event.status)}
                        variant={event.status === 'PUBLISHED' ? 'warning' : 'success'}
                        size="sm"
                        loading={actionLoading === event.id}
                        className="w-full sm:w-auto"
                      >
                        {event.status === 'PUBLISHED' ? (
                          <>
                            <EyeSlashIcon className="w-4 h-4 mr-2" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <EyeIcon className="w-4 h-4 mr-2" />
                          Publish
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => handleDeleteEvent(event.id)}
                        variant="danger"
                        size="sm"
                        loading={actionLoading === event.id}
                        className="w-full sm:w-auto"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="p-12 text-center">
              <div className="text-6xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No events found</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {searchTerm || statusFilter || sportFilter 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create your first event to get started!'
                }
              </p>
              <Button 
                as={Link} 
                to="/create-event" 
                variant="primary" 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="mt-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
            </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
            </div>
          </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
