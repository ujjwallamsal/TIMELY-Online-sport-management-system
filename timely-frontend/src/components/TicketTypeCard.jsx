// TicketTypeCard.jsx - Component for displaying ticket types
import React, { useState } from 'react';
import { utils } from '../services/api';

const TicketTypeCard = ({ ticketType, onAddToCart, maxQuantity = 10 }) => {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= Math.min(maxQuantity, ticketType.available_quantity)) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    if (quantity > 0 && ticketType.is_available) {
      onAddToCart(ticketType.id, quantity);
    }
  };

  const isAvailable = ticketType.is_available && ticketType.available_quantity > 0;
  const isLowStock = ticketType.available_quantity <= 5 && ticketType.available_quantity > 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {ticketType.name}
          </h3>
          {ticketType.description && (
            <p className="text-gray-600 text-sm leading-relaxed">
              {ticketType.description}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {utils.formatPrice(ticketType.price_cents, ticketType.currency)}
          </div>
          <div className="text-sm text-gray-500">per ticket</div>
        </div>
      </div>

      {/* Availability */}
      <div className="mb-4">
        {isAvailable ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {ticketType.available_quantity} available
              {isLowStock && (
                <span className="text-orange-600 font-medium ml-1">(Low stock)</span>
              )}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-600 font-medium">
              {ticketType.available_quantity === 0 ? 'Sold out' : 'Not available'}
            </span>
          </div>
        )}
      </div>

      {/* Quantity selector and add button */}
      {isAvailable && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor={`quantity-${ticketType.id}`} className="text-sm font-medium text-gray-700">
              Quantity:
            </label>
            <select
              id={`quantity-${ticketType.id}`}
              value={quantity}
              onChange={handleQuantityChange}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: Math.min(maxQuantity, ticketType.available_quantity) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleAddToCart}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      )}

      {/* Total price preview */}
      {isAvailable && quantity > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total for {quantity} ticket{quantity > 1 ? 's' : ''}:</span>
            <span className="text-lg font-semibold text-gray-900">
              {utils.formatPrice(ticketType.price_cents * quantity, ticketType.currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTypeCard;
