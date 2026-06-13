import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Address schema
export const addressSchema = {
  type: 'object',
  properties: {
    street: { type: 'string', minLength: 1 },
    unit: { type: 'string', nullable: true },
    city: { type: 'string', minLength: 1 },
    state: { type: 'string', minLength: 2 },
    postalCode: { type: 'string', minLength: 5 },
    country: { type: 'string', default: 'USA' },
  },
  required: ['street', 'city', 'state', 'postalCode'],
  additionalProperties: false,
};

// Coordinates schema
export const coordinatesSchema = {
  type: 'object',
  properties: {
    lat: { type: 'number', minimum: -90, maximum: 90 },
    lng: { type: 'number', minimum: -180, maximum: 180 },
  },
  required: ['lat', 'lng'],
  additionalProperties: false,
};

// Location schema
export const locationSchema = {
  type: 'object',
  properties: {
    address: addressSchema,
    coordinates: coordinatesSchema,
    areaId: { type: 'string' },
    neighborhood: { type: 'string' },
    submarket: { type: 'string' },
  },
  required: ['address', 'coordinates'],
  additionalProperties: false,
};

// Price history schema
export const priceHistorySchema = {
  type: 'object',
  properties: {
    price: { type: 'number', minimum: 0 },
    date: { type: 'string', format: 'date-time' },
    event: { type: 'string', enum: ['price_change', 'relisted'] },
  },
  required: ['price', 'date', 'event'],
  additionalProperties: false,
};

// Listing schema
export const listingSchema = {
  type: 'object',
  properties: {
    listingId: { type: 'string' },
    status: {
      type: 'string',
      enum: ['active', 'pending', 'under_contract', 'sold', 'off_market'],
      default: 'active',
    },
    listingDate: { type: 'string', format: 'date-time' },
    listingPrice: { type: 'number', minimum: 0 },
    askingPrice: { type: 'number', minimum: 0 },
    priceHistory: { type: 'array', items: priceHistorySchema },
    daysOnMarket: { type: 'number', minimum: 0 },
  },
  required: ['listingPrice'],
  additionalProperties: false,
};

// Physical schema
export const physicalSchema = {
  type: 'object',
  properties: {
    propertyType: {
      type: 'string',
      enum: ['single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial'],
    },
    yearBuilt: { type: 'number', minimum: 1800, maximum: 2030 },
    lotSizeSqft: { type: 'number', minimum: 0 },
    interiorSqft: { type: 'number', minimum: 0 },
    bedrooms: { type: 'number', minimum: 0 },
    bathrooms: { type: 'number', minimum: 0 },
    garage: { type: 'number', minimum: 0 },
    stories: { type: 'number', minimum: 1 },
    parkingSpaces: { type: 'number', minimum: 0 },
    hoaFee: { type: 'number', nullable: true },
    lotAcreage: { type: 'number', minimum: 0 },
  },
  required: ['propertyType', 'bedrooms', 'bathrooms'],
  additionalProperties: false,
};

// Features schema
export const featuresSchema = {
  type: 'object',
  properties: {
    interior: { type: 'array', items: { type: 'string' } },
    exterior: { type: 'array', items: { type: 'string' } },
    energy: { type: 'array', items: { type: 'string' } },
    smartHome: { type: 'array', items: { type: 'string' } },
    accessibility: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
};

// Condition schema
export const conditionSchema = {
  type: 'object',
  properties: {
    overall: {
      type: 'string',
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good',
    },
    roofAge: { type: 'number', minimum: 0 },
    hvacAge: { type: 'number', minimum: 0 },
    plumbingAge: { type: 'number', minimum: 0 },
    electricalAge: { type: 'number', minimum: 0 },
    lastInspection: { type: 'string', format: 'date-time', nullable: true },
  },
  additionalProperties: false,
};

// Financial schema
export const financialSchema = {
  type: 'object',
  properties: {
    currentValue: { type: 'number' },
    propflowEstimate: { type: 'number' },
    rentZestimate: { type: 'number', nullable: true },
    propertyTax: { type: 'number' },
    insuranceEstimate: { type: 'number' },
    hoaFee: { type: 'number', nullable: true },
    mortgageBalance: { type: 'number', nullable: true },
  },
  additionalProperties: false,
};

// Market schema
export const marketSchema = {
  type: 'object',
  properties: {
    compPricePerSqft: { type: 'number' },
    avgDaysOnMarket: { type: 'number' },
    priceTrend: {
      type: 'string',
      enum: ['increasing', 'stable', 'decreasing'],
      default: 'stable',
    },
    marketTemperature: {
      type: 'string',
      enum: ['hot', 'warm', 'cool', 'cold'],
      default: 'warm',
    },
    competitionIndex: { type: 'number', minimum: 0, maximum: 100 },
  },
  additionalProperties: false,
};

// Media schema
export const mediaSchema = {
  type: 'object',
  properties: {
    photos: { type: 'array', items: { type: 'string' } },
    videos: { type: 'array', items: { type: 'string' } },
    threeDTourUrl: { type: 'string', nullable: true },
    floorPlanUrl: { type: 'string', nullable: true },
    documents: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
};

// Ownership schema
export const ownershipSchema = {
  type: 'object',
  properties: {
    ownerType: {
      type: 'string',
      enum: ['individual', 'llc', 'corporation', 'trust'],
      default: 'individual',
    },
    ownerName: { type: 'string' },
    lastSaleDate: { type: 'string', format: 'date-time', nullable: true },
    lastSalePrice: { type: 'number', nullable: true },
  },
  additionalProperties: false,
};

// Agent reference schema
export const agentReferenceSchema = {
  type: 'object',
  properties: {
    listingAgentId: { type: 'string' },
    coAgentId: { type: 'string', nullable: true },
    brokerageId: { type: 'string' },
  },
  additionalProperties: false,
};

// Full Property Twin schema for creation
export const createPropertyTwinSchema = {
  type: 'object',
  properties: {
    twinId: { type: 'string' },
    propertyId: { type: 'string' },
    listing: listingSchema,
    location: locationSchema,
    physical: physicalSchema,
    features: featuresSchema,
    condition: conditionSchema,
    financial: financialSchema,
    market: marketSchema,
    media: mediaSchema,
    ownership: ownershipSchema,
    agent: agentReferenceSchema,
    tags: { type: 'array', items: { type: 'string' } },
    status: { type: 'string', enum: ['active', 'inactive', 'archived'], default: 'active' },
  },
  required: ['propertyId', 'listing', 'location', 'physical'],
  additionalProperties: false,
};

// Update schema (all fields optional)
export const updatePropertyTwinSchema = {
  type: 'object',
  properties: {
    listing: listingSchema,
    location: locationSchema,
    physical: physicalSchema,
    features: featuresSchema,
    condition: conditionSchema,
    financial: financialSchema,
    market: marketSchema,
    media: mediaSchema,
    ownership: ownershipSchema,
    agent: agentReferenceSchema,
    tags: { type: 'array', items: { type: 'string' } },
    status: { type: 'string', enum: ['active', 'inactive', 'archived'] },
  },
  additionalProperties: false,
};

// Query schema for filtering
export const queryPropertyTwinSchema = {
  type: 'object',
  properties: {
    city: { type: 'string' },
    state: { type: 'string' },
    postalCode: { type: 'string' },
    propertyType: { type: 'string', enum: ['single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial'] },
    status: { type: 'string', enum: ['active', 'pending', 'under_contract', 'sold', 'off_market'] },
    minPrice: { type: 'number', minimum: 0 },
    maxPrice: { type: 'number', minimum: 0 },
    minBedrooms: { type: 'number', minimum: 0 },
    maxBedrooms: { type: 'number', minimum: 0 },
    minBathrooms: { type: 'number', minimum: 0 },
    maxBathrooms: { type: 'number', minimum: 0 },
    minSqft: { type: 'number', minimum: 0 },
    maxSqft: { type: 'number', minimum: 0 },
    areaId: { type: 'string' },
    neighborhood: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    search: { type: 'string' },
    sortBy: { type: 'string', enum: ['listingPrice', 'daysOnMarket', 'createdAt', 'updatedAt'], default: 'createdAt' },
    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
    limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
    offset: { type: 'number', minimum: 0, default: 0 },
  },
  additionalProperties: false,
};

// Metrics update schema
export const updateMetricsSchema = {
  type: 'object',
  properties: {
    financial: financialSchema,
    condition: conditionSchema,
    market: marketSchema,
  },
  additionalProperties: false,
};

// Compile validators
export const validateCreatePropertyTwin = ajv.compile(createPropertyTwinSchema);
export const validateUpdatePropertyTwin = ajv.compile(updatePropertyTwinSchema);
export const validateQueryPropertyTwin = ajv.compile(queryPropertyTwinSchema);
export const validateUpdateMetrics = ajv.compile(updateMetricsSchema);

// Export schema type for use in tests
export type CreatePropertyTwinInput = {
  twinId?: string;
  propertyId: string;
  listing: {
    listingId?: string;
    status?: 'active' | 'pending' | 'under_contract' | 'sold' | 'off_market';
    listingDate?: string;
    listingPrice: number;
    askingPrice?: number;
    priceHistory?: Array<{ price: number; date: string; event: 'price_change' | 'relisted' }>;
    daysOnMarket?: number;
  };
  location: {
    address: { street: string; unit?: string; city: string; state: string; postalCode: string; country?: string };
    coordinates: { lat: number; lng: number };
    areaId?: string;
    neighborhood?: string;
    submarket?: string;
  };
  physical: {
    propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' | 'commercial';
    yearBuilt?: number;
    lotSizeSqft?: number;
    interiorSqft?: number;
    bedrooms: number;
    bathrooms: number;
    garage?: number;
    stories?: number;
    parkingSpaces?: number;
    hoaFee?: number | null;
    lotAcreage?: number | null;
  };
  features?: {
    interior?: string[];
    exterior?: string[];
    energy?: string[];
    smartHome?: string[];
    accessibility?: string[];
  };
  condition?: {
    overall?: 'excellent' | 'good' | 'fair' | 'poor';
    roofAge?: number;
    hvacAge?: number;
    plumbingAge?: number;
    electricalAge?: number;
    lastInspection?: string | null;
  };
  financial?: {
    currentValue?: number;
    propflowEstimate?: number;
    rentZestimate?: number | null;
    propertyTax?: number;
    insuranceEstimate?: number;
    hoaFee?: number | null;
    mortgageBalance?: number | null;
  };
  market?: {
    compPricePerSqft?: number;
    avgDaysOnMarket?: number;
    priceTrend?: 'increasing' | 'stable' | 'decreasing';
    marketTemperature?: 'hot' | 'warm' | 'cool' | 'cold';
    competitionIndex?: number;
  };
  media?: {
    photos?: string[];
    videos?: string[];
    threeDTourUrl?: string | null;
    floorPlanUrl?: string | null;
    documents?: string[];
  };
  ownership?: {
    ownerType?: 'individual' | 'llc' | 'corporation' | 'trust';
    ownerName?: string;
    lastSaleDate?: string | null;
    lastSalePrice?: number | null;
  };
  agent?: {
    listingAgentId?: string;
    coAgentId?: string | null;
    brokerageId?: string;
  };
  tags?: string[];
  status?: 'active' | 'inactive' | 'archived';
};
