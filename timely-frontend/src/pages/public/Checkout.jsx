import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon, 
  TicketIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import Skeleton, { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState, { EmptyEvents } from '../../components/ui/EmptyState';

const PublicCheckout = ({ eventId, ticketType, quantity = 1 }) => {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`public/events/${eventId}/`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const response = await api.post('tickets/checkout/', {
        event_id: eventId,
        items: [{
          ticket_type: ticketType,
          quantity: quantity
        }]
      });
      
      setCheckoutData(response.data);
      
      // In a real implementation, you would redirect to the payment provider
      // For now, we'll simulate a successful payment
      setTimeout(() => {
        setSuccess(true);
        setProcessing(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error during checkout:', error);
      setError('Checkout failed. Please try again.');
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Redirect to tickets page or show success message
    window.location.href = '/tickets';
  };

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateTotal = () => {
    if (!event) return 0;
    return event.price_cents * quantity;
  };

  const calculateTax = () => {
    return calculateTotal() * 0.08; // 8% tax
  };

  const calculateFinalTotal = () => {
    return calculateTotal() + calculateTax();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96 mb-6" />
            <SkeletonCard />
          </div>
          <div>
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyEvents 
          title="Event Not Found"
          description="The event you're trying to purchase tickets for doesn't exist."
          action={
            <a href="/events" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Browse Events
            </a>
          }
        />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-8">
            Your tickets have been purchased successfully. You will receive a confirmation email shortly.
          </p>
          <button
            onClick={handlePaymentSuccess}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            View My Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Event Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>
          <p className="text-gray-600 mb-6">Complete your ticket purchase</p>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-500">{event.sport}</p>
              </div>
              <div className="text-sm text-gray-600">
                <p>Date: {new Date(event.start_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p>Venue: {event.venue_name}</p>
                <p>Duration: {event.duration} minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TicketIcon className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{ticketType || 'General Admission'}</p>
                    <p className="text-sm text-gray-500">Quantity: {quantity}</p>
                  </div>
                </div>
                <span className="font-medium text-gray-900">{formatPrice(calculateTotal())}</span>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span className="text-gray-900">{formatPrice(calculateTax())}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatPrice(calculateFinalTotal())}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <CreditCardIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">Credit/Debit Card</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900">PayPal</span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : `Pay ${formatPrice(calculateFinalTotal())}`}
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              By completing this purchase, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCheckout;
