'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  getGuestPreferences,
  getServiceRequestHistory,
  rememberServiceRequest,
} from '@/lib/services/preferenceService';
import type { ServiceRequestMemory } from '@/lib/services/preferenceService';
import type { CheckoutBill } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// ── Types ────────────────────────────────────────────────────────────────────────

export interface CheckoutUpsell {
  id: string;
  type: 'late_checkout' | 'early_stay' | 'spa_package' | 'dining_credit' | 'loyalty_bonus' | 'transport';
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  icon: string;
  ctaLabel: string;
  validUntil?: string;
  tags: string[];
}

interface CheckoutSuggestionsProps {
  guestId: string;
  roomId: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  checkoutTime?: string;
  currentBill?: CheckoutBill;
  onAccept?: (upsell: CheckoutUpsell) => void;
  onDismiss?: (upsellId: string) => void;
  onExtendStay?: () => void;
  onBookNextStay?: () => void;
}

// ── Checkout Upsell Data ─────────────────────────────────────────────────────────

const CHECKOUT_UPSELLS: CheckoutUpsell[] = [
  {
    id: 'late-checkout-2pm',
    type: 'late_checkout',
    title: 'Late Checkout until 2:00 PM',
    description: 'Enjoy your room a bit longer with our complimentary late checkout extension',
    originalPrice: 1500,
    discountedPrice: 0,
    savings: 1500,
    icon: '🕐',
    ctaLabel: 'Claim Free Late Checkout',
    validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    tags: ['popular', 'complimentary'],
  },
  {
    id: 'late-checkout-4pm',
    type: 'late_checkout',
    title: 'Extended Late Checkout until 4:00 PM',
    description: 'Maximum flexibility for your departure',
    originalPrice: 2500,
    discountedPrice: 1500,
    savings: 1000,
    icon: '🕓',
    ctaLabel: 'Extend to 4 PM - Rs. 1500',
    tags: ['flexibility'],
  },
  {
    id: 'early-next-stay',
    type: 'early_stay',
    title: 'Early Next Stay Discount',
    description: 'Book your next visit and get 15% off plus complimentary early check-in',
    originalPrice: 0,
    discountedPrice: 0,
    savings: 0,
    icon: '🏨',
    ctaLabel: 'Get Early Access',
    tags: ['loyalty', 'repeat'],
  },
  {
    id: 'spa-exit',
    type: 'spa_package',
    title: 'Departure Spa Ritual',
    description: 'Unwind before your journey with our signature 60-minute spa package',
    originalPrice: 4500,
    discountedPrice: 2999,
    savings: 1501,
    icon: '💆',
    ctaLabel: 'Add Spa Ritual - Rs. 2999',
    tags: ['relaxation', 'featured'],
  },
  {
    id: 'dining-credit',
    type: 'dining_credit',
    title: 'Rs. 500 Dining Credit',
    description: 'Valid at our restaurant or for room service on your next visit',
    originalPrice: 500,
    discountedPrice: 350,
    savings: 150,
    icon: '🍽️',
    ctaLabel: 'Add Dining Credit - Rs. 350',
    tags: ['dining', 'savings'],
  },
  {
    id: 'airport-transfer',
    type: 'transport',
    title: 'Complimentary Airport Transfer',
    description: 'We\'ll arrange comfortable transport to/from the airport',
    originalPrice: 800,
    discountedPrice: 0,
    savings: 800,
    icon: '✈️',
    ctaLabel: 'Book Complimentary Transfer',
    tags: ['convenience', 'complimentary'],
  },
  {
    id: 'loyalty-points',
    type: 'loyalty_bonus',
    title: 'Bonus Loyalty Points',
    description: 'Earn 2x REZ coins on this stay plus 500 bonus points as a thank you',
    originalPrice: 0,
    discountedPrice: 0,
    savings: 0,
    icon: '⭐',
    ctaLabel: 'Claim Bonus Points',
    tags: ['loyalty', 'rewards'],
  },
];

// ── Utility Functions ─────────────────────────────────────────────────────────────

function isWithinHours(deadline: string | undefined, hours: number): boolean {
  if (!deadline) return true;
  return new Date(deadline).getTime() > Date.now() + hours * 60 * 60 * 1000;
}

function getRecommendedUpsells(
  serviceHistory: ServiceRequestMemory[],
  preferences: Awaited<ReturnType<typeof getGuestPreferences>> | null,
  stayDuration: number
): CheckoutUpsell[] {
  const usedServices = new Set(serviceHistory.map((s) => s.serviceType));
  const recommended: CheckoutUpsell[] = [];

  // Always show late checkout as top priority
  recommended.push(CHECKOUT_UPSELLS.find((u) => u.id === 'late-checkout-2pm')!);

  // Show spa if guest used spa or has spa-related preferences
  if (usedServices.has('spa') || preferences?.preferences.some((p) => p.preferenceType === 'general')) {
    recommended.push(CHECKOUT_UPSELLS.find((u) => u.id === 'spa-exit')!);
  }

  // Show airport transfer for longer stays
  if (stayDuration >= 2) {
    recommended.push(CHECKOUT_UPSELLS.find((u) => u.id === 'airport-transfer')!);
  }

  // Show loyalty for repeat consideration
  if (serviceHistory.length > 3) {
    recommended.push(CHECKOUT_UPSELLS.find((u) => u.id === 'loyalty-points')!);
    recommended.push(CHECKOUT_UPSELLS.find((u) => u.id === 'early-next-stay')!);
  }

  // Add dining credit
  if (usedServices.has('restaurant') || usedServices.has('room_service')) {
    recommended.push(CHECKOUT_UPSELLS.find((u) => u.id === 'dining-credit')!);
  }

  // Remove duplicates and filter valid offers
  return recommended
    .filter((upsell, index, arr) => arr.findIndex((u) => u.id === upsell.id) === index)
    .filter((upsell) => !upsell.validUntil || isWithinHours(upsell.validUntil, 0));
}

function calculateStayDuration(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Component ────────────────────────────────────────────────────────────────────

export default function CheckoutSuggestions({
  guestId,
  roomId,
  guestName,
  checkIn,
  checkOut,
  checkoutTime,
  currentBill,
  onAccept,
  onDismiss,
  onExtendStay,
  onBookNextStay,
}: CheckoutSuggestionsProps) {
  const [preferences, setPreferences] = useState<Awaited<ReturnType<typeof getGuestPreferences>> | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceRequestMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offers' | 'summary'>('offers');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  // Load guest data
  useEffect(() => {
    async function loadGuestData() {
      try {
        const [prefs, history] = await Promise.all([
          getGuestPreferences(guestId, roomId),
          getServiceRequestHistory(guestId, roomId),
        ]);
        setPreferences(prefs);
        setServiceHistory(history);
      } catch (error) {
        logger.error('Failed to load guest data:', { error });
      } finally {
        setLoading(false);
      }
    }
    loadGuestData();
  }, [guestId, roomId]);

  // Get recommended upsells
  const recommendedUpsells = useMemo(() => {
    const stayDuration = calculateStayDuration(checkIn, checkOut);
    return getRecommendedUpsells(serviceHistory, preferences, stayDuration);
  }, [serviceHistory, preferences, checkIn, checkOut]);

  // Filter visible upsells
  const visibleUpsells = recommendedUpsells.filter(
    (upsell) => !dismissedIds.has(upsell.id) && !acceptedIds.has(upsell.id)
  );

  // Handle accept
  const handleAccept = (upsell: CheckoutUpsell) => {
    setAcceptedIds((prev) => new Set([...prev, upsell.id]));

    // Remember this choice
    rememberServiceRequest(guestId, roomId, `checkout_upsell_${upsell.type}`, `Accepted: ${upsell.title}`);

    // Trigger callbacks based on upsell type
    switch (upsell.type) {
      case 'late_checkout':
        onExtendStay?.();
        break;
      case 'early_stay':
        onBookNextStay?.();
        break;
      default:
        onAccept?.(upsell);
    }
  };

  // Handle dismiss
  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    onDismiss?.(id);
  };

  // Calculate total savings
  const totalSavings = visibleUpsells.reduce((sum, upsell) => sum + upsell.savings, 0);
  const stayDuration = calculateStayDuration(checkIn, checkOut);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {guestName ? `${guestName}, before you go...` : 'Before You Go'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {stayDuration} night{stayDuration > 1 ? 's' : ''} with us. Here are some exclusive offers!
          </p>
        </div>
        {totalSavings > 0 && (
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            Save Rs. {totalSavings}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'offers'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Exclusive Offers ({visibleUpsells.length})
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'summary'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Stay Summary
        </button>
      </div>

      {/* Content */}
      {activeTab === 'offers' ? (
        <div className="space-y-3">
          {visibleUpsells.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No offers available at this time.</p>
            </div>
          ) : (
            visibleUpsells.map((upsell) => (
              <div
                key={upsell.id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  upsell.tags.includes('featured')
                    ? 'border-indigo-200 shadow-md'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{upsell.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-gray-900">{upsell.title}</h4>
                      {upsell.savings > 0 && upsell.discountedPrice > 0 && (
                        <span className="text-sm font-medium text-green-600 whitespace-nowrap">
                          Save Rs. {upsell.savings}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{upsell.description}</p>

                    {/* Pricing */}
                    <div className="flex items-center gap-2 mt-2">
                      {upsell.discountedPrice > 0 ? (
                        <>
                          <span className="text-lg font-bold text-gray-900">
                            Rs. {upsell.discountedPrice}
                          </span>
                          {upsell.originalPrice > upsell.discountedPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              Rs. {upsell.originalPrice}
                            </span>
                          )}
                        </>
                      ) : upsell.savings > 0 ? (
                        <span className="text-sm font-medium text-green-600">FREE</span>
                      ) : null}

                      {upsell.validUntil && (
                        <span className="text-xs text-gray-400">
                          Expires {new Date(upsell.validUntil).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mt-2">
                      {upsell.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            tag === 'featured'
                              ? 'bg-indigo-100 text-indigo-600'
                              : tag === 'complimentary'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleAccept(upsell)}
                        className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        {upsell.ctaLabel}
                      </button>
                      <button
                        onClick={() => handleDismiss(upsell.id)}
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-2"
                      >
                        No thanks
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
          <h4 className="font-semibold text-gray-900">Your Stay Summary</h4>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Check-in</span>
              <span className="text-gray-900 font-medium">
                {checkIn ? new Date(checkIn).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Check-out</span>
              <span className="text-gray-900 font-medium">
                {checkOut ? new Date(checkOut).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Duration</span>
              <span className="text-gray-900 font-medium">{stayDuration} night(s)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Services used</span>
              <span className="text-gray-900 font-medium">{serviceHistory.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current bill</span>
              <span className="text-gray-900 font-medium">
                {currentBill ? `Rs. ${(currentBill.total / 100).toFixed(2)}` : '—'}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={onBookNextStay}
              className="w-full text-center text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
            >
              Book Your Next Stay
            </button>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      {visibleUpsells.length === 0 && activeTab === 'offers' && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500 mb-2">Thank you for staying with us!</p>
          <button
            onClick={onBookNextStay}
            className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
          >
            Book your next visit
          </button>
        </div>
      )}
    </div>
  );
}

// ── Export utility functions ───────────────────────────────────────────────────────

export { CHECKOUT_UPSELLS, calculateStayDuration };
