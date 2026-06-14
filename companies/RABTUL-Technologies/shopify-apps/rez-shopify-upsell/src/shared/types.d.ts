/**
 * ReZ Upsell - Types
 */
export interface UpsellConfig {
    shop: string;
    tenantId: string;
    brandId: string;
    enabled: boolean;
    position: 'checkout' | 'cart' | 'thank_you';
    discountCode?: string;
    discountPercentage?: number;
    products: UpsellProduct[];
    settings: UpsellSettings;
}
export interface UpsellProduct {
    productId: string;
    variantId: string;
    title: string;
    price: number;
    image?: string;
    compareAtPrice?: number;
}
export interface UpsellSettings {
    showOnMobile: boolean;
    autoTrigger: boolean;
    delaySeconds: number;
    maxUpsellsPerSession: number;
    trackAllClicks: boolean;
    customizeColors: boolean;
    primaryColor: string;
    backgroundColor: string;
}
export interface UpsellOffer {
    id: string;
    product: UpsellProduct;
    originalPrice: number;
    offerPrice: number;
    discountPercentage: number;
    message: string;
    expiresAt: Date;
}
export interface UpsellAnalytics {
    offerId: string;
    productId: string;
    variantId: string;
    customerId?: string;
    sessionId: string;
    shop: string;
    event: 'offer_shown' | 'offer_clicked' | 'offer_accepted' | 'offer_declined';
    revenue: number;
    timestamp: Date;
}
export interface UpsellStats {
    totalOffers: number;
    totalClicks: number;
    totalAccepted: number;
    totalDeclined: number;
    clickRate: number;
    conversionRate: number;
    totalRevenue: number;
    averageOrderValue: number;
}
export interface UpsellSession {
    sessionId: string;
    checkoutId?: string;
    customerId?: string;
    cartItems: CartItem[];
    createdAt: Date;
    offers: OfferResult[];
}
export interface CartItem {
    productId: string;
    variantId: string;
    title: string;
    quantity: number;
    price: number;
    image?: string;
}
export interface OfferResult {
    offerId: string;
    productId: string;
    shown: boolean;
    clicked: boolean;
    accepted: boolean;
    declined: boolean;
    acceptedAt?: Date;
}
