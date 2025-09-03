// QRTicket.jsx - Component for displaying ticket with QR code
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { utils } from '../api';

const QRTicket = ({ ticket, showDetails = true }) => {
  if (!ticket) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No ticket data available</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      valid: 'bg-green-100 text-green-800',
      used: 'bg-blue-100 text-blue-800',
      void: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'used':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'void':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Digital Ticket</h3>
            <p className="text-blue-100 text-sm">#{ticket.serial}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(ticket.status)}`}>
            {getStatusIcon(ticket.status)}
            <span className="capitalize">{ticket.status}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
              <QRCodeSVG
                value={ticket.qr_payload}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Scan this QR code at the event entrance
            </p>
          </div>

          {/* Ticket Details */}
          {showDetails && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Event Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Event:</span>
                    <span className="ml-2 font-medium">{ticket.event_name}</span>
                  </div>
                  {ticket.fixture_info && (
                    <>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 font-medium">
                          {utils.formatDateTime(ticket.fixture_info.starts_at)}
                        </span>
                      </div>
                      {ticket.fixture_info.venue && (
                        <div>
                          <span className="text-gray-600">Venue:</span>
                          <span className="ml-2 font-medium">{ticket.fixture_info.venue}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Ticket Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{ticket.ticket_type_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Serial:</span>
                    <span className="ml-2 font-medium font-mono">{ticket.serial}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Issued:</span>
                    <span className="ml-2 font-medium">
                      {utils.formatDateTime(ticket.issued_at)}
                    </span>
                  </div>
                  {ticket.used_at && (
                    <div>
                      <span className="text-gray-600">Used:</span>
                      <span className="ml-2 font-medium">
                        {utils.formatDateTime(ticket.used_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Important Instructions</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Present this QR code at the event entrance</li>
            <li>• Keep your phone charged and ready</li>
            <li>• This ticket is non-transferable</li>
            <li>• Contact support if you have any issues</li>
          </ul>
        </div>

        {/* Download/Print Options */}
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Print Ticket
          </button>
          <button
            onClick={() => {
              // Create a data URL for the QR code and download
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const link = document.createElement('a');
                link.download = `ticket-${ticket.serial}.png`;
                link.href = canvas.toDataURL();
                link.click();
              }
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRTicket;
