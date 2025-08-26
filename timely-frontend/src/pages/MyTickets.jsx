import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listMyTickets, downloadTicket } from '../lib/api';
import { useNotifications } from '../components/NotificationSystem';

const MyTickets = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await listMyTickets();
      if (response && response.results) {
        setTickets(response.results);
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to load tickets' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (ticketId) => {
    try {
      const ticketData = await downloadTicket(ticketId);
      // In production, this would download a PDF
      addNotification({ type: 'success', title: 'Success', message: 'Ticket downloaded' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to download ticket' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Tickets</h1>
          <p className="text-xl text-gray-600">Your purchased event tickets</p>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No tickets yet</h3>
            <p className="text-gray-500 mb-6">You haven't purchased any tickets yet.</p>
            <a href="/events" className="btn btn-primary">Browse Events</a>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{ticket.event_name}</h3>
                      <p className="text-blue-100 text-sm">{ticket.ticket_type_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                        {ticket.status_display}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Body */}
                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ticket ID:</span>
                      <span className="font-mono text-sm text-gray-800">{ticket.ticket_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Holder:</span>
                      <span className="font-medium">{ticket.holder_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issued:</span>
                      <span className="text-sm">{new Date(ticket.issued_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="text-sm">{new Date(ticket.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      ticket.is_valid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ticket.is_valid ? '✅ Valid' : '❌ Invalid'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(ticket.id)}
                      className="flex-1 btn btn-secondary btn-sm"
                    >
                      📥 Download
                    </button>
                    <button className="flex-1 btn btn-primary btn-sm">
                      📱 View QR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
