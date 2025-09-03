// OrderSummary.jsx - Component for displaying order summary
import React from 'react';
import { utils } from '../api';

const OrderSummary = ({ order, onCheckout, onRemoveItem, isLoading = false }) => {
  if (!order || !order.items || order.items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      </div>
    );
  }

  const totalCents = order.items.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
      
      {/* Event Info */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900">{order.event_name}</h4>
        {order.fixture_info && (
          <p className="text-sm text-gray-600">
            {utils.formatDateTime(order.fixture_info.starts_at)}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="space-y-3 mb-4">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{item.ticket_type_name}</div>
              <div className="text-sm text-gray-600">
                {utils.formatPrice(item.price_cents, order.currency)} × {item.quantity}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {utils.formatPrice(item.price_cents * item.quantity, order.currency)}
              </span>
              {onRemoveItem && (
                <button
                  onClick={() => onRemoveItem(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="text-gray-900">{utils.formatPrice(totalCents, order.currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Processing fee:</span>
          <span className="text-gray-900">$0.00</span>
        </div>
        <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total:</span>
          <span className="text-gray-900">{utils.formatPrice(totalCents, order.currency)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        ) : (
          'Proceed to Checkout'
        )}
      </button>

      {/* Security notice */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
