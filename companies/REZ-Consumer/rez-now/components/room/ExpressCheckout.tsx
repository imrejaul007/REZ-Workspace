'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/utils/logger';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ChargeItem {
  id: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
  date: string;
  category: string;
}

interface FolioBill {
  bookingId: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  roomCharges: ChargeItem[];
  minibar: ChargeItem[];
  laundry: ChargeItem[];
  restaurant: ChargeItem[];
  spa: ChargeItem[];
  transport: ChargeItem[];
  other: ChargeItem[];
  subtotalPaise: number;
  taxesPaise: number;
  totalPaise: number;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'cash' | 'room_charge';
  label: string;
  icon: string;
  last4?: string;
}

interface PaymentRecord {
  id: string;
  amountPaise: number;
  method: string;
  status: string;
  date: string;
  transactionId?: string;
}

interface DigitalReceipt {
  receiptId: string;
  bookingId: string;
  guestName: string;
  roomNumber: string;
  totalAmountPaise: number;
  paidAmountPaise: number;
  paymentMethod: string;
  transactionId: string;
  issuedAt: string;
}

interface ExpressCheckoutProps {
  bookingId: string;
  roomId: string;
  guestId: string;
  hotelId: string;
  guestName: string;
  roomNumber: string;
  checkOut: string;
  onCheckoutComplete?: (receipt: DigitalReceipt) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', type: 'card', label: 'Credit/Debit Card', icon: 'card' },
  { id: 'upi', type: 'upi', label: 'UPI', icon: 'upi' },
  { id: 'wallet', type: 'wallet', label: 'Wallet', icon: 'wallet' },
  { id: 'cash', type: 'cash', label: 'Cash', icon: 'cash' },
  { id: 'room_charge', type: 'room_charge', label: 'Charge to Room', icon: 'room' },
];

const CATEGORY_LABELS: Record<string, string> = {
  room: 'Room Charges',
  minibar: 'Minibar',
  laundry: 'Laundry',
  restaurant: 'Restaurant',
  spa: 'Spa & Wellness',
  transport: 'Transport',
  other: 'Other Charges',
};

const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  room: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  minibar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M8 2h8l-1 7h4l-5 9v4h2v-4H8l-2-9h4L8 2z" />
    </svg>
  ),
  laundry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
    </svg>
  ),
  restaurant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  ),
  spa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M12 22c-4-3-8-6-8-11a8 8 0 1116 0c0 5-4 8-8 11z" />
      <circle cx="12" cy="11" r="3" />
    </svg>
  ),
  transport: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M5 17a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0zM3 9l2-4h14l2 4M5 17H3v-5l1-2m14 7h2l1-2-1-5v5" />
    </svg>
  ),
  other: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
};

// ─── Utility Functions ──────────────────────────────────────────────────────────

function formatPrice(paise: number): string {
  if (paise === 0) return '₹0';
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ExpressCheckout({
  bookingId,
  roomId,
  guestId,
  hotelId,
  guestName,
  roomNumber,
  checkOut,
  onCheckoutComplete,
}: ExpressCheckoutProps) {
  const [folio, setFolio] = useState<FolioBill | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState<DigitalReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch folio
  useEffect(() => {
    const fetchFolio = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/checkout/room-checkout/${bookingId}/folio`);
        const data = await response.json();
        if (data.success) {
          setFolio(data.data.folio);
          setPayments(data.data.payments || []);
        } else {
          // Fall back to demo data
          setFolio(createDemoFolio());
        }
      } catch (err) {
        logger.error('Failed to fetch folio:', { error: err });
        setFolio(createDemoFolio());
      } finally {
        setLoading(false);
      }
    };
    fetchFolio();
  }, [bookingId]);

  const createDemoFolio = (): FolioBill => ({
    bookingId,
    guestName,
    roomNumber,
    checkIn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    checkOut,
    roomCharges: [
      {
        id: 'room-1',
        description: 'Deluxe Room (3 nights)',
        quantity: 3,
        unitPricePaise: 500000,
        totalPaise: 1500000,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'room',
      },
    ],
    minibar: [
      {
        id: 'minibar-1',
        description: 'Mineral Water',
        quantity: 2,
        unitPricePaise: 2000,
        totalPaise: 4000,
        date: new Date().toISOString(),
        category: 'minibar',
      },
    ],
    laundry: [],
    restaurant: [],
    spa: [],
    transport: [],
    other: [
      {
        id: 'wifi-1',
        description: 'WiFi Access',
        quantity: 1,
        unitPricePaise: 0,
        totalPaise: 0,
        date: new Date().toISOString(),
        category: 'other',
      },
    ],
    subtotalPaise: 1504000,
    taxesPaise: 270720,
    totalPaise: 1774720,
  });

  const balanceDue = useMemo(() => {
    if (!folio) return 0;
    const paidAmount = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amountPaise, 0);
    return Math.max(0, folio.totalPaise - paidAmount);
  }, [folio, payments]);

  // Process payment
  const handlePayment = useCallback(async () => {
    if (!folio || balanceDue <= 0) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/checkout/room-checkout/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment',
          amountPaise: balanceDue,
          paymentMethod: selectedPaymentMethod,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const paymentRecord: PaymentRecord = {
          id: data.data.paymentId,
          amountPaise: balanceDue,
          method: selectedPaymentMethod,
          status: 'completed',
          date: new Date().toISOString(),
          transactionId: data.data.transactionId,
        };
        setPayments(prev => [...prev, paymentRecord]);

        // Check if fully paid
        const newPaidAmount = payments.reduce((sum, p) => sum + p.amountPaise, 0) + balanceDue;
        if (newPaidAmount >= folio.totalPaise) {
          // Generate receipt
          const receiptData: DigitalReceipt = {
            receiptId: data.data.receiptId || `RCP-${Date.now()}`,
            bookingId,
            guestName,
            roomNumber,
            totalAmountPaise: folio.totalPaise,
            paidAmountPaise: newPaidAmount,
            paymentMethod: selectedPaymentMethod,
            transactionId: data.data.transactionId || `TXN-${Date.now()}`,
            issuedAt: new Date().toISOString(),
          };
          setReceipt(receiptData);
          setShowReceipt(true);
          onCheckoutComplete?.(receiptData);
        }
      } else {
        setError(data.message || 'Payment failed');
      }
    } catch (err) {
      logger.error('Payment error:', { error: err });
      setError('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [folio, balanceDue, selectedPaymentMethod, bookingId, guestName, roomNumber, payments, onCheckoutComplete]);

  // Request express checkout
  const handleExpressCheckout = useCallback(async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/checkout/room-checkout/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'express_checkout',
          checkoutTime: checkOut,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // If there's a balance due, prompt for payment
        if (balanceDue > 0) {
          // Payment flow will be triggered
        } else {
          // Generate final receipt
          const receiptData: DigitalReceipt = {
            receiptId: data.data.receiptId || `RCP-${Date.now()}`,
            bookingId,
            guestName,
            roomNumber,
            totalAmountPaise: folio?.totalPaise || 0,
            paidAmountPaise: folio?.totalPaise || 0,
            paymentMethod: 'prepaid',
            transactionId: data.data.transactionId || `TXN-${Date.now()}`,
            issuedAt: new Date().toISOString(),
          };
          setReceipt(receiptData);
          setShowReceipt(true);
          onCheckoutComplete?.(receiptData);
        }
      } else {
        setError(data.message || 'Express checkout failed');
      }
    } catch (err) {
      logger.error('Express checkout error:', { error: err });
      setError('Express checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [bookingId, checkOut, balanceDue, folio, guestName, roomNumber, onCheckoutComplete]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!folio) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-gray-500">Unable to load checkout details</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <path d="M1 10h22" />
          </svg>
          Express Checkout 2.0
        </h2>
        <p className="text-emerald-100 text-sm mt-1">
          Quick, seamless checkout experience
        </p>
      </div>

      {/* Guest Info */}
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{guestName}</p>
            <p className="text-sm text-gray-500">Room {roomNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Check-out</p>
            <p className="font-medium text-gray-900">{formatDate(checkOut)}</p>
          </div>
        </div>
      </div>

      {/* Bill Breakdown */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Bill Breakdown</h3>

        {folio.roomCharges.length > 0 && (
          <CategorySection
            label={CATEGORY_LABELS.room}
            icon={CATEGORY_ICONS.room}
            items={folio.roomCharges}
          />
        )}

        {folio.minibar.length > 0 && (
          <CategorySection
            label={CATEGORY_LABELS.minibar}
            icon={CATEGORY_ICONS.minibar}
            items={folio.minibar}
          />
        )}

        {folio.laundry.length > 0 && (
          <CategorySection
            label={CATEGORY_LABELS.laundry}
            icon={CATEGORY_ICONS.laundry}
            items={folio.laundry}
          />
        )}

        {folio.restaurant.length > 0 && (
          <CategorySection
            label={CATEGORY_LABELS.restaurant}
            icon={CATEGORY_ICONS.restaurant}
            items={folio.restaurant}
          />
        )}

        {folio.spa.length > 0 && (
          <CategorySection
            label={CATEGORY_LABELS.spa}
            icon={CATEGORY_ICONS.spa}
            items={folio.spa}
          />
        )}

        {folio.transport.length > 0 && (
          <CategorySection
            label={CATEGORY_LABELS.transport}
            icon={CATEGORY_ICONS.transport}
            items={folio.transport}
          />
        )}

        {folio.other.length > 0 && (
          <CategorySection
            label={CATEGORY_LABELS.other}
            icon={CATEGORY_ICONS.other}
            items={folio.other}
          />
        )}

        {/* Totals */}
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatPrice(folio.subtotalPaise)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Taxes (18% GST)</span>
            <span className="text-gray-900">{formatPrice(folio.taxesPaise)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
            <span className="text-gray-900">Total</span>
            <span className="text-indigo-600">{formatPrice(folio.totalPaise)}</span>
          </div>

          {payments.length > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Paid</span>
              <span>-{formatPrice(payments.reduce((sum, p) => sum + p.amountPaise, 0))}</span>
            </div>
          )}

          {balanceDue > 0 && (
            <div className="flex justify-between font-bold text-lg text-red-600 bg-red-50 -mx-4 px-4 py-2 rounded-lg">
              <span>Balance Due</span>
              <span>{formatPrice(balanceDue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Payment Section */}
      {balanceDue > 0 && (
        <div className="p-4 border-t border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {PAYMENT_METHODS.filter(m => m.id !== 'room_charge').map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`p-3 rounded-xl border-2 transition-colors ${
                  selectedPaymentMethod === method.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className={`w-8 h-8 mx-auto mb-1 ${selectedPaymentMethod === method.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                    <PaymentIcon type={method.type} />
                  </div>
                  <p className={`text-xs font-medium ${selectedPaymentMethod === method.id ? 'text-indigo-600' : 'text-gray-600'}`}>
                    {method.label}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <path d="M1 10h22" />
                </svg>
                Pay {formatPrice(balanceDue)}
              </>
            )}
          </button>
        </div>
      )}

      {/* Express Checkout Button (when no balance due) */}
      {balanceDue === 0 && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleExpressCheckout}
            disabled={processing}
            className="w-full py-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Complete Express Checkout
              </>
            )}
          </button>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {showReceipt && receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReceipt(false)} />
          <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Checkout Complete!</h3>
            <p className="text-gray-500 mb-4">Thank you for staying with us</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt ID</span>
                <span className="font-mono text-sm">{receipt.receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Guest</span>
                <span className="font-medium">{receipt.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Room</span>
                <span className="font-medium">{receipt.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Paid</span>
                <span className="font-bold text-green-600">{formatPrice(receipt.paidAmountPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction</span>
                <span className="font-mono text-sm">{receipt.transactionId}</span>
              </div>
            </div>

            <button
              onClick={() => setShowReceipt(false)}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function CategorySection({
  label,
  icon,
  items,
}: {
  label: string;
  icon: React.ReactElement;
  items: ChargeItem[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.totalPaise, 0);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 text-gray-500">{icon}</div>
          <span className="font-medium text-gray-900">{label}</span>
          <span className="text-xs text-gray-500">({items.length} items)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{formatPrice(total)}</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="p-3 bg-white space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <span className="text-gray-700">{item.description}</span>
                {item.quantity > 1 && (
                  <span className="text-gray-400 ml-1">x{item.quantity}</span>
                )}
              </div>
              <span className="text-gray-900">{formatPrice(item.totalPaise)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentIcon({ type }: { type: string }) {
  switch (type) {
    case 'card':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <path d="M1 10h22" />
        </svg>
      );
    case 'upi':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" />
        </svg>
      );
    case 'wallet':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <path d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z" />
          <circle cx="16" cy="12" r="2" />
        </svg>
      );
    case 'cash':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
  }
}

export default ExpressCheckout;
