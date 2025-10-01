/**
 * Checkout Cancel Page
 * Displayed when user cancels the Stripe checkout
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

const CheckoutCancel: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="card text-center">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout Cancelled</h1>
          <p className="text-gray-600 mb-8">
            Your payment was not completed. No charges were made to your account.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm text-gray-700">
              If you experienced any issues during checkout or have questions, please contact our support team.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {eventId && (
              <Link
                to={`/events/${eventId}/checkout`}
                className="btn btn-primary inline-flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            )}
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

export default CheckoutCancel;
