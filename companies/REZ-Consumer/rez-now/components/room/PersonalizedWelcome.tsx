'use client';

import React, { useState, useEffect, useMemo } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface GuestProfile {
  firstName: string;
  lastName?: string;
  isReturningGuest: boolean;
  stayCount: number;
  lastStayDate?: string;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  stayPurpose?: 'business' | 'pleasure' | 'mixed';
  preferences?: {
    favoriteAmenity?: string;
    dietaryRestrictions?: string[];
  };
}

interface PreviousStay {
  checkIn: string;
  checkOut: string;
  roomType: string;
  servicesUsed: string[];
  feedback?: {
    rating: number;
    comment?: string;
  };
}

interface HotelAmenities {
  pool: boolean;
  spa: boolean;
  gym: boolean;
  restaurant: boolean;
  bar: boolean;
  businessCenter: boolean;
  concierge: boolean;
  airportTransfer: boolean;
}

interface PersonalizedWelcomeProps {
  guestProfile: GuestProfile;
  bookingId: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  hotelAmenities: HotelAmenities;
  previousStays?: PreviousStay[];
  onDismiss?: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const GREETINGS = {
  morning: { en: 'Good morning', hi: 'सुप्रभात', greeting: '🌅' },
  afternoon: { en: 'Good afternoon', hi: 'नमस्ते', greeting: '☀️' },
  evening: { en: 'Good evening', hi: 'शुभ संध्या', greeting: '🌆' },
  night: { en: 'Good night', hi: 'शुभ रात्रि', greeting: '🌙' },
};

const STAY_PURPOSE_MESSAGES = {
  business: {
    title: 'Business Travel',
    message: 'We have your workspace ready - high-speed WiFi, business center access, and early breakfast options.',
    icon: '💼',
  },
  pleasure: {
    title: 'Relaxation Getaway',
    message: 'Unwind with our spa services, pool access, and city tour arrangements. You deserve this break!',
    icon: '🌴',
  },
  mixed: {
    title: 'Work & Leisure',
    message: 'The best of both worlds - productive workdays and relaxing evenings await you.',
    icon: '⚡',
  },
};

const LOYALTY_PERKS = {
  bronze: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', emoji: '🥉' },
  silver: { color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-300', emoji: '🥈' },
  gold: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300', emoji: '🥇' },
  platinum: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300', emoji: '💎' },
};

// ─── Utility Functions ──────────────────────────────────────────────────────────

function getTimeOfDay(): keyof typeof GREETINGS {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getWeatherMessage(): string {
  // In production, this would be fetched from a weather API based on location
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'Perfect morning for a fresh start!';
  if (hour >= 12 && hour < 17) return 'Enjoy your afternoon with our cool refreshments.';
  if (hour >= 17 && hour < 21) return 'Beautiful evening - perfect for rooftop dining.';
  return 'Rest well and recharge for tomorrow.';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatStayDuration(checkIn: string, checkOut: string): string {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  if (nights === 1) return '1 night';
  return `${nights} nights`;
}

// ─── Components ────────────────────────────────────────────────────────────────

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactElement> = {
    star: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    heart: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    sparkles: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
        <path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" />
        <path d="M19 17L19.5 19L21 19.5L19.5 20L19 22L18.5 20L17 19.5L18.5 19L19 17Z" />
      </svg>
    ),
    close: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
    chevronDown: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" />
      </svg>
    ),
    wifi: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
      </svg>
    ),
    pool: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12h20M2 18h20M2 6h20M6 6v12M12 6v12M18 6v12" />
      </svg>
    ),
    spa: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22c-4-3-8-6-8-11a8 8 0 1116 0c0 5-4 8-8 11z" />
        <circle cx="12" cy="11" r="3" />
      </svg>
    ),
    gym: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6.5 6.5h11M6.5 17.5h11M3 9h3m-3 6h3M18 9h3m-3 6h3M6 9h.01M6 15h.01M18 9h.01M18 15h.01" />
      </svg>
    ),
    restaurant: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
      </svg>
    ),
    car: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 17a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0zM3 9l2-4h14l2 4M5 17H3v-5l1-2m14 7h2l1-2-1-5v5" />
      </svg>
    ),
    check: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  };
  return icons[name] || <span className={className}>•</span>;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PersonalizedWelcome({
  guestProfile,
  bookingId,
  roomNumber,
  checkIn,
  checkOut,
  hotelAmenities,
  previousStays = [],
  onDismiss,
}: PersonalizedWelcomeProps) {
  const [expanded, setExpanded] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const timeOfDay = getTimeOfDay();
  const greeting = GREETINGS[timeOfDay];
  const loyaltyPerks = LOYALTY_PERKS[guestProfile.loyaltyTier || 'bronze'];

  const stayPurposeInfo = useMemo(() => {
    const purpose = guestProfile.stayPurpose || 'mixed';
    return STAY_PURPOSE_MESSAGES[purpose];
  }, [guestProfile.stayPurpose]);

  const weatherMessage = useMemo(() => getWeatherMessage(), []);

  const availableAmenities = useMemo(() => {
    const amenities = [];
    if (hotelAmenities.pool) amenities.push({ name: 'Pool', icon: 'pool' });
    if (hotelAmenities.spa) amenities.push({ name: 'Spa', icon: 'spa' });
    if (hotelAmenities.gym) amenities.push({ name: 'Gym', icon: 'gym' });
    if (hotelAmenities.restaurant) amenities.push({ name: 'Restaurant', icon: 'restaurant' });
    if (hotelAmenities.airportTransfer) amenities.push({ name: 'Airport Transfer', icon: 'car' });
    return amenities;
  }, [hotelAmenities]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-2xl shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">{greeting.greeting}</span>
            </div>
            <div className="text-left">
              <p className="font-semibold">{greeting.en}, {guestProfile.firstName}!</p>
              <p className="text-sm text-white/80">Room {roomNumber} · Tap to expand</p>
            </div>
          </div>
          <Icon name="chevronDown" className="w-5 h-5 rotate-180" />
        </div>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header Section */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Time-based greeting */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{greeting.greeting}</span>
            </div>

            {/* Guest name */}
            <h1 className="text-2xl font-bold mb-1">
              {guestProfile.firstName}
              {guestProfile.lastName && ` ${guestProfile.lastName}`}
              <span className="text-white/80">!</span>
            </h1>

            {/* Room info */}
            <p className="text-white/90 text-sm">
              Room <span className="font-semibold">{roomNumber}</span>
              <span className="mx-2">·</span>
              {formatStayDuration(checkIn, checkOut)}
              <span className="mx-2">·</span>
              {formatDate(checkIn)} - {formatDate(checkOut)}
            </p>
          </div>

          {/* Collapse button */}
          <button
            onClick={() => setExpanded(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Collapse welcome banner"
          >
            <Icon name="chevronDown" className="w-5 h-5" />
          </button>
        </div>

        {/* Weather message */}
        <div className="mt-4 bg-white/10 rounded-xl px-4 py-2 text-sm">
          {weatherMessage}
        </div>

        {/* Stay purpose card */}
        <div className="mt-4 bg-white/10 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{stayPurposeInfo.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold">{stayPurposeInfo.title}</h3>
              <p className="text-sm text-white/80 mt-1">{stayPurposeInfo.message}</p>
            </div>
          </div>
        </div>

        {/* Loyalty badge (if returning guest) */}
        {guestProfile.isReturningGuest && guestProfile.loyaltyTier && (
          <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full ${loyaltyPerks.bg} ${loyaltyPerks.color}`}>
            <span>{loyaltyPerks.emoji}</span>
            <span className="font-medium capitalize">{guestProfile.loyaltyTier} Member</span>
            {guestProfile.stayCount > 0 && (
              <span className="text-xs opacity-75">· {guestProfile.stayCount} stays</span>
            )}
          </div>
        )}

        {/* Returning guest welcome back message */}
        {guestProfile.isReturningGuest && previousStays.length > 0 && (
          <div className="mt-4 bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="heart" className="w-5 h-5 text-red-400" />
              <span className="font-medium">Welcome back!</span>
            </div>
            <p className="text-sm text-white/80">
              Your last stay was {guestProfile.lastStayDate
                ? `on ${formatDate(guestProfile.lastStayDate)}`
                : 'recently'}. We have noted your preferences.
            </p>
            {previousStays[0]?.feedback && (
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="star"
                    className={`w-4 h-4 ${star <= (previousStays[0]?.feedback?.rating || 5) ? 'text-yellow-400' : 'text-white/30'}`}
                  />
                ))}
                <span className="text-xs text-white/70 ml-2">Your previous rating</span>
              </div>
            )}
          </div>
        )}

        {/* Amenities highlight */}
        {availableAmenities.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-white/80 mb-2">Hotel Highlights</h4>
            <div className="flex flex-wrap gap-2">
              {availableAmenities.slice(0, 4).map((amenity) => (
                <div
                  key={amenity.name}
                  className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 text-sm"
                >
                  <Icon name={amenity.icon} className="w-4 h-4" />
                  <span>{amenity.name}</span>
                </div>
              ))}
              {availableAmenities.length > 4 && (
                <div className="bg-white/15 rounded-full px-3 py-1.5 text-sm">
                  +{availableAmenities.length - 4} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick preferences toggle */}
        {guestProfile.preferences && (
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="mt-4 w-full flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Icon name="sparkles" className="w-5 h-5" />
              <span className="font-medium">Your Preferences</span>
            </div>
            <Icon
              name="chevronDown"
              className={`w-5 h-5 transition-transform ${showPreferences ? 'rotate-180' : ''}`}
            />
          </button>
        )}

        {/* Preferences details */}
        {showPreferences && guestProfile.preferences && (
          <div className="mt-3 bg-white/10 rounded-xl p-4 space-y-3">
            {guestProfile.preferences.favoriteAmenity && (
              <div className="flex items-center gap-2 text-sm">
                <Icon name="heart" className="w-4 h-4 text-red-400" />
                <span>Favorite: {guestProfile.preferences.favoriteAmenity}</span>
              </div>
            )}
            {guestProfile.preferences.dietaryRestrictions &&
              guestProfile.preferences.dietaryRestrictions.length > 0 && (
                <div className="text-sm">
                  <span className="text-white/70">Dietary: </span>
                  <span>{guestProfile.preferences.dietaryRestrictions.join(', ')}</span>
                </div>
              )}
            {previousStays[0]?.servicesUsed && previousStays[0].servicesUsed.length > 0 && (
              <div className="text-sm">
                <span className="text-white/70">Previously enjoyed: </span>
                <span>{previousStays[0].servicesUsed.slice(0, 3).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with dismiss */}
      <div className="bg-black/10 px-5 py-3 flex items-center justify-between">
        <p className="text-xs text-white/60">
          Scan the QR to access all services
        </p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

export default PersonalizedWelcome;
