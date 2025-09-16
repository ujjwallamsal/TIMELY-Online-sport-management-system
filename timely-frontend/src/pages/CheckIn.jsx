import React, { useState, useEffect } from 'react';
import { checkinTicket, validateTicket } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const CheckIn = () => {
  const { user } = useAuth();
  const [qrPayload, setQrPayload] = useState('');
  const [gate, setGate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [ticketInfo, setTicketInfo] = useState(null);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!qrPayload.trim()) {
      setError('Please enter a QR code payload');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await checkinTicket(qrPayload, gate);
      setSuccess('Ticket checked in successfully!');
      setTicketInfo(response.data.ticket);
      setQrPayload('');
      setGate('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check in ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!qrPayload.trim()) {
      setError('Please enter a QR code payload');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Parse QR payload to get ticket ID
      const parts = qrPayload.split(':');
      if (parts.length !== 4 || parts[0] !== 'TKT') {
        throw new Error('Invalid QR code format');
      }
      
      const ticketId = parseInt(parts[1]);
      const response = await validateTicket(ticketId);
      setTicketInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to validate ticket');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need staff privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ticket Check-In</h1>
          <p className="mt-2 text-gray-600">Scan or enter QR codes to check in tickets</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Check-In Form</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleCheckIn} className="space-y-6">
              <div>
                <label htmlFor="qr_payload" className="block text-sm font-medium text-gray-700">
                  QR Code Payload
                </label>
                <textarea
                  id="qr_payload"
                  value={qrPayload}
                  onChange={(e) => setQrPayload(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste QR code payload here..."
                />
              </div>

              <div>
                <label htmlFor="gate" className="block text-sm font-medium text-gray-700">
                  Gate/Entry Point (Optional)
                </label>
                <input
                  type="text"
                  id="gate"
                  value={gate}
                  onChange={(e) => setGate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Main Entrance, Gate A"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Check In Ticket'}
                </button>
                
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? 'Validating...' : 'Validate Only'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {ticketInfo && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Ticket Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Ticket Details</h3>
                  <dl className="mt-2 space-y-1">
                    <div>
                      <dt className="text-sm text-gray-600">Serial Number</dt>
                      <dd className="text-sm font-medium text-gray-900">{ticketInfo.serial}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Ticket Type</dt>
                      <dd className="text-sm font-medium text-gray-900">{ticketInfo.ticket_type}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Event</dt>
                      <dd className="text-sm font-medium text-gray-900">{ticketInfo.event_name}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Status</h3>
                  <dl className="mt-2 space-y-1">
                    <div>
                      <dt className="text-sm text-gray-600">Current Status</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticketInfo.status === 'valid' ? 'bg-green-100 text-green-800' :
                          ticketInfo.status === 'used' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ticketInfo.status}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Issued At</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {new Date(ticketInfo.issued_at).toLocaleString()}
                      </dd>
                    </div>
                    {ticketInfo.used_at && (
                      <div>
                        <dt className="text-sm text-gray-600">Used At</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {new Date(ticketInfo.used_at).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              
              {ticketInfo.is_valid && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    ✓ This ticket is valid and ready for check-in
                  </p>
                </div>
              )}
              
              {ticketInfo.status === 'used' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    ℹ This ticket has already been used
                  </p>
                </div>
              )}
              
              {ticketInfo.status === 'void' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    ✗ This ticket is void and cannot be used
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">How to Use</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>1. <strong>Scan QR Code:</strong> Use a QR code scanner to get the payload, or manually enter it</p>
            <p>2. <strong>Validate:</strong> Click "Validate Only" to check ticket status without checking it in</p>
            <p>3. <strong>Check In:</strong> Click "Check In Ticket" to mark the ticket as used</p>
            <p>4. <strong>Gate Entry:</strong> Optionally specify which gate/entry point the ticket was used at</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
