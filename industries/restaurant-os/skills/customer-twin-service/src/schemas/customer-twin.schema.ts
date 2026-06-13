// Customer Twin Schema - Defines types and validation for Customer Twin Service

export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export enum ChurnRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface DietaryPreference {
  restrictions: string[];
  allergies: string[];
  preferences: string[];
}

export interface VisitHistory {
  restaurantId: string;
  visitCount: number;
  lastVisit: string;
  avgOrderValue: number;
  favoriteItems: string[];
}

export interface CustomerTwinDocument {
  twinId: string;
  customerId: string;
  profile: {
    name: string;
    phone: string;
    email?: string;
    firstVisit?: string;
  };
  preferences: {
    dietary: DietaryPreference;
    favoriteItems: string[];
    preferredPayment: string;
    preferredOrderType: string;
  };
  visitHistory: VisitHistory[];
  loyalty: {
    currentTier: LoyaltyTier;
    pointsBalance: number;
    lifetimePoints: number;
    pointsValue: number;
  };
  sentiment: {
    lastRating?: number;
    avgRating: number;
    feedbackCount: number;
  };
  lifetimeValue: {
    clv: number;
    churnRisk: ChurnRisk;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerTwinRequest {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
}

export interface CreateCustomerTwinResponse {
  twinId: string;
  customerId: string;
  twinOsEntityId: string;
  createdAt: string;
}

export interface GetCustomerTwinResponse extends CustomerTwinDocument {
  twinOsEntityId: string;
}

export interface UpdatePreferencesRequest {
  dietary?: DietaryPreference;
  favoriteItems?: string[];
  preferredPayment?: string;
  preferredOrderType?: string;
}

export interface RecordVisitRequest {
  restaurantId: string;
  orderValue: number;
  items?: string[];
}

export interface UpdateLoyaltyRequest {
  pointsEarned?: number;
  pointsRedeemed?: number;
  tier?: LoyaltyTier;
}
