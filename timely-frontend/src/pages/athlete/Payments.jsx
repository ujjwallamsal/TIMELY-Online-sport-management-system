import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api.js';
import useSocket from '../../hooks/useSocket';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const Payments = ({ registrationId, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/athlete/`,
    {
      onMessage: (message) => {
        console.log('Received message:', message);
        handleRealtimeUpdate(message);
      }
    }
  );

  const fetchRegistrationData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`registrations/${registrationId}/`);
      setRegistration(response.data);
    } catch (error) {
      console.error('Error fetching registration data:', error);
      setError('Failed to load registration data');
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'registration_update':
        if (message.data.registration_id === registrationId) {
          // Refresh registration data when payment status changes
          fetchRegistrationData();
        }
        break;
      default:
        break;
    }
  };

  const createPaymentIntent = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const response = await api.post(`registrations/${registrationId}/pay/`);
      setPaymentIntent(response.data);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError('Failed to create payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccess('Payment completed successfully!');
    setTimeout(() => {
      onComplete?.(registration);
    }, 2000);
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage || 'Payment failed. Please try again.');
  };

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon className="w-5 h-5" />;
      case 'pending': return <ClockIcon className="w-5 h-5" />;
      case 'failed': return <ExclamationTriangleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  useEffect(() => {
    if (registrationId) {
      fetchRegistrationData();
    }
  }, [registrationId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonCard />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState 
          title="Registration Not Found"
          description="The registration you're looking for doesn't exist."
          action={
            <button onClick={() => window.history.back()} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Go Back
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
          <LiveIndicator status={connectionStatus} />
        </div>
        <p className="text-gray-600">
          Complete payment for your registration in <strong>{registration.event_name}</strong>
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Registration Summary */}
      <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Event:</span>
            <span className="font-medium">{registration.event_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Division:</span>
            <span className="font-medium">{registration.division_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium capitalize">{registration.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              registration.status === 'approved' ? 'bg-green-100 text-green-800' :
              registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {registration.status}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment Status</h2>
            <div className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(registration.payment_status)}`}>
              {getPaymentStatusIcon(registration.payment_status)}
              {registration.payment_status}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Registration Fee:</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(registration.event_price_cents)}
              </span>
            </div>
            
            {registration.payment_status === 'paid' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <p className="text-sm text-green-700">
                    Payment completed on {new Date(registration.paid_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            
            {registration.payment_status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-yellow-500" />
                  <p className="text-sm text-yellow-700">
                    Payment is pending. Please complete the payment to confirm your registration.
                  </p>
                </div>
              </div>
            )}
            
            {registration.payment_status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">
                    Payment failed. Please try again or contact support.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {registration.payment_status === 'pending' && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Credit Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCardIcon className="w-8 h-8 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Credit/Debit Card</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Pay securely with your credit or debit card
              </p>
              <button
                onClick={createPaymentIntent}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Pay with Card'}
              </button>
            </div>

            {/* PayPal */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">PayPal</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Pay with your PayPal account
              </p>
              <button
                onClick={createPaymentIntent}
                disabled={processing}
                className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Pay with PayPal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Intent Details */}
      {paymentIntent && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Payment Intent ID:</span>
              <span className="font-mono text-blue-900">{paymentIntent.payment_intent_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Amount:</span>
              <span className="font-medium text-blue-900">{formatPrice(paymentIntent.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Currency:</span>
              <span className="font-medium text-blue-900">{paymentIntent.currency.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Status:</span>
              <span className="font-medium text-blue-900">{paymentIntent.status}</span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              In development mode, this is a mock payment. In production, you would integrate with Stripe or PayPal.
            </p>
            <button
              onClick={handlePaymentSuccess}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm"
            >
              Simulate Successful Payment
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
      {registration.payment_history && registration.payment_history.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registration.payment_history.map((payment, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Registration
        </button>
        
        {registration.payment_status === 'paid' && onComplete && (
          <button
            onClick={() => onComplete(registration)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default Payments;
