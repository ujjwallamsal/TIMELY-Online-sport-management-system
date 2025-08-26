import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listTicketTypes, createTicketOrder, createStripeCheckout, createPayPalCheckout } from '../lib/api';
import { useNotifications } from '../components/NotificationSystem';

const TicketCheckout = ({ eventId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: ''
  });

  useEffect(() => {
    loadTicketTypes();
  }, [eventId]);

  const loadTicketTypes = async () => {
    try {
      const response = await listTicketTypes(eventId);
      if (response && response.results) {
        setTicketTypes(response.results);
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to load ticket types' });
    } finally {
      setLoading(false);
    }
  };

  const handleTicketQuantityChange = (ticketTypeId, quantity) => {
    if (quantity === 0) {
      const newSelected = { ...selectedTickets };
      delete newSelected[ticketTypeId];
      setSelectedTickets(newSelected);
    } else {
      setSelectedTickets({
        ...selectedTickets,
        [ticketTypeId]: quantity
      });
    }
  };

  const calculateTotal = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = ticketTypes.find(tt => tt.id === parseInt(ticketTypeId));
      return total + (ticketType?.price_cents * quantity || 0);
    }, 0);
  };

  const handleCheckout = async (paymentMethod) => {
    if (Object.keys(selectedTickets).length === 0) {
      addNotification({ type: 'error', title: 'Error', message: 'Please select at least one ticket' });
      return;
    }

    setCheckoutLoading(true);
    try {
      // Create ticket order
      const tickets = Object.entries(selectedTickets).map(([ticketTypeId, quantity]) => ({
        ticket_type: parseInt(ticketTypeId),
        quantity,
        holder_name: customerInfo.customer_name,
        holder_email: customerInfo.customer_email
      }));

      const orderData = {
        event: eventId,
        customer_name: customerInfo.customer_name,
        customer_email: customerInfo.customer_email,
        customer_phone: customerInfo.customer_phone,
        tickets
      };

      const order = await createTicketOrder(orderData);
      
      if (paymentMethod === 'stripe') {
        const checkout = await createStripeCheckout(
          order.id,
          `${window.location.origin}/tickets/success?order=${order.order_number}`,
          `${window.location.origin}/tickets/cancel?order=${order.order_number}`
        );
        window.location.href = checkout.checkout_url;
      } else if (paymentMethod === 'paypal') {
        const checkout = await createPayPalCheckout(
          order.id,
          `${window.location.origin}/tickets/success?order=${order.order_number}`,
          `${window.location.origin}/tickets/cancel?order=${order.order_number}`
        );
        window.location.href = checkout.checkout_url;
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'Checkout failed. Please try again.' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading ticket options...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase Tickets</h2>
      
      {/* Customer Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={customerInfo.customer_name}
              onChange={(e) => setCustomerInfo({...customerInfo, customer_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={customerInfo.customer_email}
              onChange={(e) => setCustomerInfo({...customerInfo, customer_email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
            <input
              type="tel"
              value={customerInfo.customer_phone}
              onChange={(e) => setCustomerInfo({...customerInfo, customer_phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ticket Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Tickets</h3>
        <div className="space-y-4">
          {ticketTypes.map((ticketType) => (
            <div key={ticketType.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{ticketType.name}</h4>
                  <p className="text-sm text-gray-600">{ticketType.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-lg font-bold text-blue-600">
                      ${ticketType.price_dollars}
                    </span>
                    <span className="text-sm text-gray-500">
                      {ticketType.available_quantity} available
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTicketQuantityChange(ticketType.id, (selectedTickets[ticketType.id] || 0) - 1)}
                    disabled={(selectedTickets[ticketType.id] || 0) <= 0}
                    className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">
                    {selectedTickets[ticketType.id] || 0}
                  </span>
                  <button
                    onClick={() => handleTicketQuantityChange(ticketType.id, (selectedTickets[ticketType.id] || 0) + 1)}
                    disabled={(selectedTickets[ticketType.id] || 0) >= ticketType.available_quantity}
                    className="w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total and Checkout */}
      {Object.keys(selectedTickets).length > 0 && (
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-blue-600">
              ${(calculateTotal() / 100).toFixed(2)}
            </span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleCheckout('stripe')}
              disabled={checkoutLoading}
              className="flex-1 btn btn-primary"
            >
              {checkoutLoading ? 'Processing...' : '💳 Pay with Card'}
            </button>
            <button
              onClick={() => handleCheckout('paypal')}
              disabled={checkoutLoading}
              className="flex-1 btn btn-secondary"
            >
              {checkoutLoading ? 'Processing...' : '🅿️ Pay with PayPal'}
            </button>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      <div className="mt-4 text-center">
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TicketCheckout;
