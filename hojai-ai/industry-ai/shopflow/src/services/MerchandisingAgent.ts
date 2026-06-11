/**
 * Merchandising Agent - ShopFlow AI
 * Manages product placement, visual merchandising, and promotional displays
 */

import axios from 'axios';

// Types
export interface MerchandisingPlan {
  planId: string;
  storeId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  sections: MerchandisingSection[];
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchandisingSection {
  sectionId: string;
  name: string;
  type: 'feature' | 'endcap' | 'promotion' | 'seasonal' | 'cross_sell' | 'impulse';
  position: { aisle: number; shelf: number; facing: number };
  products: MerchandisingProduct[];
  visualElements: VisualElement[];
  duration: { days: number; hours: number };
  metrics: SectionMetrics;
}

export interface MerchandisingProduct {
  productId: string;
  name: string;
  sku: string;
  displayPosition: number;
  signageType: 'price_tag' | 'shelf_talker' | 'display_card' | 'digital_signage';
  bundleOffer?: { type: string; products: string[]; discountPercent: number };
}

export interface VisualElement {
  elementId: string;
  type: 'banner' | 'poster' | 'signage' | 'shelf_label' | 'digital_display';
  content: string;
  placement: string;
  assets: { url: string; type: string }[];
}

export interface SectionMetrics {
  views: number;
  conversions: number;
  revenue: number;
  uplift: number;
}

export interface Planogram {
  planogramId: string;
  storeId: string;
  sectionId: string;
  layout: PlanogramSection[];
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanogramSection {
  sectionName: string;
  shelf: number;
  bays: PlanogramBay[];
}

export interface PlanogramBay {
  bayNumber: number;
  products: PlanogramProduct[];
  height: number;
  width: number;
}

export interface PlanogramProduct {
  productId: string;
  sku: string;
  name: string;
  facings: number;
  depth: number;
  category: string;
}

export interface StoreDisplay {
  displayId: string;
  storeId: string;
  type: 'window' | 'entrance' | 'checkout' | 'floor' | 'ceiling';
  position: { x: number; y: number; z: number };
  dimensions: { width: number; height: number; depth: number };
  currentContent: DisplayContent;
  schedule: DisplaySchedule[];
}

export interface DisplayContent {
  primaryMessage: string;
  secondaryMessage?: string;
  visual: { url: string; alt: string };
  callToAction: string;
  expiresAt?: Date;
}

export interface DisplaySchedule {
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  content: DisplayContent;
}

export interface CrossSellRule {
  ruleId: string;
  triggerProductId: string;
  triggerCategory: string;
  recommendedProducts: RecommendedProduct[];
  placement: 'below' | 'sidebar' | 'checkout' | 'email';
  displayFormat: 'grid' | 'carousel' | 'list';
  maxProducts: number;
  priority: number;
  active: boolean;
}

export interface RecommendedProduct {
  productId: string;
  name: string;
  matchScore: number;
  discount?: number;
  reason: string;
}

export class MerchandisingAgent {
  private shopflowBaseUrl: string;

  constructor() {
    this.shopflowBaseUrl = process.env.SHOPFLOW_BASE_URL || 'http://localhost:4830';
  }

  /**
   * Generate a merchandising plan for a store
   */
  async createPlan(
    storeId: string,
    options: {
      name: string;
      description: string;
      startDate: Date;
      endDate: Date;
      focus?: 'seasonal' | 'promotion' | 'clearance' | 'new_arrivals';
      targetCategories?: string[];
    }
  ): Promise<MerchandisingPlan> {
    const planId = `MERCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get products for merchandising
    const { data: products } = await axios.get(`${this.shopflowBaseUrl}/api/products`, {
      params: { storeId, categories: options.targetCategories?.join(',') }
    }).catch(() => ({ data: [] }));

    // Generate sections based on focus
    const sections = this.generateSections(options.focus || 'promotion', products);

    return {
      planId,
      storeId,
      name: options.name,
      description: options.description,
      startDate: options.startDate,
      endDate: options.endDate,
      sections,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private generateSections(focus: string, products: any[]): MerchandisingSection[] {
    const sections: MerchandisingSection[] = [];

    // Feature section
    sections.push({
      sectionId: `SEC-${Date.now()}-1`,
      name: 'Featured Products',
      type: 'feature',
      position: { aisle: 1, shelf: 1, facing: 4 },
      products: products.slice(0, 6).map((p, i) => ({
        productId: p.productId || p._id,
        name: p.name,
        sku: p.sku,
        displayPosition: i + 1,
        signageType: 'display_card' as const
      })),
      visualElements: [{
        elementId: `VIZ-${Date.now()}-1`,
        type: 'banner',
        content: `Discover our ${focus} specials!`,
        placement: 'above_section',
        assets: []
      }],
      duration: { days: 14, hours: 24 },
      metrics: { views: 0, conversions: 0, revenue: 0, uplift: 0 }
    });

    // Endcap section
    sections.push({
      sectionId: `SEC-${Date.now()}-2`,
      name: 'Endcap Display',
      type: 'endcap',
      position: { aisle: 1, shelf: 1, facing: 6 },
      products: products.slice(6, 12).map((p, i) => ({
        productId: p.productId || p._id,
        name: p.name,
        sku: p.sku,
        displayPosition: i + 1,
        signageType: 'shelf_talker' as const
      })),
      visualElements: [],
      duration: { days: 7, hours: 12 },
      metrics: { views: 0, conversions: 0, revenue: 0, uplift: 0 }
    });

    return sections;
  }

  /**
   * Generate a planogram for a store section
   */
  async generatePlanogram(
    storeId: string,
    sectionId: string,
    options?: {
      layout?: 'linear' | 'grid' | 'block';
      optimizeForSales?: boolean;
    }
  ): Promise<Planogram> {
    const planogramId = `PLAN-${Date.now()}`;

    // Get products for this section
    const { data: products } = await axios.get(`${this.shopflowBaseUrl}/api/products`, {
      params: { storeId, section: sectionId }
    }).catch(() => ({ data: [] }));

    // Generate planogram layout
    const layout: PlanogramSection[] = [];
    const shelfCount = 5;
    const baysPerShelf = 4;

    for (let shelf = 1; shelf <= shelfCount; shelf++) {
      const bay: PlanogramBay[] = [];
      for (let b = 1; b <= baysPerShelf; b++) {
        const productIndex = (shelf - 1) * baysPerShelf + b - 1;
        const product = products[productIndex];

        bay.push({
          bayNumber: b,
          products: product ? [{
            productId: product.productId || product._id,
            sku: product.sku,
            name: product.name,
            facings: Math.floor(Math.random() * 4) + 1,
            depth: 2,
            category: product.category || 'General'
          }] : [],
          height: 30,
          width: 100
        });
      }

      layout.push({
        sectionName: `Shelf ${shelf}`,
        shelf,
        bays: bay
      });
    }

    return {
      planogramId,
      storeId,
      sectionId,
      layout,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Manage store displays
   */
  async createDisplay(
    storeId: string,
    type: StoreDisplay['type'],
    position: StoreDisplay['position'],
    dimensions: StoreDisplay['dimensions']
  ): Promise<StoreDisplay> {
    const displayId = `DISPLAY-${Date.now()}`;

    return {
      displayId,
      storeId,
      type,
      position,
      dimensions,
      currentContent: {
        primaryMessage: 'Welcome!',
        visual: { url: '', alt: 'Store display' },
        callToAction: 'Shop now'
      },
      schedule: []
    };
  }

  /**
   * Schedule display content
   */
  async scheduleDisplay(
    displayId: string,
    schedule: DisplaySchedule
  ): Promise<StoreDisplay> {
    // In production, this would update the database
    return {
      displayId,
      storeId: '',
      type: 'window',
      position: { x: 0, y: 0, z: 0 },
      dimensions: { width: 0, height: 0, depth: 0 },
      currentContent: schedule.content,
      schedule: [schedule]
    };
  }

  /**
   * Create cross-sell rules
   */
  async createCrossSellRule(
    triggerProductId: string,
    triggerCategory: string,
    recommendedProducts: RecommendedProduct[]
  ): Promise<CrossSellRule> {
    return {
      ruleId: `CROSS-${Date.now()}`,
      triggerProductId,
      triggerCategory,
      recommendedProducts,
      placement: 'below',
      displayFormat: 'grid',
      maxProducts: 4,
      priority: 1,
      active: true
    };
  }

  /**
   * Optimize cross-sell rules based on performance
   */
  async optimizeCrossSellRules(storeId: string): Promise<CrossSellRule[]> {
    // In production, analyze sales data to optimize rules
    return [];
  }

  /**
   * Get merchandising analytics
   */
  async getAnalytics(
    planId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    impressions: number;
    conversions: number;
    revenue: number;
    uplift: number;
    topPerformingSections: MerchandisingSection[];
  }> {
    return {
      impressions: 0,
      conversions: 0,
      revenue: 0,
      uplift: 0,
      topPerformingSections: []
    };
  }
}

export const merchandisingAgent = new MerchandisingAgent();