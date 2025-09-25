import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, QrCode, Calendar, MapPin, Download, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';

interface Ticket {
  id: number;
  event_id: number;
  event_name: string;
  event_date: string;
  venue_name?: string;
  ticket_type: string;
  price: number;
  status: 'valid' | 'used' | 'cancelled';
  qr_code?: string;
  created_at: string;
}

const MyTickets: React.FC = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpointAvailable, setEndpointAvailable] = useState(false);

  // Check if my tickets endpoint is available and fetch tickets
  useEffect(() => {
    const checkEndpointAndFetch = async () => {
      try {
        // Try to fetch tickets - if it works, endpoint is available
        await fetchTickets();
        setEndpointAvailable(true);
      } catch (error: any) {
        console.log('My tickets endpoint not available:', error.message);
        setEndpointAvailable(false);
        setIsLoading(false);
      }
    };

    checkEndpointAndFetch();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(ENDPOINTS.myTickets);
      setTickets(response.data.results || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Valid';
      case 'used':
        return 'Used';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleDownloadTicket = (ticket: Ticket) => {
    // Mock download functionality
    console.log('Downloading ticket:', ticket.id);
    // In a real app, this would generate and download a PDF
  };

  const handleViewQR = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
            <p className="text-gray-600">Loading your tickets...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton-text-lg mb-4"></div>
                <div className="skeleton-text mb-2"></div>
                <div className="skeleton-text mb-4"></div>
                <div className="skeleton-button"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tickets</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchTickets}
                className="btn btn-primary inline-flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show not available state
  if (!endpointAvailable) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tickets Feature Unavailable</h3>
            <p className="text-gray-500 mb-6">The tickets feature is not available at the moment.</p>
            <Link to="/events" className="btn btn-primary">
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Found</h3>
            <p className="text-gray-500 mb-6">You haven't purchased any tickets yet.</p>
            <Link to="/events" className="btn btn-primary">
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
          <p className="text-gray-600">Manage and view your event tickets</p>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {ticket.event_name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getStatusColor(ticket.status)}`}>
                    {getStatusText(ticket.status)}
                  </span>
                </div>
                <div className="ml-4">
                  <span className="text-xl font-bold text-gray-900">
                    ${ticket.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(ticket.event_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {ticket.venue_name && (
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-2" />
                    {ticket.venue_name}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  <strong>Type:</strong> {ticket.ticket_type}
                </div>
                <div className="text-sm text-gray-500">
                  <strong>Ticket #:</strong> {ticket.id.toString().padStart(6, '0')}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewQR(ticket)}
                  className="flex-1 btn btn-outline text-sm"
                  disabled={ticket.status !== 'valid'}
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  QR Code
                </button>
                <button
                  onClick={() => handleDownloadTicket(ticket)}
                  className="flex-1 btn btn-secondary text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to={`/events/${ticket.event_id}`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Event Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* QR Code Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  QR Code - {selectedTicket.event_name}
                </h3>
                
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded flex items-center justify-center">
                    <QrCode className="h-32 w-32 text-gray-400" />
                    <div className="absolute text-xs text-gray-500 mt-20">
                      QR Code Placeholder
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <div><strong>Ticket #:</strong> {selectedTicket.id.toString().padStart(6, '0')}</div>
                  <div><strong>Type:</strong> {selectedTicket.ticket_type}</div>
                  <div><strong>Price:</strong> ${selectedTicket.price.toFixed(2)}</div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Present this QR code at the event entrance for entry.
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1 btn btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDownloadTicket(selectedTicket)}
                    className="flex-1 btn btn-primary"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
