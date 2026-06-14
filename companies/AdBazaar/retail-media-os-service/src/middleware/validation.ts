import { z } from 'zod';

// Retailer schemas
export const createRetailerSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  categories: z.array(z.string()).min(1),
  settings: z.object({
    defaultMarkup: z.number().min(0).max(100).optional(),
    minBid: z.number().min(0).optional(),
    maxBid: z.number().min(0).optional(),
    targetingEnabled: z.boolean().optional(),
    attributionEnabled: z.boolean().optional(),
    salesLiftTracking: z.boolean().optional()
  }).optional(),
  integration: z.object({
    posSystem: z.string().optional(),
    inventorySource: z.string().optional(),
    loyaltyProgram: z.string().optional(),
    apiKey: z.string().optional(),
    webhookUrl: z.string().url().optional()
  }).optional()
});

export const updateRetailerSchema = createRetailerSchema.partial();

// Store schemas
export const createStoreSchema = z.object({
  storeCode: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  storeType: z.enum(['supermarket', 'hypermarket', 'convenience', 'department', 'specialty']),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().optional(),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional()
    }).optional()
  }),
  capacity: z.object({
    shelfUnits: z.number().min(0).optional(),
    endCaps: z.number().min(0).optional(),
    checkouts: z.number().min(0).optional(),
    entranceDisplays: z.number().min(0).optional(),
    freezerDoors: z.number().min(0).optional()
  }).optional(),
  operatingHours: z.record(
    z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional()
    })
  ).optional(),
  attributes: z.object({
    hasSelfCheckout: z.boolean().optional(),
    hasDeli: z.boolean().optional(),
    hasBakery: z.boolean().optional(),
    hasPharmacy: z.boolean().optional(),
    trafficScore: z.number().min(1).max(10).optional(),
    avgDailyVisitors: z.number().min(0).optional()
  }).optional()
});

// Inventory schemas
export const createInventorySchema = z.object({
  inventoryType: z.enum(['shelf', 'endcap', 'checkout', 'entrance', 'freezer', 'floor', 'digital']),
  placement: z.object({
    aisle: z.string().optional(),
    section: z.string().optional(),
    position: z.number().optional(),
    facing: z.number().optional()
  }).optional(),
  dimensions: z.object({
    width: z.number().min(0.1),
    height: z.number().min(0.1),
    depth: z.number().min(0.1)
  }),
  pricing: z.object({
    basePrice: z.number().min(0),
    markup: z.number().min(0).max(100).optional()
  }),
  category: z.string().min(1),
  productIds: z.array(z.string()).optional(),
  visibility: z.enum(['high', 'medium', 'low']).optional(),
  availability: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  })
});

// Campaign schemas
export const createCampaignSchema = z.object({
  advertiserId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  objective: z.enum(['awareness', 'consideration', 'conversion', 'loyalty']),
  bidStrategy: z.enum(['cpm', 'cpc', 'cpas']).optional(),
  budget: z.object({
    total: z.number().min(100),
    daily: z.number().min(0).optional()
  }),
  targeting: z.object({
    storeIds: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    productIds: z.array(z.string()).optional(),
    audienceSegments: z.array(z.string()).optional(),
    locationTypes: z.array(z.string()).optional()
  }).optional(),
  products: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    category: z.string(),
    bidAmount: z.number().min(0),
    adSchedule: z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      days: z.array(z.string()).optional(),
      hours: z.object({
        start: z.number().min(0).max(24).optional(),
        end: z.number().min(0).max(24).optional()
      }).optional()
    })
  })).min(1),
  creativeAssets: z.array(z.object({
    assetId: z.string(),
    type: z.enum(['image', 'video', 'html']),
    url: z.string().url(),
    inventoryType: z.string()
  })).optional(),
  schedule: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    flighting: z.array(z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      budgetPercent: z.number().min(0).max(100)
    })).optional()
  }),
  attribution: z.object({
    enabled: z.boolean().optional(),
    model: z.enum(['last_touch', 'first_touch', 'linear', 'data_driven']).optional(),
    windowDays: z.number().min(1).max(30).optional()
  }).optional()
});

export const addAdSchema = z.object({
  productId: z.string(),
  name: z.string(),
  category: z.string(),
  bidAmount: z.number().min(0),
  adSchedule: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    days: z.array(z.string()).optional(),
    hours: z.object({
      start: z.number().min(0).max(24).optional(),
      end: z.number().min(0).max(24).optional()
    }).optional()
  })
});

// Sales Lift schemas
export const createSalesLiftSchema = z.object({
  storeIds: z.array(z.string()).min(1),
  method: z.enum(['geo_test', 'store_test', 'holdout', 'matched_market']),
  period: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }),
  baseline: z.object({
    sales: z.number().min(0),
    transactions: z.number().min(0),
    avgOrderValue: z.number().min(0),
    units: z.number().min(0)
  }),
  treatment: z.object({
    sales: z.number().min(0),
    transactions: z.number().min(0),
    avgOrderValue: z.number().min(0),
    units: z.number().min(0)
  }),
  controlGroup: z.object({
    storeIds: z.array(z.string()).optional(),
    sales: z.number().min(0).optional(),
    transactions: z.number().min(0).optional()
  }).optional()
});

// Attribution schemas
export const calculateAttributionSchema = z.object({
  storeId: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  attributionModel: z.enum(['last_touch', 'first_touch', 'linear', 'data_driven']),
  windowDays: z.number().min(1).max(30).optional()
});

export default {
  createRetailerSchema,
  updateRetailerSchema,
  createStoreSchema,
  createInventorySchema,
  createCampaignSchema,
  addAdSchema,
  createSalesLiftSchema,
  calculateAttributionSchema
};