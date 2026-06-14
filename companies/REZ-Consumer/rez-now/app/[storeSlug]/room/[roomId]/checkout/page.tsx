'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCheckoutBill,
  generateCheckoutBill,
  getBillBreakdownByCategory,
  getCategoryLabel,
  getCategoryIcon,
  settleFolio,
} from '@/lib/api/folio';
import {
  getWalletBalance,
  payWithWallet,
  payCheckoutWithWallet,
} from '@/lib/api/wallet';
import {
  getTipOptions,
  addCheckoutTip,
  calculateTipAmount,
  type TipPercentage,
} from '@/lib/api/tips';
import {
  createRazorpayOrder,
  verifyPayment,
  type CreateOrderPayload,
} from '@/lib/api/payment';
import { CheckoutBill, CheckoutBillItem, WalletBalance } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// ── Types ────────────────────────────────────────────────────────────────────────

interface CheckoutPageState {
  bill: CheckoutBill | null;
  walletBalance: WalletBalance | null;
  loading: boolean;
  error: string | null;
  processingPayment: boolean;
  selectedTipPercentage: TipPercentage;
  selectedPaymentMethod: 'wallet' | 'razorpay';
  showReceipt: boolean;
  receiptData: {
    transactionId: string;
    amount: number;
    method: string;
    timestamp: string;
  } | null;
}

const INITIAL_STATE: CheckoutPageState = {
  bill: null,
  walletBalance: null,
  loading: true,
  error: null,
  processingPayment: false,
  selectedTipPercentage: 10,
  selectedPaymentMethod: 'wallet',
  showReceipt: false,
  receiptData: null,
};

// ── Component ────────────────────────────────────────────────────────────────────

export default function RoomCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.storeSlug as string;
  const roomId = params.roomId as string;
  const bookingId = (params.bookingId as string) || '';

  const [state, setState] = useState<CheckoutPageState>(INITIAL_STATE);

  // Load checkout data
  const loadCheckoutData = useCallback(async () => {
    if (!bookingId) {
      setState((s) => ({ ...s, loading: false, error: 'Booking ID not found' }));
      return;
    }

    try {
      setState((s) => ({ ...s, loading: true, error: null }));

      // Load bill and wallet in parallel
      const [bill, wallet] = await Promise.all([
        getCheckoutBill(bookingId).catch(() => null),
        getWalletBalance().catch(() => null),
      ]);

      if (!bill) {
        // Try to generate bill if not available
        const generatedBill = await generateCheckoutBill(bookingId);
        setState((s) => ({
          ...s,
          bill: generatedBill,
          walletBalance: wallet,
          loading: false,
        }));
      } else {
        setState((s) => ({
          ...s,
          bill,
          walletBalance: wallet,
          loading: false,
        }));
      }
    } catch (err) {
      logger.error('Failed to load checkout data', { bookingId, error: err });
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Failed to load checkout information. Please try again.',
      }));
    }
  }, [bookingId]);

  useEffect(() => {
    loadCheckoutData();
  }, [loadCheckoutData]);

  // Calculate totals with tip
  const calculateTotalWithTip = () => {
    if (!state.bill) return { subtotal: 0, tip: 0, tax: 0, total: 0 };

    const subtotal = state.bill.subtotal;
    const tip = calculateTipAmount(subtotal, state.selectedTipPercentage);
    const tax = state.bill.tax;
    const total = subtotal + tip + tax;

    return { subtotal, tip, tax, total };
  };

  // Handle tip selection
  const handleTipChange = (percentage: TipPercentage) => {
    setState((s) => ({ ...s, selectedTipPercentage: percentage }));
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method: 'wallet' | 'razorpay') => {
    setState((s) => ({ ...s, selectedPaymentMethod: method }));
  };

  // Process payment
  const handlePayment = async () => {
    if (!state.bill || state.processingPayment) return;

    const { total } = calculateTotalWithTip();
    if (total <= 0) {
      setState((s) => ({ ...s, error: 'No amount to pay' }));
      return;
    }

    setState((s) => ({ ...s, processingPayment: true, error: null }));

    try {
      if (state.selectedPaymentMethod === 'wallet') {
        // Pay with wallet
        const tipAmount = calculateTipAmount(state.bill.subtotal, state.selectedTipPercentage);

        // Add tip first
        if (tipAmount > 0) {
          await addCheckoutTip(bookingId, roomId, state.bill.subtotal, state.selectedTipPercentage);
        }

        // Then pay checkout
        const result = await payCheckoutWithWallet(bookingId, roomId, total);

        if (result.success) {
          setState((s) => ({
            ...s,
            processingPayment: false,
            showReceipt: true,
            receiptData: {
              transactionId: result.transactionId || 'WALLET-' + Date.now(),
              amount: total,
              method: 'REZ Wallet',
              timestamp: new Date().toISOString(),
            },
          }));
        } else {
          setState((s) => ({
            ...s,
            processingPayment: false,
            error: result.message || 'Payment failed',
          }));
        }
      } else {
        // Pay with Razorpay
        const payload: CreateOrderPayload = {
          storeSlug,
          orderType: 'delivery',
          items: [
            {
              itemId: 'checkout',
              name: 'Room Checkout Payment',
              price: total,
              basePrice: total,
              quantity: 1,
              customizations: {},
              customizationTotal: 0,
              isVeg: true,
            },
          ],
          subtotal: total,
          tip: calculateTipAmount(state.bill.subtotal, state.selectedTipPercentage),
          donation: 0,
        };

        const order = await createRazorpayOrder(payload);

        // Open Razorpay
        if (typeof window !== 'undefined' && (window as unknown).Razorpay) {
          const rzp = new (window as unknown).Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            order_id: order.razorpayOrderId,
            name: 'REZ Now',
            description: 'Room Checkout Payment',
            handler: async (response) => {
              try {
                await verifyPayment(order.orderNumber, {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });

                setState((s) => ({
                  ...s,
                  processingPayment: false,
                  showReceipt: true,
                  receiptData: {
                    transactionId: response.razorpay_payment_id,
                    amount: total,
                    method: 'Card/UPI',
                    timestamp: new Date().toISOString(),
                  },
                }));
              } catch (err) {
                logger.error('Payment verification failed', { error: err });
                setState((s) => ({
                  ...s,
                  processingPayment: false,
                  error: 'Payment verification failed. Please contact support.',
                }));
              }
            },
            modal: {
              ondismiss: () => {
                setState((s) => ({ ...s, processingPayment: false }));
              },
            },
          });
          rzp.open();
        } else {
          throw new Error('Razorpay not loaded');
        }
      }
    } catch (err) {
      logger.error('Payment failed', { error: err });
      setState((s) => ({
        ...s,
        processingPayment: false,
        error: err instanceof Error ? err.message : 'Payment failed. Please try again.',
      }));
    }
  };

  // Render loading state
  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout information...</p>
        </div>
      </div>
    );
  }

  // Render receipt
  if (state.showReceipt && state.receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h1>
            <p className="text-gray-600">Thank you for staying with us!</p>
          </div>

          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-bold text-lg">Rs. {state.receiptData.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Payment Method</span>
              <span className="text-gray-900">{state.receiptData.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID</span>
              <span className="text-gray-900 text-sm">{state.receiptData.transactionId}</span>
            </div>
          </div>

          {state.bill && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-3">Bill Summary</h2>
              {state.bill.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.description}</span>
                  <span className="text-gray-900">Rs. {(item.amount / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <Link
              href={`/${storeSlug}`}
              className="block w-full bg-indigo-600 text-white text-center py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Return to Home
            </Link>
            <button
              onClick={() => window.print()}
              className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (state.error && !state.bill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Bill</h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <button
            onClick={loadCheckoutData}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { subtotal, tip, tax, total } = calculateTotalWithTip();
  const breakdown = state.bill ? getBillBreakdownByCategory(state.bill.items) : {};
  const tipOptions = state.bill ? getTipOptions(state.bill.subtotal) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${storeSlug}/room/${roomId}`} className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Checkout</h1>
            <div className="w-6" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Guest Info */}
        {state.bill && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{state.bill.guestName}</p>
                <p className="text-sm text-gray-500">Room {state.bill.roomNumber}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bill Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Bill Breakdown</h2>

          {Object.entries(breakdown).map(([category, data]) => (
            <div key={category} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500">{getCategoryIcon(category)}</span>
                <h3 className="text-sm font-medium text-gray-700">{getCategoryLabel(category)}</h3>
              </div>
              <div className="pl-6 space-y-1">
                {data.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.description}</span>
                    <span className="text-gray-900">Rs. {(item.amount / 100).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium pt-1 border-t border-gray-100">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="text-gray-900">Rs. {(data.subtotal / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}

          <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">Rs. {(subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxes & Fees</span>
              <span className="text-gray-900">Rs. {(tax / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Tip Section */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Add a Tip</h2>
          <p className="text-sm text-gray-500 mb-4">Show your appreciation for the service</p>

          <div className="grid grid-cols-3 gap-2">
            {tipOptions.map((option) => (
              <button
                key={option.percentage}
                onClick={() => handleTipChange(option.percentage)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  state.selectedTipPercentage === option.percentage
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">{option.label}</p>
                <p className="text-sm text-gray-500">
                  {option.percentage === 0 ? '—' : `Rs. ${(option.amount / 100).toFixed(0)}`}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Payment Method</h2>

          <div className="space-y-3">
            {/* REZ Wallet */}
            <label
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                state.selectedPaymentMethod === 'wallet'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="wallet"
                checked={state.selectedPaymentMethod === 'wallet'}
                onChange={() => handlePaymentMethodChange('wallet')}
                className="sr-only"
              />
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">REZ Wallet</p>
                {state.walletBalance && (
                  <p className="text-sm text-gray-500">
                    Balance: Rs. {state.walletBalance.rupees.toFixed(2)}
                  </p>
                )}
              </div>
              {state.selectedPaymentMethod === 'wallet' && (
                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </label>

            {/* Card/UPI */}
            <label
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                state.selectedPaymentMethod === 'razorpay'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                checked={state.selectedPaymentMethod === 'razorpay'}
                onChange={() => handlePaymentMethodChange('razorpay')}
                className="sr-only"
              />
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Card / UPI</p>
                <p className="text-sm text-gray-500">Pay with unknown card or UPI app</p>
              </div>
              {state.selectedPaymentMethod === 'razorpay' && (
                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Total & Pay Button */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-900">Total Amount</span>
            <span className="text-2xl font-bold text-indigo-600">Rs. {(total / 100).toFixed(2)}</span>
          </div>

          {state.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={state.processingPayment || !state.bill}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors ${
              state.processingPayment
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {state.processingPayment ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              `Pay Rs. ${(total / 100).toFixed(2)}`
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </main>
    </div>
  );
}
