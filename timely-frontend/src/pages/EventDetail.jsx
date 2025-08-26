import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import { getEvent, createRegistration } from "../lib/api";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { connected, subscribeToEvent } = useWebSocket();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  // WebSocket real-time updates for this specific event
  useEffect(() => {
    if (connected && event) {
      const unsubscribe = subscribeToEvent('event.changed', (data) => {
        if (data.event_data && data.event_data.id === parseInt(id)) {
          console.log('Event updated in real-time:', data);
          setSuccess("Event information updated in real-time!");
          setTimeout(() => setSuccess(""), 3000);
          loadEvent(); // Refresh event data
        }
      });

      return unsubscribe;
    }
  }, [connected, subscribeToEvent, event, id]);

  async function loadEvent() {
    try {
      setLoading(true);
      setError("");
      const eventData = await getEvent(id);
      setEvent(eventData);
    } catch (err) {
      setError("Failed to load event. Please try again.");
      console.error('Error loading event:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    try {
      setRegistering(true);
      await createRegistration({
        event: parseInt(id),
        user: user.id
      });
      setSuccess("Registration successful! You're now registered for this event.");
      loadEvent(); // Refresh to show updated registration status
    } catch (err) {
      setError(err.message || "Failed to register for event. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'UPCOMING': return 'bg-blue-100 text-blue-800';
      case 'ONGOING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "TBD";
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilEvent = () => {
    if (!event?.start_date) return null;
    const today = new Date();
    const eventDate = new Date(event.start_date);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The event you're looking for doesn't exist."}</p>
          <Link
            to="/events"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const daysUntilEvent = getDaysUntilEvent();
  const isRegistrationOpen = event.is_registration_open;
  const canRegister = isAuthenticated && isRegistrationOpen && event.status === 'PUBLISHED';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/events"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </Link>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                  {daysUntilEvent !== null && daysUntilEvent > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      {daysUntilEvent} day{daysUntilEvent !== 1 ? 's' : ''} away
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-2">{event.name}</h1>
                <p className="text-xl text-blue-100">{event.sport_type}</p>
                
                {/* Real-time indicator */}
                <div className="flex items-center mt-4">
                  <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm text-blue-200">
                    {connected ? 'Live updates enabled' : 'Offline mode'}
                  </span>
                </div>
              </div>
              
              {/* Registration Button */}
              <div className="mt-4 sm:mt-0">
                {canRegister ? (
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {registering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      'Register Now'
                    )}
                  </button>
                ) : !isAuthenticated ? (
                  <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200"
                  >
                    Sign in to Register
                  </Link>
                ) : !isRegistrationOpen ? (
                  <span className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-500 bg-gray-100">
                    Registration Closed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-500 bg-gray-100">
                    Event Not Available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {event.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">About This Event</h3>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Event Schedule */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Schedule</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Event Dates</p>
                    <p className="text-gray-600">{formatDate(event.start_date)} - {formatDate(event.end_date)}</p>
                  </div>
                </div>
                
                {event.registration_open && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Registration Opens</p>
                      <p className="text-gray-600">{formatDateTime(event.registration_open)}</p>
                    </div>
                  </div>
                )}
                
                {event.registration_close && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Registration Closes</p>
                      <p className="text-gray-600">{formatDateTime(event.registration_close)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Divisions */}
            {event.divisions_detail && event.divisions_detail.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Event Divisions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.divisions_detail.map(division => (
                    <div key={division.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{division.name}</h4>
                      {division.description && (
                        <p className="text-sm text-gray-600 mb-2">{division.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {division.min_age && division.max_age && (
                          <span>Age: {division.min_age}-{division.max_age}</span>
                        )}
                        <span>Gender: {division.gender}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules & Regulations */}
            {event.rules_and_regulations && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rules & Regulations</h3>
                <div className="prose prose-sm text-gray-700 max-w-none">
                  {event.rules_and_regulations}
                </div>
              </div>
            )}

            {/* Eligibility Notes */}
            {event.eligibility_notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Eligibility</h3>
                <p className="text-gray-700">{event.eligibility_notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Venue</p>
                  <p className="text-gray-900">{event.venue_detail?.name || 'TBD'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Capacity</p>
                  <p className="text-gray-900">{event.capacity} participants</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Registration Fee</p>
                  <p className="text-2xl font-bold text-blue-600">${event.fee_dollars || 0}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Registration Status</p>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${isRegistrationOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-medium ${isRegistrationOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {isRegistrationOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Organizer Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Organizer</h3>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-blue-600">
                    {event.created_by_name?.[0]?.toUpperCase() || 'O'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{event.created_by_name || 'Organizer'}</p>
                  <p className="text-sm text-gray-500">Event Creator</p>
                </div>
              </div>
            </div>

            {/* Contact & Support */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700 mb-4">
                Have questions about this event? Contact the organizer or our support team.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Contact Support
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
