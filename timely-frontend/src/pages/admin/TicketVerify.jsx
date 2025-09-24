import React, { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';
import { 
  QrCodeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  MagnifyingGlassIcon,
  TicketIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export default function TicketVerify() {
  const [ticketCode, setTicketCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  const handleVerify = async () => {
    if (!ticketCode.trim()) {
      push({ type: 'error', title: 'Invalid Code', message: 'Please enter a ticket code to verify.' });
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    try {
      const result = await api.verify(ticketCode.trim());
      setVerificationResult(result);
      
      if (result.valid) {
        push({ type: 'success', title: 'Ticket Valid', message: 'This ticket is valid and can be used for entry.' });
      } else {
        push({ type: 'error', title: 'Ticket Invalid', message: result.reason || 'This ticket is not valid.' });
      }
    } catch (err) {
      push({ 
        type: 'error', 
        title: 'Verification Failed', 
        message: err.message || 'Unable to verify ticket. Please try again.' 
      });
      setVerificationResult({ valid: false, reason: 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTicketCode('');
    setVerificationResult(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticket Verification</h1>
          <p className="text-gray-600">Verify tickets for event entry and check-in</p>
        </div>
        <QrCodeIcon className="h-8 w-8 text-gray-400" />
      </div>

      {/* Verification Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Ticket</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Code / QR Code Data
            </label>
            <Input
              type="text"
              placeholder="Enter ticket code or scan QR code..."
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleVerify}
              disabled={loading || !ticketCode.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <QrCodeIcon className="h-4 w-4" />
                  Verify
                </>
              )}
            </Button>
            <Button
              onClick={handleClear}
              variant="secondary"
              disabled={loading}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Verification Result */}
      {verificationResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            {verificationResult.valid ? (
              <>
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">Ticket Valid</h3>
              </>
            ) : (
              <>
                <XCircleIcon className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Ticket Invalid</h3>
              </>
            )}
          </div>

          {verificationResult.valid ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium mb-2">✓ This ticket is valid for entry</p>
                <p className="text-green-700 text-sm">
                  The ticket holder can be admitted to the event. Please proceed with check-in.
                </p>
              </div>

              {verificationResult.ticket && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Ticket Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <TicketIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span><strong>Ticket ID:</strong> {verificationResult.ticket.id}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span><strong>Holder:</strong> {verificationResult.ticket.holder_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span><strong>Type:</strong> {verificationResult.ticket.type || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  {verificationResult.ticket.event && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Event Details</h4>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>Event:</strong> {verificationResult.ticket.event.name || verificationResult.ticket.event.title}
                        </div>
                        <div className="flex items-center text-sm">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span><strong>Date:</strong> {formatDate(verificationResult.ticket.event.start_datetime)}</span>
                        </div>
                        {verificationResult.ticket.event.venue_name && (
                          <div className="flex items-center text-sm">
                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span><strong>Venue:</strong> {verificationResult.ticket.event.venue_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">✗ This ticket is not valid</p>
              <p className="text-red-700 text-sm">
                {verificationResult.reason || 'This ticket cannot be used for entry.'}
              </p>
              <div className="mt-3 text-sm text-red-600">
                <p>Possible reasons:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Ticket has already been used</li>
                  <li>Ticket has expired</li>
                  <li>Invalid ticket code</li>
                  <li>Ticket has been cancelled or refunded</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">How to verify tickets:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Enter the ticket code manually, or</li>
          <li>• Scan the QR code using a QR code scanner</li>
          <li>• The system will check ticket validity and provide detailed information</li>
          <li>• Valid tickets can be used for event entry</li>
          <li>• Invalid tickets should be rejected with appropriate reason</li>
        </ul>
      </div>
    </div>
  );
}
