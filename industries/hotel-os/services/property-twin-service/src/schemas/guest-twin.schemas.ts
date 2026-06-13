// Guest Twin Schemas for validation

export const createGuestTwinSchema = {
  type: 'object',
  required: ['guestId', 'profile'],
  properties: {
    guestId: { type: 'string', minLength: 1 },
    profile: {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'phone'],
      properties: {
        firstName: { type: 'string', minLength: 1, maxLength: 100 },
        lastName: { type: 'string', minLength: 1, maxLength: 100 },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string', minLength: 5, maxLength: 20 },
        nationality: { type: 'string', maxLength: 50 },
        dateOfBirth: { type: 'string', format: 'date-time' },
        vipStatus: { type: 'boolean', default: false },
        corporateAccount: { type: 'string', maxLength: 100 },
      },
      additionalProperties: false,
    },
    preferences: {
      type: 'object',
      properties: {
        roomTemperature: { type: 'number', minimum: 16, maximum: 30 },
        bedType: { type: 'string', enum: ['king', 'queen', 'twin', 'double'] },
        pillowType: { type: 'string', enum: ['firm', 'medium', 'soft', 'memory_foam', 'down'] },
        smokingPreference: { type: 'string', enum: ['non-smoking', 'smoking', 'no-preference'] },
        floorPreference: { type: 'string', enum: ['high', 'low', 'no-preference'] },
        quietRoom: { type: 'boolean' },
        highFloor: { type: 'boolean' },
        nearElevator: { type: 'boolean' },
        lateCheckout: { type: 'boolean' },
        earlyCheckin: { type: 'boolean' },
        dietaryRestrictions: { type: 'array', items: { type: 'string' } },
        beveragePreferences: {
          type: 'object',
          properties: {
            coffee: { type: 'string', enum: ['regular', 'decaf', 'none'] },
            tea: { type: 'string', enum: ['black', 'green', 'herbal', 'none'] },
            water: { type: 'string', enum: ['still', 'sparkling', 'both'] },
          },
        },
        amenities: { type: 'array', items: { type: 'string' } },
        entertainment: { type: 'array', items: { type: 'string' } },
        language: { type: 'string', default: 'en' },
        currency: { type: 'string', default: 'USD' },
      },
      additionalProperties: false,
    },
    loyalty: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'] },
        points: { type: 'number', minimum: 0 },
        lifetimePoints: { type: 'number', minimum: 0 },
        memberSince: { type: 'string', format: 'date-time' },
        benefits: { type: 'array', items: { type: 'string' } },
        qualifiedNights: { type: 'number', minimum: 0 },
      },
      additionalProperties: false,
    },
    tags: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
};

export const updateGuestPreferencesSchema = {
  type: 'object',
  properties: {
    roomTemperature: { type: 'number', minimum: 16, maximum: 30 },
    bedType: { type: 'string', enum: ['king', 'queen', 'twin', 'double'] },
    pillowType: { type: 'string', enum: ['firm', 'medium', 'soft', 'memory_foam', 'down'] },
    smokingPreference: { type: 'string', enum: ['non-smoking', 'smoking', 'no-preference'] },
    floorPreference: { type: 'string', enum: ['high', 'low', 'no-preference'] },
    quietRoom: { type: 'boolean' },
    highFloor: { type: 'boolean' },
    nearElevator: { type: 'boolean' },
    lateCheckout: { type: 'boolean' },
    earlyCheckin: { type: 'boolean' },
    dietaryRestrictions: { type: 'array', items: { type: 'string' } },
    beveragePreferences: {
      type: 'object',
      properties: {
        coffee: { type: 'string', enum: ['regular', 'decaf', 'none'] },
        tea: { type: 'string', enum: ['black', 'green', 'herbal', 'none'] },
        water: { type: 'string', enum: ['still', 'sparkling', 'both'] },
      },
    },
    amenities: { type: 'array', items: { type: 'string' } },
    entertainment: { type: 'array', items: { type: 'string' } },
    language: { type: 'string' },
    currency: { type: 'string' },
  },
  additionalProperties: false,
};

export const guestTwinQuerySchema = {
  type: 'object',
  properties: {
    vipStatus: { type: 'boolean' },
    tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'] },
    tag: { type: 'string' },
    limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
    offset: { type: 'number', minimum: 0, default: 0 },
  },
  additionalProperties: false,
};

export const addStayHistorySchema = {
  type: 'object',
  required: ['propertyId', 'propertyName', 'roomId', 'roomType', 'checkIn', 'checkOut'],
  properties: {
    propertyId: { type: 'string', minLength: 1 },
    propertyName: { type: 'string', minLength: 1 },
    roomId: { type: 'string', minLength: 1 },
    roomType: { type: 'string', minLength: 1 },
    checkIn: { type: 'string', format: 'date-time' },
    checkOut: { type: 'string', format: 'date-time' },
    totalSpent: { type: 'number', minimum: 0 },
    purpose: { type: 'string', enum: ['business', 'leisure', 'mixed'] },
    rating: { type: 'number', minimum: 1, maximum: 5 },
    feedback: { type: 'string', maxLength: 2000 },
  },
  additionalProperties: false,
};

export const updateSentimentSchema = {
  type: 'object',
  required: ['overallScore'],
  properties: {
    overallScore: { type: 'number', minimum: -1, maximum: 1 },
    sources: { type: 'array', items: { type: 'string' } },
    positiveKeywords: { type: 'array', items: { type: 'string' } },
    negativeKeywords: { type: 'array', items: { type: 'string' } },
    recentMentions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['source', 'sentiment', 'date'],
        properties: {
          source: { type: 'string' },
          sentiment: { type: 'number', minimum: -1, maximum: 1 },
          date: { type: 'string', format: 'date-time' },
          excerpt: { type: 'string', maxLength: 500 },
        },
      },
    },
  },
  additionalProperties: false,
};
