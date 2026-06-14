/**
 * Traveler Social Types
 * Community reviews, tips, and itinerary sharing
 */

export interface User {
  id: string;
  name: string;
  avatar?: string;
  badge?: string;
  trips: number;
  helpful: number;
  joinedAt: string;
}

export interface Review {
  id: string;
  type: 'airline' | 'lounge' | 'airport' | 'hotel' | 'restaurant' | 'destination';
  entityId: string;
  entityName: string;
  entityLocation?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;  // 1-5
  title: string;
  content: string;
  photos?: string[];
  tags?: string[];
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt?: string;
  verified?: boolean;  // Verified stay/visit
}

export interface ReviewRequest {
  type: Review['type'];
  entityId: string;
  entityName: string;
  entityLocation?: string;
  rating: number;
  title: string;
  content: string;
  photos?: string[];
  tags?: string[];
}

export interface ItineraryShare {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description?: string;
  destination: string;
  duration: number;  // days
  budget?: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'monsoon' | 'any';
  type: 'solo' | 'couple' | 'family' | 'friends' | 'business';
  days: ItineraryDay[];
  likes: number;
  views: number;
  saved: number;
  comments: number;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  activities: ItineraryActivity[];
}

export interface ItineraryActivity {
  time?: string;
  title: string;
  description?: string;
  location?: string;
  duration?: string;
  cost?: string;
  tips?: string;
  type: 'flight' | 'hotel' | 'sightseeing' | 'restaurant' | 'shopping' | 'transport' | 'other';
}

export interface Tip {
  id: string;
  userId: string;
  userName: string;
  category: 'visa' | 'packing' | 'budget' | 'safety' | 'food' | 'transport' | 'general';
  destination: string;
  title: string;
  content: string;
  helpful: number;
  tags?: string[];
  createdAt: string;
}

export interface Comment {
  id: string;
  targetType: 'review' | 'itinerary' | 'tip';
  targetId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface DestinationGuide {
  id: string;
  name: string;
  country: string;
  imageUrl?: string;
  summary: string;
  sections: {
    about: string;
    bestTime: string;
    gettingThere: string;
    visa: string;
    currency: string;
    language: string;
    safety: string;
    tips: string[];
  };
  contributors: number;
  helpful: number;
  updatedAt: string;
}

// Popular tags
export const REVIEW_TAGS = [
  'Clean',
  'Comfortable',
  'Friendly staff',
  'Good food',
  'Value for money',
  'On time',
  'Spacious',
  'Noisy',
  'Slow service',
  'Great view',
  'Convenient',
  'Crowded',
];

export const DESTINATIONS = [
  'Thailand',
  'UAE',
  'Singapore',
  'Malaysia',
  'Indonesia',
  'Japan',
  'South Korea',
  'Australia',
  'New Zealand',
  'United Kingdom',
  'France',
  'Germany',
  'Italy',
  'Spain',
  'United States',
  'Canada',
  'Maldives',
  'Sri Lanka',
  'Nepal',
  'Bhutan',
];
