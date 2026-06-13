// Room Twin Schemas for validation

export const createRoomTwinSchema = {
  type: 'object',
  required: ['roomId', 'propertyId', 'roomNumber', 'floor', 'roomType', 'features', 'pricing'],
  properties: {
    roomId: { type: 'string', minLength: 1 },
    propertyId: { type: 'string', minLength: 1 },
    roomNumber: { type: 'string', minLength: 1 },
    floor: { type: 'number', minimum: 0 },
    roomType: { type: 'string', minLength: 1 },
    status: {
      type: 'string',
      enum: ['available', 'occupied', 'maintenance', 'out-of-order', 'cleaning', 'inspected'],
      default: 'available',
    },
    occupancy: {
      type: 'object',
      properties: {
        isOccupied: { type: 'boolean' },
        currentGuestId: { type: 'string' },
        checkIn: { type: 'string', format: 'date-time' },
        checkOut: { type: 'string', format: 'date-time' },
        expectedArrival: { type: 'string', format: 'date-time' },
      },
    },
    iotState: {
      type: 'array',
      items: {
        type: 'object',
        required: ['deviceId', 'deviceType'],
        properties: {
          deviceId: { type: 'string' },
          deviceType: {
            type: 'string',
            enum: ['thermostat', 'lighting', 'blinds', 'tv', 'door_lock', 'minibar', 'hvac', 'smart_speaker'],
          },
          status: { type: 'string', enum: ['on', 'off', 'standby'] },
          settings: { type: 'object' },
        },
      },
    },
    features: {
      type: 'object',
      required: ['bedType', 'bedCount', 'maxOccupancy', 'roomSize', 'floor'],
      properties: {
        bedType: { type: 'string', enum: ['king', 'queen', 'twin', 'double', 'suite'] },
        bedCount: { type: 'number', minimum: 1 },
        maxOccupancy: { type: 'number', minimum: 1 },
        roomSize: { type: 'number', minimum: 1 },
        floor: { type: 'number', minimum: 0 },
        view: { type: 'string', enum: ['city', 'ocean', 'garden', 'pool', 'mountain', 'courtyard', 'none'] },
        balcony: { type: 'boolean' },
        bathtub: { type: 'boolean' },
        showerType: { type: 'string', enum: ['standup', 'walkin', 'both'] },
        amenities: { type: 'array', items: { type: 'string' } },
        accessibility: { type: 'boolean' },
        smoking: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    currentCondition: {
      type: 'object',
      properties: {
        cleanlinessScore: { type: 'number', minimum: 0, maximum: 100 },
        maintenanceIssues: { type: 'array', items: { type: 'string' } },
        lastInspected: { type: 'string', format: 'date-time' },
        nextScheduledMaintenance: { type: 'string', format: 'date-time' },
      },
    },
    pricing: {
      type: 'object',
      required: ['baseRate'],
      properties: {
        baseRate: { type: 'number', minimum: 0 },
        currency: { type: 'string', default: 'USD' },
        weekendRate: { type: 'number', minimum: 0 },
        seasonalRates: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'startDate', 'endDate', 'multiplier'],
            properties: {
              name: { type: 'string' },
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
              multiplier: { type: 'number', minimum: 0 },
            },
          },
        },
      },
      additionalProperties: false,
    },
    tags: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
};

export const updateRoomStatusSchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      enum: ['available', 'occupied', 'maintenance', 'out-of-order', 'cleaning', 'inspected'],
    },
    reason: { type: 'string', maxLength: 500 },
    changedBy: { type: 'string', maxLength: 100 },
  },
  additionalProperties: false,
};

export const updateRoomConditionSchema = {
  type: 'object',
  properties: {
    cleanlinessScore: { type: 'number', minimum: 0, maximum: 100 },
    maintenanceIssues: { type: 'array', items: { type: 'string' } },
    lastInspected: { type: 'string', format: 'date-time' },
    nextScheduledMaintenance: { type: 'string', format: 'date-time' },
  },
  additionalProperties: false,
};

export const updateIoTStateSchema = {
  type: 'object',
  required: ['deviceId', 'deviceType', 'status'],
  properties: {
    deviceId: { type: 'string' },
    deviceType: {
      type: 'string',
      enum: ['thermostat', 'lighting', 'blinds', 'tv', 'door_lock', 'minibar', 'hvac', 'smart_speaker'],
    },
    status: { type: 'string', enum: ['on', 'off', 'standby'] },
    settings: { type: 'object' },
  },
  additionalProperties: false,
};

export const roomTwinQuerySchema = {
  type: 'object',
  properties: {
    propertyId: { type: 'string' },
    status: { type: 'string', enum: ['available', 'occupied', 'maintenance', 'out-of-order', 'cleaning', 'inspected'] },
    bedType: { type: 'string', enum: ['king', 'queen', 'twin', 'double', 'suite'] },
    floor: { type: 'number', minimum: 0 },
    view: { type: 'string', enum: ['city', 'ocean', 'garden', 'pool', 'mountain', 'courtyard', 'none'] },
    minPrice: { type: 'number', minimum: 0 },
    maxPrice: { type: 'number', minimum: 0 },
    accessibility: { type: 'boolean' },
    tag: { type: 'string' },
    limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
    offset: { type: 'number', minimum: 0, default: 0 },
  },
  additionalProperties: false,
};

export const roomAvailabilityQuerySchema = {
  type: 'object',
  properties: {
    propertyId: { type: 'string' },
    checkIn: { type: 'string', format: 'date-time' },
    checkOut: { type: 'string', format: 'date-time' },
    guestCount: { type: 'number', minimum: 1, default: 1 },
    bedType: { type: 'string', enum: ['king', 'queen', 'twin', 'double', 'suite'] },
    floor: { type: 'number', minimum: 0 },
    view: { type: 'string', enum: ['city', 'ocean', 'garden', 'pool', 'mountain', 'courtyard', 'none'] },
    accessibility: { type: 'boolean' },
    limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
  },
  additionalProperties: false,
};
