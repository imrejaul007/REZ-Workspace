export type VendorCategory = 
  | 'utilities'
  | 'food_supplies'
  | 'equipment'
  | 'services'
  | 'marketing'
  | 'finance'
  | 'maintenance'
  | 'real_estate';

export type ProductCategory = 
  | 'ingredients'
  | 'beverages'
  | 'packaging'
  | 'cleaning'
  | 'kitchen_equipment'
  | 'furniture'
  | 'technology'
  | 'uniforms';

export type ServiceType = 
  | 'lpg_gas'
  | 'water_supply'
  | 'tax_filing'
  | 'accounting'
  | 'marketing'
  | 'pest_control'
  | 'waste_management'
  | 'laundry'
  | 'maintenance'
  | 'delivery';

export type OrderType = 'single' | 'bulk' | 'wholesale' | 'subscription';

export type ListingType = 'sale' | 'rent' | 'lease';

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  logo: string;
  rating: number;
  reviewCount: number;
  description: string;
  services: ServiceType[];
  products: Product[];
  certifications: string[];
  minOrderValue?: number;
  deliveryTime: string;
  location: string;
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  bulkDiscount?: number;
  subscriptionPlans?: SubscriptionPlan[];
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  category: ProductCategory;
  description: string;
  images: string[];
  price: number;
  unit: string;
  inStock: boolean;
  minQuantity: number;
  bulkPricing?: BulkPricing[];
  specifications?: Record<string, string>;
  deliveryOptions: string[];
}

export interface BulkPricing {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  discount: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  deliveryFrequency?: string;
  minimumCommitment?: number;
}

export interface RestaurantListing {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  images: string[];
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  details: {
    size: string;
    seatingCapacity?: number;
    kitchenEquipped?: boolean;
    parkingSpaces?: number;
    yearEstablished?: number;
    revenue?: string;
    reason?: string;
  };
  amenities: string[];
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  availability?: string;
  terms?: string;
}

export interface MarketplaceFilter {
  category?: VendorCategory | ProductCategory;
  serviceType?: ServiceType;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  location?: string;
  orderType?: OrderType;
  searchQuery?: string;
}