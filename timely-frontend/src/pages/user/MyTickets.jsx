import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { 
  TicketIcon,
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function MyTickets() {
  const { user } = useAuth();
  const { push } = useToast();
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMyTickets();
    }
  }, [user]);

  const loadMyTickets = async () => {
    try {
      setLoading(true);
      
      // Load both tickets and orders
      const [ticketsData, ordersData] = await Promise.all([
        api.get('/tickets/mine/'),
        api.getOrders()
      ]);
      
      setTickets(ticketsData.results || ticketsData || []);
      setOrders(ordersData.results || ordersData || []);
    } catch (err) {
      push({ 
        type: 'error', 
        title: 'Failed to load tickets', 
        message: err.message || 'Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'PAID': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'FAILED': 'bg-red-100 text-red-800',
      'REFUNDED': 'bg-gray-100 text-gray-800',
      'VALID': 'bg-green-100 text-green-800',
      'USED': 'bg-blue-100 text-blue-800',
      'VOID': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
      case 'VALID':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'FAILED':
      case 'VOID':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <EmptyState 
          title="Login Required" 
          description="Please log in to view your tickets." 
          action={
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Login
            </Link>
          }
        />
      </div>
    );
  }

  const hasTickets = tickets.length > 0 || orders.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
        <p className="text-gray-600">View and manage your event tickets</p>
      </div>

      {!hasTickets ? (
        <EmptyState 
          title="No tickets yet" 
          description="You haven't purchased any tickets yet. Browse events to get started." 
          action={
            <Link
              to="/tickets"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Events
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Orders */}
          {orders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Event ID: {order.event_id}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(order.status)}
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900">
                        ${(order.total_cents / 100).toFixed(2)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/events/${order.event_id}`}
                          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          View Event
                          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Tickets */}
          {tickets.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Tickets</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <TicketIcon className="h-8 w-8 text-blue-600 mr-3" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Ticket {ticket.serial}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Event ID: {ticket.order?.event_id}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span>Issued: {formatDate(ticket.issued_at)}</span>
                        </div>
                        
                        {ticket.used_at && (
                          <div className="flex items-center text-sm text-gray-500">
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            <span>Used: {formatDate(ticket.used_at)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Order #{ticket.order?.id}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/tickets/${ticket.id}/qr`}
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View QR Code
                          </Link>
                          {ticket.order?.event_id && (
                            <Link
                              to={`/events/${ticket.order.event_id}`}
                              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-500"
                            >
                              Event Details
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
