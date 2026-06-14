'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { RoomHubServerData } from './page';
import { HotelRoomChatWidget } from '@/components/chat/HotelRoomChatWidget';
import { logger } from '@/lib/utils/logger';
import {
  LANGUAGE_CONFIG,
  type SupportedLanguage,
  type VoiceCommandResult,
  type MinibarItem,
  type MinibarConsumption,
  type CheckoutBill,
  type GuestFeedback,
  type RoomPreference,
  HOUSEKEEPING_EXTRAS,
} from '@/lib/api/room-qr-service';

// ─── Browser API Types ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = unknown;

// ─── Types ──────────────────────────────────────────────────────────────────────

type ServiceType =
  | 'housekeeping'
  | 'room_service'
  | 'laundry'
  | 'transport'
  | 'spa'
  | 'maintenance'
  | 'concierge'
  | 'fitness'
  | 'late_checkout'
  | 'early_checkin'
  | 'minibar'
  | 'express_checkout'
  | 'turndown'
  | 'amenity';

type TabId = 'services' | 'orders' | 'chat' | 'checkout' | 'preferences' | 'feedback';

interface CartItem {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
}

interface RoomServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
}

interface RoomServiceRequest {
  id: string;
  serviceType: string;
  description?: string;
  status: string;
  priority?: string;
  createdAt: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  totalAmountPaise?: number;
}

interface ChatMessage {
  id: string;
  senderType: 'guest' | 'staff' | 'system';
  senderName: string;
  content: string;
  createdAt: string;
}

interface ChatThread {
  id: string;
  status: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES: Array<{
  id: ServiceType;
  label: string;
  icon: string;
  color: string;
  bg: string;
}> = [
  { id: 'housekeeping', label: 'Housekeeping', icon: 'sparkles', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'room_service', label: 'Room Service', icon: 'restaurant', color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt', color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'maintenance', label: 'Maintenance', icon: 'wrench', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'spa', label: 'Spa & Wellness', icon: 'flower', color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'transport', label: 'Transport', icon: 'car', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'concierge', label: 'Concierge', icon: 'user', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'fitness', label: 'Fitness', icon: 'barbell', color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'late_checkout', label: 'Late Checkout', icon: 'clock', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'minibar', label: 'Minibar', icon: 'glass', color: 'text-teal-600', bg: 'bg-teal-50' },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  assigned: { color: 'bg-cyan-100 text-cyan-700', label: 'Assigned' },
  in_progress: { color: 'bg-orange-100 text-orange-700', label: 'In Progress' },
  completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
};

const FEEDBACK_CATEGORIES = [
  { id: 'cleanliness', label: 'Cleanliness' },
  { id: 'service', label: 'Service' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'food', label: 'Food Quality' },
];

const IMPROVEMENT_OPTIONS = [
  'Faster service',
  'Better WiFi',
  'More pillow options',
  'Quieter environment',
  'Better bathroom amenities',
  'Clearer instructions',
  'More food variety',
  'Better temperature control',
];

// ─── Translation Helper ─────────────────────────────────────────────────────────

const TRANSLATIONS: Partial<Record<SupportedLanguage, Record<string, string>>> = {
  en: {
    welcome: 'Welcome',
    room: 'Room',
    services: 'Services',
    orders: 'My Requests',
    chat: 'Chat',
    checkout: 'Checkout',
    preferences: 'Preferences',
    feedback: 'Feedback',
    specialRequest: 'Special request',
    placeOrder: 'Place Order',
    requestSent: 'Request submitted!',
    language: 'Language',
    selectLanguage: 'Select Language',
    voiceCommand: 'Voice Command',
    tapToSpeak: 'Tap to speak',
    listening: 'Listening...',
    lateCheckout: 'Late Checkout',
    earlyCheckin: 'Early Check-in',
    checkoutTime: 'Checkout Time',
    checkinTime: 'Check-in Time',
    reason: 'Reason',
    optional: 'optional',
    submit: 'Submit',
    minibar: 'Minibar',
    addToMinibar: 'Add to Minibar',
    currentBill: 'Current Bill',
    expressCheckout: 'Express Checkout',
    viewBill: 'View Bill',
    payNow: 'Pay Now',
    extraTowels: 'Extra Towels',
    extraPillows: 'Extra Pillows',
    freshBedding: 'Fresh Bedding',
    toiletries: 'Toiletries',
    rateYourStay: 'Rate Your Stay',
    overallRating: 'Overall Rating',
    submitFeedback: 'Submit Feedback',
    thankYouFeedback: 'Thank you for your feedback!',
    savePreferences: 'Save Preferences',
    preferencesSaved: 'Preferences saved!',
    housekeepingExtras: 'Housekeeping Extras',
    scheduledService: 'Schedule for later',
    priorityService: 'Priority',
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },
  hi: {
    welcome: 'स्वागत है',
    room: 'कमरा',
    services: 'सेवाएं',
    orders: 'मेरे अनुरोध',
    chat: 'चैट',
    checkout: 'चेकआउट',
    preferences: 'प्राथमिकताएं',
    feedback: 'प्रतिक्रिया',
    specialRequest: 'विशेष अनुरोध',
    placeOrder: 'ऑर्डर दें',
    requestSent: 'अनुरोध भेजा गया!',
    language: 'भाषा',
    selectLanguage: 'भाषा चुनें',
    voiceCommand: 'आवाज़ कमांड',
    tapToSpeak: 'बोलने के लिए टैप करें',
    listening: 'सुन रहे हैं...',
    lateCheckout: 'देरी से चेकआउट',
    earlyCheckin: 'जल्दी चेक-इन',
    checkoutTime: 'चेकआउट समय',
    checkinTime: 'चेक-इन समय',
    reason: 'कारण',
    optional: 'वैकल्पिक',
    submit: 'जमा करें',
    minibar: 'मिनीबार',
    addToMinibar: 'मिनीबार में जोड़ें',
    currentBill: 'वर्तमान बिल',
    expressCheckout: 'एक्सप्रेस चेकआउट',
    viewBill: 'बिल देखें',
    payNow: 'अभी भुगतान करें',
    extraTowels: 'अतिरिक्त तौलिए',
    extraPillows: 'अतिरिक्त तकिये',
    freshBedding: 'ताज़ा बिस्तर',
    toiletries: 'टॉयलेटरीज़',
    rateYourStay: 'अपनी रहने की समीक्षा करें',
    overallRating: 'कुल रेटिंग',
    submitFeedback: 'प्रतिक्रिया जमा करें',
    thankYouFeedback: 'आपकी प्रतिक्रिया के लिए धन्यवाद!',
    savePreferences: 'प्राथमिकताएं सहेजें',
    preferencesSaved: 'प्राथमिकताएं सहेजी गईं!',
    housekeepingExtras: 'हाउसकीपिंग एक्सट्रा',
    scheduledService: 'बाद के लिए शेड्यूल करें',
    priorityService: 'प्राथमिकता',
    urgent: 'तत्काल',
    high: 'उच्च',
    medium: 'मध्यम',
    low: 'कम',
  },
};

// ─── Utility Functions ──────────────────────────────────────────────────────────

function formatPrice(paise: number) {
  if (paise === 0) return 'Free';
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

// ─── Icon Component ────────────────────────────────────────────────────────────

function Icon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactElement> = {
    sparkles: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
        <path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" />
        <path d="M19 17L19.5 19L21 19.5L19.5 20L19 22L18.5 20L17 19.5L18.5 19L19 17Z" />
      </svg>
    ),
    restaurant: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
      </svg>
    ),
    shirt: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
      </svg>
    ),
    wrench: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    flower: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2a3 3 0 00-3 3c0 1.5 1 2.5 3 3s3 1.5 3 3-1 2.5-3 3-3 1.5-3 3a3 3 0 006 0" />
      </svg>
    ),
    car: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0zM3 9l2-4h14l2 4M5 17H3v-5l1-2m14 7h2l1-2-1-5v5" />
      </svg>
    ),
    user: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
    barbell: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11M6.5 17.5h11M3 9h3m-3 6h3M18 9h3m-3 6h3M6 9h.01M6 15h.01M18 9h.01M18 15h.01" />
      </svg>
    ),
    clock: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    glass: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2h8l-1 7h4l-5 9v4h2v-4H8l-2-9h4L8 2z" />
      </svg>
    ),
    send: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
      </svg>
    ),
    plus: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    minus: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <path d="M5 12h14" />
      </svg>
    ),
    close: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
    chat: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    list: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
    grid: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    arrow: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    ),
    cart: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
    ),
    check: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    mic: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
      </svg>
    ),
    star: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    starOutline: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    checkout: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </svg>
    ),
    settings: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    globe: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
    feedback: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <path d="M8 10h8M8 14h4" />
      </svg>
    ),
  };
  return icons[name] ?? <span className={className}>·</span>;
}

// ─── Rating Component ───────────────────────────────────────────────────────────

function StarRating({ value, onChange, readonly = false }: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`p-0.5 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          disabled={readonly}
        >
          <Icon
            name={star <= value ? 'star' : 'starOutline'}
            className={`w-6 h-6 ${star <= value ? 'text-amber-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Language Selector ─────────────────────────────────────────────────────────

const LANGUAGES: Array<{ code: SupportedLanguage; name: string; nativeName: string }> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

// ─── Main Component ────────────────────────────────────────────────────────────

interface Props {
  initialData: RoomHubServerData;
  hotelSlug: string;
  roomId: string;
  roomToken: string;
}

export default function RoomHubPageClient({ initialData, hotelSlug, roomId, roomToken }: Props) {
  const { roomContext, menu, requests: initialRequests } = initialData;

  // UI State
  const [activeTab, setActiveTab] = useState<TabId>('services');
  const [requests, setRequests] = useState<RoomServiceRequest[]>(initialRequests);
  const [selectedCategory, setSelectedCategory] = useState<string>('meals');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [specialRequest, setSpecialRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Language State
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Voice Command State
  const [isListening, setIsListening] = useState(false);
  const [voiceResult, setVoiceResult] = useState<string | null>(null);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);

  // Chat State
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Housekeeping State
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [showHousekeepingModal, setShowHousekeepingModal] = useState(false);
  const [housekeepingPriority, setHousekeepingPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  // Checkout State
  const [checkoutBill, setCheckoutBill] = useState<CheckoutBill | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [lateCheckoutTime, setLateCheckoutTime] = useState('14:00');
  const [earlyCheckinTime, setEarlyCheckinTime] = useState('10:00');
  const [checkoutReason, setCheckoutReason] = useState('');

  // Minibar State
  const [minibarItems, setMinibarItems] = useState<MinibarItem[]>([]);
  const [minibarConsumption, setMinibarConsumption] = useState<MinibarConsumption[]>([]);
  const [minibarBill, setMinibarBill] = useState<{ subtotal: number; tax: number; total: number } | null>(null);

  // Feedback State
  const [feedbackRatings, setFeedbackRatings] = useState<Record<string, number>>({});
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  // Preferences State
  const [preferences, setPreferences] = useState<Record<string, string>>({
    pillow: '',
    temperature: '22',
    lighting: 'medium',
    noise: 'normal',
    wakeup: '',
    dietary: '',
  });
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const t = (key: string) => TRANSLATIONS[language]?.[key] ?? key;

  // Refetch requests from Hotel OTA
  const refreshRequests = useCallback(async () => {
    try {
      const data = await fetch(
        `/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`,
        { headers: { 'x-room-token': roomToken } }
      ).then(r => r.json()).catch(() => null);
      if (data?.data?.requests) {
        setRequests(data.data.requests);
      }
    } catch (err) {
      logger.error('[RoomHub] refreshRequests failed', { error: err, hotelSlug, roomId });
    }
  }, [hotelSlug, roomId, roomToken]);

  // Init chat
  const initChat = useCallback(async () => {
    if (!roomContext?.bookingId) return;
    setChatLoading(true);
    try {
      const res = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-room-token': roomToken },
        body: JSON.stringify({
          action: 'create-thread',
          bookingId: roomContext.bookingId,
          roomId,
          message: undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.data?.threadId) {
        setThread({ id: data.data.threadId, status: 'active' });
        const msgRes = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-room-token': roomToken },
          body: JSON.stringify({ action: 'get-thread', threadId: data.data.threadId }),
        });
        const msgData = await msgRes.json().catch(() => null);
        if (msgData?.data?.messages) {
          setMessages(msgData.data.messages);
        }
      }
    } catch (err) {
      logger.error('[RoomHub] initChat failed', { error: err, hotelSlug, roomId, bookingId: roomContext?.bookingId });
    } finally { setChatLoading(false); }
  }, [roomContext?.bookingId, roomId, hotelSlug, roomToken]);

  useEffect(() => {
    if (activeTab === 'chat') initChat();
  }, [activeTab, initChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Command Handler
  const startVoiceCommand = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceMessage('Voice commands are not supported in your browser');
      return;
    }

    const SpeechRecognition = (window as typeof window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceMessage(null);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceResult(transcript);
      setVoiceMessage(`Processing: "${transcript}"...`);

      // Simulate voice command processing
      const lowerTranscript = transcript.toLowerCase();

      if (lowerTranscript.includes('clean') || lowerTranscript.includes('housekeeping')) {
        handleQuickRequest('housekeeping');
        setVoiceMessage("I've requested housekeeping for your room.");
      } else if (lowerTranscript.includes('towel')) {
        setShowHousekeepingModal(true);
        setVoiceMessage("Opening housekeeping extras...");
      } else if (lowerTranscript.includes('checkout')) {
        handleQuickRequest('late_checkout');
        setVoiceMessage("I've noted your checkout request.");
      } else if (lowerTranscript.includes('wifi') || lowerTranscript.includes('internet')) {
        handleQuickRequest('maintenance');
        setVoiceMessage("I've requested WiFi assistance.");
      } else if (lowerTranscript.includes('food') || lowerTranscript.includes('hungry')) {
        setActiveTab('services');
        setSelectedCategory('meals');
        setVoiceMessage("Opening room service menu.");
      } else if (lowerTranscript.includes('taxi') || lowerTranscript.includes('cab')) {
        handleQuickRequest('transport');
        setVoiceMessage("I'll arrange a taxi for you.");
      } else {
        setVoiceMessage("I couldn't understand that request. Could you please type it?");
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== 'no-speech') {
        setVoiceMessage('Sorry, there was an error. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [language]);

  const addToCart = (item: RoomServiceItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: item.id, name: item.name, price: item.price, category: item.category, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter(i => i.id !== itemId);
    });
  };

  const handleQuickRequest = async (serviceType: ServiceType) => {
    if (!roomContext?.bookingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-room-token': roomToken },
        body: JSON.stringify({
          action: 'create-request',
          bookingId: roomContext.bookingId,
          roomId,
          serviceType,
          description: `${serviceType.replace('_', ' ')} request via Room Hub`,
          priority: serviceType === 'late_checkout' || serviceType === 'early_checkin' ? 'high' : 'now',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
        refreshRequests();
      }
    } catch (err) {
      logger.error('[RoomHub] handleQuickRequest failed', { error: err, serviceType, hotelSlug, roomId });
    } finally { setSubmitting(false); }
  };

  const handlePlaceOrder = async () => {
    if (!roomContext?.bookingId || cartItems.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-room-token': roomToken },
        body: JSON.stringify({
          action: 'create-request',
          bookingId: roomContext.bookingId,
          roomId,
          serviceType: 'room_service',
          description: specialRequest || undefined,
          items: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, category: i.category })),
          priority: 'now',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCartItems([]);
        setSpecialRequest('');
        setShowCart(false);
        refreshRequests();
        setActiveTab('orders');
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (err) {
      logger.error('[RoomHub] handlePlaceOrder failed', { error: err, hotelSlug, roomId });
    } finally { setSubmitting(false); }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !thread) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-room-token': roomToken },
        body: JSON.stringify({ action: 'send-message', threadId: thread.id, content }),
      });
      const data = await res.json();
      if (data.data) {
        setMessages(prev => [...prev, data.data]);
      }
    } catch (err) {
      logger.error('[RoomHub] handleSendMessage failed', { error: err, hotelSlug, roomId, threadId: thread?.id });
    } finally { setSendingMessage(false); }
  };

  const handleHousekeepingRequest = async () => {
    if (!roomContext?.bookingId) return;
    setSubmitting(true);
    try {
      const items = Object.entries(selectedExtras)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ id, name: HOUSEKEEPING_EXTRAS[id]?.name || id, quantity: qty }));

      const res = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-room-token': roomToken },
        body: JSON.stringify({
          action: 'create-request',
          bookingId: roomContext.bookingId,
          roomId,
          serviceType: 'housekeeping',
          description: `Housekeeping extras: ${items.map(i => `${i.quantity}x ${i.name}`).join(', ')}${specialRequest ? `. Notes: ${specialRequest}` : ''}`,
          items,
          priority: housekeepingPriority,
          scheduledFor: scheduledTime || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowHousekeepingModal(false);
        setSelectedExtras({});
        setSpecialRequest('');
        refreshRequests();
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (err) {
      logger.error('[RoomHub] handleHousekeepingRequest failed', { error: err, hotelSlug, roomId });
    } finally { setSubmitting(false); }
  };

  const handleLateCheckout = async () => {
    if (!roomContext?.bookingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-room-token': roomToken },
        body: JSON.stringify({
          action: 'create-request',
          bookingId: roomContext.bookingId,
          roomId,
          serviceType: 'late_checkout',
          description: `Late checkout requested until ${lateCheckoutTime}${checkoutReason ? `. Reason: ${checkoutReason}` : ''}`,
          priority: lateCheckoutTime === '16:00' ? 'high' : 'medium',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCheckoutModal(false);
        refreshRequests();
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (err) {
      logger.error('[RoomHub] handleLateCheckout failed', { error: err, hotelSlug, roomId });
    } finally { setSubmitting(false); }
  };

  const handleFeedbackSubmit = async () => {
    if (!roomContext?.bookingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-room-token': roomToken },
        body: JSON.stringify({
          action: 'submit-feedback',
          bookingId: roomContext.bookingId,
          roomId,
          feedbackType: 'in_stay',
          ratings: feedbackRatings,
          comment: feedbackComment,
          improvements: selectedImprovements,
          wouldRecommend,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSubmitted(true);
        setTimeout(() => setFeedbackSubmitted(false), 5000);
      }
    } catch (err) {
      logger.error('[RoomHub] handleFeedbackSubmit failed', { error: err, hotelSlug, roomId });
    } finally { setSubmitting(false); }
  };

  const handleSavePreferences = async () => {
    if (!roomContext?.bookingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-room-token': roomToken },
        body: JSON.stringify({
          action: 'save-preferences',
          bookingId: roomContext.bookingId,
          roomId,
          preferences,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreferencesSaved(true);
        setTimeout(() => setPreferencesSaved(false), 3000);
      }
    } catch (err) {
      logger.error('[RoomHub] handleSavePreferences failed', { error: err, hotelSlug, roomId });
    } finally { setSubmitting(false); }
  };

  const getMenuItems = () => {
    if (!menu) return [];
    return (menu as Record<string, RoomServiceItem[]>)[selectedCategory] ?? [];
  };

  if (!roomContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Room access required</h1>
          <p className="text-sm text-gray-500 mt-1">Please scan the QR code on your room door.</p>
          <Link href={`/${hotelSlug}`} className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            Back to hotel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/${hotelSlug}`} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <Icon name="arrow" className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight">{roomContext.roomTypeName ?? 'Room Service'}</h1>
            <p className="text-xs text-indigo-200 flex items-center gap-1">
              <span>{roomContext.hotelName}</span>
              <span>·</span>
              <span>{t('room')} {roomContext.roomNumber}</span>
            </p>
          </div>

          {/* Language Selector */}
          <button
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={t('selectLanguage')}
          >
            <Icon name="globe" className="w-5 h-5" />
          </button>

          {/* Voice Command Button */}
          <button
            onClick={startVoiceCommand}
            disabled={isListening}
            className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'hover:bg-white/10'}`}
            aria-label={t('voiceCommand')}
          >
            <Icon name="mic" className="w-5 h-5" />
          </button>

          {/* Cart */}
          {cartCount > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Icon name="cart" className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            </button>
          )}
        </div>

        {/* Voice Result */}
        {voiceMessage && (
          <div className="mt-2 bg-white/10 rounded-lg px-3 py-2 text-sm">
            {voiceMessage}
          </div>
        )}
      </div>

      {/* Language Selector Dropdown */}
      {showLanguageSelector && (
        <div className="absolute right-0 top-20 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[200px]">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setShowLanguageSelector(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 ${language === lang.code ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}`}
            >
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-gray-400 ml-2 text-xs">{lang.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex overflow-x-auto">
        {([
          { id: 'services', label: t('services'), icon: 'grid' },
          { id: 'orders', label: t('orders'), icon: 'list' },
          { id: 'chat', label: t('chat'), icon: 'chat' },
          { id: 'checkout', label: t('checkout'), icon: 'checkout' },
          { id: 'preferences', label: t('preferences'), icon: 'settings' },
          { id: 'feedback', label: t('feedback'), icon: 'feedback' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-3 px-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon name={tab.icon} className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-24">
        {/* Success toast */}
        {submitSuccess && (
          <div className="mx-4 mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm font-medium">
            <Icon name="check" className="w-4 h-4 text-green-600" />
            {t('requestSent')}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="p-4 space-y-6">
            {/* Service Grid */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('services')}</h2>
              <div className="grid grid-cols-4 gap-3">
                {SERVICE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (cat.id === 'housekeeping') {
                        setShowHousekeepingModal(true);
                      } else if (cat.id === 'late_checkout') {
                        setShowCheckoutModal(true);
                      } else {
                        handleQuickRequest(cat.id);
                      }
                    }}
                    disabled={submitting}
                    className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center`}>
                      <Icon name={cat.icon} className={`w-5 h-5 ${cat.color}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-800 text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Room Service Menu */}
            {menu && (
              <section>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Order Food & Drinks</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {(['meals', 'snacks', 'beverages', 'housekeeping', 'laundry'] as const).map(cat => {
                    const catDef = SERVICE_CATEGORIES.find(c => c.id === cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                          selectedCategory === cat
                            ? catDef
                              ? `${catDef.bg} ${catDef.color} border-current`
                              : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 space-y-2">
                  {getMenuItems().map(item => {
                    const inCart = cartItems.find(i => i.id === item.id);
                    return (
                      <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                          )}
                          <p className="text-sm font-semibold text-indigo-600 mt-1">{formatPrice(item.price)}</p>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-2 bg-indigo-50 rounded-full px-2 py-1">
                            <button onClick={() => removeFromCart(item.id)} className="p-0.5 text-indigo-600 hover:text-indigo-800">
                              <Icon name="minus" className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-bold text-gray-900 w-4 text-center">{inCart.quantity}</span>
                            <button onClick={() => addToCart(item as RoomServiceItem)} className="p-0.5 text-indigo-600 hover:text-indigo-800">
                              <Icon name="plus" className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item as RoomServiceItem)}
                            className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all"
                          >
                            <Icon name="plus" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {getMenuItems().length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">No items in this category</p>
                  )}
                </div>

                {/* Special request */}
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('specialRequest')}</label>
                  <textarea
                    value={specialRequest}
                    onChange={e => setSpecialRequest(e.target.value)}
                    placeholder="Any special instructions..."
                    rows={2}
                    className="w-full bg-white rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </section>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('orders')}</h2>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon name="list" className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">No requests yet</p>
                <p className="text-xs text-gray-400 mt-1">Use the Services tab to make requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => {
                  const statusConfig = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
                  const catDef = SERVICE_CATEGORIES.find(c => c.id === req.serviceType);
                  return (
                    <div key={req.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${catDef?.bg ?? 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                          <Icon name={catDef?.icon ?? 'user'} className={`w-5 h-5 ${catDef?.color ?? 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 capitalize">
                              {req.serviceType.replace('_', ' ')}
                            </p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          {req.description && (
                            <p className="text-xs text-gray-500 mt-1">{req.description}</p>
                          )}
                          {req.items && req.items.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {req.items.map((item, idx) => (
                                <p key={idx} className="text-xs text-gray-600">
                                  {item.quantity}x {item.name}
                                </p>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">{formatTime(req.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-200px)]">
            {chatLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {messages.length === 0 && !thread && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Icon name="chat" className="w-7 h-7 text-indigo-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Chat with hotel staff</p>
                      <p className="text-xs text-gray-400 mt-1">Start a conversation for unknown assistance</p>
                    </div>
                  )}
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'guest' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          msg.senderType === 'guest'
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : msg.senderType === 'system'
                            ? 'bg-gray-100 text-gray-500 text-xs text-center w-full'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.senderType !== 'guest' && (
                          <p className="text-xs font-medium opacity-60 mb-0.5">{msg.senderName}</p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.senderType === 'guest' ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {thread && (
                  <div className="border-t border-gray-200 bg-white p-3 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={sendingMessage}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
                    >
                      {sendingMessage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon name="send" className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Checkout Tab */}
        {activeTab === 'checkout' && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{t('expressCheckout')}</h2>

            {/* Late Checkout */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">{t('lateCheckout')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t('checkoutTime')}</label>
                  <select
                    value={lateCheckoutTime}
                    onChange={(e) => setLateCheckoutTime(e.target.value)}
                    className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="12:00">12:00 PM (Noon)</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">{t('reason')} ({t('optional')})</label>
                  <input
                    type="text"
                    value={checkoutReason}
                    onChange={(e) => setCheckoutReason(e.target.value)}
                    placeholder="e.g., Late flight"
                    className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleLateCheckout}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {t('submit')} {t('lateCheckout')}
                </button>
              </div>
            </div>

            {/* View Bill */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">{t('viewBill')}</h3>
              <p className="text-sm text-gray-500 mb-3">Review your complete bill including room charges, minibar, restaurant, and other services.</p>
              <button
                onClick={() => {
                  // Fetch and display checkout bill
                  setCheckoutBill({
                    id: 'bill-123',
                    bookingId: roomContext.bookingId,
                    roomId: roomContext.roomId,
                    roomNumber: roomContext.roomNumber,
                    guestName: roomContext.guestName || 'Guest',
                    items: [],
                    charges: [
                      { type: 'room', description: 'Room charges', amount: 500000 },
                      { type: 'minibar', description: 'Minibar', amount: 5000 },
                      { type: 'tax', description: 'Taxes (18%)', amount: 90900 },
                    ],
                    subtotal: 505000,
                    tax: 90900,
                    total: 595900,
                    paidAmount: 0,
                    pendingAmount: 595900,
                    paymentStatus: 'pending',
                    checkoutTime: new Date().toISOString(),
                    generatedAt: new Date().toISOString(),
                  });
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
              >
                {t('viewBill')}
              </button>
            </div>

            {/* Checkout Bill Display */}
            {checkoutBill && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">{t('currentBill')}</h3>
                <div className="space-y-2 mb-4">
                  {checkoutBill.charges.map((charge, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{charge.description}</span>
                      <span className="font-medium">{formatPrice(charge.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-indigo-600">{formatPrice(checkoutBill.total)}</span>
                  </div>
                </div>
                <button className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700">
                  {t('payNow')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{t('preferences')}</h2>

            {preferencesSaved && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">
                <Icon name="check" className="w-4 h-4" />
                {t('preferencesSaved')}
              </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
              {/* Temperature */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Room Temperature</label>
                <input
                  type="range"
                  min="18"
                  max="28"
                  value={preferences.temperature}
                  onChange={(e) => setPreferences({ ...preferences, temperature: e.target.value })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Cooler</span>
                  <span className="font-medium">{preferences.temperature}°C</span>
                  <span>Warmer</span>
                </div>
              </div>

              {/* Lighting */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Lighting Preference</label>
                <div className="flex gap-2">
                  {['dim', 'medium', 'bright'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setPreferences({ ...preferences, lighting: level })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${
                        preferences.lighting === level
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Noise */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Noise Preference</label>
                <div className="flex gap-2">
                  {['quiet', 'normal', 'no_preference'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setPreferences({ ...preferences, noise: level })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${
                        preferences.noise === level
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {level.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pillow Preference */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Pillow Preference</label>
                <div className="flex gap-2">
                  {['soft', 'firm', 'memory_foam', 'no_preference'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setPreferences({ ...preferences, pillow: type })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize ${
                        preferences.pillow === type
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wake-up Call */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Wake-up Call Time ({t('optional')})</label>
                <input
                  type="time"
                  value={preferences.wakeup}
                  onChange={(e) => setPreferences({ ...preferences, wakeup: e.target.value })}
                  className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Dietary Restrictions */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Dietary Restrictions / Allergies ({t('optional')})</label>
                <textarea
                  value={preferences.dietary}
                  onChange={(e) => setPreferences({ ...preferences, dietary: e.target.value })}
                  placeholder="e.g., Vegetarian, Nut allergy..."
                  rows={2}
                  className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                onClick={handleSavePreferences}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('savePreferences')}
              </button>
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{t('rateYourStay')}</h2>

            {feedbackSubmitted && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">
                <Icon name="check" className="w-4 h-4" />
                {t('thankYouFeedback')}
              </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
              {/* Overall Rating */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{t('overallRating')}</label>
                <StarRating
                  value={feedbackRatings.overall || 0}
                  onChange={(v) => setFeedbackRatings({ ...feedbackRatings, overall: v })}
                />
              </div>

              {/* Category Ratings */}
              {FEEDBACK_CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{cat.label}</span>
                  <StarRating
                    value={feedbackRatings[cat.id] || 0}
                    onChange={(v) => setFeedbackRatings({ ...feedbackRatings, [cat.id]: v })}
                  />
                </div>
              ))}

              {/* Would Recommend */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Would you recommend us?</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWouldRecommend(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      wouldRecommend === true
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setWouldRecommend(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      wouldRecommend === false
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* What could improve */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">What could we improve?</label>
                <div className="flex flex-wrap gap-2">
                  {IMPROVEMENT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedImprovements((prev) =>
                          prev.includes(option)
                            ? prev.filter((o) => o !== option)
                            : [...prev, option]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        selectedImprovements.includes(option)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Additional Comments ({t('optional')})</label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  rows={3}
                  className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                onClick={handleFeedbackSubmit}
                disabled={submitting || !feedbackRatings.overall}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('submitFeedback')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white w-full rounded-t-3xl p-5 max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            {cartItems.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-3">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.quantity}x {item.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between py-4 border-t border-gray-200 mt-3">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-extrabold text-indigo-600">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Icon name="check" className="w-4 h-4" />
                      {t('placeOrder')} · {formatPrice(cartTotal)}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Housekeeping Modal */}
      {showHousekeepingModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHousekeepingModal(false)} />
          <div className="relative bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{t('housekeepingExtras')}</h2>
              <button onClick={() => setShowHousekeepingModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            {/* Priority */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">{t('priorityService')}</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setHousekeepingPriority(priority)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${
                      housekeepingPriority === priority
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t(priority)}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">{t('scheduledService')} ({t('optional')})</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Extras Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.entries(HOUSEKEEPING_EXTRAS).map(([id, extra]) => (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedExtras((prev) => ({
                      ...prev,
                      [id]: (prev[id] || 0) + 1,
                    }));
                  }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{id.includes('towel') ? '🛁' : id.includes('pillow') ? '🛏️' : id.includes('toiletries') ? '🧴' : '✨'}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{extra.name}</p>
                    <p className="text-xs text-gray-500">{formatPrice(extra.price)}</p>
                  </div>
                  {selectedExtras[id] > 0 && (
                    <span className="bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {selectedExtras[id]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Selected items summary */}
            {Object.keys(selectedExtras).length > 0 && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-xl">
                <p className="text-sm font-medium text-indigo-700 mb-2">Selected:</p>
                {Object.entries(selectedExtras)
                  .filter(([_, qty]) => qty > 0)
                  .map(([id, qty]) => (
                    <p key={id} className="text-sm text-indigo-600">
                      {qty}x {HOUSEKEEPING_EXTRAS[id]?.name || id}
                    </p>
                  ))}
              </div>
            )}

            {/* Special instructions */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">{t('specialRequest')}</label>
              <textarea
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="Any special instructions..."
                rows={2}
                className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={handleHousekeepingRequest}
              disabled={submitting || Object.keys(selectedExtras).length === 0}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                t('submit')
              )}
            </button>
          </div>
        </div>
      )}

      {/* AI Chat Widget */}
      {roomContext && (
        <HotelRoomChatWidget
          hotelId={roomContext.hotelId}
          roomId={roomContext.roomId}
          guestName={roomContext.guestName || 'Guest'}
          guestId={roomContext.bookingId}
        />
      )}
    </div>
  );
}
