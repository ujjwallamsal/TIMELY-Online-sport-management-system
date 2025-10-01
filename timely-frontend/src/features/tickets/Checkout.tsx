/**
 * Ticket Checkout Page
 * Uses real Stripe Checkout Session for payment processing
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { CreditCard, Ticket, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

interface Event {
  id: number;
  name: string;
  start_datetime: string;
  venue_name?: string;
  fee_cents: number;
}

const Checkout: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantityError, setQuantityError] = useState('');

  // Fetch event details only (no background queries)
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.event(parseInt(eventId || '0')));
      return response.data;
    },
    enabled: !!eventId && isAuthenticated,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - event details don't change often
  });

  // Handle quantity change with validation
  const handleQuantityChange = (value: number) => {
    if (value < 1) {
      setQuantity(1);
      setQuantityError('Quantity must be at least 1');
    } else if (value > 10) {
      setQuantity(10);
      setQuantityError('Maximum 10 tickets per purchase');
    } else {
      setQuantity(value);
      setQuantityError('');
    }
  };

  // Handle checkout submission with real Stripe
  const handleCheckout = async () => {
    if (quantity < 1 || quantity > 10) {
      setQuantityError('Quantity must be between 1 and 10');
      return;
    }

    setIsProcessing(true);
    setQuantityError('');

    try {
      // Handle free events (no Stripe needed)
      if (!event?.fee_cents || event.fee_cents === 0) {
        await api.post(ENDPOINTS.checkout, {
          event_id: parseInt(eventId || '0'),
          quantity: quantity,
          mode: 'ticket'
        });
        showSuccess('Ticket Reserved', 'Your free ticket has been reserved and is pending approval.');
        navigate('/tickets/me');
        return;
      }

      // Call checkout endpoint to create Stripe session
      const response = await api.post(ENDPOINTS.checkout, {
        event_id: parseInt(eventId || '0'),
        quantity: quantity,
        mode: 'ticket'
      });

      const data = response.data;

      // Handle free/pending flow
      if (data.status === 'pending_approval') {
        showSuccess('Submitted', 'Your ticket request has been submitted for approval.');
        navigate('/tickets/me');
        return;
      }

      // Redirect to Stripe Checkout
      if (!data.sessionId && !data.checkoutUrl) {
        showError('Checkout Error', 'Invalid payment session. Please try again.');
        return;
      }

      // Use the checkout URL directly (newer Stripe API method)
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Fallback: construct checkout URL from session ID
        window.location.href = `https://checkout.stripe.com/c/pay/${data.sessionId}`;
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      
      // Parse error response
      let errorMessage = 'Failed to process payment. Please try again.';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        // Handle structured error response
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (errorData.detail && typeof errorData.detail === 'object') {
          errorMessage = JSON.stringify(errorData.detail);
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError('Payment Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show sign-in prompt for anonymous users
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <Ticket className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to purchase tickets</h1>
          <p className="text-gray-600 mb-6">Create an account or sign in to complete your ticket purchase.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-md text-sm font-medium">
              Sign in
            </Link>
            <Link to="/register" className="border border-gray-300 text-gray-900 hover:bg-gray-50 px-5 py-2 rounded-md text-sm font-medium">
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (eventLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Event not found or error
  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Event Not Found</h3>
            <p className="text-gray-500 mb-4">The event you're looking for doesn't exist or is no longer available.</p>
            <button
              onClick={() => navigate('/events')}
              className="btn btn-primary"
            >
              Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ticketPrice = event.fee_cents ? event.fee_cents / 100 : 0;
  const totalPrice = ticketPrice * quantity;
  const isFree = ticketPrice === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Event
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Tickets</h1>
          <p className="text-gray-600 mt-2">{event.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Ticket className="h-5 w-5 mr-2" />
              Ticket Selection
            </h2>
            
            <div className="space-y-6">
              {/* Quantity Input */}
              <div>
                <label className="form-label">Number of Tickets</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className={`form-input ${quantityError ? 'border-red-500' : ''}`}
                />
                {quantityError && (
                  <p className="text-sm text-red-600 mt-1">{quantityError}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Maximum 10 tickets per purchase</p>
              </div>

              {/* Payment Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center text-sm text-blue-700">
                  <CreditCard className="h-5 w-5 mr-2" />
                  <div>
                    {isFree ? (
                      <p>This is a <strong>free event</strong>. No payment required.</p>
                    ) : (
                      <p>You'll be redirected to <strong>Stripe</strong> to complete payment securely.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isProcessing || !!quantityError}
                className="w-full btn btn-primary flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isFree ? 'Reserve Free Tickets' : `Continue to Payment - $${totalPrice.toFixed(2)}`}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900">{event.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(event.start_datetime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {event.venue_name && (
                  <p className="text-sm text-gray-500 mt-1">{event.venue_name}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tickets (×{quantity})</span>
                  <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-medium text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {isFree && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700">
                    <strong>Free Event:</strong> No payment required. Your tickets will be reserved instantly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
