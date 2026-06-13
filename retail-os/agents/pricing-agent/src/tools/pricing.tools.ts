import { PricingActions, PriceRecommendation, Promotion, PricingMetrics } from '../actions/pricing.actions';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
}

export const pricingTools: ToolDefinition[] = [
  {
    name: 'get_product_pricing',
    description: 'Get current pricing information for a product',
    parameters: [
      { name: 'productId', type: 'string', description: 'Product ID', required: true },
    ],
  },
  {
    name: 'update_product_price',
    description: 'Update the base price for a product',
    parameters: [
      { name: 'productId', type: 'string', description: 'Product ID', required: true },
      { name: 'newPrice', type: 'number', description: 'New base price', required: true },
    ],
  },
  {
    name: 'calculate_optimal_price',
    description: 'Calculate optimal price based on cost, margin targets, and market conditions',
    parameters: [
      { name: 'productId', type: 'string', description: 'Product ID', required: true },
      { name: 'targetMargin', type: 'number', description: 'Target margin percentage (optional)', required: false },
    ],
  },
  {
    name: 'analyze_price_elasticity',
    description: 'Analyze price elasticity for a product',
    parameters: [
      { name: 'productId', type: 'string', description: 'Product ID', required: true },
    ],
  },
  {
    name: 'create_promotion',
    description: 'Create a new promotional offer',
    parameters: [
      { name: 'name', type: 'string', description: 'Promotion name', required: true },
      { name: 'type', type: 'string', description: 'Type: percentage, fixed, bogo, bundle', required: true },
      { name: 'value', type: 'number', description: 'Discount value', required: true },
      { name: 'startDate', type: 'string', description: 'Start date ISO string', required: true },
      { name: 'endDate', type: 'string', description: 'End date ISO string', required: true },
      { name: 'applicableProducts', type: 'array', description: 'Product IDs (optional)', required: false },
    ],
  },
  {
    name: 'get_active_promotions',
    description: 'Get all currently active promotions',
    parameters: [],
  },
  {
    name: 'analyze_promotion_performance',
    description: 'Analyze the performance of a promotion',
    parameters: [
      { name: 'promotionId', type: 'string', description: 'Promotion ID', required: true },
    ],
  },
  {
    name: 'identify_markdown_candidates',
    description: 'Identify products that are good candidates for price markdowns',
    parameters: [
      { name: 'threshold', type: 'number', description: 'Days in stock threshold (default 60)', required: false },
    ],
  },
  {
    name: 'calculate_markdown_depth',
    description: 'Calculate optimal markdown strategy for a product',
    parameters: [
      { name: 'productId', type: 'string', description: 'Product ID', required: true },
      { name: 'daysRemaining', type: 'number', description: 'Days to sell through', required: true },
    ],
  },
  {
    name: 'get_pricing_metrics',
    description: 'Get overall pricing metrics and KPIs',
    parameters: [],
  },
  {
    name: 'track_competitor_prices',
    description: 'Track competitor prices for specified products',
    parameters: [
      { name: 'productIds', type: 'array', description: 'Product IDs to track', required: true },
    ],
  },
];

export class PricingTools {
  private actions: PricingActions;

  constructor() {
    this.actions = new PricingActions();
  }

  async executeTool(toolName: string, params: Record<string, any>): Promise<any> {
    switch (toolName) {
      case 'get_product_pricing':
        return this.actions.getProductPricing(params.productId);

      case 'update_product_price':
        return this.actions.updateProductPrice(params.productId, params.newPrice);

      case 'calculate_optimal_price':
        return this.actions.calculateOptimalPrice(params.productId, params.targetMargin);

      case 'analyze_price_elasticity':
        return this.actions.analyzePriceElasticity(params.productId);

      case 'create_promotion':
        return this.actions.createPromotion(params);

      case 'get_active_promotions':
        return this.actions.getActivePromotions();

      case 'analyze_promotion_performance':
        return this.actions.analyzePromotionPerformance(params.promotionId);

      case 'identify_markdown_candidates':
        return this.actions.identifyMarkdownCandidates(params.threshold);

      case 'calculate_markdown_depth':
        return this.actions.calculateMarkdownDepth(params.productId, params.daysRemaining);

      case 'get_pricing_metrics':
        return this.actions.getPricingMetrics();

      case 'track_competitor_prices':
        return this.actions.trackCompetitorPrices(params.productIds);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  getToolDefinitions(): ToolDefinition[] {
    return pricingTools;
  }
}
