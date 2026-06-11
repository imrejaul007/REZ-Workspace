const { z } = require('zod');

// User Schemas
const userRegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional()
});

const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Booking Schemas
const createBookingSchema = z.object({
  type: z.enum(['flight', 'hotel', 'car', 'package', 'activity']),
  destination: z.string().min(1, 'Destination is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }),
  returnDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid return date format'
  }).optional().nullable(),
  passengers: z.number().int().min(1).max(20).default(1),
  total: z.number().min(0, 'Total must be positive'),
  currency: z.string().length(3).default('USD'),
  details: z.object({
    flightNumber: z.string().optional(),
    airline: z.string().optional(),
    hotelName: z.string().optional(),
    roomType: z.string().optional(),
    pickupLocation: z.string().optional(),
    dropoffLocation: z.string().optional()
  }).optional()
});

const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'refunded']).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }).optional(),
  returnDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid return date format'
  }).optional().nullable(),
  total: z.number().min(0).optional(),
  passengers: z.number().int().min(1).max(20).optional()
});

// Destination Schemas
const createDestinationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  country: z.string().min(1, 'Country is required'),
  description: z.string().max(2000).optional(),
  attractions: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    ticketPrice: z.number().min(0).optional(),
    recommendedDuration: z.string().optional(),
    rating: z.number().min(0).max(5).optional()
  })).optional(),
  rating: z.number().min(0).max(5).optional(),
  priceRange: z.enum(['budget', 'moderate', 'luxury', 'ultra-luxury']).optional(),
  estimatedDailyCost: z.number().min(0).optional(),
  bestTimeToVisit: z.array(z.object({
    month: z.string(),
    description: z.string().optional()
  })).optional(),
  image: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  visaRequired: z.boolean().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  currency: z.string().optional()
});

// Itinerary Schemas
const createItinerarySchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  destination: z.string().min(1, 'Destination is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(2000).optional(),
  days: z.array(z.object({
    dayNumber: z.number().int().min(1),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format'
    }),
    title: z.string(),
    activities: z.array(z.object({
      time: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      location: z.string().optional(),
      duration: z.string().optional(),
      cost: z.number().min(0).optional(),
      category: z.string().optional(),
      bookingRequired: z.boolean().optional()
    })).optional(),
    meals: z.object({
      breakfast: z.object({ type: z.string(), description: z.string() }).optional(),
      lunch: z.object({ type: z.string(), description: z.string() }).optional(),
      dinner: z.object({ type: z.string(), description: z.string() }).optional()
    }).optional(),
    accommodation: z.object({
      name: z.string().optional(),
      address: z.string().optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional()
    }).optional(),
    notes: z.string().optional()
  })).min(1, 'At least one day is required'),
  totalCost: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  preferences: z.object({
    travelStyle: z.enum(['budget', 'moderate', 'luxury', 'adventure', 'relaxation', 'cultural']).optional(),
    interests: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    pace: z.enum(['relaxed', 'moderate', 'packed']).optional()
  }).optional()
});

// Review Schemas
const createReviewSchema = z.object({
  destinationId: z.string().min(1, 'Destination ID is required'),
  bookingId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(2000),
  photos: z.array(z.object({
    url: z.string().url(),
    caption: z.string().optional()
  })).optional(),
  categories: z.object({
    overall: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
    location: z.number().min(1).max(5).optional(),
    service: z.number().min(1).max(5).optional(),
    cleanliness: z.number().min(1).max(5).optional(),
    amenities: z.number().min(1).max(5).optional()
  }).optional(),
  pros: z.array(z.string()).max(10).optional(),
  cons: z.array(z.string()).max(10).optional(),
  metadata: z.object({
    visitDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format'
    }).optional(),
    travelType: z.enum(['solo', 'couple', 'family', 'friends', 'business', 'other']).optional(),
    device: z.enum(['web', 'mobile', 'tablet', 'other']).optional()
  }).optional()
});

// AI Agent Schemas
const tripPlanSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date format'
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end date format'
  }),
  travelers: z.number().int().min(1).max(20).default(1),
  budget: z.number().min(0).optional(),
  travelStyle: z.enum(['budget', 'moderate', 'luxury', 'adventure', 'relaxation', 'cultural']).default('moderate'),
  interests: z.array(z.string()).default([]),
  dietaryRestrictions: z.array(z.string()).default([]),
  pace: z.enum(['relaxed', 'moderate', 'packed']).default('moderate')
});

const bookingSearchSchema = z.object({
  type: z.enum(['flight', 'hotel', 'car', 'package', 'activity']),
  destination: z.string().min(1, 'Destination is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }),
  returnDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid return date format'
  }).optional().nullable(),
  passengers: z.number().int().min(1).max(20).default(1),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).optional(),
  preferences: z.object({
    airline: z.string().optional(),
    hotelRating: z.number().min(1).max(5).optional(),
    amenities: z.array(z.string()).optional()
  }).optional()
});

const visaCheckSchema = z.object({
  nationality: z.string().min(1, 'Nationality is required'),
  destination: z.string().min(1, 'Destination is required'),
  travelDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid travel date format'
  }),
  duration: z.number().int().min(1).max(365).default(7),
  purpose: z.enum(['tourism', 'business', 'transit', 'study', 'work']).default('tourism')
});

const airportAssistSchema = z.object({
  flightNumber: z.string().optional(),
  departureDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid departure date format'
  }).optional(),
  airportCode: z.string().min(3).max(4).optional(),
  assistanceType: z.enum(['flight_status', 'terminal_info', 'check_in', 'baggage', 'facilities', 'layover', 'complete']).default('complete'),
  bookingId: z.string().optional()
});

module.exports = {
  userRegisterSchema,
  userLoginSchema,
  createBookingSchema,
  updateBookingSchema,
  createDestinationSchema,
  createItinerarySchema,
  createReviewSchema,
  tripPlanSchema,
  bookingSearchSchema,
  visaCheckSchema,
  airportAssistSchema
};