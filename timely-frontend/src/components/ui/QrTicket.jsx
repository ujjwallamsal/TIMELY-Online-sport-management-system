import React, { useState } from 'react';
import { QrCodeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const QrTicket = ({ 
  ticket, 
  showDetails = true,
  onCheckIn,
  canCheckIn = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
        return 'text-green-600 bg-green-100';
      case 'used':
        return 'text-blue-600 bg-blue-100';
      case 'void':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <CheckIcon className="w-4 h-4" />;
      case 'used':
        return <CheckIcon className="w-4 h-4" />;
      case 'void':
        return <XMarkIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCodeIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{ticket.ticket_type}</h3>
              <p className="text-sm text-gray-500">Serial: {ticket.serial}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
            {getStatusIcon(ticket.status)}
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="p-6 text-center">
        <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <QrCodeIcon className="w-16 h-16 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 mb-2">Scan QR code for entry</p>
        <p className="text-xs text-gray-400 font-mono">{ticket.qr_payload}</p>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center justify-between"
          >
            <span>Ticket Details</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Event:</span>
                <span className="font-medium">{ticket.event_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Issued:</span>
                <span>{formatDate(ticket.issued_at)}</span>
              </div>
              {ticket.used_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Used:</span>
                  <span>{formatDate(ticket.used_at)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Check-in Button */}
      {canCheckIn && ticket.status === 'valid' && onCheckIn && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => onCheckIn(ticket)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Check In
          </button>
        </div>
      )}
    </div>
  );
};

export default QrTicket;
