import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TicketIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const TicketStrip = ({ event, className = '' }) => {
  const { user } = useAuth();

  const formatPrice = (cents) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getTicketUrl = () => {
    if (user) {
      return `/events/${event.id}/register`;
    } else {
      return `/login?next=/events/${event.id}/register`;
    }
  };

  const getButtonText = () => {
    if (user) {
      return 'Get Tickets';
    } else {
      return 'Sign In to Get Tickets';
    }
  };

  const getButtonStyle = () => {
    if (user) {
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    } else {
      return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <TicketIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ready to Attend?
            </h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              <span className="font-medium">
                {formatPrice(event.fee_cents)}
                {event.capacity > 0 && (
                  <span className="ml-2">
                    • {event.capacity} spots available
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <Link
            to={getTicketUrl()}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-colors ${getButtonStyle()}`}
          >
            {getButtonText()}
          </Link>
        </div>
      </div>
      
      {!user && (
        <div className="mt-4 p-3 bg-blue-100 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You'll need to sign in to purchase tickets for this event.
          </p>
        </div>
      )}
      
      {event.registration_close_at && (
        <div className="mt-4 text-sm text-gray-600">
          <strong>Registration closes:</strong> {new Date(event.registration_close_at).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default TicketStrip;
