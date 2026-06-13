// Property Twin Schemas for validation

export const createPropertyTwinSchema = {
  type: 'object',
  required: ['propertyId', 'propertyName', 'brand', 'location', 'contact', 'configuration'],
  properties: {
    propertyId: { type: 'string', minLength: 1 },
    propertyName: { type: 'string', minLength: 1, maxLength: 200 },
    brand: { type: 'string', minLength: 1, maxLength: 100 },
    chainCode: { type: 'string', maxLength: 20 },
    location: {
      type: 'object',
      required: ['address', 'coordinates', 'timezone'],
      properties: {
        address: {
          type: 'object',
          required: ['street', 'city', 'state', 'postalCode', 'country'],
          properties: {
            street: { type: 'string', minLength: 1, maxLength: 200 },
            city: { type: 'string', minLength: 1, maxLength: 100 },
            state: { type: 'string', minLength: 1, maxLength: 100 },
            postalCode: { type: 'string', minLength: 1, maxLength: 20 },
            country: { type: 'string', minLength: 1, maxLength: 100 },
          },
          additionalProperties: false,
        },
        coordinates: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
          },
          additionalProperties: false,
        },
        timezone: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
    contact: {
      type: 'object',
      required: ['phone', 'email'],
      properties: {
        phone: { type: 'string', minLength: 5, maxLength: 20 },
        email: { type: 'string', format: 'email' },
        website: { type: 'string', format: 'uri' },
        emergencyContact: { type: 'string', maxLength: 20 },
      },
      additionalProperties: false,
    },
    venues: {
      type: 'array',
      items: {
        type: 'object',
        required: ['venueId', 'name', 'type', 'capacity'],
        properties: {
          venueId: { type: 'string' },
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: ['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room', 'ballroom', 'lounge', 'cafe'],
          },
          capacity: { type: 'number', minimum: 0 },
          operatingHours: {
            type: 'array',
            items: {
              type: 'object',
              required: ['dayOfWeek', 'openTime', 'closeTime'],
              properties: {
                dayOfWeek: { type: 'number', minimum: 0, maximum: 6 },
                openTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                closeTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                isClosed: { type: 'boolean' },
              },
            },
          },
          amenities: { type: 'array', items: { type: 'string' } },
          contact: {
            type: 'object',
            properties: {
              phone: { type: 'string' },
              email: { type: 'string' },
              reservationUrl: { type: 'string' },
            },
          },
          images: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['open', 'closed', 'seasonal', 'renovation'] },
        },
      },
    },
    amenities: {
      type: 'array',
      items: {
        type: 'object',
        required: ['amenityId', 'name', 'category', 'description'],
        properties: {
          amenityId: { type: 'string' },
          name: { type: 'string' },
          category: {
            type: 'string',
            enum: ['pool', 'spa', 'fitness', 'dining', 'business', 'transportation', 'entertainment', 'family', 'accessibility'],
          },
          description: { type: 'string' },
          available: { type: 'boolean' },
          location: { type: 'string' },
          operatingHours: { type: 'string' },
          additionalCost: { type: 'number', minimum: 0 },
          bookingRequired: { type: 'boolean' },
        },
      },
    },
    policies: {
      type: 'array',
      items: {
        type: 'object',
        required: ['policyId', 'name', 'category', 'description', 'rules'],
        properties: {
          policyId: { type: 'string' },
          name: { type: 'string' },
          category: {
            type: 'string',
            enum: ['checkin', 'checkout', 'cancellation', 'pet', 'smoking', 'parking', 'payment', 'general'],
          },
          description: { type: 'string' },
          rules: { type: 'array', items: { type: 'string' } },
          exceptions: { type: 'array', items: { type: 'string' } },
          effectiveFrom: { type: 'string', format: 'date-time' },
          effectiveTo: { type: 'string', format: 'date-time' },
        },
      },
    },
    revenueCenters: {
      type: 'array',
      items: {
        type: 'object',
        required: ['centerId', 'name', 'type', 'revenueCode'],
        properties: {
          centerId: { type: 'string' },
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: ['rooms', 'fnb', 'spa', 'parking', 'laundry', 'business_center', 'gift_shop', 'other'],
          },
          revenueCode: { type: 'string' },
          targetRevenue: { type: 'number', minimum: 0 },
          actualRevenue: { type: 'number', minimum: 0 },
          budgetedRevenue: { type: 'number', minimum: 0 },
        },
      },
    },
    configuration: {
      type: 'object',
      required: ['totalRooms', 'totalFloors', 'roomTypes'],
      properties: {
        totalRooms: { type: 'number', minimum: 0 },
        totalFloors: { type: 'number', minimum: 0 },
        roomTypes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['type', 'count', 'baseRate'],
            properties: {
              type: { type: 'string' },
              count: { type: 'number', minimum: 0 },
              baseRate: { type: 'number', minimum: 0 },
            },
          },
        },
        starRating: { type: 'number', minimum: 1, maximum: 5 },
        yearBuilt: { type: 'number', minimum: 1800, maximum: 2100 },
        lastRenovation: { type: 'string', format: 'date-time' },
      },
      additionalProperties: false,
    },
    metrics: {
      type: 'object',
      properties: {
        occupancyRate: { type: 'number', minimum: 0, maximum: 100 },
        averageDailyRate: { type: 'number', minimum: 0 },
        revenuePerAvailableRoom: { type: 'number', minimum: 0 },
        guestSatisfactionScore: { type: 'number', minimum: 0, maximum: 100 },
      },
    },
    tags: { type: 'array', items: { type: 'string' } },
    status: { type: 'string', enum: ['active', 'inactive', 'coming-soon'] },
  },
  additionalProperties: false,
};

export const updatePropertyMetricsSchema = {
  type: 'object',
  properties: {
    occupancyRate: { type: 'number', minimum: 0, maximum: 100 },
    averageDailyRate: { type: 'number', minimum: 0 },
    revenuePerAvailableRoom: { type: 'number', minimum: 0 },
    guestSatisfactionScore: { type: 'number', minimum: 0, maximum: 100 },
  },
  additionalProperties: false,
};

export const addVenueSchema = {
  type: 'object',
  required: ['venueId', 'name', 'type', 'capacity'],
  properties: {
    venueId: { type: 'string' },
    name: { type: 'string' },
    type: {
      type: 'string',
      enum: ['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room', 'ballroom', 'lounge', 'cafe'],
    },
    capacity: { type: 'number', minimum: 0 },
    operatingHours: {
      type: 'array',
      items: {
        type: 'object',
        required: ['dayOfWeek', 'openTime', 'closeTime'],
        properties: {
          dayOfWeek: { type: 'number', minimum: 0, maximum: 6 },
          openTime: { type: 'string' },
          closeTime: { type: 'string' },
          isClosed: { type: 'boolean' },
        },
      },
    },
    amenities: { type: 'array', items: { type: 'string' } },
    contact: {
      type: 'object',
      properties: {
        phone: { type: 'string' },
        email: { type: 'string' },
        reservationUrl: { type: 'string' },
      },
    },
    status: { type: 'string', enum: ['open', 'closed', 'seasonal', 'renovation'] },
  },
  additionalProperties: false,
};

export const updateRevenueCenterSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    targetRevenue: { type: 'number', minimum: 0 },
    actualRevenue: { type: 'number', minimum: 0 },
    budgetedRevenue: { type: 'number', minimum: 0 },
  },
  additionalProperties: false,
};

export const propertyTwinQuerySchema = {
  type: 'object',
  properties: {
    city: { type: 'string' },
    country: { type: 'string' },
    starRating: { type: 'number', minimum: 1, maximum: 5 },
    status: { type: 'string', enum: ['active', 'inactive', 'coming-soon'] },
    tag: { type: 'string' },
    minRooms: { type: 'number', minimum: 0 },
    maxRooms: { type: 'number', minimum: 0 },
    limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
    offset: { type: 'number', minimum: 0, default: 0 },
  },
  additionalProperties: false,
};