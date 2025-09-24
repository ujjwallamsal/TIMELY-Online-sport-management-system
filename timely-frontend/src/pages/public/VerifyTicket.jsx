import React, { useState } from 'react';
import api from '../../services/api.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { 
  QrCodeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

export default function VerifyTicket() {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const { push } = useToast();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      push({ type: 'error', title: 'Invalid Code', message: 'Please enter a ticket code.' });
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      const response = await api.verify(code.trim());
      
      if (response.valid) {
        setResult({
          valid: true,
          ticket: response.ticket,
          message: 'Ticket is valid'
        });
        push({ type: 'success', title: 'Valid Ticket', message: 'This ticket is valid and can be used.' });
      } else {
        setResult({
          valid: false,
          message: response.message || 'Ticket is not valid'
        });
        push({ type: 'error', title: 'Invalid Ticket', message: response.message || 'This ticket is not valid.' });
      }
    } catch (error) {
      setResult({
        valid: false,
        message: error.message || 'Failed to verify ticket'
      });
      push({ type: 'error', title: 'Verification Failed', message: error.message || 'Please try again.' });
    } finally {
      setVerifying(false);
    }
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <QrCodeIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Verify Ticket</h1>
        <p className="text-gray-600 mt-2">Scan or enter a ticket code to verify its validity</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket Code or QR Data
            </label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter ticket code or scan QR code"
              className="text-center text-lg font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the code from the ticket or scan the QR code
            </p>
          </div>

          <Button
            type="submit"
            disabled={verifying || !code.trim()}
            className="w-full flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verifying...
              </>
            ) : (
              <>
                <QrCodeIcon className="h-4 w-4" />
                Verify Ticket
              </>
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className={`p-4 rounded-lg ${
              result.valid 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <h3 className={`font-semibold ${
                    result.valid ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.valid ? 'Valid Ticket' : 'Invalid Ticket'}
                  </h3>
                  <p className={`text-sm ${
                    result.valid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                </div>
              </div>

              {result.valid && result.ticket && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-900">Event:</span>
                      <p className="text-green-700">{result.ticket.event?.name || 'Unknown Event'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-900">Ticket ID:</span>
                      <p className="text-green-700 font-mono">{result.ticket.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-900">Type:</span>
                      <p className="text-green-700">{result.ticket.ticket_type?.name || 'General Admission'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-900">Status:</span>
                      <p className="text-green-700 capitalize">{result.ticket.order?.status || 'Valid'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How to use:</p>
              <ul className="space-y-1 text-xs">
                <li>• Scan the QR code on a ticket using your device camera</li>
                <li>• Or manually enter the ticket code</li>
                <li>• The system will verify if the ticket is valid and unused</li>
                <li>• Only authorized staff can verify tickets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
