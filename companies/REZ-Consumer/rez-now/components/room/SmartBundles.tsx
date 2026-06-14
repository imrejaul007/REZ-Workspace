'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/utils/logger';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Bundle {
  id: string;
  name: string;
  description: string;
  pricePaise: number;
  originalPricePaise?: number;
  discountPercent?: number;
  image?: string;
  category: BundleCategory;
  services: BundleService[];
  duration?: string;
  available: boolean;
  badges?: string[];
  isPopular?: boolean;
  isAiSuggested?: boolean;
  suggestedReason?: string;
}

interface BundleService {
  id: string;
  name: string;
  description?: string;
  icon: string;
  included: boolean;
}

type BundleCategory =
  | 'romantic'
  | 'spa'
  | 'convenience'
  | 'transport'
  | 'celebration'
  | 'staycation'
  | 'wellness'
  | 'dining';

interface OrderBundleRequest {
  bundleId: string;
  bookingId: string;
  roomId: string;
  guestId: string;
  scheduledFor?: string;
  notes?: string;
}

interface BundleOrder {
  id: string;
  bundleId: string;
  bookingId: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledFor?: string;
  createdAt: string;
  completedAt?: string;
}

interface SmartBundlesProps {
  hotelId: string;
  bookingId: string;
  roomId: string;
  guestId: string;
  stayPurpose?: 'business' | 'pleasure' | 'mixed';
  onOrderComplete?: (order: BundleOrder) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const BUNDLE_CATEGORIES: Array<{ id: BundleCategory; label: string; icon: string }> = [
  { id: 'romantic', label: 'Romantic', icon: 'heart' },
  { id: 'spa', label: 'Spa & Wellness', icon: 'spa' },
  { id: 'convenience', label: 'Convenience', icon: 'clock' },
  { id: 'transport', label: 'Transport', icon: 'car' },
  { id: 'celebration', label: 'Celebration', icon: 'party' },
  { id: 'staycation', label: 'Staycation', icon: 'sun' },
  { id: 'wellness', label: 'Wellness', icon: 'leaf' },
  { id: 'dining', label: 'Dining', icon: 'utensils' },
];

const BUNDLE_ICONS: Record<string, React.ReactElement> = {
  heart: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  spa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M12 22c-4-3-8-6-8-11a8 8 0 1116 0c0 5-4 8-8 11z" />
      <circle cx="12" cy="11" r="3" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  car: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M5 17a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0zM3 9l2-4h14l2 4M5 17H3v-5l1-2m14 7h2l1-2-1-5v5" />
    </svg>
  ),
  party: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M12 22c-4-4-8-7-8-12a8 8 0 1116 0c0 5-4 8-8 12z" />
      <path d="M12 10v6" />
    </svg>
  ),
  utensils: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
      <path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" />
      <path d="M19 17L19.5 19L21 19.5L19.5 20L19 22L18.5 20L17 19.5L18.5 19L19 17Z" />
    </svg>
  ),
};

// ─── Utility Functions ──────────────────────────────────────────────────────────

function formatPrice(paise: number): string {
  if (paise === 0) return 'Free';
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// ─── Default Bundles Data ───────────────────────────────────────────────────────

const DEFAULT_BUNDLES: Bundle[] = [
  {
    id: 'romantic-dinner',
    name: 'Romantic Dinner',
    description: 'Candlelit dinner with champagne, rose petals, and a personalized menu',
    pricePaise: 450000,
    originalPricePaise: 600000,
    discountPercent: 25,
    category: 'romantic',
    services: [
      { id: 'dinner', name: 'Candlelit Dinner', description: '3-course meal for two', icon: 'utensils', included: true },
      { id: 'champagne', name: 'Champagne', description: 'Premium bottle', icon: 'heart', included: true },
      { id: 'decoration', name: 'Room Decoration', description: 'Rose petals & candles', icon: 'sparkles', included: true },
    ],
    duration: '3 hours',
    available: true,
    badges: ['Couples Favorite'],
    isPopular: true,
  },
  {
    id: 'spa-combo',
    name: 'Spa Relaxation Combo',
    description: 'Full body massage and rejuvenating facial for ultimate relaxation',
    pricePaise: 800000,
    originalPricePaise: 1000000,
    discountPercent: 20,
    category: 'spa',
    services: [
      { id: 'massage', name: 'Full Body Massage', description: '60 minutes', icon: 'spa', included: true },
      { id: 'facial', name: 'Facial Treatment', description: '45 minutes', icon: 'leaf', included: true },
      { id: 'steam', name: 'Steam Room Access', description: '30 minutes', icon: 'spa', included: true },
    ],
    duration: '2.5 hours',
    available: true,
    badges: ['Best Value'],
    isPopular: true,
  },
  {
    id: 'late-checkout-breakfast',
    name: 'Late Checkout + Breakfast',
    description: 'Extended checkout until 4 PM with breakfast in bed',
    pricePaise: 150000,
    category: 'convenience',
    services: [
      { id: 'late-checkout', name: 'Late Checkout', description: 'Until 4 PM', icon: 'clock', included: true },
      { id: 'breakfast', name: 'Breakfast in Bed', description: 'Full breakfast', icon: 'utensils', included: true },
    ],
    duration: 'Until 4 PM',
    available: true,
  },
  {
    id: 'airport-transfer-lounge',
    name: 'Airport Transfer + Lounge',
    description: 'Premium airport pickup with lounge access',
    pricePaise: 350000,
    category: 'transport',
    services: [
      { id: 'pickup', name: 'Airport Pickup', description: 'Premium sedan', icon: 'car', included: true },
      { id: 'lounge', name: 'Lounge Access', description: '2 persons', icon: 'sparkles', included: true },
      { id: 'wifi', name: 'Portable WiFi', description: 'Unlimited data', icon: 'sparkles', included: true },
    ],
    duration: 'As needed',
    available: true,
    badges: ['Business Traveler'],
  },
  {
    id: 'birthday-special',
    name: 'Birthday Special',
    description: 'Celebrate with cake, decorations, and surprise gift',
    pricePaise: 300000,
    category: 'celebration',
    services: [
      { id: 'cake', name: 'Birthday Cake', description: 'Custom flavor', icon: 'party', included: true },
      { id: 'decoration', name: 'Room Setup', description: 'Balloons & banners', icon: 'sparkles', included: true },
      { id: 'gift', name: 'Surprise Gift', description: 'Hotel merchandise', icon: 'party', included: true },
      { id: 'breakfast', name: 'Special Breakfast', description: 'Birthday special', icon: 'utensils', included: true },
    ],
    duration: 'All day',
    available: true,
    badges: ['Special Occasion'],
    isPopular: true,
  },
  {
    id: 'staycation-package',
    name: 'Weekend Staycation',
    description: 'Pool access, spa treatment, and dinner - everything for a perfect staycation',
    pricePaise: 1500000,
    originalPricePaise: 2000000,
    discountPercent: 25,
    category: 'staycation',
    services: [
      { id: 'pool', name: 'Pool Access', description: 'Full day', icon: 'sun', included: true },
      { id: 'spa', name: 'Spa Treatment', description: '45 minutes', icon: 'spa', included: true },
      { id: 'dinner', name: 'Dinner', description: 'Buffet for two', icon: 'utensils', included: true },
      { id: 'breakfast', name: 'Breakfast', description: 'Next morning', icon: 'utensils', included: true },
    ],
    duration: '24 hours',
    available: true,
    badges: ['Weekend Deal'],
    isAiSuggested: true,
    suggestedReason: 'Perfect for a quick getaway',
  },
  {
    id: 'anniversary-package',
    name: 'Anniversary Celebration',
    description: 'Romantic dinner, couples massage, and champagne to celebrate your special day',
    pricePaise: 850000,
    category: 'celebration',
    services: [
      { id: 'dinner', name: 'Romantic Dinner', description: '4-course meal', icon: 'utensils', included: true },
      { id: 'massage', name: 'Couples Massage', description: '60 minutes', icon: 'spa', included: true },
      { id: 'champagne', name: 'Champagne', description: 'Premium bottle', icon: 'heart', included: true },
      { id: 'cake', name: 'Anniversary Cake', description: 'Custom design', icon: 'party', included: true },
    ],
    duration: 'Full evening',
    available: true,
    badges: ['Most Booked'],
    isAiSuggested: true,
    suggestedReason: 'Popular for special occasions',
  },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export function SmartBundles({
  hotelId,
  bookingId,
  roomId,
  guestId,
  stayPurpose = 'mixed',
  onOrderComplete,
}: SmartBundlesProps) {
  const [bundles, setBundles] = useState<Bundle[]>(DEFAULT_BUNDLES);
  const [selectedCategory, setSelectedCategory] = useState<BundleCategory | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Bundle | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Filter bundles by category
  const filteredBundles = useMemo(() => {
    if (selectedCategory === 'all') return bundles;
    return bundles.filter((b) => b.category === selectedCategory);
  }, [bundles, selectedCategory]);

  // AI-suggested bundles based on stay purpose
  const suggestedBundles = useMemo(() => {
    return bundles.filter((b) => b.isAiSuggested);
  }, [bundles]);

  // Fetch bundles from API
  useEffect(() => {
    const fetchBundles = async () => {
      try {
        const response = await fetch(`/api/bundles/${hotelId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.bundles) {
            setBundles(data.data.bundles);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch bundles:', { error });
        // Keep default bundles on error
      }
    };
    fetchBundles();
  }, [hotelId]);

  // Order a bundle
  const handleOrder = useCallback(
    async (bundle: Bundle) => {
      setOrdering(bundle.id);
      try {
        const response = await fetch(`/api/bundles/${bundle.id}/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bundleId: bundle.id,
            bookingId,
            roomId,
            guestId,
            scheduledFor: scheduledTime || undefined,
            notes: specialNotes || undefined,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setOrderSuccess(bundle.id);
          setShowDetails(null);
          setScheduledTime('');
          setSpecialNotes('');
          onOrderComplete?.(data.data);
          setTimeout(() => setOrderSuccess(null), 3000);
        }
      } catch (error) {
        logger.error('Failed to order bundle:', { error });
      } finally {
        setOrdering(null);
      }
    },
    [bookingId, roomId, guestId, scheduledTime, specialNotes, onOrderComplete]
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Smart Bundles</h2>
            <p className="text-sm text-gray-500">Curated packages just for you</p>
          </div>
          {suggestedBundles.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
              <div className="w-5 h-5 text-purple-500">{BUNDLE_ICONS.sparkles}</div>
              <span className="text-xs font-medium text-purple-700">AI Picks</span>
            </div>
          )}
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {BUNDLE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4">{BUNDLE_ICONS[cat.icon]}</span>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bundle list */}
      <div className="p-4 space-y-4">
        {filteredBundles.map((bundle) => (
          <div
            key={bundle.id}
            className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Bundle header */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Category icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    bundle.category === 'romantic'
                      ? 'bg-pink-100 text-pink-600'
                      : bundle.category === 'spa' || bundle.category === 'wellness'
                      ? 'bg-green-100 text-green-600'
                      : bundle.category === 'celebration'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}
                >
                  <div className="w-6 h-6">
                    {BUNDLE_ICONS[BUNDLE_CATEGORIES.find((c) => c.id === bundle.category)?.icon || 'sparkles']}
                  </div>
                </div>

                {/* Bundle info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{bundle.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{bundle.description}</p>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-indigo-600">{formatPrice(bundle.pricePaise)}</p>
                      {bundle.originalPricePaise && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(bundle.originalPricePaise)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {bundle.isPopular && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                        Popular
                      </span>
                    )}
                    {bundle.isAiSuggested && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        AI Suggested
                      </span>
                    )}
                    {bundle.badges?.map((badge) => (
                      <span
                        key={badge}
                        className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full"
                      >
                        {badge}
                      </span>
                    ))}
                    {bundle.duration && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1">
                        <div className="w-3 h-3">{BUNDLE_ICONS.clock}</div>
                        {bundle.duration}
                      </span>
                    )}
                  </div>

                  {/* Services preview */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bundle.services.slice(0, 3).map((service) => (
                      <span
                        key={service.id}
                        className="px-2 py-0.5 bg-white text-gray-600 text-xs rounded border border-gray-200"
                      >
                        {service.name}
                      </span>
                    ))}
                    {bundle.services.length > 3 && (
                      <span className="px-2 py-0.5 text-gray-400 text-xs">
                        +{bundle.services.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* AI suggestion reason */}
                  {bundle.isAiSuggested && bundle.suggestedReason && (
                    <p className="text-xs text-purple-600 mt-2 italic">
                      "{bundle.suggestedReason}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bundle actions */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => setShowDetails(bundle)}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => handleOrder(bundle)}
                disabled={ordering === bundle.id || !bundle.available}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {ordering === bundle.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : orderSuccess === bundle.id ? (
                  <>
                    <div className="w-4 h-4">{BUNDLE_ICONS.check}</div>
                    Ordered!
                  </>
                ) : (
                  'Book Now'
                )}
              </button>
            </div>
          </div>
        ))}

        {filteredBundles.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 text-gray-400">{BUNDLE_ICONS.sparkles}</div>
            </div>
            <p className="text-sm text-gray-500">No bundles available in this category</p>
          </div>
        )}
      </div>

      {/* Bundle details modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetails(null)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{showDetails.name}</h3>
              <button
                onClick={() => setShowDetails(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Price section */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{formatPrice(showDetails.pricePaise)}</p>
                  {showDetails.originalPricePaise && (
                    <p className="text-sm text-gray-400 line-through">
                      {formatPrice(showDetails.originalPricePaise)}
                      <span className="ml-1 text-green-600 font-medium">
                        ({showDetails.discountPercent}% off)
                      </span>
                    </p>
                  )}
                </div>
                {showDetails.duration && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <div className="w-4 h-4">{BUNDLE_ICONS.clock}</div>
                    <span className="text-sm">{showDetails.duration}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600">{showDetails.description}</p>

              {/* Included services */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's Included</h4>
                <div className="space-y-2">
                  {showDetails.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="w-4 h-4 text-green-600">{BUNDLE_ICONS.check}</div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        {service.description && (
                          <p className="text-sm text-gray-500">{service.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="Any special requests or dietary requirements..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Order button */}
              <button
                onClick={() => handleOrder(showDetails)}
                disabled={ordering === showDetails.id}
                className="w-full py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {ordering === showDetails.id ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Book {showDetails.name}
                    <span className="font-normal opacity-80">- {formatPrice(showDetails.pricePaise)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartBundles;
