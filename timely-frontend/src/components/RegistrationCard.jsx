import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, MapPinIcon, UserGroupIcon, CurrencyDollarIcon, EyeIcon } from '@heroicons/react/24/outline';
import RegistrationStatusBadge from './RegistrationStatusBadge';

const RegistrationCard = ({ registration, showActions = true, className = '' }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFee = (feeCents) => {
    if (feeCents === 0) return 'Free';
    return `$${(feeCents / 100).toFixed(2)}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {registration.event_name}
            </h3>
            <p className="text-sm text-gray-600">
              {registration.event_sport}
            </p>
          </div>
          <RegistrationStatusBadge 
            status={registration.status} 
            paymentStatus={registration.payment_status}
          />
        </div>

        {/* Event Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatDate(registration.event_start_date)}</span>
          </div>
          
          {registration.division_name && (
            <div className="flex items-center text-sm text-gray-600">
              <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{registration.division_name}</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatFee(registration.fee_cents)}</span>
          </div>
        </div>

        {/* Registration Details */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-1 font-medium text-gray-900 capitalize">
                {registration.type}
              </span>
            </div>
            {registration.team_name && (
              <div>
                <span className="text-gray-500">Team:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {registration.team_name}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            Submitted: {formatDate(registration.submitted_at)}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <Link
                to={`/registrations/${registration.id}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                View Details
              </Link>

              {/* Conditional actions based on status */}
              {registration.status === 'pending' && (
                <button
                  onClick={() => {
                    // Handle withdraw action
                    if (window.confirm('Are you sure you want to withdraw this registration?')) {
                      // Call withdraw API
                      console.log('Withdraw registration:', registration.id);
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Withdraw
                </button>
              )}

              {registration.payment_status === 'unpaid' && registration.fee_cents > 0 && (
                <Link
                  to={`/registrations/${registration.id}/payment`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Pay Now
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationCard;