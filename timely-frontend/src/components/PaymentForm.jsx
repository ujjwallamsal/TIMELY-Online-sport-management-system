import { useState } from 'react';

export default function PaymentForm({ 
  amount, 
  currency = 'AUD', 
  onSuccess, 
  onError, 
  description = "Event Registration",
  buttonText = "Pay Now"
}) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would call the payment gateway
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      if (success) {
        onSuccess({
          transactionId: `txn_${Date.now()}`,
          amount: amount,
          currency: currency,
          status: 'completed'
        });
      } else {
        throw new Error('Payment failed. Please try again.');
      }
    } catch (error) {
      onError(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Payment Details</h3>
      </div>
      <div className="card-body">
        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{description}</span>
            <span className="text-2xl font-bold text-gray-800">
              {formatAmount(amount)}
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="form-label">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">💳 Credit Card</div>
                <div className="text-sm text-gray-500">Visa, Mastercard, Amex</div>
              </div>
            </label>
            
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="paypal"
                checked={paymentMethod === 'paypal'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">🅿️ PayPal</div>
                <div className="text-sm text-gray-500">Fast & secure</div>
              </div>
            </label>
          </div>
        </div>

        {/* Credit Card Form */}
        {paymentMethod === 'card' && (
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="form-input"
                required
                pattern="[0-9\s]{13,19}"
                maxLength="19"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="form-input"
                  required
                  pattern="(0[1-9]|1[0-2])\/([0-9]{2})"
                  maxLength="5"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  className="form-input"
                  required
                  pattern="[0-9]{3,4}"
                  maxLength="4"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Cardholder Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="form-input"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Processing...
                </>
              ) : (
                `${buttonText} - ${formatAmount(amount)}`
              )}
            </button>
          </form>
        )}

        {/* PayPal Button */}
        {paymentMethod === 'paypal' && (
          <div className="text-center">
            <button
              onClick={handlePayment}
              disabled={loading}
              className="btn btn-primary w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Redirecting to PayPal...
                </>
              ) : (
                '🅿️ Pay with PayPal'
              )}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              You'll be redirected to PayPal to complete your payment
            </p>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-lg">🔒</span>
            <span className="text-sm">
              Your payment information is encrypted and secure. We never store your card details.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
