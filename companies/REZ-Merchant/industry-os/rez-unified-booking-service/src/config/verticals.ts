import { getConfig } from './index';

export interface VerticalConfig {
  name: string;
  bookingService: string;
  icon: string;
  bookingFields: string[];
  requiresPayment: boolean;
  cancellationPolicy: string;
  maxPartySize?: number;
  defaultDuration?: number; // in minutes
  color?: string;
}

export interface VerticalDefinition {
  key: string;
  config: VerticalConfig;
}

export const VERTICAL_CONFIGS: Record<string, VerticalConfig> = {
  restaurant: {
    name: 'Restaurant',
    bookingService: process.env['RESTAURANT_BOOKING_URL'] || 'http://localhost:3001',
    icon: 'restaurant',
    bookingFields: ['date', 'time', 'partySize', 'specialRequests'],
    requiresPayment: false,
    cancellationPolicy: '24h',
    maxPartySize: 20,
    defaultDuration: 90,
    color: '#FF6B6B',
  },
  hotel: {
    name: 'Hotel',
    bookingService: process.env['HOTEL_BOOKING_URL'] || 'http://localhost:4010',
    icon: 'hotel',
    bookingFields: ['checkIn', 'checkOut', 'roomType', 'guests', 'specialRequests'],
    requiresPayment: true,
    cancellationPolicy: '48h',
    maxPartySize: 10,
    defaultDuration: 1440, // 24 hours
    color: '#4ECDC4',
  },
  salon: {
    name: 'Salon',
    bookingService: process.env['SALON_BOOKING_URL'] || 'http://localhost:4009',
    icon: 'salon',
    bookingFields: ['date', 'time', 'serviceIds', 'stylistId'],
    requiresPayment: false,
    cancellationPolicy: '2h',
    maxPartySize: 5,
    defaultDuration: 60,
    color: '#FFE66D',
  },
  spa: {
    name: 'Spa',
    bookingService: process.env['SPA_BOOKING_URL'] || 'http://localhost:4049',
    icon: 'spa',
    bookingFields: ['date', 'time', 'serviceId', 'therapistId'],
    requiresPayment: true,
    cancellationPolicy: '4h',
    maxPartySize: 4,
    defaultDuration: 60,
    color: '#95E1D3',
  },
  gym: {
    name: 'Gym',
    bookingService: process.env['GYM_BOOKING_URL'] || 'http://localhost:4011',
    icon: 'fitness',
    bookingFields: ['classId', 'date', 'time'],
    requiresPayment: false,
    cancellationPolicy: '1h',
    maxPartySize: 30,
    defaultDuration: 60,
    color: '#F38181',
  },
  education: {
    name: 'Education',
    bookingService: process.env['EDUCATION_BOOKING_URL'] || 'http://localhost:4054',
    icon: 'school',
    bookingFields: ['courseId', 'batchId', 'startDate'],
    requiresPayment: true,
    cancellationPolicy: '7d',
    maxPartySize: 50,
    defaultDuration: 120,
    color: '#AA96DA',
  },
  events: {
    name: 'Events',
    bookingService: process.env['EVENTS_BOOKING_URL'] || 'http://localhost:4055',
    icon: 'event',
    bookingFields: ['eventId', 'ticketType', 'quantity', 'guestDetails'],
    requiresPayment: true,
    cancellationPolicy: '24h',
    maxPartySize: 100,
    defaultDuration: 180,
    color: '#FCBAD3',
  },
  automotive: {
    name: 'Automotive',
    bookingService: process.env['AUTOMOTIVE_BOOKING_URL'] || 'http://localhost:4060',
    icon: 'car',
    bookingFields: ['serviceType', 'date', 'time', 'vehicleId'],
    requiresPayment: false,
    cancellationPolicy: '2h',
    maxPartySize: 1,
    defaultDuration: 60,
    color: '#A8D8EA',
  },
  medical: {
    name: 'Medical',
    bookingService: process.env['MEDICAL_BOOKING_URL'] || 'http://localhost:4056',
    icon: 'medical',
    bookingFields: ['date', 'time', 'doctorId', 'serviceType'],
    requiresPayment: false,
    cancellationPolicy: '24h',
    maxPartySize: 1,
    defaultDuration: 30,
    color: '#FFAAA5',
  },
  tours: {
    name: 'Tours',
    bookingService: process.env['TOURS_BOOKING_URL'] || 'http://localhost:4057',
    icon: 'tour',
    bookingFields: ['tourId', 'date', 'participants'],
    requiresPayment: true,
    cancellationPolicy: '48h',
    maxPartySize: 25,
    defaultDuration: 240,
    color: '#DCD6F7',
  },
  rentals: {
    name: 'Rentals',
    bookingService: process.env['RENTALS_BOOKING_URL'] || 'http://localhost:4058',
    icon: 'rental',
    bookingFields: ['itemId', 'startDate', 'endDate'],
    requiresPayment: true,
    cancellationPolicy: '24h',
    maxPartySize: 10,
    defaultDuration: 1440,
    color: '#A1E3F9',
  },
  entertainment: {
    name: 'Entertainment',
    bookingService: process.env['ENTERTAINMENT_BOOKING_URL'] || 'http://localhost:4059',
    icon: 'entertainment',
    bookingFields: ['eventId', 'seats', 'showTime'],
    requiresPayment: true,
    cancellationPolicy: '24h',
    maxPartySize: 10,
    defaultDuration: 120,
    color: '#F9ED69',
  },
  cleaning: {
    name: 'Cleaning',
    bookingService: process.env['CLEANING_BOOKING_URL'] || 'http://localhost:4061',
    icon: 'cleaning',
    bookingFields: ['date', 'time', 'serviceType', 'address'],
    requiresPayment: true,
    cancellationPolicy: '24h',
    maxPartySize: 1,
    defaultDuration: 180,
    color: '#B8F2E6',
  },
  repair: {
    name: 'Repair',
    bookingService: process.env['REPAIR_BOOKING_URL'] || 'http://localhost:4062',
    icon: 'repair',
    bookingFields: ['date', 'serviceType', 'deviceInfo'],
    requiresPayment: false,
    cancellationPolicy: '2h',
    maxPartySize: 1,
    defaultDuration: 60,
    color: '#FFBC42',
  },
  childcare: {
    name: 'Childcare',
    bookingService: process.env['CHILDCARE_BOOKING_URL'] || 'http://localhost:4063',
    icon: 'childcare',
    bookingFields: ['date', 'time', 'duration', 'ageGroup'],
    requiresPayment: true,
    cancellationPolicy: '24h',
    maxPartySize: 5,
    defaultDuration: 240,
    color: '#F9BCDD',
  },
  petcare: {
    name: 'Petcare',
    bookingService: process.env['PETCARE_BOOKING_URL'] || 'http://localhost:4064',
    icon: 'pet',
    bookingFields: ['date', 'serviceType', 'petInfo'],
    requiresPayment: true,
    cancellationPolicy: '12h',
    maxPartySize: 3,
    defaultDuration: 60,
    color: '#BDE0FE',
  },
  legal: {
    name: 'Legal',
    bookingService: process.env['LEGAL_BOOKING_URL'] || 'http://localhost:4065',
    icon: 'legal',
    bookingFields: ['date', 'time', 'consultationType'],
    requiresPayment: true,
    cancellationPolicy: '48h',
    maxPartySize: 5,
    defaultDuration: 60,
    color: '#CDB4DB',
  },
};

export const VERTICAL_LIST = Object.entries(VERTICAL_CONFIGS).map(([key, config]) => ({
  key,
  ...config,
}));

export function getVerticalConfig(vertical: string): VerticalConfig | undefined {
  return VERTICAL_CONFIGS[vertical.toLowerCase()];
}

export function isValidVertical(vertical: string): boolean {
  return vertical.toLowerCase() in VERTICAL_CONFIGS;
}

export function getVerticalServiceUrl(vertical: string): string | undefined {
  const config = getVerticalConfig(vertical);
  return config?.bookingService;
}

export const VERTICAL_COUNT = Object.keys(VERTICAL_CONFIGS).length;

export default VERTICAL_CONFIGS;