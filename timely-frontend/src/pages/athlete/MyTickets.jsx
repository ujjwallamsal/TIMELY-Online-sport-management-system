import React, { useState, useEffect } from 'react';
import { 
  TicketIcon, 
  QrCodeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import api from '../../lib/api';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonList } from '../../components/ui/Skeleton';
import EmptyState, { EmptyTickets } from '../../components/ui/EmptyState';
import QrTicket from '../../components/ui/QrTicket';

const MyTickets = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  });

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/athlete/`,
    {
      onMessage: (message) => {
        if (message.type === 'ticket_update') {
          handleTicketUpdate(message.data);
        }
      },
      onPolling: () => {
        fetchTickets();
      }
    }
  );

  const fetchTickets = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`tickets/mine/?page=${page}`);
      setTickets(response.data.results || []);
      setPagination({
        page: response.data.page || 1,
        totalPages: response.data.total_pages || 1,
        hasNext: response.data.next || false,
        hasPrevious: response.data.previous || false
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketUpdate = (data) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === data.id ? { ...ticket, ...data } : ticket
      )
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'used':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'void':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'void':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <Skeleton className="w-32 h-8" />
        </div>
        <SkeletonList items={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-600">Manage your event tickets and check-in status</p>
        </div>
        <LiveIndicator status={connectionStatus} />
      </div>

      {/* Tickets Grid */}
      {tickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map(ticket => (
            <QrTicket
              key={ticket.id}
              ticket={{
                id: ticket.id,
                serial: ticket.serial,
                ticket_type: ticket.ticket_type,
                event_name: ticket.event_name,
                status: ticket.status,
                qr_payload: ticket.qr_payload,
                issued_at: ticket.issued_at,
                used_at: ticket.used_at
              }}
              showDetails={true}
              className="h-full"
            />
          ))}
        </div>
      ) : (
        <EmptyTickets 
          action={
            <a href="/events" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Buy Tickets
            </a>
          }
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => fetchTickets(pagination.page - 1)}
            disabled={!pagination.hasPrevious}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => fetchTickets(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
