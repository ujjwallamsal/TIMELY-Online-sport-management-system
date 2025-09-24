import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { smartConnect } from '../../lib/realtime.js';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState(null);

  useEffect(() => {
    loadEvent();
    
    // Connect to real-time updates for this event
    const connection = smartConnect(id, (data) => {
      if (data.type === 'leaderboard_update') {
        setLeaderboard(data.leaderboard || []);
      } else if (data.type === 'registration_update') {
        setPurchaseStatus(data.status);
      }
    });

    return () => {
      connection.close();
    };
  }, [id]);

  const loadEvent = async () => {
    try {
    setLoading(true);
      setError(null);
      
      // Use public API if not authenticated, authenticated API if logged in
      const eventData = user ? await api.getEvent(id) : await api.getPublicEvent(id);
      setEvent(eventData);
      
      // Load leaderboard if available
      try {
        const leaderboardData = await api.getPublicEventLeaderboard(id);
        setLeaderboard(leaderboardData);
      } catch (err) {
        // Leaderboard might not be available yet
        console.log('Leaderboard not available:', err.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseTicket = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    try {
      setPurchaseStatus('pending');
      const result = await api.purchaseTicket(id);
      setPurchaseStatus(result.status);
    } catch (err) {
      setError(err.message || 'Failed to request ticket');
      setPurchaseStatus(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading event</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-4">
                  <Link
                    to="/events"
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    ← Back to Events
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Event not found</h3>
            <p className="mt-2 text-gray-500">The event you're looking for doesn't exist.</p>
            <div className="mt-6">
              <Link
                to="/events"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                ← Back to Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
                    <div>
              <Link
                to="/events"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 mb-4 inline-block"
              >
                ← Back to Events
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <p className="mt-2 text-lg text-gray-600">{event.sport}</p>
            </div>
            <div className="flex items-center space-x-4">
              {isLive && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              )}
              {getStatusBadge(event.status)}
            </div>
          </div>
                    </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                    <div>
                    <p className="text-sm font-medium text-gray-500">Start Time</p>
                    <p className="text-gray-900">{formatDate(event.start_datetime)}</p>
                    </div>
                    </div>
                
                {event.venue && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Venue</p>
                      <p className="text-gray-900">{event.venue.name}</p>
                      {event.venue.address && (
                        <p className="text-sm text-gray-600">{event.venue.address}</p>
                      )}
                    </div>
                    </div>
                )}
                
                {event.fee_cents > 0 && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Entry Fee</p>
                      <p className="text-gray-900">${(event.fee_cents / 100).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
          </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Leaderboard</h2>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team/Player</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboard.map((entry, index) => (
                        <tr key={entry.id || index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.team_name || entry.player_name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.score || entry.points || 0}
                          </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              </div>
            )}
            </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Ticket */}
            {event.fee_cents > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Your Ticket</h3>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    ${(event.fee_cents / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">Entry fee</p>
                  
                  {purchaseStatus === 'pending' ? (
                          <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Processing request...</p>
                    </div>
                  ) : purchaseStatus === 'PENDING' ? (
                    <div className="text-center">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                      <p className="text-sm text-gray-600">Pending approval</p>
                </div>
                  ) : purchaseStatus === 'APPROVED' ? (
                    <div className="text-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                      </div>
                      <p className="text-sm text-gray-600">Approved!</p>
                    </div>
                  ) : (
                    <button
                      onClick={handlePurchaseTicket}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      {user ? 'Request Ticket' : 'Login to Request Ticket'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Event Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
              <div className="space-y-3">
                    <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-gray-900">{event.status}</p>
                </div>
                {event.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-gray-900 text-sm">{event.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}