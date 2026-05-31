"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthSchema = exports.PlatformOptimizationSchema = exports.ReviewSchema = exports.LoyaltySchema = exports.FoodCostSchema = exports.TurnoverSchema = exports.MenuEngineSchema = void 0;
const zod_1 = require("zod");
// ============================================
// Zod Schemas for Validation
// ============================================
exports.MenuEngineSchema = zod_1.z.object({
    restaurantId: zod_1.z.string().min(1),
    menuItems: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1),
        name: zod_1.z.string().min(1),
        category: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().positive(),
        cost: zod_1.z.number().nonnegative(),
        popularity: zod_1.z.number().min(0).max(100).optional().default(50),
        prepTime: zod_1.z.number().positive().optional().default(15),
        imageUrl: zod_1.z.string().url().optional(),
    })),
    targetFoodCostPercent: zod_1.z.number().min(10).max(60).optional(),
});
exports.TurnoverSchema = zod_1.z.object({
    restaurantId: zod_1.z.string().min(1),
    operatingHours: zod_1.z.record(zod_1.z.object({
        open: zod_1.z.string(),
        close: zod_1.z.string(),
        closed: zod_1.z.boolean().optional(),
    })),
    currentUtilization: zod_1.z.number().min(0).max(100),
    avgOrderValue: zod_1.z.number().positive(),
    peakHourCovers: zod_1.z.array(zod_1.z.object({
        hour: zod_1.z.number().min(0).max(23),
        covers: zod_1.z.number().nonnegative(),
    })),
    tableConfigs: zod_1.z.array(zod_1.z.object({
        tableId: zod_1.z.string().min(1),
        seats: zod_1.z.number().positive(),
        avgTurnMinutes: zod_1.z.number().positive(),
    })),
});
exports.FoodCostSchema = zod_1.z.object({
    restaurantId: zod_1.z.string().min(1),
    monthlyRevenue: zod_1.z.number().positive(),
    monthlyFoodSpend: zod_1.z.number().nonnegative(),
    targetFoodCostPercent: zod_1.z.number().min(10).max(60),
    ingredients: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        unit: zod_1.z.string().min(1),
        quantity: zod_1.z.number().nonnegative(),
        costPerUnit: zod_1.z.number().nonnegative(),
        supplier: zod_1.z.string().min(1),
        shelfLife: zod_1.z.number().positive(),
        reorderPoint: zod_1.z.number().nonnegative(),
    })).optional(),
    recipes: zod_1.z.array(zod_1.z.object({
        dishId: zod_1.z.string().min(1),
        dishName: zod_1.z.string().min(1),
        ingredients: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().min(1),
            quantity: zod_1.z.number().nonnegative(),
            unit: zod_1.z.string().min(1),
        })),
        sellingPrice: zod_1.z.number().positive(),
    })).optional(),
    vendors: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        spend: zod_1.z.number().nonnegative(),
        leadTimeDays: zod_1.z.number().positive(),
    })).optional(),
});
exports.LoyaltySchema = zod_1.z.object({
    restaurantId: zod_1.z.string().min(1),
    restaurantName: zod_1.z.string().min(1),
    avgOrderValue: zod_1.z.number().positive(),
    monthlyCustomers: zod_1.z.number().positive(),
    currentLoyalty: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        tiers: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            pointsRequired: zod_1.z.number(),
            benefits: zod_1.z.array(zod_1.z.string()),
            multiplier: zod_1.z.number(),
            color: zod_1.z.string(),
        })),
        rewards: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            pointsCost: zod_1.z.number(),
            type: zod_1.z.enum(['discount', 'free_item', 'experience', 'discount_percent']),
            minTier: zod_1.z.string().optional(),
            available: zod_1.z.boolean(),
        })),
        pointsPerRupee: zod_1.z.number(),
        birthdayBonus: zod_1.z.number(),
        referralBonus: zod_1.z.number(),
    }).optional(),
    goals: zod_1.z.enum(['acquire', 'retain', 'increase_spend', 'all']),
});
exports.ReviewSchema = zod_1.z.object({
    restaurantId: zod_1.z.string().min(1),
    platform: zod_1.z.enum(['zomato', 'swiggy', 'google', 'all']).optional(),
    reviews: zod_1.z.array(zod_1.z.object({
        platform: zod_1.z.enum(['zomato', 'swiggy', 'google', 'direct']),
        rating: zod_1.z.number().min(1).max(5),
        title: zod_1.z.string().optional(),
        text: zod_1.z.string().min(1),
        date: zod_1.z.string(),
        response: zod_1.z.string().optional(),
        sentiment: zod_1.z.enum(['positive', 'neutral', 'negative']).optional(),
        categories: zod_1.z.array(zod_1.z.string()).optional(),
    })),
    responseTemplates: zod_1.z.array(zod_1.z.object({
        sentiment: zod_1.z.string(),
        template: zod_1.z.string(),
    })).optional(),
    competitorRatings: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        rating: zod_1.z.number().min(1).max(5),
    })).optional(),
});
exports.PlatformOptimizationSchema = zod_1.z.object({
    restaurantId: zod_1.z.string().min(1),
    platform: zod_1.z.enum(['zomato', 'swiggy', 'both']),
    listings: zod_1.z.array(zod_1.z.object({
        platform: zod_1.z.enum(['zomato', 'swiggy']),
        listingId: zod_1.z.string().min(1),
        isActive: zod_1.z.boolean(),
        rating: zod_1.z.number().min(1).max(5),
        reviewCount: zod_1.z.number().nonnegative(),
        photos: zod_1.z.array(zod_1.z.string()).optional(),
        menuItems: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            price: zod_1.z.number(),
            available: zod_1.z.boolean(),
        })),
        deliveryTime: zod_1.z.number().positive(),
        packagingCharge: zod_1.z.number().nonnegative(),
        discount: zod_1.z.number().min(0).max(100).optional(),
    })),
    metrics: zod_1.z.array(zod_1.z.object({
        platform: zod_1.z.enum(['zomato', 'swiggy']),
        orders: zod_1.z.number().nonnegative(),
        gmV: zod_1.z.number().nonnegative(),
        commission: zod_1.z.number().nonnegative(),
        netRevenue: zod_1.z.number().nonnegative(),
        avgOrderValue: zod_1.z.number().positive(),
        avgRating: zod_1.z.number().min(1).max(5),
        reviewCount: zod_1.z.number().nonnegative(),
        visibility: zod_1.z.number().min(1).max(100).optional(),
        conversionRate: zod_1.z.number().min(0).max(100).optional(),
        repeatRate: zod_1.z.number().min(0).max(100).optional(),
    })),
    menuItems: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        category: zod_1.z.string(),
        price: zod_1.z.number(),
        popularity: zod_1.z.number().min(0).max(100).optional(),
    })),
    competitorData: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        rating: zod_1.z.number().min(1).max(5),
        priceRange: zod_1.z.string(),
        popularItems: zod_1.z.array(zod_1.z.string()),
    })).optional(),
});
exports.GrowthSchema = zod_1.z.object({
    restaurantId: zod_1.z.string().min(1),
    restaurantProfile: zod_1.z.object({
        id: zod_1.z.string().min(1),
        name: zod_1.z.string().min(1),
        cuisine: zod_1.z.array(zod_1.z.string()),
        location: zod_1.z.string(),
        priceRange: zod_1.z.enum(['budget', 'mid', 'premium', 'luxury']),
        seatingCapacity: zod_1.z.number().positive(),
        avgOrderValue: zod_1.z.number().positive(),
        monthlyRevenue: zod_1.z.number().nonnegative(),
        operatingHours: zod_1.z.record(zod_1.z.object({
            open: zod_1.z.string(),
            close: zod_1.z.string(),
            closed: zod_1.z.boolean().optional(),
        })),
    }),
    financialMetrics: zod_1.z.object({
        monthlyRevenue: zod_1.z.number().nonnegative(),
        monthlyOrders: zod_1.z.number().nonnegative(),
        avgOrderValue: zod_1.z.number().positive(),
    }),
    customerMetrics: zod_1.z.object({
        totalCustomers: zod_1.z.number().nonnegative(),
        repeatRate: zod_1.z.number().min(0).max(100),
        churnRate: zod_1.z.number().min(0).max(100),
    }),
    platformMetrics: zod_1.z.array(zod_1.z.object({
        platform: zod_1.z.string(),
        orders: zod_1.z.number().nonnegative(),
        revenue: zod_1.z.number().nonnegative(),
    })).optional(),
});
//# sourceMappingURL=index.js.map