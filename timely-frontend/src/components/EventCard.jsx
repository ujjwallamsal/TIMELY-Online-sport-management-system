import { Link } from "react-router-dom";

export default function EventCard({ event }) {
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
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
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

  const daysUntilEvent = getDaysUntilEvent();
  const isRegistrationOpen = event.is_registration_open;

  return (
    <div 
      data-testid="event-card"
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
        {/* Event Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {event.name}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>
        
        {/* Sport & Venue */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <span className="font-medium">{event.sport_type}</span>
          {event.venue_name && (
            <>
              <span className="mx-2">•</span>
              <span>{event.venue_name}</span>
            </>
          )}
          {!event.venue_name && (
            <>
              <span className="mx-2">•</span>
              <span>Venue: TBD</span>
            </>
          )}
        </div>
        
        {/* Dates */}
        <div className="text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(event.start_date)} - {formatDate(event.end_date)}
          </div>
        </div>
        
        {/* Registration & Fee */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div 
              data-testid="registration-status-dot"
              className={`w-2 h-2 rounded-full mr-2 ${isRegistrationOpen ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className="text-sm text-gray-600">
              {isRegistrationOpen ? 'Registration Open' : 'Registration Closed'}
            </span>
          </div>
          <span className="text-lg font-semibold text-blue-600">
            ${event.fee_dollars || 0}
          </span>
        </div>

        {/* Days until event */}
        {daysUntilEvent !== null && daysUntilEvent > 0 && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {daysUntilEvent} day{daysUntilEvent !== 1 ? 's' : ''} away
            </span>
          </div>
        )}
        
        {/* Action Button */}
        <Link
          to={`/events/${event.id}`}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

