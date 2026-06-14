/**
 * SHARED VALIDATION SCHEMAS FOR HOTEL ECOSYSTEM
 * Zod schemas for all hotel-related APIs
 *
 * Usage:
 * import { hotelSchemas } from './middleware/validation';
 * const validated = hotelSchemas.searchHotels.parse(req.body);
 */

import { z } from 'zod';

// ============================================
// HOTEL SCHEMAS
// ============================================

export const hotelSchemas = {
  // Hotel Search
  searchHotels: z.object({
    city: z.string().min(2).max(100).optional(),
    checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    checkoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    guests: z.number().int().min(1).max(10).default(1),
    rooms: z.number().int().min(1).max(5).default(1),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    amenities: z.array(z.string()).optional(),
    propertyType: z.enum(['hotel', 'resort', 'hostel', 'villa', 'apartment']).optional(),
    rating: z.number().min(1).max(5).optional(),
    sortBy: z.enum(['price', 'rating', 'distance', 'popularity']).default('popularity'),
  }),

  // Create Hotel
  createHotel: z.object({
    name: z.string().min(2).max(200),
    description: z.string().min(10).max(5000),
    address: z.object({
      street: z.string().min(1).max(200),
      city: z.string().min(2).max(100),
      state: z.string().min(2).max(100),
      country: z.string().min(2).max(100).default('India'),
      pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
      coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
    }),
    contact: z.object({
      phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number'),
      email: z.string().email(),
      website: z.string().url().optional(),
    }),
    amenities: z.array(z.string()).min(1),
    images: z.array(z.string().url()).min(1).max(20),
    policies: z.object({
      checkinTime: z.string().regex(/^\d{2}:\d{2}$/),
      checkoutTime: z.string().regex(/^\d{2}:\d{2}$/),
      cancellationPolicy: z.enum(['free', 'partial', 'none']),
      cancellationHours: z.number().int().min(0).optional(),
    }),
    rooms: z.array(z.object({
      name: z.string().min(2).max(100),
      description: z.string().min(10).max(2000),
      maxGuests: z.number().int().min(1).max(10),
      bedType: z.string(),
      size: z.number().optional(),
      view: z.string().optional(),
      inclusions: z.array(z.string()),
      pricePerNight: z.number().min(0),
      amenities: z.array(z.string()),
      images: z.array(z.string().url()),
    })).min(1),
    tier: z.enum(['basic', 'pro', 'premium']).default('basic'),
  }),

  // Update Hotel
  updateHotel: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().min(10).max(5000).optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
    policies: z.object({
      checkinTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      checkoutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      cancellationPolicy: z.enum(['free', 'partial', 'none']).optional(),
      cancellationHours: z.number().int().min(0).optional(),
    }).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
};

// ============================================
// BOOKING SCHEMAS
// ============================================

export const bookingSchemas = {
  // Create Booking
  createBooking: z.object({
    hotelId: z.string().min(1),
    roomId: z.string().min(1),
    checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guests: z.object({
      adults: z.number().int().min(1).max(10),
      children: z.number().int().min(0).max(10).default(0),
    }),
    guestDetails: z.object({
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      email: z.string().email(),
      phone: z.string().regex(/^\+91[6-9]\d{9}$/),
    }),
    specialRequests: z.string().max(500).optional(),
    paymentMethod: z.enum(['wallet', 'card', 'upi', 'netbanking']).default('wallet'),
    promoCode: z.string().optional(),
  }).refine(data => {
    const checkin = new Date(data.checkinDate);
    const checkout = new Date(data.checkoutDate);
    return checkout > checkin;
  }, {
    message: 'Checkout date must be after check-in date',
    path: ['checkoutDate'],
  }),

  // Booking Hold
  holdBooking: z.object({
    hotelId: z.string().min(1),
    roomId: z.string().min(1),
    checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guests: z.object({
      adults: z.number().int().min(1).max(10),
      children: z.number().int().min(0).max(10).default(0),
    }),
  }),

  // Cancel Booking
  cancelBooking: z.object({
    bookingId: z.string().min(1),
    reason: z.string().max(500).optional(),
  }),

  // Modify Booking
  modifyBooking: z.object({
    bookingId: z.string().min(1),
    checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    checkoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    roomId: z.string().min(1).optional(),
  }),
};

// ============================================
// ROOM SCHEMAS
// ============================================

export const roomSchemas = {
  // Add Room
  addRoom: z.object({
    name: z.string().min(2).max(100),
    description: z.string().min(10).max(2000),
    maxGuests: z.number().int().min(1).max(10),
    bedType: z.string(),
    size: z.number().optional(),
    view: z.string().optional(),
    inclusions: z.array(z.string()),
    pricePerNight: z.number().min(0),
    amenities: z.array(z.string()),
    images: z.array(z.string().url()).min(1),
    inventory: z.object({
      totalRooms: z.number().int().min(1),
      availableRooms: z.number().int().min(0),
    }),
  }),

  // Update Room
  updateRoom: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().min(10).max(2000).optional(),
    maxGuests: z.number().int().min(1).max(10).optional(),
    bedType: z.string().optional(),
    size: z.number().optional(),
    view: z.string().optional(),
    inclusions: z.array(z.string()).optional(),
    pricePerNight: z.number().min(0).optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
    inventory: z.object({
      totalRooms: z.number().int().min(1).optional(),
      availableRooms: z.number().int().min(0).optional(),
    }).optional(),
  }),

  // Update Inventory
  updateInventory: z.object({
    roomId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    available: z.number().int().min(0),
    priceOverride: z.number().min(0).optional(),
  }),
};

// ============================================
// MESSAGING SCHEMAS
// ============================================

export const messageSchemas = {
  // Send Message
  sendMessage: z.object({
    conversationId: z.string().optional(),
    recipientId: z.string().min(1),
    recipientType: z.enum(['guest', 'staff', 'hotel']),
    subject: z.string().max(200).optional(),
    content: z.string().min(1).max(5000),
    type: z.enum(['text', 'image', 'document', 'system']).default('text'),
    metadata: z.record(z.unknown()).optional(),
  }),

  // Mark as Read
  markAsRead: z.object({
    messageIds: z.array(z.string()).min(1),
  }),

  // Bulk Send (announcements)
  bulkSend: z.object({
    hotelId: z.string().min(1),
    guestIds: z.array(z.string()).min(1),
    subject: z.string().max(200),
    content: z.string().min(1).max(5000),
    type: z.enum(['announcement', 'promotion', 'reminder']).default('announcement'),
  }),
};

// ============================================
// REVIEW SCHEMAS
// ============================================

export const reviewSchemas = {
  // Submit Review
  submitReview: z.object({
    bookingId: z.string().min(1),
    overallRating: z.number().min(1).max(5),
    categories: z.object({
      cleanliness: z.number().min(1).max(5).optional(),
      service: z.number().min(1).max(5).optional(),
      location: z.number().min(1).max(5).optional(),
      value: z.number().min(1).max(5).optional(),
      amenities: z.number().min(1).max(5).optional(),
    }).optional(),
    title: z.string().min(5).max(200).optional(),
    content: z.string().min(20).max(2000),
    images: z.array(z.string().url()).max(10).optional(),
    stayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    wouldRecommend: z.boolean().optional(),
  }),

  // Hotel Response
  hotelResponse: z.object({
    reviewId: z.string().min(1),
    response: z.string().min(10).max(1000),
  }),

  // Invite Review
  inviteReview: z.object({
    bookingId: z.string().min(1),
    channel: z.enum(['email', 'sms', 'whatsapp', 'in_app']).default('email'),
    templateId: z.string().optional(),
    customMessage: z.string().max(500).optional(),
  }),
};

// ============================================
// MAINTENANCE SCHEMAS
// ============================================

export const maintenanceSchemas = {
  // Report Issue
  reportIssue: z.object({
    hotelId: z.string().min(1),
    roomId: z.string().optional(),
    category: z.enum(['electrical', 'plumbing', 'hvac', 'furniture', 'cleaning', 'safety', 'other']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    title: z.string().min(5).max(200),
    description: z.string().min(10).max(2000),
    images: z.array(z.string().url()).max(5).optional(),
    reporterType: z.enum(['staff', 'guest', 'system']).default('staff'),
    guestId: z.string().optional(),
  }),

  // Update Issue
  updateIssue: z.object({
    issueId: z.string().min(1),
    status: z.enum(['reported', 'assigned', 'in_progress', 'resolved', 'closed']).optional(),
    assignedTo: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    notes: z.string().max(1000).optional(),
    resolution: z.string().max(2000).optional(),
    cost: z.number().min(0).optional(),
  }),

  // Schedule Maintenance
  scheduleMaintenance: z.object({
    hotelId: z.string().min(1),
    roomId: z.string().optional(),
    category: z.enum(['electrical', 'plumbing', 'hvac', 'furniture', 'cleaning', 'preventive']),
    title: z.string().min(5).max(200),
    description: z.string().min(10).max(2000),
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    estimatedDuration: z.number().int().min(15), // minutes
    recurring: z.object({
      enabled: z.boolean(),
      frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).optional(),
    assignedTo: z.string().optional(),
  }),
};

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const paymentSchemas = {
  // Process Payment
  processPayment: z.object({
    bookingId: z.string().min(1),
    amount: z.number().min(0),
    currency: z.string().length(3).default('INR'),
    method: z.enum(['wallet', 'card', 'upi', 'netbanking']),
    cardDetails: z.object({
      number: z.string().regex(/^\d{16}$/),
      expiry: z.string().regex(/^\d{2}\/\d{2}$/),
      cvv: z.string().regex(/^\d{3,4}$/),
      name: z.string().min(1),
    }).optional(),
    upiId: z.string().optional(),
  }),

  // Refund Request
  refundRequest: z.object({
    bookingId: z.string().min(1),
    amount: z.number().min(0).optional(), // If not provided, full refund
    reason: z.string().min(10).max(500),
  }),

  // Webhook Verification
  verifyWebhook: z.object({
    razorpaySignature: z.string().min(1),
    webhookBody: z.string(),
  }),
};

// ============================================
// ANALYTICS SCHEMAS
// ============================================

export const analyticsSchemas = {
  // Dashboard Query
  dashboardQuery: z.object({
    hotelId: z.string().min(1),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
  }),

  // Channel Performance
  channelPerformance: z.object({
    hotelId: z.string().min(1),
    channel: z.enum(['direct', 'stayown', 'booking_com', 'makemytrip', 'goibibo', 'expedia', 'airbnb']),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Express middleware factory
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: any, res: any, next: any) => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const result = schema.safeParse(data);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'query') {
      req.query = result.data;
    }

    next();
  };
}
