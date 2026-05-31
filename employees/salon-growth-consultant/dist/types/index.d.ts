import { z } from 'zod';
export interface SalonProfile {
    id: string;
    name: string;
    location: string;
    type: 'salon' | 'spa' | 'beauty_parlor' | 'unisex' | 'unisex_premium';
    services: string[];
    priceRange: 'budget' | 'mid' | 'premium' | 'luxury';
    seatingCapacity: number;
    stations: number;
    avgServiceValue: number;
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
export interface StaffMember {
    id: string;
    name: string;
    role: 'stylist' | 'senior_stylist' | 'colorist' | 'senior_colorist' | 'beautician' | 'masseur' | 'manager' | 'receptionist';
    services: string[];
    experience: number;
    rating: number;
    monthlyClients: number;
    avgServiceDuration: number;
    salary: number;
    commission?: number;
    availability: WeeklyAvailability;
}
export interface WeeklyAvailability {
    [day: string]: {
        start: string;
        end: string;
        available: boolean;
    };
}
export interface StaffUtilization {
    staffId: string;
    staffName: string;
    role: string;
    totalCapacity: number;
    bookedMinutes: number;
    utilizationPercent: number;
    revenue: number;
    revenuePerHour: number;
    avgClientRating: number;
    peakHours: {
        hour: number;
        utilization: number;
    }[];
    utilizationTrend: 'up' | 'down' | 'stable';
}
export interface StaffAnalysis {
    overallUtilization: number;
    targetUtilization: number;
    topPerformers: StaffUtilization[];
    underperformers: StaffUtilization[];
    utilizationByRole: {
        role: string;
        utilization: number;
        staffCount: number;
    }[];
    revenueByStaff: {
        staffId: string;
        name: string;
        revenue: number;
    }[];
    capacityGaps: {
        timeSlot: string;
        shortfall: number;
        recommendation: string;
    }[];
    recommendations: {
        category: 'rebooking' | 'pricing' | 'training' | 'scheduling' | 'incentive';
        action: string;
        targetStaff?: string;
        expectedImpact: number;
        priority: 'high' | 'medium' | 'low';
    }[];
}
export interface StaffConsultRequest {
    salonId: string;
    staff: StaffMember[];
    services: Service[];
    appointments: Appointment[];
    dateRange?: {
        start: string;
        end: string;
    };
}
export interface StaffConsultResponse {
    analysis: StaffAnalysis;
    rebookingCampaigns: {
        targetStaff: string;
        clientCount: number;
        action: string;
        expectedRetentionLift: number;
    }[];
    trainingNeeds: {
        skill: string;
        staffIds: string[];
        priority: 'urgent' | 'high' | 'medium';
    }[];
}
export interface Service {
    id: string;
    name: string;
    category: 'hair' | 'skin' | 'nails' | 'spa' | 'makeup' | 'waxing' | 'mens' | 'other';
    price: number;
    cost: number;
    duration: number;
    popularity: number;
    requiresStylist?: boolean;
    allowsUpsell?: boolean;
    seasonality?: {
        peak: string[];
        low: string[];
    };
}
export interface ServiceMix {
    serviceId: string;
    name: string;
    category: string;
    bookings: number;
    revenue: number;
    avgDuration: number;
    upsellRate: number;
    repeatRate: number;
    margin: number;
}
export interface BookingAnalysis {
    totalBookings: number;
    bookingTrends: {
        week: string;
        bookings: number;
        revenue: number;
    }[];
    serviceMix: ServiceMix[];
    peakSlots: {
        time: string;
        demand: number;
        capacity: number;
    }[];
    lowSlots: {
        time: string;
        demand: number;
        utilization: number;
    }[];
    repeatRate: number;
    noShowRate: number;
    cancellationRate: number;
}
export interface BookingConsultRequest {
    salonId: string;
    services: Service[];
    appointments: Appointment[];
    clients: Client[];
    dateRange?: {
        start: string;
        end: string;
    };
}
export interface BookingConsultResponse {
    analysis: BookingAnalysis;
    recommendations: {
        category: 'timing' | 'pricing' | 'service' | 'retention' | 'upsell';
        action: string;
        expectedImpact: number;
        implementation: string;
        priority: 'high' | 'medium' | 'low';
    }[];
    upsellOpportunities: {
        service: string;
        toService: string;
        combination: string;
        pricePoint: number;
        marginBoost: number;
    }[];
    retentionStrategies: {
        trigger: string;
        action: string;
        targetSegment: string;
        expectedLift: number;
    }[];
}
export interface Client {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
    visitCount: number;
    avgSpend: number;
    lastVisit?: string;
    preferredServices?: string[];
    preferredStaff?: string;
    birthday?: string;
    tags?: string[];
    lifecycleStage?: 'new' | 'active' | 'at_risk' | 'dormant' | 'VIP';
}
export interface ClientMetrics {
    totalClients: number;
    newClients: number;
    returningClients: number;
    atRiskClients: number;
    dormantClients: number;
    VIPClients: number;
    avgLifetimeValue: number;
    avgVisitFrequency: number;
    repeatRate: number;
    churnRate: number;
}
export interface Appointment {
    id: string;
    clientId?: string;
    staffId: string;
    serviceId: string;
    dateTime: string;
    duration: number;
    price?: number;
    status: 'booked' | 'completed' | 'cancelled' | 'no_show';
    source?: 'walk_in' | 'phone' | 'online' | 'whatsapp' | 'app';
    upsells?: {
        serviceId: string;
        price: number;
    }[];
}
export interface MembershipTier {
    name: string;
    pointsRequired: number;
    monthlyFee: number;
    benefits: string[];
    discount: number;
    multiplier: number;
    color: string;
    perks: {
        category: 'discount' | 'free_service' | 'priority' | 'exclusive' | 'points';
        item: string;
        value: number;
        frequency?: 'monthly' | 'quarterly' | 'annually';
    }[];
}
export interface Membership {
    id: string;
    name: string;
    tiers: MembershipTier[];
    pointsPerRupee: number;
    pointsValue: number;
    birthdayBonus: number;
    referralBonus: number;
    expiry: 'never' | 'months' | 'years';
    expiryMonths?: number;
}
export interface MembershipMetrics {
    totalMembers: number;
    activeMembers: number;
    premiumMembers: number;
    monthlyRecurringRevenue: number;
    avgMemberValue: number;
    churnRate: number;
    redemptionRate: number;
    tierDistribution: {
        tier: string;
        count: number;
        percent: number;
        revenue: number;
    }[];
}
export interface MembershipConsultRequest {
    salonId: string;
    salonName: string;
    avgServiceValue: number;
    monthlyClients: number;
    clientMetrics: ClientMetrics;
    currentMembership?: Membership;
    goals: 'acquire' | 'retain' | 'increase_spend' | 'all';
}
export interface MembershipConsultResponse {
    program: Membership;
    metrics: MembershipMetrics;
    recommendations: {
        action: string;
        reason: string;
        expectedLift: number;
        timeline: string;
    }[];
    tierStrategy: {
        tier: string;
        targetPercent: number;
        benefits: string[];
        upgradeCriteria: string;
    }[];
    campaigns: {
        name: string;
        type: 'welcome' | 'upgrade' | 'reactivation' | 'referral' | 'birthday';
        description: string;
        targetSegment: string;
        expectedConversion: number;
    }[];
    projectedImpact: {
        memberGrowth: number;
        revenueIncrease: number;
        retentionLift: number;
        mrrIncrease: number;
    };
}
export interface BeautyPackage {
    id: string;
    name: string;
    description: string;
    services: {
        serviceId: string;
        name: string;
        originalPrice: number;
        discountedPrice: number;
    }[];
    totalOriginalPrice: number;
    packagePrice: number;
    discountPercent: number;
    margin: number;
    validity: number;
    targetSegment: 'new_client' | 'regular' | 'premium' | 'seasonal' | 'bridal';
    category: 'bridal' | 'party' | 'regular' | 'mens' | 'seasonal' | 'custom';
    popularity?: number;
    projectedSales?: number;
}
export interface PackageAnalysis {
    currentPackages: BeautyPackage[];
    packageRevenue: number;
    packageMargin: number;
    conversionRate: number;
    avgPackageValue: number;
    categoryBreakdown: {
        category: string;
        revenue: number;
        percent: number;
    }[];
    seasonalPatterns: {
        season: string;
        topPackage: string;
        sales: number;
    }[];
}
export interface PackageConsultRequest {
    salonId: string;
    services: Service[];
    clients: Client[];
    currentPackages?: BeautyPackage[];
    focusAreas?: string[];
}
export interface PackageConsultResponse {
    analysis: PackageAnalysis;
    recommendations: {
        action: 'create' | 'modify' | 'discontinue' | 'promote';
        package?: BeautyPackage;
        category?: string;
        description: string;
        expectedImpact: number;
        priority: 'high' | 'medium' | 'low';
    }[];
    newPackages: BeautyPackage[];
    seasonalBundles: {
        season: string;
        occasion: string;
        package: BeautyPackage;
        marketingPush: string;
    }[];
    upsellPaths: {
        fromPackage: string;
        toPackage: string;
        trigger: string;
        expectedConversion: number;
    }[];
}
export interface ScheduleSlot {
    date: string;
    time: string;
    staffId: string;
    serviceId?: string;
    booked: boolean;
    clientId?: string;
    appointmentId?: string;
}
export interface ScheduleOptimization {
    avgUtilization: number;
    peakCoverage: {
        slot: string;
        coverage: number;
        demand: number;
    }[];
    understaffedSlots: {
        day: string;
        time: string;
        demand: number;
        staff: number;
    }[];
    overstaffedSlots: {
        day: string;
        time: string;
        staff: number;
        utilization: number;
    }[];
    revenueOpportunity: {
        category: string;
        opportunity: string;
        potential: number;
    }[];
}
export interface ScheduleConsultRequest {
    salonId: string;
    staff: StaffMember[];
    services: Service[];
    appointments: Appointment[];
    holidays?: string[];
    targetUtilization?: number;
}
export interface ScheduleConsultResponse {
    optimization: ScheduleOptimization;
    recommendations: {
        category: 'staffing' | 'booking' | 'incentive' | 'marketing';
        action: string;
        implementation: string;
        expectedImpact: number;
        priority: 'high' | 'medium' | 'low';
    }[];
    optimalSchedule: {
        day: string;
        slots: {
            time: string;
            staffCount: number;
            targetUtilization: number;
        }[];
    }[];
    bufferRecommendations: {
        service: string;
        currentBuffer: number;
        recommendedBuffer: number;
        reason: string;
    }[];
    incentiveRecommendations: {
        period: string;
        target: string;
        incentive: string;
        expectedLift: number;
    }[];
}
export interface GrowthMetrics {
    currentRevenue: number;
    targetRevenue: number;
    growthRate: number;
    clientAcquisitionCost: number;
    clientLifetimeValue: number;
    avgServiceValue: number;
    serviceFrequency: number;
    repeatClientRate: number;
}
export interface GrowthConsultRequest {
    salonId: string;
    salonProfile: SalonProfile;
    financialMetrics: {
        monthlyRevenue: number;
        monthlyClients: number;
        avgServiceValue: number;
    };
    clientMetrics: ClientMetrics;
    staffMetrics?: {
        totalStaff: number;
        utilization: number;
        avgRating: number;
    };
}
export interface GrowthConsultResponse {
    currentState: {
        revenue: number;
        clients: number;
        avgServiceValue: number;
        growthRate: number;
        staffUtilization: number;
    };
    targetState: {
        revenue: number;
        clients: number;
        avgServiceValue: number;
        growthRate: number;
        staffUtilization: number;
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
export declare const StaffConsultSchema: z.ZodObject<{
    salonId: z.ZodString;
    staff: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        role: z.ZodEnum<["stylist", "senior_stylist", "colorist", "senior_colorist", "beautician", "masseur", "manager", "receptionist"]>;
        services: z.ZodArray<z.ZodString, "many">;
        experience: z.ZodNumber;
        rating: z.ZodNumber;
        monthlyClients: z.ZodNumber;
        avgServiceDuration: z.ZodNumber;
        salary: z.ZodNumber;
        commission: z.ZodOptional<z.ZodNumber>;
        availability: z.ZodRecord<z.ZodString, z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
            available: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            start: string;
            end: string;
            available: boolean;
        }, {
            start: string;
            end: string;
            available: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        role: "stylist" | "senior_stylist" | "colorist" | "senior_colorist" | "beautician" | "masseur" | "manager" | "receptionist";
        services: string[];
        experience: number;
        rating: number;
        monthlyClients: number;
        avgServiceDuration: number;
        salary: number;
        availability: Record<string, {
            start: string;
            end: string;
            available: boolean;
        }>;
        commission?: number | undefined;
    }, {
        id: string;
        name: string;
        role: "stylist" | "senior_stylist" | "colorist" | "senior_colorist" | "beautician" | "masseur" | "manager" | "receptionist";
        services: string[];
        experience: number;
        rating: number;
        monthlyClients: number;
        avgServiceDuration: number;
        salary: number;
        availability: Record<string, {
            start: string;
            end: string;
            available: boolean;
        }>;
        commission?: number | undefined;
    }>, "many">;
    services: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        category: z.ZodEnum<["hair", "skin", "nails", "spa", "makeup", "waxing", "mens", "other"]>;
        price: z.ZodNumber;
        cost: z.ZodNumber;
        duration: z.ZodNumber;
        popularity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        cost: number;
        duration: number;
        popularity: number;
    }, {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        cost: number;
        duration: number;
        popularity?: number | undefined;
    }>, "many">;
    appointments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        clientId: z.ZodString;
        staffId: z.ZodString;
        serviceId: z.ZodString;
        dateTime: z.ZodString;
        duration: z.ZodNumber;
        price: z.ZodNumber;
        status: z.ZodEnum<["booked", "completed", "cancelled", "no_show"]>;
        source: z.ZodEnum<["walk_in", "phone", "online", "whatsapp", "app"]>;
    }, "strip", z.ZodTypeAny, {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        price: number;
        duration: number;
        clientId: string;
        staffId: string;
        serviceId: string;
        dateTime: string;
        source: "walk_in" | "phone" | "online" | "whatsapp" | "app";
    }, {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        price: number;
        duration: number;
        clientId: string;
        staffId: string;
        serviceId: string;
        dateTime: string;
        source: "walk_in" | "phone" | "online" | "whatsapp" | "app";
    }>, "many">;
    dateRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        start: string;
        end: string;
    }, {
        start: string;
        end: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    salonId: string;
    staff: {
        id: string;
        name: string;
        role: "stylist" | "senior_stylist" | "colorist" | "senior_colorist" | "beautician" | "masseur" | "manager" | "receptionist";
        services: string[];
        experience: number;
        rating: number;
        monthlyClients: number;
        avgServiceDuration: number;
        salary: number;
        availability: Record<string, {
            start: string;
            end: string;
            available: boolean;
        }>;
        commission?: number | undefined;
    }[];
    services: {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        cost: number;
        duration: number;
        popularity: number;
    }[];
    appointments: {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        price: number;
        duration: number;
        clientId: string;
        staffId: string;
        serviceId: string;
        dateTime: string;
        source: "walk_in" | "phone" | "online" | "whatsapp" | "app";
    }[];
    dateRange?: {
        start: string;
        end: string;
    } | undefined;
}, {
    salonId: string;
    staff: {
        id: string;
        name: string;
        role: "stylist" | "senior_stylist" | "colorist" | "senior_colorist" | "beautician" | "masseur" | "manager" | "receptionist";
        services: string[];
        experience: number;
        rating: number;
        monthlyClients: number;
        avgServiceDuration: number;
        salary: number;
        availability: Record<string, {
            start: string;
            end: string;
            available: boolean;
        }>;
        commission?: number | undefined;
    }[];
    services: {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        cost: number;
        duration: number;
        popularity?: number | undefined;
    }[];
    appointments: {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        price: number;
        duration: number;
        clientId: string;
        staffId: string;
        serviceId: string;
        dateTime: string;
        source: "walk_in" | "phone" | "online" | "whatsapp" | "app";
    }[];
    dateRange?: {
        start: string;
        end: string;
    } | undefined;
}>;
export declare const BookingConsultSchema: z.ZodObject<{
    salonId: z.ZodString;
    services: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        category: z.ZodEnum<["hair", "skin", "nails", "spa", "makeup", "waxing", "mens", "other"]>;
        price: z.ZodNumber;
        cost: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        duration: z.ZodNumber;
        popularity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        allowsUpsell: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        cost: number;
        duration: number;
        popularity: number;
        allowsUpsell: boolean;
    }, {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        duration: number;
        cost?: number | undefined;
        popularity?: number | undefined;
        allowsUpsell?: boolean | undefined;
    }>, "many">;
    appointments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        clientId: z.ZodString;
        staffId: z.ZodString;
        serviceId: z.ZodString;
        dateTime: z.ZodString;
        duration: z.ZodNumber;
        price: z.ZodNumber;
        status: z.ZodEnum<["booked", "completed", "cancelled", "no_show"]>;
        source: z.ZodDefault<z.ZodOptional<z.ZodEnum<["walk_in", "phone", "online", "whatsapp", "app"]>>>;
        upsells: z.ZodOptional<z.ZodArray<z.ZodObject<{
            serviceId: z.ZodString;
            price: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            price: number;
            serviceId: string;
        }, {
            price: number;
            serviceId: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        price: number;
        duration: number;
        clientId: string;
        staffId: string;
        serviceId: string;
        dateTime: string;
        source: "walk_in" | "phone" | "online" | "whatsapp" | "app";
        upsells?: {
            price: number;
            serviceId: string;
        }[] | undefined;
    }, {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        price: number;
        duration: number;
        clientId: string;
        staffId: string;
        serviceId: string;
        dateTime: string;
        source?: "walk_in" | "phone" | "online" | "whatsapp" | "app" | undefined;
        upsells?: {
            price: number;
            serviceId: string;
        }[] | undefined;
    }>, "many">;
    clients: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        visitCount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        avgSpend: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        lastVisit: z.ZodOptional<z.ZodString>;
        lifecycleStage: z.ZodDefault<z.ZodOptional<z.ZodEnum<["new", "active", "at_risk", "dormant", "VIP"]>>>;
        tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        preferredServices: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        birthday: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        visitCount: number;
        avgSpend: number;
        lifecycleStage: "new" | "active" | "at_risk" | "dormant" | "VIP";
        tags: string[];
        preferredServices: string[];
        phone?: string | undefined;
        birthday?: string | undefined;
        name?: string | undefined;
        lastVisit?: string | undefined;
    }, {
        id: string;
        phone?: string | undefined;
        birthday?: string | undefined;
        name?: string | undefined;
        visitCount?: number | undefined;
        avgSpend?: number | undefined;
        lastVisit?: string | undefined;
        lifecycleStage?: "new" | "active" | "at_risk" | "dormant" | "VIP" | undefined;
        tags?: string[] | undefined;
        preferredServices?: string[] | undefined;
    }>, "many">;
    dateRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        start: string;
        end: string;
    }, {
        start: string;
        end: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    salonId: string;
    services: {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        cost: number;
        duration: number;
        popularity: number;
        allowsUpsell: boolean;
    }[];
    appointments: {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        price: number;
        duration: number;
        clientId: string;
        staffId: string;
        serviceId: string;
        dateTime: string;
        source: "walk_in" | "phone" | "online" | "whatsapp" | "app";
        upsells?: {
            price: number;
            serviceId: string;
        }[] | undefined;
    }[];
    clients: {
        id: string;
        visitCount: number;
        avgSpend: number;
        lifecycleStage: "new" | "active" | "at_risk" | "dormant" | "VIP";
        tags: string[];
        preferredServices: string[];
        phone?: string | undefined;
        birthday?: string | undefined;
        name?: string | undefined;
        lastVisit?: string | undefined;
    }[];
    dateRange?: {
        start: string;
        end: string;
    } | undefined;
}, {
    salonId: string;
    services: {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        duration: number;
        cost?: number | undefined;
        popularity?: number | undefined;
        allowsUpsell?: boolean | undefined;
    }[];
    appointments: {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        price: number;
        duration: number;
        clientId: string;
        staffId: string;
        serviceId: string;
        dateTime: string;
        source?: "walk_in" | "phone" | "online" | "whatsapp" | "app" | undefined;
        upsells?: {
            price: number;
            serviceId: string;
        }[] | undefined;
    }[];
    clients: {
        id: string;
        phone?: string | undefined;
        birthday?: string | undefined;
        name?: string | undefined;
        visitCount?: number | undefined;
        avgSpend?: number | undefined;
        lastVisit?: string | undefined;
        lifecycleStage?: "new" | "active" | "at_risk" | "dormant" | "VIP" | undefined;
        tags?: string[] | undefined;
        preferredServices?: string[] | undefined;
    }[];
    dateRange?: {
        start: string;
        end: string;
    } | undefined;
}>;
export declare const MembershipConsultSchema: z.ZodObject<{
    salonId: z.ZodString;
    salonName: z.ZodString;
    avgServiceValue: z.ZodNumber;
    monthlyClients: z.ZodNumber;
    clientMetrics: z.ZodObject<{
        totalClients: z.ZodNumber;
        newClients: z.ZodNumber;
        returningClients: z.ZodNumber;
        atRiskClients: z.ZodNumber;
        dormantClients: z.ZodNumber;
        VIPClients: z.ZodNumber;
        avgLifetimeValue: z.ZodNumber;
        avgVisitFrequency: z.ZodNumber;
        repeatRate: z.ZodNumber;
        churnRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalClients: number;
        newClients: number;
        returningClients: number;
        atRiskClients: number;
        dormantClients: number;
        VIPClients: number;
        avgLifetimeValue: number;
        avgVisitFrequency: number;
        repeatRate: number;
        churnRate: number;
    }, {
        totalClients: number;
        newClients: number;
        returningClients: number;
        atRiskClients: number;
        dormantClients: number;
        VIPClients: number;
        avgLifetimeValue: number;
        avgVisitFrequency: number;
        repeatRate: number;
        churnRate: number;
    }>;
    currentMembership: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        tiers: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            pointsRequired: z.ZodNumber;
            monthlyFee: z.ZodNumber;
            benefits: z.ZodArray<z.ZodString, "many">;
            discount: z.ZodNumber;
            multiplier: z.ZodNumber;
            color: z.ZodString;
            perks: z.ZodArray<z.ZodObject<{
                category: z.ZodEnum<["discount", "free_service", "priority", "exclusive", "points"]>;
                item: z.ZodString;
                value: z.ZodNumber;
                frequency: z.ZodOptional<z.ZodEnum<["monthly", "quarterly", "annually"]>>;
            }, "strip", z.ZodTypeAny, {
                value: number;
                category: "discount" | "free_service" | "priority" | "exclusive" | "points";
                item: string;
                frequency?: "monthly" | "quarterly" | "annually" | undefined;
            }, {
                value: number;
                category: "discount" | "free_service" | "priority" | "exclusive" | "points";
                item: string;
                frequency?: "monthly" | "quarterly" | "annually" | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            discount: number;
            name: string;
            pointsRequired: number;
            monthlyFee: number;
            benefits: string[];
            multiplier: number;
            color: string;
            perks: {
                value: number;
                category: "discount" | "free_service" | "priority" | "exclusive" | "points";
                item: string;
                frequency?: "monthly" | "quarterly" | "annually" | undefined;
            }[];
        }, {
            discount: number;
            name: string;
            pointsRequired: number;
            monthlyFee: number;
            benefits: string[];
            multiplier: number;
            color: string;
            perks: {
                value: number;
                category: "discount" | "free_service" | "priority" | "exclusive" | "points";
                item: string;
                frequency?: "monthly" | "quarterly" | "annually" | undefined;
            }[];
        }>, "many">;
        pointsPerRupee: z.ZodNumber;
        pointsValue: z.ZodNumber;
        birthdayBonus: z.ZodNumber;
        referralBonus: z.ZodNumber;
        expiry: z.ZodEnum<["never", "months", "years"]>;
        expiryMonths: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        tiers: {
            discount: number;
            name: string;
            pointsRequired: number;
            monthlyFee: number;
            benefits: string[];
            multiplier: number;
            color: string;
            perks: {
                value: number;
                category: "discount" | "free_service" | "priority" | "exclusive" | "points";
                item: string;
                frequency?: "monthly" | "quarterly" | "annually" | undefined;
            }[];
        }[];
        pointsPerRupee: number;
        pointsValue: number;
        birthdayBonus: number;
        referralBonus: number;
        expiry: "never" | "months" | "years";
        expiryMonths?: number | undefined;
    }, {
        id: string;
        name: string;
        tiers: {
            discount: number;
            name: string;
            pointsRequired: number;
            monthlyFee: number;
            benefits: string[];
            multiplier: number;
            color: string;
            perks: {
                value: number;
                category: "discount" | "free_service" | "priority" | "exclusive" | "points";
                item: string;
                frequency?: "monthly" | "quarterly" | "annually" | undefined;
            }[];
        }[];
        pointsPerRupee: number;
        pointsValue: number;
        birthdayBonus: number;
        referralBonus: number;
        expiry: "never" | "months" | "years";
        expiryMonths?: number | undefined;
    }>>;
    goals: z.ZodEnum<["acquire", "retain", "increase_spend", "all"]>;
}, "strip", z.ZodTypeAny, {
    salonId: string;
    monthlyClients: number;
    salonName: string;
    avgServiceValue: number;
    clientMetrics: {
        totalClients: number;
        newClients: number;
        returningClients: number;
        atRiskClients: number;
        dormantClients: number;
        VIPClients: number;
        avgLifetimeValue: number;
        avgVisitFrequency: number;
        repeatRate: number;
        churnRate: number;
    };
    goals: "acquire" | "retain" | "increase_spend" | "all";
    currentMembership?: {
        id: string;
        name: string;
        tiers: {
            discount: number;
            name: string;
            pointsRequired: number;
            monthlyFee: number;
            benefits: string[];
            multiplier: number;
            color: string;
            perks: {
                value: number;
                category: "discount" | "free_service" | "priority" | "exclusive" | "points";
                item: string;
                frequency?: "monthly" | "quarterly" | "annually" | undefined;
            }[];
        }[];
        pointsPerRupee: number;
        pointsValue: number;
        birthdayBonus: number;
        referralBonus: number;
        expiry: "never" | "months" | "years";
        expiryMonths?: number | undefined;
    } | undefined;
}, {
    salonId: string;
    monthlyClients: number;
    salonName: string;
    avgServiceValue: number;
    clientMetrics: {
        totalClients: number;
        newClients: number;
        returningClients: number;
        atRiskClients: number;
        dormantClients: number;
        VIPClients: number;
        avgLifetimeValue: number;
        avgVisitFrequency: number;
        repeatRate: number;
        churnRate: number;
    };
    goals: "acquire" | "retain" | "increase_spend" | "all";
    currentMembership?: {
        id: string;
        name: string;
        tiers: {
            discount: number;
            name: string;
            pointsRequired: number;
            monthlyFee: number;
            benefits: string[];
            multiplier: number;
            color: string;
            perks: {
                value: number;
                category: "discount" | "free_service" | "priority" | "exclusive" | "points";
                item: string;
                frequency?: "monthly" | "quarterly" | "annually" | undefined;
            }[];
        }[];
        pointsPerRupee: number;
        pointsValue: number;
        birthdayBonus: number;
        referralBonus: number;
        expiry: "never" | "months" | "years";
        expiryMonths?: number | undefined;
    } | undefined;
}>;
export declare const PackageConsultSchema: z.ZodObject<{
    salonId: z.ZodString;
    services: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        category: z.ZodEnum<["hair", "skin", "nails", "spa", "makeup", "waxing", "mens", "other"]>;
        price: z.ZodNumber;
        cost: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        duration: z.ZodNumber;
        popularity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        cost: number;
        duration: number;
        popularity: number;
    }, {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        duration: number;
        cost?: number | undefined;
        popularity?: number | undefined;
    }>, "many">;
    clients: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        visitCount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        avgSpend: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        lastVisit: z.ZodOptional<z.ZodString>;
        lifecycleStage: z.ZodDefault<z.ZodOptional<z.ZodEnum<["new", "active", "at_risk", "dormant", "VIP"]>>>;
        tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        preferredServices: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        birthday: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        visitCount: number;
        avgSpend: number;
        lifecycleStage: "new" | "active" | "at_risk" | "dormant" | "VIP";
        tags: string[];
        preferredServices: string[];
        phone?: string | undefined;
        birthday?: string | undefined;
        name?: string | undefined;
        lastVisit?: string | undefined;
    }, {
        id: string;
        phone?: string | undefined;
        birthday?: string | undefined;
        name?: string | undefined;
        visitCount?: number | undefined;
        avgSpend?: number | undefined;
        lastVisit?: string | undefined;
        lifecycleStage?: "new" | "active" | "at_risk" | "dormant" | "VIP" | undefined;
        tags?: string[] | undefined;
        preferredServices?: string[] | undefined;
    }>, "many">;
    currentPackages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        services: z.ZodArray<z.ZodObject<{
            serviceId: z.ZodString;
            name: z.ZodString;
            originalPrice: z.ZodNumber;
            discountedPrice: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            name: string;
            serviceId: string;
            originalPrice: number;
            discountedPrice: number;
        }, {
            name: string;
            serviceId: string;
            originalPrice: number;
            discountedPrice: number;
        }>, "many">;
        totalOriginalPrice: z.ZodNumber;
        packagePrice: z.ZodNumber;
        discountPercent: z.ZodNumber;
        margin: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        validity: z.ZodNumber;
        targetSegment: z.ZodEnum<["new_client", "regular", "premium", "seasonal", "bridal"]>;
        category: z.ZodEnum<["bridal", "party", "regular", "mens", "seasonal", "custom"]>;
        popularity: z.ZodOptional<z.ZodNumber>;
        projectedSales: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        services: {
            name: string;
            serviceId: string;
            originalPrice: number;
            discountedPrice: number;
        }[];
        category: "mens" | "regular" | "seasonal" | "bridal" | "party" | "custom";
        description: string;
        totalOriginalPrice: number;
        packagePrice: number;
        discountPercent: number;
        margin: number;
        validity: number;
        targetSegment: "premium" | "new_client" | "regular" | "seasonal" | "bridal";
        popularity?: number | undefined;
        projectedSales?: number | undefined;
    }, {
        id: string;
        name: string;
        services: {
            name: string;
            serviceId: string;
            originalPrice: number;
            discountedPrice: number;
        }[];
        category: "mens" | "regular" | "seasonal" | "bridal" | "party" | "custom";
        description: string;
        totalOriginalPrice: number;
        packagePrice: number;
        discountPercent: number;
        validity: number;
        targetSegment: "premium" | "new_client" | "regular" | "seasonal" | "bridal";
        popularity?: number | undefined;
        margin?: number | undefined;
        projectedSales?: number | undefined;
    }>, "many">>;
    focusAreas: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    salonId: string;
    services: {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        cost: number;
        duration: number;
        popularity: number;
    }[];
    clients: {
        id: string;
        visitCount: number;
        avgSpend: number;
        lifecycleStage: "new" | "active" | "at_risk" | "dormant" | "VIP";
        tags: string[];
        preferredServices: string[];
        phone?: string | undefined;
        birthday?: string | undefined;
        name?: string | undefined;
        lastVisit?: string | undefined;
    }[];
    currentPackages?: {
        id: string;
        name: string;
        services: {
            name: string;
            serviceId: string;
            originalPrice: number;
            discountedPrice: number;
        }[];
        category: "mens" | "regular" | "seasonal" | "bridal" | "party" | "custom";
        description: string;
        totalOriginalPrice: number;
        packagePrice: number;
        discountPercent: number;
        margin: number;
        validity: number;
        targetSegment: "premium" | "new_client" | "regular" | "seasonal" | "bridal";
        popularity?: number | undefined;
        projectedSales?: number | undefined;
    }[] | undefined;
    focusAreas?: string[] | undefined;
}, {
    salonId: string;
    services: {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        duration: number;
        cost?: number | undefined;
        popularity?: number | undefined;
    }[];
    clients: {
        id: string;
        phone?: string | undefined;
        birthday?: string | undefined;
        name?: string | undefined;
        visitCount?: number | undefined;
        avgSpend?: number | undefined;
        lastVisit?: string | undefined;
        lifecycleStage?: "new" | "active" | "at_risk" | "dormant" | "VIP" | undefined;
        tags?: string[] | undefined;
        preferredServices?: string[] | undefined;
    }[];
    currentPackages?: {
        id: string;
        name: string;
        services: {
            name: string;
            serviceId: string;
            originalPrice: number;
            discountedPrice: number;
        }[];
        category: "mens" | "regular" | "seasonal" | "bridal" | "party" | "custom";
        description: string;
        totalOriginalPrice: number;
        packagePrice: number;
        discountPercent: number;
        validity: number;
        targetSegment: "premium" | "new_client" | "regular" | "seasonal" | "bridal";
        popularity?: number | undefined;
        margin?: number | undefined;
        projectedSales?: number | undefined;
    }[] | undefined;
    focusAreas?: string[] | undefined;
}>;
export declare const ScheduleConsultSchema: z.ZodObject<{
    salonId: z.ZodString;
    staff: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        role: z.ZodEnum<["stylist", "senior_stylist", "colorist", "senior_colorist", "beautician", "masseur", "manager", "receptionist"]>;
        services: z.ZodArray<z.ZodString, "many">;
        experience: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        rating: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        monthlyClients: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        avgServiceDuration: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        salary: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        commission: z.ZodOptional<z.ZodNumber>;
        availability: z.ZodRecord<z.ZodString, z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
            available: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            start: string;
            end: string;
            available: boolean;
        }, {
            start: string;
            end: string;
            available: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        role: "stylist" | "senior_stylist" | "colorist" | "senior_colorist" | "beautician" | "masseur" | "manager" | "receptionist";
        services: string[];
        experience: number;
        rating: number;
        monthlyClients: number;
        avgServiceDuration: number;
        salary: number;
        availability: Record<string, {
            start: string;
            end: string;
            available: boolean;
        }>;
        commission?: number | undefined;
    }, {
        id: string;
        name: string;
        role: "stylist" | "senior_stylist" | "colorist" | "senior_colorist" | "beautician" | "masseur" | "manager" | "receptionist";
        services: string[];
        availability: Record<string, {
            start: string;
            end: string;
            available: boolean;
        }>;
        experience?: number | undefined;
        rating?: number | undefined;
        monthlyClients?: number | undefined;
        avgServiceDuration?: number | undefined;
        salary?: number | undefined;
        commission?: number | undefined;
    }>, "many">;
    services: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        duration: z.ZodNumber;
        category: z.ZodEnum<["hair", "skin", "nails", "spa", "makeup", "waxing", "mens", "other"]>;
        price: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        cost: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        popularity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        cost: number;
        duration: number;
        popularity: number;
    }, {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        duration: number;
        price?: number | undefined;
        cost?: number | undefined;
        popularity?: number | undefined;
    }>, "many">;
    appointments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        clientId: z.ZodOptional<z.ZodString>;
        staffId: z.ZodString;
        serviceId: z.ZodString;
        dateTime: z.ZodString;
        duration: z.ZodNumber;
        price: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        status: z.ZodEnum<["booked", "completed", "cancelled", "no_show"]>;
        source: z.ZodDefault<z.ZodOptional<z.ZodEnum<["walk_in", "phone", "online", "whatsapp", "app"]>>>;
    }, "strip", z.ZodTypeAny, {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        price: number;
        duration: number;
        staffId: string;
        serviceId: string;
        dateTime: string;
        source: "walk_in" | "phone" | "online" | "whatsapp" | "app";
        clientId?: string | undefined;
    }, {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        duration: number;
        staffId: string;
        serviceId: string;
        dateTime: string;
        price?: number | undefined;
        clientId?: string | undefined;
        source?: "walk_in" | "phone" | "online" | "whatsapp" | "app" | undefined;
    }>, "many">;
    holidays: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    targetUtilization: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    salonId: string;
    staff: {
        id: string;
        name: string;
        role: "stylist" | "senior_stylist" | "colorist" | "senior_colorist" | "beautician" | "masseur" | "manager" | "receptionist";
        services: string[];
        experience: number;
        rating: number;
        monthlyClients: number;
        avgServiceDuration: number;
        salary: number;
        availability: Record<string, {
            start: string;
            end: string;
            available: boolean;
        }>;
        commission?: number | undefined;
    }[];
    services: {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        price: number;
        cost: number;
        duration: number;
        popularity: number;
    }[];
    appointments: {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        price: number;
        duration: number;
        staffId: string;
        serviceId: string;
        dateTime: string;
        source: "walk_in" | "phone" | "online" | "whatsapp" | "app";
        clientId?: string | undefined;
    }[];
    targetUtilization: number;
    holidays?: string[] | undefined;
}, {
    salonId: string;
    staff: {
        id: string;
        name: string;
        role: "stylist" | "senior_stylist" | "colorist" | "senior_colorist" | "beautician" | "masseur" | "manager" | "receptionist";
        services: string[];
        availability: Record<string, {
            start: string;
            end: string;
            available: boolean;
        }>;
        experience?: number | undefined;
        rating?: number | undefined;
        monthlyClients?: number | undefined;
        avgServiceDuration?: number | undefined;
        salary?: number | undefined;
        commission?: number | undefined;
    }[];
    services: {
        id: string;
        name: string;
        category: "spa" | "hair" | "skin" | "nails" | "makeup" | "waxing" | "mens" | "other";
        duration: number;
        price?: number | undefined;
        cost?: number | undefined;
        popularity?: number | undefined;
    }[];
    appointments: {
        status: "booked" | "completed" | "cancelled" | "no_show";
        id: string;
        duration: number;
        staffId: string;
        serviceId: string;
        dateTime: string;
        price?: number | undefined;
        clientId?: string | undefined;
        source?: "walk_in" | "phone" | "online" | "whatsapp" | "app" | undefined;
    }[];
    holidays?: string[] | undefined;
    targetUtilization?: number | undefined;
}>;
export declare const GrowthConsultSchema: z.ZodObject<{
    salonId: z.ZodString;
    salonProfile: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        location: z.ZodString;
        type: z.ZodEnum<["salon", "spa", "beauty_parlor", "unisex", "unisex_premium"]>;
        services: z.ZodArray<z.ZodString, "many">;
        priceRange: z.ZodEnum<["budget", "mid", "premium", "luxury"]>;
        seatingCapacity: z.ZodNumber;
        stations: z.ZodNumber;
        avgServiceValue: z.ZodNumber;
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
        type: "salon" | "spa" | "beauty_parlor" | "unisex" | "unisex_premium";
        id: string;
        name: string;
        services: string[];
        avgServiceValue: number;
        location: string;
        priceRange: "budget" | "mid" | "premium" | "luxury";
        seatingCapacity: number;
        stations: number;
        monthlyRevenue: number;
        operatingHours: Record<string, {
            open: string;
            close: string;
            closed?: boolean | undefined;
        }>;
    }, {
        type: "salon" | "spa" | "beauty_parlor" | "unisex" | "unisex_premium";
        id: string;
        name: string;
        services: string[];
        avgServiceValue: number;
        location: string;
        priceRange: "budget" | "mid" | "premium" | "luxury";
        seatingCapacity: number;
        stations: number;
        monthlyRevenue: number;
        operatingHours: Record<string, {
            open: string;
            close: string;
            closed?: boolean | undefined;
        }>;
    }>;
    financialMetrics: z.ZodObject<{
        monthlyRevenue: z.ZodNumber;
        monthlyClients: z.ZodNumber;
        avgServiceValue: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        monthlyClients: number;
        avgServiceValue: number;
        monthlyRevenue: number;
    }, {
        monthlyClients: number;
        avgServiceValue: number;
        monthlyRevenue: number;
    }>;
    clientMetrics: z.ZodObject<{
        totalClients: z.ZodNumber;
        newClients: z.ZodNumber;
        returningClients: z.ZodNumber;
        atRiskClients: z.ZodNumber;
        dormantClients: z.ZodNumber;
        VIPClients: z.ZodNumber;
        avgLifetimeValue: z.ZodNumber;
        avgVisitFrequency: z.ZodNumber;
        repeatRate: z.ZodNumber;
        churnRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalClients: number;
        newClients: number;
        returningClients: number;
        atRiskClients: number;
        dormantClients: number;
        VIPClients: number;
        avgLifetimeValue: number;
        avgVisitFrequency: number;
        repeatRate: number;
        churnRate: number;
    }, {
        totalClients: number;
        newClients: number;
        returningClients: number;
        atRiskClients: number;
        dormantClients: number;
        VIPClients: number;
        avgLifetimeValue: number;
        avgVisitFrequency: number;
        repeatRate: number;
        churnRate: number;
    }>;
    staffMetrics: z.ZodOptional<z.ZodObject<{
        totalStaff: z.ZodNumber;
        utilization: z.ZodNumber;
        avgRating: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalStaff: number;
        utilization: number;
        avgRating: number;
    }, {
        totalStaff: number;
        utilization: number;
        avgRating: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    salonId: string;
    clientMetrics: {
        totalClients: number;
        newClients: number;
        returningClients: number;
        atRiskClients: number;
        dormantClients: number;
        VIPClients: number;
        avgLifetimeValue: number;
        avgVisitFrequency: number;
        repeatRate: number;
        churnRate: number;
    };
    salonProfile: {
        type: "salon" | "spa" | "beauty_parlor" | "unisex" | "unisex_premium";
        id: string;
        name: string;
        services: string[];
        avgServiceValue: number;
        location: string;
        priceRange: "budget" | "mid" | "premium" | "luxury";
        seatingCapacity: number;
        stations: number;
        monthlyRevenue: number;
        operatingHours: Record<string, {
            open: string;
            close: string;
            closed?: boolean | undefined;
        }>;
    };
    financialMetrics: {
        monthlyClients: number;
        avgServiceValue: number;
        monthlyRevenue: number;
    };
    staffMetrics?: {
        totalStaff: number;
        utilization: number;
        avgRating: number;
    } | undefined;
}, {
    salonId: string;
    clientMetrics: {
        totalClients: number;
        newClients: number;
        returningClients: number;
        atRiskClients: number;
        dormantClients: number;
        VIPClients: number;
        avgLifetimeValue: number;
        avgVisitFrequency: number;
        repeatRate: number;
        churnRate: number;
    };
    salonProfile: {
        type: "salon" | "spa" | "beauty_parlor" | "unisex" | "unisex_premium";
        id: string;
        name: string;
        services: string[];
        avgServiceValue: number;
        location: string;
        priceRange: "budget" | "mid" | "premium" | "luxury";
        seatingCapacity: number;
        stations: number;
        monthlyRevenue: number;
        operatingHours: Record<string, {
            open: string;
            close: string;
            closed?: boolean | undefined;
        }>;
    };
    financialMetrics: {
        monthlyClients: number;
        avgServiceValue: number;
        monthlyRevenue: number;
    };
    staffMetrics?: {
        totalStaff: number;
        utilization: number;
        avgRating: number;
    } | undefined;
}>;
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    metadata?: {
        processingTime: number;
        model?: string;
        confidence?: number;
    };
}
//# sourceMappingURL=index.d.ts.map