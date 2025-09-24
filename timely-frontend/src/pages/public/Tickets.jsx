import React, { useEffect, useState } from 'react';
import { ticketsAPI } from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { 
  TicketIcon, 
  QrCodeIcon, 
  CalendarIcon, 
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function Tickets() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrImages, setQrImages] = useState({});
  const { push } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    ticketsAPI.myTickets()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setItems(list);
        
        // Load QR codes for each ticket
        list.forEach(ticket => {
          loadQrCode(ticket.id);
        });
      })
      .catch((err) => {
        push({ type: 'error', title: 'Failed to load tickets', message: err.message || 'Please try again.' });
        setItems([]);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [push]);

  const loadQrCode = async (ticketId) => {
    try {
      const response = await ticketsAPI.ticketQr(ticketId);
      if (response.data) {
        setQrImages(prev => ({
          ...prev,
          [ticketId]: response.data
        }));
      }
    } catch (err) {
      console.error('Failed to load QR code for ticket:', ticketId, err);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'failed': return <XCircleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-600">Manage your event tickets and QR codes</p>
        </div>
        <TicketIcon className="h-8 w-8 text-gray-400" />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState 
          title="No tickets found" 
          description="You haven't purchased any tickets yet. Browse events to find tickets you'd like to buy." 
          icon={<TicketIcon className="mx-auto h-12 w-12 text-gray-400" />}
        />
      ) : (
        <div className="space-y-6">
          {items.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {ticket.event?.name || ticket.event?.title || 'Event'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.order?.status || ticket.status)}`}>
                        {getStatusIcon(ticket.order?.status || ticket.status)}
                        {(ticket.order?.status || ticket.status || 'pending').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <TicketIcon className="h-4 w-4 mr-2" />
                          <span>Type: {ticket.ticket_type?.name || ticket.type?.name || 'General Admission'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span>Event Date: {formatDate(ticket.event?.start_datetime)}</span>
                        </div>
                        {ticket.event?.venue_name && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            <span>{ticket.event.venue_name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Ticket ID:</span> {ticket.id}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Order ID:</span> {ticket.order?.id || 'N/A'}
                        </div>
                        {ticket.order?.total_cents && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Price:</span> ${(ticket.order.total_cents / 100).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col items-center">
                    {qrImages[ticket.id] ? (
                      <div className="text-center">
                        <img 
                          src={qrImages[ticket.id]} 
                          alt={`QR Code for ticket ${ticket.id}`}
                          className="w-24 h-24 border border-gray-200 rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">QR Code</p>
                      </div>
                    ) : (
                      <div className="w-24 h-24 border border-gray-200 rounded flex items-center justify-center bg-gray-50">
                        <QrCodeIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => loadQrCode(ticket.id)}
                    >
                      Refresh QR
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


