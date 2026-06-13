import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, coerceTypes: true });
addFormats(ajv);

// ============ GUEST TWIN SCHEMAS ============

export const CreateGuestTwinSchema = {
  type: 'object',
  required: ['property_id', 'profile'],
  properties: {
    guest_id: { type: 'string', format: 'uuid' },
    property_id: { type: 'string', minLength: 1 },
    profile: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        nationality: { type: 'string' },
        language_preference: { type: 'string', default: 'en' },
        accessibility_needs: { type: 'array', items: { type: 'string' }, default: [] },
      },
    },
    loyalty: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum'] },
        points_balance: { type: 'number', minimum: 0 },
        member_since: { type: 'string', format: 'date-time' },
        total_stays: { type: 'number', minimum: 0 },
        total_spend: { type: 'number', minimum: 0 },
      },
    },
    preferences: {
      type: 'object',
      properties: {
        room: {
          type: 'object',
          properties: {
            floor_preference: { type: 'string' },
            view_preference: { type: 'string' },
            bed_configuration: { type: 'string' },
            temperature_setting: {
              type: 'object',
              properties: {
                default: { type: 'number', minimum: 16, maximum: 30 },
                range: {
                  type: 'object',
                  properties: {
                    min: { type: 'number' },
                    max: { type: 'number' },
                  },
                },
              },
            },
            lighting_preference: { type: 'string' },
            noise_tolerance: { type: 'number', minimum: 1, maximum: 10 },
          },
        },
        dining: {
          type: 'object',
          properties: {
            dietary_restrictions: { type: 'array', items: { type: 'string' } },
            allergies: { type: 'array', items: { type: 'string' } },
            favorite_items: { type: 'array', items: { type: 'string' } },
            beverage_preferences: { type: 'array', items: { type: 'string' } },
            typical_spend_range: {
              type: 'object',
              properties: {
                min: { type: 'number', minimum: 0 },
                max: { type: 'number', minimum: 0 },
              },
            },
          },
        },
        amenities: {
          type: 'object',
          properties: {
            spa_interests: { type: 'array', items: { type: 'string' } },
            fitness_habits: { type: 'boolean' },
            pool_usage: { type: 'boolean' },
            business_amenities: { type: 'array', items: { type: 'string' } },
          },
        },
        communication: {
          type: 'object',
          properties: {
            preferred_channel: { type: 'string', enum: ['email', 'sms', 'app_push', 'whatsapp'] },
            opt_ins: { type: 'array', items: { type: 'string' } },
            quiet_hours: {
              type: 'object',
              properties: {
                start: { type: 'string' },
                end: { type: 'string' },
              },
            },
          },
        },
      },
    },
    stay_patterns: {
      type: 'object',
      properties: {
        typical_check_in_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        typical_check_out_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        weekend_vs_weekday: { type: 'string', enum: ['weekend', 'weekday', 'mixed'] },
        seasonal_patterns: { type: 'array', items: { type: 'string' } },
        booking_lead_time: { type: 'number', minimum: 0 },
      },
    },
    sentiment: {
      type: 'object',
      properties: {
        current_score: { type: 'number', minimum: 0, maximum: 100 },
        trend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
        last_feedback_date: { type: 'string', format: 'date-time' },
        key_topics: { type: 'array', items: { type: 'string' } },
      },
    },
    lifetime_value: {
      type: 'object',
      properties: {
        clv: { type: 'number', minimum: 0 },
        potential_clv: { type: 'number', minimum: 0 },
        churn_risk: { type: 'string', enum: ['low', 'medium', 'high'] },
        recommendation_eligibility: { type: 'boolean' },
      },
    },
    current_stay: {
      type: 'object',
      properties: {
        room_id: { type: 'string' },
        check_in: { type: 'string', format: 'date-time' },
        check_out: { type: 'string', format: 'date-time' },
        adults: { type: 'number', minimum: 1 },
        children: { type: 'number', minimum: 0 },
        rate_code: { type: 'string' },
        special_requests: { type: 'array', items: { type: 'string' } },
        occasion: { type: 'string', nullable: true },
      },
    },
    price_sensitivity: { type: 'number', minimum: 0, maximum: 100 },
  },
};

export const UpdatePreferencesSchema = {
  type: 'object',
  properties: {
    room: { type: 'object' },
    dining: { type: 'object' },
    amenities: { type: 'object' },
    communication: { type: 'object' },
  },
  additionalProperties: false,
};

// ============ ROOM TWIN SCHEMAS ============

export const CreateRoomTwinSchema = {
  type: 'object',
  required: ['property_id', 'room_number', 'room_type', 'floor', 'revenue'],
  properties: {
    room_id: { type: 'string' },
    property_id: { type: 'string', minLength: 1 },
    room_number: { type: 'string', minLength: 1 },
    room_type: { type: 'string', enum: ['standard', 'deluxe', 'suite', 'penthouse', 'accessible'] },
    floor: { type: 'number', minimum: 0 },
    view: { type: 'string', enum: ['city', 'pool', 'garden', 'ocean', 'mountain'], default: 'city' },
    capacity: {
      type: 'object',
      properties: {
        max_adults: { type: 'number', minimum: 1 },
        max_children: { type: 'number', minimum: 0 },
        max_occupancy: { type: 'number', minimum: 1 },
      },
    },
    bed_configuration: {
      type: 'object',
      properties: {
        bed_count: { type: 'number', minimum: 1 },
        bed_type: { type: 'string', enum: ['king', 'queen', 'twin', 'bunk'] },
        rollaway_available: { type: 'boolean' },
      },
    },
    amenities: {
      type: 'object',
      properties: {
        smart_tv: { type: 'boolean' },
        smart_speaker: { type: 'boolean' },
        minibar: { type: 'boolean' },
        coffee_machine: { type: 'boolean' },
        safe: { type: 'boolean' },
        balcony: { type: 'boolean' },
        jacuzzi: { type: 'boolean' },
      },
    },
    revenue: {
      type: 'object',
      required: ['base_rate', 'rack_rate'],
      properties: {
        base_rate: { type: 'number', minimum: 0 },
        rack_rate: { type: 'number', minimum: 0 },
      },
    },
  },
};

export const UpdateRoomStatusSchema = {
  type: 'object',
  properties: {
    current: { type: 'string', enum: ['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected'] },
    next_available: { type: 'string', format: 'date-time' },
    maintenance_alerts: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
};

// ============ PROPERTY TWIN SCHEMAS ============

export const CreatePropertyTwinSchema = {
  type: 'object',
  required: ['brand', 'name', 'location', 'inventory'],
  properties: {
    property_id: { type: 'string' },
    brand: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    location: {
      type: 'object',
      required: ['address', 'city', 'country', 'coordinates'],
      properties: {
        address: { type: 'string' },
        city: { type: 'string' },
        country: { type: 'string' },
        coordinates: {
          type: 'object',
          required: ['lat', 'lng'],
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
        },
        timezone: { type: 'string', default: 'UTC' },
      },
    },
    inventory: {
      type: 'object',
      required: ['total_rooms'],
      properties: {
        total_rooms: { type: 'number', minimum: 1 },
        by_type: { type: 'object', additionalProperties: { type: 'number' } },
        available_today: { type: 'number', minimum: 0 },
        available_tomorrow: { type: 'number', minimum: 0 },
      },
    },
    venues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          venue_id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room'] },
          capacity: { type: 'number' },
          hours: { type: 'object' },
          pos_revenue_center_id: { type: 'string' },
        },
      },
    },
    settings: {
      type: 'object',
      properties: {
        brand_standards_version: { type: 'string' },
        upsell_config: { type: 'object' },
        pricing_rules: { type: 'object' },
      },
    },
  },
};

// ============ PRICING SCHEMAS ============

export const PricingContextSchema = {
  type: 'object',
  required: ['room_id'],
  properties: {
    room_id: { type: 'string', minLength: 1 },
    guest_id: { type: 'string' },
    check_in: { type: 'string', format: 'date-time' },
    check_out: { type: 'string', format: 'date-time' },
    adults: { type: 'number', minimum: 1 },
    children: { type: 'number', minimum: 0 },
  },
};

export const UpgradePricingSchema = {
  type: 'object',
  required: ['guest_id', 'current_room_id', 'target_room_type'],
  properties: {
    guest_id: { type: 'string', minLength: 1 },
    current_room_id: { type: 'string', minLength: 1 },
    target_room_type: { type: 'string', enum: ['standard', 'deluxe', 'suite', 'penthouse', 'accessible'] },
  },
};

// ============ OFFER SCHEMAS ============

export const OfferContextSchema = {
  type: 'object',
  required: ['guest_id', 'room_id'],
  properties: {
    guest_id: { type: 'string', minLength: 1 },
    room_id: { type: 'string', minLength: 1 },
    offer_type: { type: 'string', enum: ['upgrade', 'package', 'addon', 'early_checkin', 'late_checkout'] },
    force_refresh: { type: 'boolean', default: false },
  },
};

export const OfferResponseSchema = {
  type: 'object',
  required: ['offer_id', 'response'],
  properties: {
    offer_id: { type: 'string', minLength: 1 },
    response: { type: 'string', enum: ['accepted', 'declined'] },
  },
};

// ============ VALIDATORS ============

export const validateCreateGuestTwin = ajv.compile(CreateGuestTwinSchema);
export const validateUpdatePreferences = ajv.compile(UpdatePreferencesSchema);
export const validateCreateRoomTwin = ajv.compile(CreateRoomTwinSchema);
export const validateUpdateRoomStatus = ajv.compile(UpdateRoomStatusSchema);
export const validateCreatePropertyTwin = ajv.compile(CreatePropertyTwinSchema);
export const validatePricingContext = ajv.compile(PricingContextSchema);
export const validateUpgradePricing = ajv.compile(UpgradePricingSchema);
export const validateOfferContext = ajv.compile(OfferContextSchema);
export const validateOfferResponse = ajv.compile(OfferResponseSchema);