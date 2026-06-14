'use client';

import { useState, useEffect, useMemo } from 'react';
import { getGuestPreferences } from '@/lib/services/preferenceService';
import type { GuestPreferences, RoomPreference, ServiceType } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// ── Types ────────────────────────────────────────────────────────────────────────

export interface ServiceRecommendation {
  id: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  icon: string;
  price?: number;
  imageUrl?: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  timeSlot?: string;
  actionLabel: string;
}

interface RoomRecommendationsProps {
  roomId: string;
  guestId: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  onServiceSelect?: (serviceType: ServiceType) => void;
  onDismiss?: (recommendationId: string) => void;
}

// ── Time-based Recommendations ────────────────────────────────────────────────────

const TIME_BASED_SERVICES: Record<string, ServiceRecommendation[]> = {
  morning: [
    {
      id: 'breakfast-room',
      serviceType: 'room_service',
      title: 'Breakfast in Room',
      description: 'Start your day with a delicious breakfast served in your room',
      icon: '🍳',
      price: 350,
      priority: 'high',
      reason: 'Perfect time for breakfast - freshly prepared for you',
      timeSlot: '7:00 AM - 10:30 AM',
      actionLabel: 'Order Breakfast',
    },
    {
      id: 'wakeup-call',
      serviceType: 'concierge',
      title: 'Schedule Wake-up Call',
      description: 'Never miss an important meeting or flight',
      icon: '⏰',
      priority: 'low',
      reason: 'Helpful for early risers',
      actionLabel: 'Set Alarm',
    },
    {
      id: 'newspaper',
      serviceType: 'concierge',
      title: 'Morning Newspaper',
      description: 'Get your favorite newspaper delivered to your room',
      icon: '📰',
      priority: 'low',
      reason: 'Stay informed with today\'s news',
      actionLabel: 'Request',
    },
  ],
  afternoon: [
    {
      id: 'lunch-room',
      serviceType: 'room_service',
      title: 'Lunch Delivery',
      description: 'Refreshing lunch options delivered to your room',
      icon: '🥗',
      price: 450,
      priority: 'medium',
      reason: 'Quick and convenient lunch option',
      timeSlot: '12:00 PM - 3:00 PM',
      actionLabel: 'Order Lunch',
    },
    {
      id: 'spa-midday',
      serviceType: 'spa',
      title: 'Afternoon Spa Treatment',
      description: 'Rejuvenate with our signature massage or spa package',
      icon: '💆',
      price: 2500,
      priority: 'medium',
      reason: 'Perfect time for relaxation and unwinding',
      timeSlot: '2:00 PM - 6:00 PM',
      actionLabel: 'Book Spa',
    },
    {
      id: 'pool-access',
      serviceType: 'fitness',
      title: 'Pool & Gym Access',
      description: 'Take a refreshing swim or work out in our fully equipped gym',
      icon: '🏊',
      priority: 'low',
      reason: 'Stay active during your stay',
      actionLabel: 'View Facilities',
    },
  ],
  evening: [
    {
      id: 'dinner-room',
      serviceType: 'room_service',
      title: 'Dinner in Room',
      description: 'Elegant dinner options for a cozy evening',
      icon: '🍽️',
      price: 550,
      priority: 'high',
      reason: 'Time for a memorable dinner experience',
      timeSlot: '7:00 PM - 10:00 PM',
      actionLabel: 'Order Dinner',
    },
    {
      id: 'spa-evening',
      serviceType: 'spa',
      title: 'Evening Spa Ritual',
      description: 'Unwind with our evening spa packages',
      icon: '🕯️',
      price: 3000,
      priority: 'medium',
      reason: 'Perfect way to end your day',
      timeSlot: '6:00 PM - 9:00 PM',
      actionLabel: 'Book Spa',
    },
    {
      id: 'turndown',
      serviceType: 'turndown',
      title: 'Turndown Service',
      description: 'Let us prepare your room for a restful night\'s sleep',
      icon: '🌙',
      priority: 'low',
      reason: 'Enjoy a perfectly prepared sleeping environment',
      actionLabel: 'Request',
    },
  ],
  night: [
    {
      id: 'late-snack',
      serviceType: 'room_service',
      title: 'Late Night Snack',
      description: 'Satisfy late-night cravings with our snack menu',
      icon: '🌙',
      price: 200,
      priority: 'medium',
      reason: 'Available 24/7 for your convenience',
      actionLabel: 'Order Snacks',
    },
    {
      id: 'extra-pillows',
      serviceType: 'amenity',
      title: 'Extra Pillows & Blankets',
      description: 'Add extra comfort to your bed',
      icon: '😴',
      priority: 'low',
      reason: 'Ensure a comfortable night\'s rest',
      actionLabel: 'Request',
    },
  ],
};

// ── Stay Duration Recommendations ────────────────────────────────────────────────

const STAY_BASED_RECOMMENDATIONS: Record<string, ServiceRecommendation[]> = {
  first_night: [
    {
      id: 'welcome-amenity',
      serviceType: 'amenity',
      title: 'Welcome Amenity',
      description: 'Enjoy our complimentary welcome drink and snacks',
      icon: '🎁',
      priority: 'high',
      reason: 'Welcome to our hotel! Enjoy this special treat',
      actionLabel: 'Claim',
    },
    {
      id: 'explore-hotel',
      serviceType: 'concierge',
      title: 'Hotel Tour',
      description: 'Let us show you around our facilities',
      icon: '🗺️',
      priority: 'medium',
      reason: 'Discover everything our hotel has to offer',
      actionLabel: 'Schedule Tour',
    },
  ],
  short_stay: [
    {
      id: 'express-checkout',
      serviceType: 'express_checkout',
      title: 'Express Checkout',
      description: 'Skip the front desk - checkout from your room',
      icon: '⚡',
      priority: 'high',
      reason: 'Save time with our express checkout service',
      actionLabel: 'Enable',
    },
    {
      id: 'quick-spa',
      serviceType: 'spa',
      title: 'Quick Spa Session',
      description: '30-minute express massage to refresh and energize',
      icon: '💆',
      price: 1500,
      priority: 'medium',
      reason: 'Make the most of your short stay',
      actionLabel: 'Book Now',
    },
  ],
  medium_stay: [
    {
      id: 'laundry-service',
      serviceType: 'laundry',
      title: 'Laundry Service',
      description: 'Professional laundry and dry cleaning',
      icon: '👔',
      price: 200,
      priority: 'medium',
      reason: 'Keep your wardrobe fresh during your stay',
      actionLabel: 'Schedule Pickup',
    },
    {
      id: 'spa-package',
      serviceType: 'spa',
      title: 'Full Spa Package',
      description: 'Complete relaxation with our signature spa journey',
      icon: '🧖',
      price: 5000,
      priority: 'medium',
      reason: 'Treat yourself to ultimate relaxation',
      actionLabel: 'Book Package',
    },
  ],
  long_stay: [
    {
      id: 'weekly-cleaning',
      serviceType: 'housekeeping',
      title: 'Deep Cleaning',
      description: 'Comprehensive room cleaning and sanitization',
      icon: '✨',
      priority: 'medium',
      reason: 'Keep your extended stay fresh and comfortable',
      actionLabel: 'Schedule',
    },
    {
      id: 'room-upgrade',
      serviceType: 'concierge',
      title: 'Room Upgrade',
      description: 'Consider upgrading to our premium suite',
      icon: '🏠',
      priority: 'low',
      reason: 'Enhance your extended stay experience',
      actionLabel: 'Inquire',
    },
  ],
};

// ── Upsell Recommendations ────────────────────────────────────────────────────────

const UPSELL_SERVICES: ServiceRecommendation[] = [
  {
    id: 'breakfast-package',
    serviceType: 'room_service',
    title: 'Breakfast Package',
    description: 'Add unlimited breakfast to your stay',
    icon: '🍳',
    price: 2500,
    priority: 'high',
    reason: 'Save on daily breakfast with our package deal',
    actionLabel: 'Add to Stay',
  },
  {
    id: 'spa-credit',
    serviceType: 'spa',
    title: 'Spa Credit',
    description: 'Get Rs. 500 spa credit included',
    icon: '💆',
    price: 3500,
    priority: 'medium',
    reason: 'Relaxation made affordable',
    actionLabel: 'Add Credit',
  },
  {
    id: 'late-checkout',
    serviceType: 'late_checkout',
    title: 'Late Checkout',
    description: 'Extend your checkout to 3:00 PM',
    icon: '🕐',
    price: 1000,
    priority: 'medium',
    reason: 'No rush - enjoy your room a bit longer',
    actionLabel: 'Request',
  },
];

// ── Utility Functions ─────────────────────────────────────────────────────────────

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getStayDurationCategory(checkIn?: string, checkOut?: string): 'first_night' | 'short_stay' | 'medium_stay' | 'long_stay' {
  if (!checkIn || !checkOut) return 'short_stay';

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const now = new Date();

  // Calculate nights from check-in
  const nightsFromCheckIn = Math.ceil((now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  if (nightsFromCheckIn < 1) return 'first_night';
  if (nightsFromCheckIn <= 2) return 'short_stay';
  if (nightsFromCheckIn <= 5) return 'medium_stay';
  return 'long_stay';
}

function getTotalNights(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 1;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
}

function filterByPreferences(
  recommendations: ServiceRecommendation[],
  preferences?: GuestPreferences
): ServiceRecommendation[] {
  if (!preferences || !preferences.preferences.length) return recommendations;

  // Boost recommendations that match guest preferences
  return recommendations.map((rec) => {
    const matchingPref = preferences.preferences.find((p) =>
      p.preferenceType === getPreferenceTypeForService(rec.serviceType) ||
      rec.title.toLowerCase().includes(p.value.toLowerCase())
    );

    if (matchingPref) {
      return { ...rec, reason: `Based on your preference: ${matchingPref.notes || matchingPref.value}` };
    }

    return rec;
  });
}

function getPreferenceTypeForService(serviceType: ServiceType): RoomPreference['preferenceType'] | null {
  const mapping: Partial<Record<ServiceType, RoomPreference['preferenceType']>> = {
    spa: 'general',
    room_service: 'dietary',
    housekeeping: 'general',
  };
  return mapping[serviceType] || null;
}

// ── Component ────────────────────────────────────────────────────────────────────

export default function RoomRecommendations({
  roomId,
  guestId,
  guestName,
  checkIn,
  checkOut,
  onServiceSelect,
  onDismiss,
}: RoomRecommendationsProps) {
  const [preferences, setPreferences] = useState<GuestPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'for-you' | 'time' | 'packages'>('for-you');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Load preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        const prefs = await getGuestPreferences(guestId, roomId);
        setPreferences(prefs);
      } catch (error) {
        logger.error('Failed to load preferences:', { error });
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, [guestId, roomId]);

  // Get personalized recommendations
  const recommendations = useMemo(() => {
    const timeOfDay = getTimeOfDay();
    const stayCategory = getStayDurationCategory(checkIn, checkOut);
    const totalNights = getTotalNights(checkIn, checkOut);

    // Combine time-based and stay-based recommendations
    let combined = [
      ...TIME_BASED_SERVICES[timeOfDay],
      ...STAY_BASED_RECOMMENDATIONS[stayCategory],
    ];

    // Add upsell for longer stays
    if (totalNights >= 2) {
      combined = [...combined, ...UPSELL_SERVICES];
    }

    // Filter by preferences
    combined = filterByPreferences(combined, preferences || undefined);

    // Filter out dismissed recommendations
    combined = combined.filter((rec) => !dismissedIds.has(rec.id));

    // Sort by priority
    combined.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return combined;
  }, [preferences, dismissedIds, checkIn, checkOut]);

  // Handle service selection
  const handleServiceClick = (service: ServiceRecommendation) => {
    onServiceSelect?.(service.serviceType);
  };

  // Handle dismiss
  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    onDismiss?.(id);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recommendations available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {guestName ? `${guestName}, here are suggestions for you` : 'Recommended for You'}
          </h3>
          <p className="text-sm text-gray-500">Personalized based on your stay</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('for-you')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'for-you'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          For You
        </button>
        <button
          onClick={() => setActiveTab('time')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'time'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Available Now
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'packages'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Packages
        </button>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations
          .filter((rec) => {
            if (activeTab === 'time') {
              return TIME_BASED_SERVICES[getTimeOfDay()]?.some((r) => r.id === rec.id);
            }
            if (activeTab === 'packages') {
              return UPSELL_SERVICES.some((r) => r.id === rec.id);
            }
            return true;
          })
          .slice(0, 6)
          .map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleServiceClick(rec)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{rec.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-gray-900 truncate">{rec.title}</h4>
                    {rec.price && (
                      <span className="text-sm font-medium text-indigo-600 whitespace-nowrap">
                        Rs. {rec.price}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{rec.description}</p>
                  {rec.reason && (
                    <p className="text-xs text-gray-400 mt-2 italic">{rec.reason}</p>
                  )}
                  {rec.timeSlot && (
                    <p className="text-xs text-indigo-500 mt-1">Available: {rec.timeSlot}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        rec.priority === 'high'
                          ? 'bg-red-100 text-red-600'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(rec.id);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* View All Link */}
      <div className="text-center pt-2">
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
          View All Services
        </button>
      </div>
    </div>
  );
}

// ── Export utility functions for use elsewhere ──────────────────────────────────

export { getTimeOfDay, getStayDurationCategory, getTotalNights };
