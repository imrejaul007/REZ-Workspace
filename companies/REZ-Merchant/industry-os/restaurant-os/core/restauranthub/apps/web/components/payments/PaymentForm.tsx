'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { toast } from 'react-hot-toast';
import { CreditCardIcon, BanknotesIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  description: string;
  enabled: boolean;
  processingTime: string;
  fees: {
    percentage: number;
    description: string;
  };
  balance?: number;
}

interface PaymentFormProps {
  amount: number;
  currency?: string;
  orderId?: string;
  onPaymentSuccess: (paymentResult) => void;
  onPaymentError: (error) => void;
}

const PaymentFormContent: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'INR',
  orderId,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPaymentMethods(data.data);
        if (data.data.length > 0) {
          setSelectedMethod(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('Failed to load payment methods');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod);
      
      if (!selectedPaymentMethod) {
        throw new Error('Please select a payment method');
      }

      let paymentData: unknown = {
        amount,
        currency,
        method: selectedPaymentMethod.type.toUpperCase(),
        orderId,
      };

      // Handle different payment methods
      if (selectedMethod === 'card') {
        await handleCardPayment(paymentData);
      } else if (selectedMethod === 'upi') {
        await handleUPIPayment(paymentData);
      } else if (selectedMethod === 'wallet') {
        await handleWalletPayment(paymentData);
      } else if (selectedMethod === 'netbanking') {
        await handleNetBankingPayment(paymentData);
      } else if (selectedMethod === 'cash') {
        await handleCashPayment(paymentData);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(error.message || 'Payment failed');
      onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (paymentData) => {
    if (!stripe || !elements) {
      throw new Error('Stripe is not loaded');
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      throw new Error('Card element not found');
    }

    // Process payment on backend
    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Payment processing failed');
    }

    // Confirm payment with Stripe
    const { clientSecret } = result.data;
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      throw error;
    }

    onPaymentSuccess({
      paymentId: result.data.paymentId,
      paymentIntent,
    });
    toast.success('Payment successful!');
  };

  const handleUPIPayment = async (paymentData) => {
    if (!upiId) {
      throw new Error('Please enter UPI ID');
    }

    paymentData.metadata = { upiId };

    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Payment processing failed');
    }

    // Redirect to payment URL
    if (result.data.paymentUrl) {
      window.open(result.data.paymentUrl, '_blank');
    }

    onPaymentSuccess(result.data);
    toast.success('Payment initiated! Complete the payment in the new window.');
  };

  const handleWalletPayment = async (paymentData) => {
    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Payment processing failed');
    }

    onPaymentSuccess(result.data);
    toast.success('Payment completed using wallet!');
  };

  const handleNetBankingPayment = async (paymentData) => {
    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Payment processing failed');
    }

    if (result.data.paymentUrl) {
      window.open(result.data.paymentUrl, '_blank');
    }

    onPaymentSuccess(result.data);
    toast.success('Payment initiated! Complete the payment in the new window.');
  };

  const handleCashPayment = async (paymentData) => {
    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Payment processing failed');
    }

    onPaymentSuccess(result.data);
    toast.success('Cash payment selected. Please pay at the restaurant.');
  };

  const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
      
      <div className="mb-6">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total Amount:</span>
          <span>₹{amount.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Payment Method</label>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => method.enabled && setSelectedMethod(method.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {method.type === 'card' && <CreditCardIcon className="w-6 h-6 text-gray-500" />}
                    {method.type === 'upi' && <DevicePhoneMobileIcon className="w-6 h-6 text-gray-500" />}
                    {method.type === 'wallet' && <BanknotesIcon className="w-6 h-6 text-gray-500" />}
                    {method.type === 'netbanking' && <BanknotesIcon className="w-6 h-6 text-gray-500" />}
                    {method.type === 'cash' && <BanknotesIcon className="w-6 h-6 text-gray-500" />}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{method.name}</span>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        disabled={!method.enabled}
                        className="text-blue-600"
                        readOnly
                      />
                    </div>
                    <p className="text-sm text-gray-500">{method.description}</p>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Processing: {method.processingTime}</span>
                      <span>Fees: {method.fees.description}</span>
                    </div>
                    {method.balance !== undefined && (
                      <p className="text-xs text-green-600 mt-1">
                        Available: ₹{method.balance}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card Payment Form */}
        {selectedMethod === 'card' && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium mb-2">Card Details</label>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
              className="p-3 border rounded-md bg-white"
            />
          </div>
        )}

        {/* UPI Payment Form */}
        {selectedMethod === 'upi' && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium mb-2">UPI ID</label>
            <Input
              type="text"
              placeholder="your-upi-id@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !selectedPaymentMethod?.enabled}
          loading={loading}
        >
          {loading ? 'Processing...' : `Pay ₹${amount.toFixed(2)}`}
        </Button>
      </form>
    </Card>
  );
};

export const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: Math.round(props.amount * 100), // Convert to smallest currency unit
    currency: props.currency?.toLowerCase() || 'inr',
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm;