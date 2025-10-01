/**
 * Checkout Success Page
 * Displays order confirmation after successful Stripe payment
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { CheckCircle, Ticket, Loader2, AlertCircle } from 'lucide-react';

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  // Fetch order details using session ID
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-by-session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID provided');
      const response = await api.get(`${ENDPOINTS.checkout.replace('/checkout/', '/orders/by_session/')}?session_id=${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
    retry: 2
  });

  useEffect(() => {
    // Redirect if no session ID
    if (!sessionId) {
      navigate('/events');
    }
  }, [sessionId, navigate]);

  if (!sessionId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="card text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find your order details. Please check your email for confirmation or contact support.
            </p>
            <Link
              to="/tickets/me"
              className="btn btn-primary inline-block"
            >
              View My Tickets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="card text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your order has been submitted for admin approval.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium text-gray-900">#{order.order_id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Event:</span>
                <span className="font-medium text-gray-900">{order.event_name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium text-gray-900">{order.quantity} ticket{order.quantity > 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-gray-900">
                  ${(order.total_cents / 100).toFixed(2)} {order.currency.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending Approval
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex">
              <Ticket className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Awaiting Admin Approval</p>
                <p>
                  An administrator will review and approve your tickets shortly. 
                  You'll receive a notification when your tickets are approved and ready to use.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/tickets/me"
              className="btn btn-primary"
            >
              View My Tickets
            </Link>
            <Link
              to="/events"
              className="btn btn-secondary"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
