import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';
import { loadStripe } from '@stripe/stripe-js';

export default function Tickets() {
  const { user } = useAuth();
  const { push } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load upcoming events; logged-in sees full list, logged-out sees public list
      const data = user ? await api.getEvents() : await api.getPublicEvents();
      const items = (data.results || data) || [];
      // Sort: paid first (fee_cents > 0), then by start time
      const sorted = items
        .slice()
        .sort((a, b) => {
          const aPaid = (a.fee_cents || 0) > 0 ? 0 : 1;
          const bPaid = (b.fee_cents || 0) > 0 ? 0 : 1;
          if (aPaid !== bPaid) return aPaid - bPaid;
          return new Date(a.start_datetime) - new Date(b.start_datetime);
        });
      setEvents(sorted);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyOrGet = async (eventId, feeCents) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      setProcessingId(eventId);
      if ((feeCents || 0) > 0) {
        const result = await api.createCheckoutSession(eventId);
        if (result.session_id) {
          const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PK);
          if (!stripe) throw new Error('Stripe failed to load');
          const { error } = await stripe.redirectToCheckout({ sessionId: result.session_id });
          if (error) throw new Error(error.message);
        } else {
          throw new Error('No session_id received');
        }
      } else {
        await api.createRegistration({ event: eventId });
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate ticket flow');
    } finally {
      setProcessingId(null);
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
      'PUBLISHED': 'bg-green-100 text-green-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'COMPLETED': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const handleBuyTicket = async (event) => {
    if (!user) {
      push({ type: 'error', title: 'Login Required', message: 'Please log in to purchase tickets.' });
      return;
    }

    setProcessing(true);
    setProcessingId(event.id);

    try {
      // Create checkout session
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PK);
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const checkoutSession = await api.createCheckoutSession(event.id);
      
      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: checkoutSession.session_id,
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      push({ 
        type: 'error', 
        title: 'Purchase Failed', 
        message: err.message || 'Failed to process ticket purchase. Please try again.' 
      });
    } finally {
      setProcessing(false);
      setProcessingId(null);
    }
  };

  const handleGetFreeTicket = async (event) => {
    if (!user) {
      push({ type: 'error', title: 'Login Required', message: 'Please log in to get free tickets.' });
      return;
    }

    setProcessing(true);
    setProcessingId(event.id);

    try {
      // For free events, we can create a direct registration/ticket
      const response = await api.post(`/events/${event.id}/register/`);
      
      push({ 
        type: 'success', 
        title: 'Ticket Secured!', 
        message: 'Your free ticket has been secured. Check your dashboard for details.' 
      });
      
      // Reload events to update availability
      loadEvents();
    } catch (err) {
      push({ 
        type: 'error', 
        title: 'Registration Failed', 
        message: err.message || 'Failed to secure your free ticket. Please try again.' 
      });
    } finally {
      setProcessing(false);
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Tickets</h1>
          <p className="text-xl text-gray-600 mb-8">
            Purchase tickets for upcoming sporting events
          </p>
          
          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-lg font-semibold text-blue-900">Login Required</h3>
              </div>
              <p className="text-blue-800 mb-4">
                You need to be logged in to purchase tickets for events.
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>


        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Events with Tickets */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No ticketed events available</h3>
            <p className="mt-1 text-sm text-gray-500">Check back later for events with ticket sales.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        <Link
                          to={`/events/${event.id}`}
                          className="hover:text-blue-600 transition-colors duration-200"
                        >
                          {event.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{event.sport}</p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(event.start_datetime)}
                    </div>
                    {event.venue && (
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.venue.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">
                      {event.fee_cents > 0 ? `$${(event.fee_cents / 100).toFixed(2)}` : 'FREE'}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => event.fee_cents > 0 ? handleBuyTicket(event) : handleGetFreeTicket(event)}
                        disabled={processingId === event.id}
                        className={`inline-flex items-center text-sm font-medium text-white px-3 py-2 rounded-md disabled:opacity-50 ${
                          event.fee_cents > 0 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {processingId === event.id ? 'Processing...' : (event.fee_cents > 0 ? 'Buy Ticket' : 'Get Ticket')}
                      </button>
                      <Link
                        to={`/events/${event.id}`}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        View Details
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-12 bg-gray-100 rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Ticketing Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Events</h3>
                <p className="text-gray-600">Find events you're interested in and check their details</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase or Get Free</h3>
                <p className="text-gray-600">Buy tickets for paid events or get free tickets for free events</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Enjoy the Event</h3>
                <p className="text-gray-600">Access your tickets in your dashboard and enjoy the event</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}