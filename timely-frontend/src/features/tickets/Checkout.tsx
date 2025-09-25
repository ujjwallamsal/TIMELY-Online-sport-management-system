import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { useEvent } from '../../api/queries';
import { useToast } from '../../contexts/ToastContext';
import { Form, FormGroup, FormRow, FormActions, Input, Button } from '../../components/Form';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { CreditCard, Ticket, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';

interface CheckoutData {
  event_id: number;
  quantity: number;
  payment_method: 'card' | 'cash';
  card_number?: string;
  expiry_date?: string;
  cvv?: string;
  cardholder_name?: string;
  billing_address?: string;
}

// const checkoutSchema = {
//   event_id: { required: true, type: 'number' },
//   quantity: { required: true, type: 'number', min: 1, max: 10 },
//   payment_method: { required: true, type: 'string' },
//   card_number: { required: false, type: 'string' },
//   expiry_date: { required: false, type: 'string' },
//   cvv: { required: false, type: 'string' },
//   cardholder_name: { required: false, type: 'string' },
//   billing_address: { required: false, type: 'string' },
// };

const Checkout: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: event, isLoading: eventLoading } = useEvent(parseInt(eventId || '0'));

  const form = useForm<CheckoutData>({
    initialValues: {
      event_id: parseInt(eventId || '0'),
      quantity: 1,
      payment_method: 'card',
      card_number: '',
      expiry_date: '',
      cvv: '',
      cardholder_name: '',
      billing_address: '',
    },
    validationSchema: z.object({
      event_id: z.number().min(1, 'Please select an event'),
      quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per purchase'),
      payment_method: z.enum(['card', 'cash']),
      card_number: z.string().min(16, 'Card number must be 16 digits'),
      expiry_date: z.string().min(5, 'Please enter a valid expiry date'),
      cvv: z.string().min(3, 'CVV must be at least 3 digits'),
      cardholder_name: z.string().min(1, 'Cardholder name is required'),
      billing_address: z.string().min(1, 'Billing address is required'),
    }),
    onSubmit: async () => {
      setIsProcessing(true);
      try {
        // Call the actual checkout endpoint using the API client
        const response = await api.post(ENDPOINTS.checkout, {
          event_id: form.values.event_id,
          items: [{
            type: 'general',
            quantity: form.values.quantity,
            price_cents: event?.fee_cents || 0
          }],
          payment_method: form.values.payment_method,
          payment_details: form.values.payment_method === 'card' ? {
            card_number: form.values.card_number,
            expiry_date: form.values.expiry_date,
            cvv: form.values.cvv,
            cardholder_name: form.values.cardholder_name,
            billing_address: form.values.billing_address
          } : {}
        });

        const result = response.data;
        showSuccess('Purchase Successful', 'Your tickets have been purchased successfully!');
        navigate(`/tickets/me`);
      } catch (error) {
        console.error('Checkout error:', error);
        showError('Payment Failed', `Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsProcessing(false);
      }
    },
  });

  const ticketPrice = event?.fee_cents ? event.fee_cents / 100 : 0;
  const totalPrice = ticketPrice * form.values.quantity;
  const fees = totalPrice * 0.05; // 5% service fee
  const grandTotal = totalPrice + fees;

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
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

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Event Not Found</h3>
            <p className="text-gray-500">The event you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/events')}
              className="mt-4 btn btn-primary"
            >
              Browse Events
            </button>
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
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => navigate(`/events/${eventId}`)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Event
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Tickets</h1>
              <p className="text-gray-600 mt-2">Complete your ticket purchase for {event.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Details
            </h2>
            
            <Form onSubmit={form.handleSubmit}>
              <FormGroup>
                <Input
                  label="Number of Tickets"
                  name="quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={form.values.quantity}
                  onChange={(e) => form.setValue('quantity', parseInt(e.target.value) || 1)}
                  error={form.errors.quantity}
                  required
                />
              </FormGroup>

              <FormGroup>
                <label className="form-label">Payment Method</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={form.values.payment_method === 'card'}
                      onChange={(e) => form.setValue('payment_method', e.target.value as 'card')}
                      className="h-4 w-4 text-primary-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash"
                      checked={form.values.payment_method === 'cash'}
                      onChange={(e) => form.setValue('payment_method', e.target.value as 'cash')}
                      className="h-4 w-4 text-primary-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">Cash at Event</span>
                  </label>
                </div>
              </FormGroup>

              {form.values.payment_method === 'card' && (
                <>
                  <FormGroup>
                    <Input
                      label="Card Number"
                      name="card_number"
                      value={form.values.card_number}
                      onChange={(e) => form.setValue('card_number', e.target.value)}
                      error={form.errors.card_number}
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </FormGroup>

                  <FormRow>
                    <FormGroup>
                      <Input
                        label="Expiry Date"
                        name="expiry_date"
                        value={form.values.expiry_date}
                        onChange={(e) => form.setValue('expiry_date', e.target.value)}
                        error={form.errors.expiry_date}
                        placeholder="MM/YY"
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Input
                        label="CVV"
                        name="cvv"
                        value={form.values.cvv}
                        onChange={(e) => form.setValue('cvv', e.target.value)}
                        error={form.errors.cvv}
                        placeholder="123"
                        required
                      />
                    </FormGroup>
                  </FormRow>

                  <FormGroup>
                    <Input
                      label="Cardholder Name"
                      name="cardholder_name"
                      value={form.values.cardholder_name}
                      onChange={(e) => form.setValue('cardholder_name', e.target.value)}
                      error={form.errors.cardholder_name}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Input
                      label="Billing Address"
                      name="billing_address"
                      value={form.values.billing_address}
                      onChange={(e) => form.setValue('billing_address', e.target.value)}
                      error={form.errors.billing_address}
                      required
                    />
                  </FormGroup>
                </>
              )}

              <FormActions>
                <Button
                  type="submit"
                  loading={isProcessing}
                  disabled={!form.isValid || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    'Processing Payment...'
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Purchase - ${grandTotal.toFixed(2)}
                    </>
                  )}
                </Button>
              </FormActions>
            </Form>
          </div>

          {/* Order Summary */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Ticket className="h-5 w-5 mr-2" />
              Order Summary
            </h2>
            
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
                  <span className="text-gray-600">Tickets (×{form.values.quantity})</span>
                  <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="text-gray-900">${fees.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-medium text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {form.values.payment_method === 'cash' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
                    <div className="text-sm text-blue-700">
                      <strong>Cash Payment:</strong> You'll pay ${grandTotal.toFixed(2)} at the event venue.
                    </div>
                  </div>
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
