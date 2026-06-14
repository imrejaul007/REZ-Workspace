export interface Feature {
  id: string;
  name: string;
  description: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year' | 'one-time';
  features: string[];
  recommended?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export interface Agent {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  longDescription: string;
  icon: string;
  capabilities: string[];
  price: number;
  rating: number;
  installCount: number;
  features: Feature[];
  pricingPlans: PricingPlan[];
  integrations: string[];
  screenshots: string[];
  reviews: Review[];
  tasks: string[];
  automations: string[];
}

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  agentCount: number;
};

export interface InstallationConfig {
  agentId: string;
  businessName: string;
  locations: string[];
  permissions: string[];
  plan: string;
  trainingComplete: boolean;
}