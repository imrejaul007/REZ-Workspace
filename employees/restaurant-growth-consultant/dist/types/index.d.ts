import { z } from 'zod';
export interface RestaurantProfile {
    id: string;
    name: string;
    cuisine: string[];
    location: string;
    priceRange: 'budget' | 'mid' | 'premium' | 'luxury';
    seatingCapacity: number;
    avgOrderValue: number;
    monthlyRevenue: number;
    operatingHours: OperatingHours;
}
export interface OperatingHours {
    [day: string]: {
        open: string;
        close: string;
        closed?: boolean;
    };
}
export interface MenuItem {
    id: string;
    name: string;
    category: string;
    description?: string;
    price: number;
    cost: number;
    popularity: number;
    margin?: number;
    prepTime: number;
    imageUrl?: string;
}
export interface MenuAnalysis {
    stars: MenuItem[];
    plowhorses: MenuItem[];
    puzzles: MenuItem[];
    dogs: MenuItem[];
}
export interface MenuRecommendation {
    action: 'promote' | 'reprice' | 'reformulate' | 'remove';
    itemId: string;
    itemName: string;
    currentPrice?: number;
    recommendedPrice?: number;
    reason: string;
    expectedImpact: 'high' | 'medium' | 'low';
}
export interface MenuEngineRequest {
    restaurantId: string;
    menuItems: MenuItem[];
    targetFoodCostPercent?: number;
}
export interface MenuEngineResponse {
    analysis: MenuAnalysis;
    recommendations: MenuRecommendation[];
    averageMargin: number;
    currentFoodCostPercent: number;
    projectedFoodCostPercent: number;
    bestSellers: MenuItem[];
    lowPerformers: MenuItem[];
    newItemsToAdd: {
        name: string;
        category: string;
        priceRange: string;
        reason: string;
    }[];
}
export interface TableMetrics {
    tableId: string;
    seats: number;
    avgTurnTime: number;
    coversPerTurn: number;
    revenuePerTurn: number;
    potentialRevenue: number;
    utilizationPercent: number;
}
export interface TurnoverAnalysis {
    peakHours: {
        hour: number;
        avgCovers: number;
        tableCount: number;
    }[];
    avgTableTurnTime: number;
    targetTurnTime: number;
    currentUtilization: number;
    revenuePerSeatHour: number;
    tables: TableMetrics[];
    bottlenecks: {
        location: string;
        cause: string;
        impact: string;
    }[];
}
export interface TurnoverRequest {
    restaurantId: string;
    operatingHours: OperatingHours;
    currentUtilization: number;
    avgOrderValue: number;
    peakHourCovers: {
        hour: number;
        covers: number;
    }[];
    tableConfigs: {
        tableId: string;
        seats: number;
        avgTurnMinutes: number;
    }[];
}
export interface TurnoverResponse {
    analysis: TurnoverAnalysis;
    recommendations: {
        action: string;
        target: string;
        reason: string;
        expectedImpact: {
            revenueIncrease: number;
            turnsIncrease: number;
        };
    }[];
    scheduleOptimizations: {
        timeSlot: string;
        action: 'add_tables' | 'reduce_tables' | 'no_change';
        tableCount: number;
    }[];
    automation: {
        feature: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
    }[];
}
export interface Ingredient {
    name: string;
    unit: string;
    quantity: number;
    costPerUnit: number;
    supplier: string;
    shelfLife: number;
    reorderPoint: number;
}
export interface DishRecipe {
    dishId: string;
    dishName: string;
    ingredients: {
        name: string;
        quantity: number;
        cost: number;
    }[];
    totalCost: number;
    sellingPrice: number;
    foodCostPercent: number;
    yieldPercent: number;
}
export interface FoodCostAnalysis {
    overallFoodCostPercent: number;
    targetFoodCostPercent: number;
    monthlyFoodSpend: number;
    monthlyPotentialSavings: number;
    vendorAnalysis: {
        vendor: string;
        spend: number;
        savings: number;
        quality: 'poor' | 'average' | 'good' | 'excellent';
        items: string[];
    }[];
    wasteAnalysis: {
        category: string;
        amount: number;
        cost: number;
        percentOfTotal: number;
    }[];
    recipes: DishRecipe[];
}
export interface FoodCostRequest {
    restaurantId: string;
    monthlyRevenue: number;
    monthlyFoodSpend: number;
    targetFoodCostPercent: number;
    ingredients?: Ingredient[];
    recipes?: {
        dishId: string;
        dishName: string;
        ingredients: {
            name: string;
            quantity: number;
            unit: string;
        }[];
        sellingPrice: number;
    }[];
    vendors?: {
        name: string;
        spend: number;
        leadTimeDays: number;
    }[];
}
export interface FoodCostResponse {
    analysis: FoodCostAnalysis;
    recommendations: {
        category: 'vendor' | 'recipe' | 'waste' | 'pricing' | 'inventory';
        action: string;
        item?: string;
        savings: number;
        implementation: string;
    }[];
    costReduction: {
        immediate: number;
        shortTerm: number;
        longTerm: number;
    };
}
export interface LoyaltyTier {
    name: string;
    pointsRequired: number;
    benefits: string[];
    multiplier: number;
    color: string;
}
export interface LoyaltyReward {
    id: string;
    name: string;
    pointsCost: number;
    type: 'discount' | 'free_item' | 'experience' | 'discount_percent';
    minTier?: string;
    available: boolean;
}
export interface LoyaltyProgram {
    id: string;
    name: string;
    tiers: LoyaltyTier[];
    rewards: LoyaltyReward[];
    pointsPerRupee: number;
    birthdayBonus: number;
    referralBonus: number;
}
export interface LoyaltyMetrics {
    totalMembers: number;
    activeMembers: number;
    avgVisitFrequency: number;
    avgOrderValue: number;
    redemptionRate: number;
    memberLifetimeValue: number;
    churnRate: number;
    tierDistribution: {
        tier: string;
        count: number;
        percent: number;
    }[];
}
export interface LoyaltyRequest {
    restaurantId: string;
    restaurantName: string;
    avgOrderValue: number;
    monthlyCustomers: number;
    currentLoyalty?: LoyaltyProgram;
    goals: 'acquire' | 'retain' | 'increase_spend' | 'all';
}
export interface LoyaltyResponse {
    program: LoyaltyProgram;
    metrics: LoyaltyMetrics;
    recommendations: {
        action: string;
        reason: string;
        expectedLift: number;
    }[];
    tierStrategy: {
        tier: string;
        targetPercent: number;
        benefits: string[];
        upgradeCriteria: string;
    }[];
    campaigns: {
        name: string;
        type: 'welcome' | 'reactivation' | 'tier_upgrade' | 'referral';
        description: string;
        expectedResponse: number;
    }[];
}
export interface Review {
    id: string;
    platform: 'zomato' | 'swiggy' | 'google' | 'direct';
    rating: number;
    title?: string;
    text: string;
    date: string;
    response?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    categories?: string[];
}
export interface ReviewAnalysis {
    overallRating: number;
    ratingDistribution: {
        stars: number;
        count: number;
        percent: number;
    }[];
    sentimentBreakdown: {
        sentiment: string;
        count: number;
        percent: number;
    }[];
    categoryScores: {
        category: string;
        score: number;
        trend: 'up' | 'down' | 'stable';
        reviewCount: number;
    }[];
    responseRate: number;
    avgResponseTime: number;
    recentTrends: {
        period: string;
        avgRating: number;
        reviewCount: number;
    }[];
    competitorAvg?: number;
}
export interface ReviewRequest {
    restaurantId: string;
    platform?: 'zomato' | 'swiggy' | 'google' | 'all';
    reviews: Omit<Review, 'id'>[];
    responseTemplates?: {
        sentiment: string;
        template: string;
    }[];
    competitorRatings?: {
        name: string;
        rating: number;
    }[];
}
export interface ReviewResponse {
    analysis: ReviewAnalysis;
    responseSuggestions: {
        reviewId: string;
        suggestedResponse: string;
        sentiment: string;
    }[];
    strategy: {
        priority: 'urgent' | 'high' | 'medium' | 'low';
        action: string;
        reason: string;
    }[];
    campaigns: {
        name: string;
        trigger: string;
        action: string;
        expectedLift: number;
    }[];
    automation: {
        trigger: string;
        action: string;
        enabled: boolean;
    }[];
}
export interface PlatformListing {
    platform: 'zomato' | 'swiggy';
    listingId: string;
    isActive: boolean;
    rating: number;
    reviewCount: number;
    photos?: string[];
    menuItems: {
        id: string;
        name: string;
        price: number;
        available: boolean;
    }[];
    deliveryTime: number;
    packagingCharge: number;
    discount?: number;
}
export interface PlatformMetrics {
    platform: 'zomato' | 'swiggy';
    orders: number;
    gmV: number;
    commission: number;
    netRevenue: number;
    avgOrderValue: number;
    avgRating: number;
    reviewCount: number;
    visibility?: number;
    conversionRate?: number;
    repeatRate?: number;
}
export interface PlatformOptimizationRequest {
    restaurantId: string;
    platform: 'zomato' | 'swiggy' | 'both';
    listings: PlatformListing[];
    metrics: PlatformMetrics[];
    menuItems: {
        id: string;
        name: string;
        category: string;
        price: number;
        popularity?: number;
    }[];
    competitorData?: {
        name: string;
        rating: number;
        priceRange: string;
        popularItems: string[];
    }[];
}
export interface PlatformOptimizationResponse {
    profileOptimization: {
        photoQuality: {
            score: number;
            recommendation: string;
        };
        description: {
            score: number;
            recommendation: string;
        };
        badges: {
            current: string[];
            recommended: string[];
            reason: string;
        };
    };
    menuOptimization: {
        spotlightItems: {
            itemId: string;
            name: string;
            reason: string;
            action: string;
        }[];
        pricingStrategy: {
            approach: string;
            rationale: string;
            expectedImpact: number;
        };
        packagingRecommendation: {
            charge: number;
            suggestion: string;
        };
    };
    operationalOptimization: {
        deliveryTime: {
            current: number;
            target: number;
            recommendations: string[];
        };
        availability: {
            itemsToEnable: string[];
            itemsToDisable: string[];
        };
        busyHours: {
            strategy: string;
            items: {
                itemId: string;
                name: string;
                discount?: number;
            }[];
        };
    };
    reviewStrategy: {
        targetRating: number;
        neededReviews: number;
        reviewSources: {
            source: string;
            weight: number;
            action: string;
        }[];
    };
    commissionOptimization: {
        currentCommission: number;
        recommendedCommission: number;
        subsidyStrategy: {
            minimumOrder: number;
            maxSubsidy: number;
        };
    };
    recommendations: {
        priority: number;
        action: string;
        effort: 'low' | 'medium' | 'high';
        impact: number;
        timeline: string;
    }[];
}
export interface GrowthMetrics {
    currentRevenue: number;
    targetRevenue: number;
    growthRate: number;
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
    avgOrderValue: number;
    orderFrequency: number;
    repeatCustomerRate: number;
}
export interface GrowthRequest {
    restaurantId: string;
    restaurantProfile: RestaurantProfile;
    financialMetrics: {
        monthlyRevenue: number;
        monthlyOrders: number;
        avgOrderValue: number;
    };
    customerMetrics: {
        totalCustomers: number;
        repeatRate: number;
        churnRate: number;
    };
    platformMetrics?: {
        platform: string;
        orders: number;
        revenue: number;
    }[];
}
export interface GrowthResponse {
    currentState: {
        revenue: number;
        customers: number;
        avgOrderValue: number;
        growthRate: number;
    };
    targetState: {
        revenue: number;
        customers: number;
        avgOrderValue: number;
        growthRate: number;
    };
    growthPillars: {
        pillar: string;
        weight: number;
        currentScore: number;
        targetScore: number;
        initiatives: {
            initiative: string;
            impact: number;
            timeline: string;
            effort: string;
        }[];
    }[];
    quickWins: {
        action: string;
        impact: number;
        effort: string;
        timeline: string;
    }[];
    investments: {
        category: string;
        amount: number;
        roi: number;
        paybackMonths: number;
    }[];
    timeline: {
        month: string;
        focus: string;
        keyActions: string[];
        expectedOutcome: string;
    }[];
}
export declare const MenuEngineSchema: z.ZodObject<{
    restaurantId: z.ZodString;
    menuItems: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        category: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        price: z.ZodNumber;
        cost: z.ZodNumber;
        popularity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        prepTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        imageUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        category: string;
        price: number;
        cost: number;
        popularity: number;
        prepTime: number;
        description?: string | undefined;
        imageUrl?: string | undefined;
    }, {
        id: string;
        name: string;
        category: string;
        price: number;
        cost: number;
        description?: string | undefined;
        popularity?: number | undefined;
        prepTime?: number | undefined;
        imageUrl?: string | undefined;
    }>, "many">;
    targetFoodCostPercent: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    restaurantId: string;
    menuItems: {
        id: string;
        name: string;
        category: string;
        price: number;
        cost: number;
        popularity: number;
        prepTime: number;
        description?: string | undefined;
        imageUrl?: string | undefined;
    }[];
    targetFoodCostPercent?: number | undefined;
}, {
    restaurantId: string;
    menuItems: {
        id: string;
        name: string;
        category: string;
        price: number;
        cost: number;
        description?: string | undefined;
        popularity?: number | undefined;
        prepTime?: number | undefined;
        imageUrl?: string | undefined;
    }[];
    targetFoodCostPercent?: number | undefined;
}>;
export declare const TurnoverSchema: z.ZodObject<{
    restaurantId: z.ZodString;
    operatingHours: z.ZodRecord<z.ZodString, z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
        closed: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }>>;
    currentUtilization: z.ZodNumber;
    avgOrderValue: z.ZodNumber;
    peakHourCovers: z.ZodArray<z.ZodObject<{
        hour: z.ZodNumber;
        covers: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        hour: number;
        covers: number;
    }, {
        hour: number;
        covers: number;
    }>, "many">;
    tableConfigs: z.ZodArray<z.ZodObject<{
        tableId: z.ZodString;
        seats: z.ZodNumber;
        avgTurnMinutes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        tableId: string;
        seats: number;
        avgTurnMinutes: number;
    }, {
        tableId: string;
        seats: number;
        avgTurnMinutes: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    restaurantId: string;
    operatingHours: Record<string, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }>;
    currentUtilization: number;
    avgOrderValue: number;
    peakHourCovers: {
        hour: number;
        covers: number;
    }[];
    tableConfigs: {
        tableId: string;
        seats: number;
        avgTurnMinutes: number;
    }[];
}, {
    restaurantId: string;
    operatingHours: Record<string, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }>;
    currentUtilization: number;
    avgOrderValue: number;
    peakHourCovers: {
        hour: number;
        covers: number;
    }[];
    tableConfigs: {
        tableId: string;
        seats: number;
        avgTurnMinutes: number;
    }[];
}>;
export declare const FoodCostSchema: z.ZodObject<{
    restaurantId: z.ZodString;
    monthlyRevenue: z.ZodNumber;
    monthlyFoodSpend: z.ZodNumber;
    targetFoodCostPercent: z.ZodNumber;
    ingredients: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        unit: z.ZodString;
        quantity: z.ZodNumber;
        costPerUnit: z.ZodNumber;
        supplier: z.ZodString;
        shelfLife: z.ZodNumber;
        reorderPoint: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        unit: string;
        quantity: number;
        costPerUnit: number;
        supplier: string;
        shelfLife: number;
        reorderPoint: number;
    }, {
        name: string;
        unit: string;
        quantity: number;
        costPerUnit: number;
        supplier: string;
        shelfLife: number;
        reorderPoint: number;
    }>, "many">>;
    recipes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        dishId: z.ZodString;
        dishName: z.ZodString;
        ingredients: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            quantity: z.ZodNumber;
            unit: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            unit: string;
            quantity: number;
        }, {
            name: string;
            unit: string;
            quantity: number;
        }>, "many">;
        sellingPrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        ingredients: {
            name: string;
            unit: string;
            quantity: number;
        }[];
        dishId: string;
        dishName: string;
        sellingPrice: number;
    }, {
        ingredients: {
            name: string;
            unit: string;
            quantity: number;
        }[];
        dishId: string;
        dishName: string;
        sellingPrice: number;
    }>, "many">>;
    vendors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        spend: z.ZodNumber;
        leadTimeDays: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        spend: number;
        leadTimeDays: number;
    }, {
        name: string;
        spend: number;
        leadTimeDays: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    restaurantId: string;
    targetFoodCostPercent: number;
    monthlyRevenue: number;
    monthlyFoodSpend: number;
    ingredients?: {
        name: string;
        unit: string;
        quantity: number;
        costPerUnit: number;
        supplier: string;
        shelfLife: number;
        reorderPoint: number;
    }[] | undefined;
    recipes?: {
        ingredients: {
            name: string;
            unit: string;
            quantity: number;
        }[];
        dishId: string;
        dishName: string;
        sellingPrice: number;
    }[] | undefined;
    vendors?: {
        name: string;
        spend: number;
        leadTimeDays: number;
    }[] | undefined;
}, {
    restaurantId: string;
    targetFoodCostPercent: number;
    monthlyRevenue: number;
    monthlyFoodSpend: number;
    ingredients?: {
        name: string;
        unit: string;
        quantity: number;
        costPerUnit: number;
        supplier: string;
        shelfLife: number;
        reorderPoint: number;
    }[] | undefined;
    recipes?: {
        ingredients: {
            name: string;
            unit: string;
            quantity: number;
        }[];
        dishId: string;
        dishName: string;
        sellingPrice: number;
    }[] | undefined;
    vendors?: {
        name: string;
        spend: number;
        leadTimeDays: number;
    }[] | undefined;
}>;
export declare const LoyaltySchema: z.ZodObject<{
    restaurantId: z.ZodString;
    restaurantName: z.ZodString;
    avgOrderValue: z.ZodNumber;
    monthlyCustomers: z.ZodNumber;
    currentLoyalty: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        tiers: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            pointsRequired: z.ZodNumber;
            benefits: z.ZodArray<z.ZodString, "many">;
            multiplier: z.ZodNumber;
            color: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            pointsRequired: number;
            benefits: string[];
            multiplier: number;
            color: string;
        }, {
            name: string;
            pointsRequired: number;
            benefits: string[];
            multiplier: number;
            color: string;
        }>, "many">;
        rewards: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            pointsCost: z.ZodNumber;
            type: z.ZodEnum<["discount", "free_item", "experience", "discount_percent"]>;
            minTier: z.ZodOptional<z.ZodString>;
            available: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "discount" | "free_item" | "experience" | "discount_percent";
            name: string;
            pointsCost: number;
            available: boolean;
            minTier?: string | undefined;
        }, {
            id: string;
            type: "discount" | "free_item" | "experience" | "discount_percent";
            name: string;
            pointsCost: number;
            available: boolean;
            minTier?: string | undefined;
        }>, "many">;
        pointsPerRupee: z.ZodNumber;
        birthdayBonus: z.ZodNumber;
        referralBonus: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        tiers: {
            name: string;
            pointsRequired: number;
            benefits: string[];
            multiplier: number;
            color: string;
        }[];
        rewards: {
            id: string;
            type: "discount" | "free_item" | "experience" | "discount_percent";
            name: string;
            pointsCost: number;
            available: boolean;
            minTier?: string | undefined;
        }[];
        pointsPerRupee: number;
        birthdayBonus: number;
        referralBonus: number;
    }, {
        id: string;
        name: string;
        tiers: {
            name: string;
            pointsRequired: number;
            benefits: string[];
            multiplier: number;
            color: string;
        }[];
        rewards: {
            id: string;
            type: "discount" | "free_item" | "experience" | "discount_percent";
            name: string;
            pointsCost: number;
            available: boolean;
            minTier?: string | undefined;
        }[];
        pointsPerRupee: number;
        birthdayBonus: number;
        referralBonus: number;
    }>>;
    goals: z.ZodEnum<["acquire", "retain", "increase_spend", "all"]>;
}, "strip", z.ZodTypeAny, {
    restaurantId: string;
    avgOrderValue: number;
    restaurantName: string;
    monthlyCustomers: number;
    goals: "acquire" | "retain" | "increase_spend" | "all";
    currentLoyalty?: {
        id: string;
        name: string;
        tiers: {
            name: string;
            pointsRequired: number;
            benefits: string[];
            multiplier: number;
            color: string;
        }[];
        rewards: {
            id: string;
            type: "discount" | "free_item" | "experience" | "discount_percent";
            name: string;
            pointsCost: number;
            available: boolean;
            minTier?: string | undefined;
        }[];
        pointsPerRupee: number;
        birthdayBonus: number;
        referralBonus: number;
    } | undefined;
}, {
    restaurantId: string;
    avgOrderValue: number;
    restaurantName: string;
    monthlyCustomers: number;
    goals: "acquire" | "retain" | "increase_spend" | "all";
    currentLoyalty?: {
        id: string;
        name: string;
        tiers: {
            name: string;
            pointsRequired: number;
            benefits: string[];
            multiplier: number;
            color: string;
        }[];
        rewards: {
            id: string;
            type: "discount" | "free_item" | "experience" | "discount_percent";
            name: string;
            pointsCost: number;
            available: boolean;
            minTier?: string | undefined;
        }[];
        pointsPerRupee: number;
        birthdayBonus: number;
        referralBonus: number;
    } | undefined;
}>;
export declare const ReviewSchema: z.ZodObject<{
    restaurantId: z.ZodString;
    platform: z.ZodOptional<z.ZodEnum<["zomato", "swiggy", "google", "all"]>>;
    reviews: z.ZodArray<z.ZodObject<{
        platform: z.ZodEnum<["zomato", "swiggy", "google", "direct"]>;
        rating: z.ZodNumber;
        title: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
        date: z.ZodString;
        response: z.ZodOptional<z.ZodString>;
        sentiment: z.ZodOptional<z.ZodEnum<["positive", "neutral", "negative"]>>;
        categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        platform: "zomato" | "swiggy" | "google" | "direct";
        rating: number;
        text: string;
        date: string;
        title?: string | undefined;
        response?: string | undefined;
        sentiment?: "positive" | "neutral" | "negative" | undefined;
        categories?: string[] | undefined;
    }, {
        platform: "zomato" | "swiggy" | "google" | "direct";
        rating: number;
        text: string;
        date: string;
        title?: string | undefined;
        response?: string | undefined;
        sentiment?: "positive" | "neutral" | "negative" | undefined;
        categories?: string[] | undefined;
    }>, "many">;
    responseTemplates: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sentiment: z.ZodString;
        template: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sentiment: string;
        template: string;
    }, {
        sentiment: string;
        template: string;
    }>, "many">>;
    competitorRatings: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        rating: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        rating: number;
        name: string;
    }, {
        rating: number;
        name: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    restaurantId: string;
    reviews: {
        platform: "zomato" | "swiggy" | "google" | "direct";
        rating: number;
        text: string;
        date: string;
        title?: string | undefined;
        response?: string | undefined;
        sentiment?: "positive" | "neutral" | "negative" | undefined;
        categories?: string[] | undefined;
    }[];
    platform?: "all" | "zomato" | "swiggy" | "google" | undefined;
    responseTemplates?: {
        sentiment: string;
        template: string;
    }[] | undefined;
    competitorRatings?: {
        rating: number;
        name: string;
    }[] | undefined;
}, {
    restaurantId: string;
    reviews: {
        platform: "zomato" | "swiggy" | "google" | "direct";
        rating: number;
        text: string;
        date: string;
        title?: string | undefined;
        response?: string | undefined;
        sentiment?: "positive" | "neutral" | "negative" | undefined;
        categories?: string[] | undefined;
    }[];
    platform?: "all" | "zomato" | "swiggy" | "google" | undefined;
    responseTemplates?: {
        sentiment: string;
        template: string;
    }[] | undefined;
    competitorRatings?: {
        rating: number;
        name: string;
    }[] | undefined;
}>;
export declare const PlatformOptimizationSchema: z.ZodObject<{
    restaurantId: z.ZodString;
    platform: z.ZodEnum<["zomato", "swiggy", "both"]>;
    listings: z.ZodArray<z.ZodObject<{
        platform: z.ZodEnum<["zomato", "swiggy"]>;
        listingId: z.ZodString;
        isActive: z.ZodBoolean;
        rating: z.ZodNumber;
        reviewCount: z.ZodNumber;
        photos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        menuItems: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            price: z.ZodNumber;
            available: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            price: number;
            available: boolean;
        }, {
            id: string;
            name: string;
            price: number;
            available: boolean;
        }>, "many">;
        deliveryTime: z.ZodNumber;
        packagingCharge: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        platform: "zomato" | "swiggy";
        rating: number;
        menuItems: {
            id: string;
            name: string;
            price: number;
            available: boolean;
        }[];
        listingId: string;
        isActive: boolean;
        reviewCount: number;
        deliveryTime: number;
        packagingCharge: number;
        discount?: number | undefined;
        photos?: string[] | undefined;
    }, {
        platform: "zomato" | "swiggy";
        rating: number;
        menuItems: {
            id: string;
            name: string;
            price: number;
            available: boolean;
        }[];
        listingId: string;
        isActive: boolean;
        reviewCount: number;
        deliveryTime: number;
        packagingCharge: number;
        discount?: number | undefined;
        photos?: string[] | undefined;
    }>, "many">;
    metrics: z.ZodArray<z.ZodObject<{
        platform: z.ZodEnum<["zomato", "swiggy"]>;
        orders: z.ZodNumber;
        gmV: z.ZodNumber;
        commission: z.ZodNumber;
        netRevenue: z.ZodNumber;
        avgOrderValue: z.ZodNumber;
        avgRating: z.ZodNumber;
        reviewCount: z.ZodNumber;
        visibility: z.ZodOptional<z.ZodNumber>;
        conversionRate: z.ZodOptional<z.ZodNumber>;
        repeatRate: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        platform: "zomato" | "swiggy";
        avgOrderValue: number;
        reviewCount: number;
        orders: number;
        gmV: number;
        commission: number;
        netRevenue: number;
        avgRating: number;
        visibility?: number | undefined;
        conversionRate?: number | undefined;
        repeatRate?: number | undefined;
    }, {
        platform: "zomato" | "swiggy";
        avgOrderValue: number;
        reviewCount: number;
        orders: number;
        gmV: number;
        commission: number;
        netRevenue: number;
        avgRating: number;
        visibility?: number | undefined;
        conversionRate?: number | undefined;
        repeatRate?: number | undefined;
    }>, "many">;
    menuItems: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        category: z.ZodString;
        price: z.ZodNumber;
        popularity: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        category: string;
        price: number;
        popularity?: number | undefined;
    }, {
        id: string;
        name: string;
        category: string;
        price: number;
        popularity?: number | undefined;
    }>, "many">;
    competitorData: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        rating: z.ZodNumber;
        priceRange: z.ZodString;
        popularItems: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        rating: number;
        name: string;
        priceRange: string;
        popularItems: string[];
    }, {
        rating: number;
        name: string;
        priceRange: string;
        popularItems: string[];
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    platform: "zomato" | "swiggy" | "both";
    restaurantId: string;
    menuItems: {
        id: string;
        name: string;
        category: string;
        price: number;
        popularity?: number | undefined;
    }[];
    listings: {
        platform: "zomato" | "swiggy";
        rating: number;
        menuItems: {
            id: string;
            name: string;
            price: number;
            available: boolean;
        }[];
        listingId: string;
        isActive: boolean;
        reviewCount: number;
        deliveryTime: number;
        packagingCharge: number;
        discount?: number | undefined;
        photos?: string[] | undefined;
    }[];
    metrics: {
        platform: "zomato" | "swiggy";
        avgOrderValue: number;
        reviewCount: number;
        orders: number;
        gmV: number;
        commission: number;
        netRevenue: number;
        avgRating: number;
        visibility?: number | undefined;
        conversionRate?: number | undefined;
        repeatRate?: number | undefined;
    }[];
    competitorData?: {
        rating: number;
        name: string;
        priceRange: string;
        popularItems: string[];
    }[] | undefined;
}, {
    platform: "zomato" | "swiggy" | "both";
    restaurantId: string;
    menuItems: {
        id: string;
        name: string;
        category: string;
        price: number;
        popularity?: number | undefined;
    }[];
    listings: {
        platform: "zomato" | "swiggy";
        rating: number;
        menuItems: {
            id: string;
            name: string;
            price: number;
            available: boolean;
        }[];
        listingId: string;
        isActive: boolean;
        reviewCount: number;
        deliveryTime: number;
        packagingCharge: number;
        discount?: number | undefined;
        photos?: string[] | undefined;
    }[];
    metrics: {
        platform: "zomato" | "swiggy";
        avgOrderValue: number;
        reviewCount: number;
        orders: number;
        gmV: number;
        commission: number;
        netRevenue: number;
        avgRating: number;
        visibility?: number | undefined;
        conversionRate?: number | undefined;
        repeatRate?: number | undefined;
    }[];
    competitorData?: {
        rating: number;
        name: string;
        priceRange: string;
        popularItems: string[];
    }[] | undefined;
}>;
export declare const GrowthSchema: z.ZodObject<{
    restaurantId: z.ZodString;
    restaurantProfile: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        cuisine: z.ZodArray<z.ZodString, "many">;
        location: z.ZodString;
        priceRange: z.ZodEnum<["budget", "mid", "premium", "luxury"]>;
        seatingCapacity: z.ZodNumber;
        avgOrderValue: z.ZodNumber;
        monthlyRevenue: z.ZodNumber;
        operatingHours: z.ZodRecord<z.ZodString, z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
            closed: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            open: string;
            close: string;
            closed?: boolean | undefined;
        }, {
            open: string;
            close: string;
            closed?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        operatingHours: Record<string, {
            open: string;
            close: string;
            closed?: boolean | undefined;
        }>;
        avgOrderValue: number;
        monthlyRevenue: number;
        priceRange: "budget" | "mid" | "premium" | "luxury";
        cuisine: string[];
        location: string;
        seatingCapacity: number;
    }, {
        id: string;
        name: string;
        operatingHours: Record<string, {
            open: string;
            close: string;
            closed?: boolean | undefined;
        }>;
        avgOrderValue: number;
        monthlyRevenue: number;
        priceRange: "budget" | "mid" | "premium" | "luxury";
        cuisine: string[];
        location: string;
        seatingCapacity: number;
    }>;
    financialMetrics: z.ZodObject<{
        monthlyRevenue: z.ZodNumber;
        monthlyOrders: z.ZodNumber;
        avgOrderValue: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        avgOrderValue: number;
        monthlyRevenue: number;
        monthlyOrders: number;
    }, {
        avgOrderValue: number;
        monthlyRevenue: number;
        monthlyOrders: number;
    }>;
    customerMetrics: z.ZodObject<{
        totalCustomers: z.ZodNumber;
        repeatRate: z.ZodNumber;
        churnRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        repeatRate: number;
        totalCustomers: number;
        churnRate: number;
    }, {
        repeatRate: number;
        totalCustomers: number;
        churnRate: number;
    }>;
    platformMetrics: z.ZodOptional<z.ZodArray<z.ZodObject<{
        platform: z.ZodString;
        orders: z.ZodNumber;
        revenue: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        platform: string;
        orders: number;
        revenue: number;
    }, {
        platform: string;
        orders: number;
        revenue: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    restaurantId: string;
    restaurantProfile: {
        id: string;
        name: string;
        operatingHours: Record<string, {
            open: string;
            close: string;
            closed?: boolean | undefined;
        }>;
        avgOrderValue: number;
        monthlyRevenue: number;
        priceRange: "budget" | "mid" | "premium" | "luxury";
        cuisine: string[];
        location: string;
        seatingCapacity: number;
    };
    financialMetrics: {
        avgOrderValue: number;
        monthlyRevenue: number;
        monthlyOrders: number;
    };
    customerMetrics: {
        repeatRate: number;
        totalCustomers: number;
        churnRate: number;
    };
    platformMetrics?: {
        platform: string;
        orders: number;
        revenue: number;
    }[] | undefined;
}, {
    restaurantId: string;
    restaurantProfile: {
        id: string;
        name: string;
        operatingHours: Record<string, {
            open: string;
            close: string;
            closed?: boolean | undefined;
        }>;
        avgOrderValue: number;
        monthlyRevenue: number;
        priceRange: "budget" | "mid" | "premium" | "luxury";
        cuisine: string[];
        location: string;
        seatingCapacity: number;
    };
    financialMetrics: {
        avgOrderValue: number;
        monthlyRevenue: number;
        monthlyOrders: number;
    };
    customerMetrics: {
        repeatRate: number;
        totalCustomers: number;
        churnRate: number;
    };
    platformMetrics?: {
        platform: string;
        orders: number;
        revenue: number;
    }[] | undefined;
}>;
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    metadata?: {
        processingTime: number;
        model?: string;
        confidence?: number;
    };
}
//# sourceMappingURL=index.d.ts.map