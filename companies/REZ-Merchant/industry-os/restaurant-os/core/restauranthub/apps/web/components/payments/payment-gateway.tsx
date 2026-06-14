'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Shield,
  Check,
  X,
  AlertCircle,
  Lock,
  Clock,
  Receipt,
  RefreshCw,
  QrCode,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'net_banking' | 'wallet' | 'cash' | 'credit';
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  enabled: boolean;
  processingTime: string;
  fees: {
    percentage?: number;
    fixed?: number;
    description: string;
  };
  limits?: {
    min: number;
    max: number;
  };
}

interface PaymentDetails {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  merchantInfo: {
    name: string;
    id: string;
  };
}

interface PaymentGatewayProps {
  paymentDetails: PaymentDetails;
  availableMethods: PaymentMethod[];
  onPaymentSuccess: (paymentId: string, method: string, transactionData) => void;
  onPaymentFailure: (error: string, method: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    type: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, RuPay, American Express',
    enabled: true,
    processingTime: 'Instant',
    fees: {
      percentage: 1.8,
      description: '1.8% + GST'
    },
    limits: {
      min: 100,
      max: 200000
    }
  },
  {
    id: 'upi',
    type: 'upi',
    name: 'UPI',
    icon: Smartphone,
    description: 'Google Pay, PhonePe, Paytm, BHIM',
    enabled: true,
    processingTime: 'Instant',
    fees: {
      percentage: 0,
      description: 'Free'
    },
    limits: {
      min: 100,
      max: 100000
    }
  },
  {
    id: 'net_banking',
    type: 'net_banking',
    name: 'Net Banking',
    icon: Building2,
    description: 'All major banks supported',
    enabled: true,
    processingTime: '1-2 minutes',
    fees: {
      fixed: 10,
      description: '₹10 + GST'
    },
    limits: {
      min: 500,
      max: 500000
    }
  },
  {
    id: 'wallet',
    type: 'wallet',
    name: 'Digital Wallet',
    icon: Wallet,
    description: 'Paytm, Amazon Pay, MobiKwik',
    enabled: true,
    processingTime: 'Instant',
    fees: {
      percentage: 1.2,
      description: '1.2% + GST'
    },
    limits: {
      min: 100,
      max: 50000
    }
  },
  {
    id: 'credit',
    type: 'credit',
    name: 'Restaurant Credit',
    icon: Wallet,
    description: 'Use your RestoPapa credit balance',
    enabled: true,
    processingTime: 'Instant',
    fees: {
      percentage: 0,
      description: 'No fees'
    }
  }
];

export default function PaymentGateway({
  paymentDetails,
  availableMethods,
  onPaymentSuccess,
  onPaymentFailure,
  onCancel,
  isOpen
}: PaymentGatewayProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'processing' | 'success' | 'failed'>('method');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
    saveCard: false
  });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing your payment...');
  const [paymentResult, setPaymentResult] = useState<unknown>(null);

  // Calculate fees
  const calculateFees = (method: PaymentMethod, amount: number) => {
    let fees = 0;
    if (method.fees.percentage) {
      fees += (amount * method.fees.percentage) / 100;
    }
    if (method.fees.fixed) {
      fees += method.fees.fixed;
    }
    return fees;
  };

  const getTotalAmount = (method: PaymentMethod) => {
    const fees = calculateFees(method, paymentDetails.amount);
    return paymentDetails.amount + fees;
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentStep('details');
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setPaymentStep('processing');

    const messages = [
      'Processing your payment...',
      'Verifying payment details...',
      'Communicating with bank...',
      'Finalizing transaction...',
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < messages.length - 1) {
        messageIndex++;
        setProcessingMessage(messages[messageIndex]);
      }
    }, 1500);

    try {
      // Real payment API call
      const res = await fetch('/api/proxy/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: paymentDetails.orderId,
          amount: getTotalAmount(selectedMethod),
          currency: paymentDetails.currency,
          method: selectedMethod.type,
          methodData: {
            ...(selectedMethod.type === 'card' && {
              maskedNumber: cardDetails.number.replace(/\s/g, '').slice(-4),
              name: cardDetails.name,
              expiry: cardDetails.expiry,
            }),
            ...(selectedMethod.type === 'upi' && { upiId }),
            ...(selectedMethod.type === 'net_banking' && { bank: selectedBank }),
          },
        }),
      });
      const json = await res.json();
      clearInterval(messageInterval);

      if (!res.ok) throw new Error(json?.error || 'Payment failed');

      const transactionData = {
        transactionId: json.transactionId || `TXN${Date.now()}`,
        paymentId: json.paymentId || `PAY${Date.now()}`,
        amount: getTotalAmount(selectedMethod),
        method: selectedMethod.type,
        timestamp: new Date().toISOString(),
        status: 'completed',
        ...json,
      };

      setPaymentResult(transactionData);
      setPaymentStep('success');
      onPaymentSuccess(transactionData.paymentId, selectedMethod.type, transactionData);
    } catch (err) {
      clearInterval(messageInterval);
      setPaymentStep('failed');
      onPaymentFailure(err?.message || 'Payment processing error', selectedMethod.type);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 3) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const getMaskedCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.length < 4) return number;
    return '**** **** **** ' + cleaned.slice(-4);
  };

  const renderPaymentMethodSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Choose Payment Method</h3>
        <p className="text-muted-foreground">
          Pay {formatCurrency(paymentDetails.amount)} for {paymentDetails.description}
        </p>
      </div>

      <div className="space-y-3">
        {availableMethods.filter(method => method.enabled).map((method) => {
          const Icon = method.icon;
          const fees = calculateFees(method, paymentDetails.amount);
          const total = getTotalAmount(method);
          
          return (
            <Card
              key={method.id}
              className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary/20"
              onClick={() => handleMethodSelect(method)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{method.name}</h4>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {method.processingTime}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {method.fees.description}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(total)}
                    </p>
                    {fees > 0 && (
                      <p className="text-xs text-muted-foreground">
                        +{formatCurrency(fees)} fees
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderCardPaymentForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Card Payment</h3>
        <p className="text-muted-foreground">
          Total amount: {formatCurrency(getTotalAmount(selectedMethod!))}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Card Number</label>
          <div className="relative">
            <input
              type={showCardNumber ? 'text' : 'password'}
              value={cardDetails.number}
              onChange={(e) => setCardDetails(prev => ({ ...prev, number: formatCardNumber(e.target.value) }))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary pr-12"
            />
            <button
              type="button"
              onClick={() => setShowCardNumber(!showCardNumber)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showCardNumber ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Expiry Date</label>
            <input
              type="text"
              value={cardDetails.expiry}
              onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
              placeholder="MM/YY"
              maxLength={5}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">CVV</label>
            <div className="relative">
              <input
                type={showCvv ? 'text' : 'password'}
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                placeholder="123"
                maxLength={4}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCvv(!showCvv)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showCvv ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Cardholder Name</label>
          <input
            type="text"
            value={cardDetails.name}
            onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
            placeholder="John Doe"
            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="save-card"
            checked={cardDetails.saveCard}
            onChange={(e) => setCardDetails(prev => ({ ...prev, saveCard: e.target.checked }))}
            className="rounded border-border"
          />
          <label htmlFor="save-card" className="text-sm text-muted-foreground">
            Save this card for future payments
          </label>
        </div>
      </div>

      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
        <Shield className="h-4 w-4 text-green-600" />
        <p className="text-xs text-muted-foreground">
          Your payment information is encrypted and secure
        </p>
      </div>
    </div>
  );

  const renderUpiPaymentForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">UPI Payment</h3>
        <p className="text-muted-foreground">
          Total amount: {formatCurrency(getTotalAmount(selectedMethod!))}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">UPI ID</label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@paytm"
            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="text-center py-6">
          <div className="inline-block p-4 bg-muted rounded-lg">
            <QrCode className="h-24 w-24 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Scan QR Code</p>
            <p className="text-xs text-muted-foreground">or enter UPI ID above</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Google Pay', logo: '🇬' },
            { name: 'PhonePe', logo: '📱' },
            { name: 'Paytm', logo: '💰' },
            { name: 'BHIM UPI', logo: '🇮' }
          ].map((app) => (
            <button
              key={app.name}
              className="p-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{app.logo}</div>
                <p className="text-xs font-medium">{app.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNetBankingForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Net Banking</h3>
        <p className="text-muted-foreground">
          Total amount: {formatCurrency(getTotalAmount(selectedMethod!))}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Select Your Bank</label>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {[
            'State Bank of India',
            'HDFC Bank',
            'ICICI Bank',
            'Axis Bank',
            'Kotak Mahindra Bank',
            'Punjab National Bank',
            'Bank of Baroda',
            'Canara Bank',
            'Union Bank of India',
            'Indian Bank'
          ].map((bank) => (
            <button
              key={bank}
              onClick={() => setSelectedBank(bank)}
              className={cn(
                'p-3 text-left border rounded-lg hover:bg-accent transition-colors',
                selectedBank === bank ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              {bank}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-12">
      <div className="space-y-4">
        <div className="inline-block p-4 rounded-full bg-primary/10">
          <RefreshCw className="h-12 w-12 text-primary animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{processingMessage}</h3>
        <p className="text-muted-foreground">Please do not close this window</p>
        
        <div className="flex items-center justify-center space-x-2 mt-6">
          <Lock className="h-4 w-4 text-green-600" />
          <p className="text-xs text-muted-foreground">Secure payment processing</p>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-12">
      <div className="space-y-4">
        <div className="inline-block p-4 rounded-full bg-green-100">
          <Check className="h-12 w-12 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Payment Successful!</h3>
        <p className="text-muted-foreground">
          Your payment of {formatCurrency(paymentResult?.amount)} has been processed successfully
        </p>
        
        {paymentResult && (
          <div className="bg-muted rounded-lg p-4 text-left max-w-sm mx-auto mt-6">
            <h4 className="font-medium text-foreground mb-2">Transaction Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono">{paymentResult.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono">{paymentResult.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{paymentResult.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span>{formatCurrency(paymentResult.amount)}</span>
              </div>
            </div>
          </div>
        )}
        
        <Button onClick={onCancel} className="mt-6">
          <Receipt className="h-4 w-4 mr-2" />
          Download Receipt
        </Button>
      </div>
    </div>
  );

  const renderFailure = () => (
    <div className="text-center py-12">
      <div className="space-y-4">
        <div className="inline-block p-4 rounded-full bg-red-100">
          <X className="h-12 w-12 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Payment Failed</h3>
        <p className="text-muted-foreground">
          We couldn't process your payment. Please try again.
        </p>
        
        <div className="flex items-center justify-center space-x-3 mt-6">
          <Button variant="outline" onClick={() => setPaymentStep('method')}>
            Try Again
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={paymentStep === 'processing' ? undefined : onCancel}
        />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-background rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {paymentStep === 'method' && 'Payment'}
                {paymentStep === 'details' && `${selectedMethod?.name} Payment`}
                {paymentStep === 'processing' && 'Processing'}
                {paymentStep === 'success' && 'Payment Successful'}
                {paymentStep === 'failed' && 'Payment Failed'}
              </h2>
              
              {paymentStep !== 'processing' && (
                <Button variant="ghost"  onClick={onCancel}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {paymentStep === 'method' && renderPaymentMethodSelection()}
              {paymentStep === 'details' && selectedMethod?.type === 'card' && renderCardPaymentForm()}
              {paymentStep === 'details' && selectedMethod?.type === 'upi' && renderUpiPaymentForm()}
              {paymentStep === 'details' && selectedMethod?.type === 'net_banking' && renderNetBankingForm()}
              {paymentStep === 'processing' && renderProcessing()}
              {paymentStep === 'success' && renderSuccess()}
              {paymentStep === 'failed' && renderFailure()}
            </div>

            {/* Footer */}
            {paymentStep === 'details' && (
              <div className="flex items-center justify-between p-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setPaymentStep('method')}
                >
                  Back
                </Button>
                
                <Button
                  onClick={handlePayment}
                  disabled={
                    (selectedMethod?.type === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name)) ||
                    (selectedMethod?.type === 'upi' && !upiId) ||
                    (selectedMethod?.type === 'net_banking' && !selectedBank)
                  }
                >
                  Pay {selectedMethod && formatCurrency(getTotalAmount(selectedMethod))}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}