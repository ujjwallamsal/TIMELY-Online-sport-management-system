// Checkout.jsx - Checkout page for ticket purchases
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketingAPI, paymentsAPI } from '../api';
import TicketTypeCard from '../components/TicketTypeCard';
import OrderSummary from '../components/OrderSummary';

const Checkout = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [ticketTypes, setTicketTypes] = useState([]);
  const [cart, setCart] = useState([]);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState(null);

  // Load ticket types
  useEffect(() => {
    const loadTicketTypes = async () => {
      try {
        setIsLoading(true);
        const response = await ticketingAPI.listTicketTypes(eventId);
        setTicketTypes(response.data.results || response.data);
      } catch (err) {
        setError('Failed to load ticket types');
        console.error('Error loading ticket types:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      loadTicketTypes();
    }
  }, [eventId]);

  // Add item to cart
  const handleAddToCart = (ticketTypeId, quantity) => {
    const ticketType = ticketTypes.find(tt => tt.id === ticketTypeId);
    if (!ticketType) return;

    const existingItemIndex = cart.findIndex(item => item.ticket_type_id === ticketTypeId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const newCart = [...cart];
      newCart[existingItemIndex].qty += quantity;
      setCart(newCart);
    } else {
      // Add new item
      setCart([...cart, {
        ticket_type_id: ticketTypeId,
        qty: quantity
      }]);
    }
  };

  // Remove item from cart
  const handleRemoveFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  // Create order
  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      setError('Please add tickets to your cart');
      return;
    }

    try {
      setIsCreatingOrder(true);
      setError(null);

      const orderData = {
        event_id: parseInt(eventId),
        items: cart
      };

      const response = await ticketingAPI.createOrder(orderData);
      setOrder(response.data);
      setCart([]); // Clear cart after successful order creation
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
      console.error('Error creating order:', err);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Process payment
  const handleCheckout = async () => {
    if (!order) {
      await handleCreateOrder();
      return;
    }

    try {
      setIsProcessingPayment(true);
      setError(null);

      const response = await paymentsAPI.stripeCheckout(order.id);
      
      // Redirect to Stripe checkout
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process payment');
      console.error('Error processing payment:', err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Build order summary for display
  const orderSummary = order ? {
    id: order.id,
    event_name: order.event_name,
    fixture_info: order.fixture_info,
    currency: order.currency,
    items: order.tickets?.map(ticket => ({
      ticket_type_name: ticket.ticket_type_name,
      price_cents: ticket.ticket_type?.price_cents || 0,
      quantity: 1
    })) || []
  } : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ticket types...</p>
        </div>
      </div>
    );
  }

  if (error && !ticketTypes.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/events')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Tickets</h1>
          <p className="text-gray-600 mt-2">Select your tickets and proceed to checkout</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Types */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Tickets</h2>
            
            {ticketTypes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets available</h3>
                <p className="text-gray-600">There are no tickets currently on sale for this event.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {ticketTypes.map((ticketType) => (
                  <TicketTypeCard
                    key={ticketType.id}
                    ticketType={ticketType}
                    onAddToCart={handleAddToCart}
                    maxQuantity={10}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            {order ? (
              <OrderSummary
                order={orderSummary}
                onCheckout={handleCheckout}
                isLoading={isProcessingPayment}
              />
            ) : (
              <OrderSummary
                order={{
                  items: cart.map(item => {
                    const ticketType = ticketTypes.find(tt => tt.id === item.ticket_type_id);
                    return {
                      ticket_type_name: ticketType?.name || 'Unknown',
                      price_cents: ticketType?.price_cents || 0,
                      quantity: item.qty
                    };
                  }),
                  currency: 'USD'
                }}
                onRemoveItem={handleRemoveFromCart}
                onCheckout={handleCreateOrder}
                isLoading={isCreatingOrder}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
