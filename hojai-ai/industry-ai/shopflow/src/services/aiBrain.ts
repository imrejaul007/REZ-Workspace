/**
 * ShopFlow AI Brain - Central Intelligence for Retail AI
 * Provides: Product Recommendations, Inventory Forecasting, Dynamic Pricing,
 * Customer Segmentation, Cross-sell/Up-sell Suggestions, Store Layout Optimization
 */

import Anthropic from '@anthropic-ai/sdk';
import { Product, Customer, Sale } from '../models/index';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || 'sk-ant-api03-placeholder',
});

interface RecommendationContext {
  customerId?: string;
  browsingHistory?: string[];
  preferences?: Record<string, any>;
  currentCart?: Array<{ productId: string; quantity: number }>;
}

interface InventoryForecastResult {
  productId: string;
  productName: string;
  currentStock: number;
  forecast: {
    nextWeek: number;
    nextMonth: number;
    dailyAverage: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  confidence: number;
  recommendations: string[];
}

interface PricingSuggestion {
  productId: string;
  productName: string;
  currentPrice: number;
  cost: number;
  suggestedPrice: number;
  priceChange: number;
  reason: string;
  confidence: number;
  factors: string[];
}

interface CustomerSegmentation {
  customerId: string;
  segment: 'budget' | 'regular' | 'premium' | 'vip';
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    shoppingFrequency: 'rare' | 'occasional' | 'regular' | 'frequent';
    channel: 'online' | 'instore' | 'omni';
  };
  ltv: number;
  churnRisk: 'low' | 'medium' | 'high';
  nextBestAction: string;
}

interface UpsellSuggestion {
  triggerProduct: string;
  suggestedProducts: Array<{
    productId: string;
    name: string;
    reason: string;
    discount?: number;
    confidence: number;
  }>;
}

interface StoreLayoutSuggestion {
  currentLayout: string;
  suggestions: Array<{
    section: string;
    action: 'move' | 'add' | 'remove' | 'reposition';
    reason: string;
    expectedImpact: number;
  }>;
  overallScore: number;
}

// ============================================
// PRODUCT RECOMMENDATIONS ENGINE
// ============================================

export async function recommendProducts(context: RecommendationContext): Promise<{
  products: Array<{ item: any; reason: string; price: number; score: number }>;
  personalized: boolean;
}> {
  try {
    const { customerId, browsingHistory, preferences, currentCart } = context;
    let recommendedProducts: any[] = [];

    // Get customer data if available
    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
    }

    // Get all active products
    let products = await Product.find({ isActive: true });

    // Score products based on context
    const scoredProducts = products.map(product => {
      let score = 50; // Base score

      // Boost based on customer preferences
      if (customer && customer.preferences) {
        if (customer.preferences.categories?.includes(product.category)) {
          score += 20;
        }
        if (product.tags?.some((tag: string) => customer.preferences.tags?.includes(tag))) {
          score += 15;
        }
      }

      // Boost trending/popular products
      if (product.tags?.includes('bestseller') || product.tags?.includes('popular')) {
        score += 15;
      }

      // Boost high-margin products
      const margin = (product.price - product.cost) / product.cost;
      if (margin > 1) score += 10;

      // Boost in-stock products
      if (product.stock > 10) score += 5;

      return { product, score };
    });

    // Sort by score and take top 10
    scoredProducts.sort((a, b) => b.score - a.score);
    recommendedProducts = scoredProducts.slice(0, 10);

    // Generate personalized reasons using AI
    let personalized = !!customerId;

    const recommendations = recommendedProducts.map(({ product, score }) => ({
      item: {
        id: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        tags: product.tags,
      },
      reason: generateRecommendationReason(product, customer, score),
      price: product.price,
      score,
    }));

    return { products: recommendations, personalized };
  } catch (error) {
    console.error('Recommendation error:', error);
    return { products: [], personalized: false };
  }
}

function generateRecommendationReason(product: any, customer: any, score: number): string {
  const reasons = [
    'Based on your shopping preferences',
    'Highly rated by similar customers',
    'Popular in your favorite category',
    'Currently trending in the store',
    'Best value in its category',
    'Frequently bought together',
  ];

  if (customer) {
    if (customer.tier === 'platinum' || customer.tier === 'gold') {
      return 'Recommended for premium customers like you';
    }
    if (customer.preferences?.categories?.includes(product.category)) {
      return `You often shop in ${product.category}`;
    }
  }

  if (product.tags?.includes('bestseller')) {
    return 'Top seller this week';
  }

  return reasons[Math.floor(Math.random() * reasons.length)];
}

// ============================================
// INVENTORY FORECASTING ENGINE
// ============================================

export async function forecastInventory(productId: string): Promise<InventoryForecastResult> {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get historical sales data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await Sale.find({
      'items.productId': productId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate daily average sales
    let totalSold = 0;
    salesData.forEach(sale => {
      const item = sale.items.find((i: any) => i.productId.toString() === productId);
      if (item) {
        totalSold += item.quantity;
      }
    });

    const daysWithSales = salesData.length > 0 ? 30 : 1;
    const dailyAverage = totalSold / daysWithSales;

    // Calculate trend
    const recentSales = salesData.filter((s: any) => {
      const saleDate = new Date(s.createdAt);
      return saleDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    });

    const olderSales = salesData.filter((s: any) => {
      const saleDate = new Date(s.createdAt);
      return saleDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    });

    const recentAvg = recentSales.length > 0 ? recentSales.reduce((sum: number, s: any) => {
      const item = s.items.find((i: any) => i.productId.toString() === productId);
      return sum + (item?.quantity || 0);
    }, 0) / 7 : 0;

    const olderAvg = olderSales.length > 0 ? olderSales.reduce((sum: number, s: any) => {
      const item = s.items.find((i: any) => i.productId.toString() === productId);
      return sum + (item?.quantity || 0);
    }, 0) / 23 : 0;

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentAvg > olderAvg * 1.2) trend = 'increasing';
    else if (recentAvg < olderAvg * 0.8) trend = 'decreasing';

    // Calculate confidence based on data availability
    const confidence = Math.min(0.95, 0.5 + (salesData.length * 0.01));

    // Calculate forecasts
    const nextWeek = Math.round(dailyAverage * 7 * (trend === 'increasing' ? 1.2 : trend === 'decreasing' ? 0.8 : 1));
    const nextMonth = Math.round(dailyAverage * 30 * (trend === 'increasing' ? 1.25 : trend === 'decreasing' ? 0.75 : 1));

    // Generate recommendations
    const recommendations: string[] = [];
    const daysOfStock = product.stock / dailyAverage;

    if (daysOfStock < 7) {
      recommendations.push('⚠️ URGENT: Stock will last less than 7 days. Reorder immediately.');
    } else if (daysOfStock < 14) {
      recommendations.push('Stock running low. Consider reordering within 3 days.');
    }

    if (trend === 'increasing') {
      recommendations.push(`📈 Demand is increasing. Consider increasing reorder quantity by 25%.`);
    } else if (trend === 'decreasing') {
      recommendations.push('📉 Demand is decreasing. Consider reducing reorder quantity.');
    }

    if (product.stock < product.reorderLevel) {
      recommendations.push(`Current stock (${product.stock}) is below reorder level (${product.reorderLevel}).`);
    }

    return {
      productId: product._id.toString(),
      productName: product.name,
      currentStock: product.stock,
      forecast: {
        nextWeek,
        nextMonth,
        dailyAverage: Math.round(dailyAverage * 10) / 10,
        trend,
      },
      confidence,
      recommendations,
    };
  } catch (error) {
    console.error('Forecast error:', error);
    throw error;
  }
}

// ============================================
// DYNAMIC PRICING SUGGESTIONS
// ============================================

export async function suggestPricing(input: {
  productId: string;
  cost?: number;
  competitorPrice?: number;
  demand?: 'low' | 'medium' | 'high';
}): Promise<PricingSuggestion> {
  try {
    const { productId, cost, competitorPrice, demand } = input;

    let product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const productCost = cost || product.cost || 0;
    const compPrice = competitorPrice || product.price;
    const demandLevel = demand || 'medium';

    // Get sales velocity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await Sale.find({
      'items.productId': productId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    let salesVelocity = 0;
    salesData.forEach(sale => {
      const item = sale.items.find((i: any) => i.productId.toString() === productId);
      if (item) salesVelocity += item.quantity;
    });

    // Calculate base price with margin
    const baseMargin = 0.3; // 30% base margin
    let suggestedPrice = productCost * (1 + baseMargin);

    // Adjust based on competitor pricing
    if (compPrice) {
      const priceDiff = (compPrice - suggestedPrice) / compPrice;
      if (priceDiff > 0.1) {
        // We're cheaper than competition - could increase
        suggestedPrice = compPrice * 0.95;
      } else if (priceDiff < -0.1) {
        // We're more expensive - should decrease
        suggestedPrice = compPrice * 1.05;
      }
    }

    // Adjust based on demand
    if (demandLevel === 'high' && salesVelocity > 20) {
      suggestedPrice *= 1.1; // Can charge 10% more
    } else if (demandLevel === 'low' && salesVelocity < 5) {
      suggestedPrice *= 0.9; // Need to reduce price
    }

    // Ensure minimum margin
    const minPrice = productCost * 1.15; // At least 15% margin
    suggestedPrice = Math.max(suggestedPrice, minPrice);

    // Round to nearest 10
    suggestedPrice = Math.round(suggestedPrice / 10) * 10;

    const priceChange = ((suggestedPrice - product.price) / product.price) * 100;

    // Generate factors and reason
    const factors: string[] = [];
    let reason = '';

    if (compPrice) {
      factors.push(`Competitor price: ₹${compPrice}`);
      if (suggestedPrice < compPrice) {
        reason = 'Slightly below competitor to attract price-sensitive customers';
      } else {
        reason = 'Positioned competitively while maintaining healthy margin';
      }
    }

    if (salesVelocity > 20) {
      factors.push('High sales velocity - demand supports premium pricing');
    } else if (salesVelocity < 5) {
      factors.push('Low sales velocity - consider promotional pricing');
    }

    if (demandLevel === 'high') {
      factors.push('High market demand detected');
    }

    const confidence = 0.75 + (salesVelocity / 100) * 0.15;

    return {
      productId: product._id.toString(),
      productName: product.name,
      currentPrice: product.price,
      cost: productCost,
      suggestedPrice,
      priceChange: Math.round(priceChange * 10) / 10,
      reason,
      confidence: Math.min(0.95, confidence),
      factors,
    };
  } catch (error) {
    console.error('Pricing suggestion error:', error);
    throw error;
  }
}

// ============================================
// CUSTOMER SEGMENTATION ENGINE
// ============================================

export async function segmentCustomer(customerId: string): Promise<CustomerSegmentation> {
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get customer's purchase history
    const sales = await Sale.find({ customerId });
    const totalSpent = customer.totalSpent || sales.reduce((sum: number, s: any) => sum + s.total, 0);
    const purchaseCount = customer.purchaseCount || sales.length;

    // Calculate LTV (simplified)
    const avgOrderValue = purchaseCount > 0 ? totalSpent / purchaseCount : 0;
    const estimatedPurchasesPerYear = purchaseCount > 0 ? purchaseCount : 1;
    const ltv = Math.round(avgOrderValue * estimatedPurchasesPerYear * 3); // 3-year projection

    // Determine segment
    let segment: 'budget' | 'regular' | 'premium' | 'vip' = 'budget';
    if (ltv > 50000) segment = 'vip';
    else if (ltv > 20000) segment = 'premium';
    else if (ltv > 5000) segment = 'regular';

    // Determine churn risk
    let churnRisk: 'low' | 'medium' | 'high' = 'medium';
    const lastPurchase = sales.length > 0 ? new Date(sales[sales.length - 1].createdAt) : null;
    const daysSinceLastPurchase = lastPurchase
      ? Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastPurchase > 90) churnRisk = 'high';
    else if (daysSinceLastPurchase < 30) churnRisk = 'low';

    // Extract preferences from purchase history
    const categories: string[] = [];
    const allTags: string[] = [];

    for (const sale of sales) {
      for (const item of sale.items) {
        const product = await Product.findById(item.productId).catch(() => null);
        if (product) {
          if (!categories.includes(product.category)) {
            categories.push(product.category);
          }
          allTags.push(...(product.tags || []));
        }
      }
    }

    // Calculate shopping frequency
    let shoppingFrequency: 'rare' | 'occasional' | 'regular' | 'frequent' = 'occasional';
    if (purchaseCount > 24) shoppingFrequency = 'frequent';
    else if (purchaseCount > 12) shoppingFrequency = 'regular';
    else if (purchaseCount < 3) shoppingFrequency = 'rare';

    // Determine next best action
    let nextBestAction = 'Send a personalized offer based on their purchase history';
    if (churnRisk === 'high') {
      nextBestAction = 'Send win-back campaign with exclusive discount';
    } else if (segment === 'vip') {
      nextBestAction = 'Invite to exclusive early access sale';
    } else if (shoppingFrequency === 'rare') {
      nextBestAction = 'Send trending products in their preferred categories';
    }

    return {
      customerId: customer._id.toString(),
      segment,
      preferences: {
        categories,
        priceRange: {
          min: Math.round(avgOrderValue * 0.5),
          max: Math.round(avgOrderValue * 1.5),
        },
        shoppingFrequency,
        channel: 'omni', // Could be determined from customer data
      },
      ltv,
      churnRisk,
      nextBestAction,
    };
  } catch (error) {
    console.error('Segmentation error:', error);
    throw error;
  }
}

// ============================================
// CROSS-SELL / UP-SELL SUGGESTIONS
// ============================================

export async function suggestUpsell(input: {
  cart: Array<{ productId: string; quantity: number }>;
  customerId?: string;
}): Promise<UpsellSuggestion> {
  try {
    const { cart, customerId } = input;

    if (cart.length === 0) {
      return {
        triggerProduct: 'empty',
        suggestedProducts: [],
      };
    }

    // Get cart products
    const cartProductIds = cart.map(item => item.productId);
    const cartProducts = await Product.find({ _id: { $in: cartProductIds } });

    // Find trigger product (highest value or first item)
    const triggerProduct = cartProducts.sort((a, b) => b.price - a.price)[0];

    // Get products frequently bought together
    const salesWithTrigger = await Sale.find({
      'items.productId': triggerProduct._id,
    });

    // Find co-occurring products
    const coOccurrences: Record<string, number> = {};
    salesWithTrigger.forEach(sale => {
      sale.items.forEach((item: any) => {
        if (item.productId.toString() !== triggerProduct._id.toString()) {
          coOccurrences[item.productId.toString()] = (coOccurrences[item.productId.toString()] || 0) + 1;
        }
      });
    });

    // Sort by co-occurrence frequency
    const sortedCoOccurrences = Object.entries(coOccurrences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Get suggested products
    const suggestedProducts = [];
    for (const [productId, count] of sortedCoOccurrences) {
      const product = await Product.findById(productId).catch(() => null);
      if (product && product.isActive) {
        // Calculate confidence based on co-occurrence frequency
        const confidence = Math.min(0.9, 0.3 + (count / 20));

        // Determine if discount should be offered
        let discount: number | undefined;
        if (confidence > 0.7) {
          discount = 5; // 5% off for high confidence suggestions
        }

        suggestedProducts.push({
          productId: product._id.toString(),
          name: product.name,
          reason: `Frequently bought together with ${triggerProduct.name}`,
          discount,
          confidence: Math.round(confidence * 100) / 100,
        });
      }
    }

    // If no co-occurrences found, use category-based suggestions
    if (suggestedProducts.length === 0 && cartProducts.length > 0) {
      const categories = cartProducts.map(p => p.category);
      const relatedProducts = await Product.find({
        category: { $in: categories },
        _id: { $nin: cartProductIds },
        isActive: true,
      }).limit(5);

      for (const product of relatedProducts) {
        suggestedProducts.push({
          productId: product._id.toString(),
          name: product.name,
          reason: `Similar to items in your cart`,
          confidence: 0.5,
        });
      }
    }

    return {
      triggerProduct: triggerProduct.name,
      suggestedProducts,
    };
  } catch (error) {
    console.error('Upsell suggestion error:', error);
    throw error;
  }
}

// ============================================
// STORE LAYOUT OPTIMIZATION
// ============================================

export async function optimizeStoreLayout(storeId?: string): Promise<StoreLayoutSuggestion> {
  try {
    // Get all products with their sales data
    const products = await Product.find({ isActive: true });

    // Calculate category performance
    const categorySales: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await Sale.find({ createdAt: { $gte: thirtyDaysAgo } });

    sales.forEach(sale => {
      sale.items.forEach((item: any) => {
        const product = products.find(p => p._id.toString() === item.productId);
        if (product) {
          categorySales[product.category] = (categorySales[product.category] || 0) + item.quantity * item.price;
        }
      });
    });

    // Sort categories by performance
    const sortedCategories = Object.entries(categorySales)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);

    // Generate layout suggestions
    const suggestions = [];

    // High-performing categories should be at eye level and near entrance
    sortedCategories.slice(0, 3).forEach((category, index) => {
      suggestions.push({
        section: `${category} Section`,
        action: 'reposition' as const,
        reason: `This category generates ${Math.round((categorySales[category] || 0) / Object.values(categorySales).reduce((a, b) => a + b, 0) * 100)}% of revenue`,
        expectedImpact: 15 + index * 5,
      });
    });

    // Cross-sell opportunities
    suggestions.push({
      section: 'Checkout Area',
      action: 'add' as const,
      reason: 'Add complementary products near checkout (candies, magazines, small accessories)',
      expectedImpact: 10,
    });

    // Clearance section optimization
    suggestions.push({
      section: 'Clearance Corner',
      action: 'move' as const,
      reason: 'Move clearance items to high-traffic area to increase visibility',
      expectedImpact: 8,
    });

    // Calculate overall score
    const overallScore = Math.min(95, 60 + sortedCategories.length * 5);

    return {
      currentLayout: 'Standard retail layout with category-based sections',
      suggestions,
      overallScore,
    };
  } catch (error) {
    console.error('Store layout optimization error:', error);
    throw error;
  }
}

// ============================================
// AI ENHANCED INSIGHTS (Using Claude)
// ============================================

export async function getAIInsights(context: {
  type: 'inventory' | 'pricing' | 'customer' | 'general';
  query?: string;
}): Promise<{ insight: string; confidence: number; recommendations: string[] }> {
  try {
    const { type, query } = context;

    // Get relevant data for context
    let dataContext = '';

    if (type === 'inventory' || type === 'general') {
      const lowStock = await Product.find({ $expr: { $lte: ['$stock', '$reorderLevel'] } }).limit(5);
      dataContext += `\nLow stock products: ${lowStock.map(p => `${p.name} (${p.stock} units)`).join(', ')}`;
    }

    if (type === 'pricing' || type === 'general') {
      const topProducts = await Product.find({ isActive: true }).sort({ price: -1 }).limit(5);
      dataContext += `\nTop priced products: ${topProducts.map(p => `${p.name} (₹${p.price})`).join(', ')}`;
    }

    if (type === 'customer' || type === 'general') {
      const recentCustomers = await Customer.find().sort({ totalSpent: -1 }).limit(3);
      dataContext += `\nTop customers: ${recentCustomers.map(c => `${c.name} (₹${c.totalSpent})`).join(', ')}`;
    }

    // Use Claude for insights
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `As ShopFlow AI, analyze this retail data and provide actionable insights:\n\n${dataContext}\n\nQuery: ${query || 'Provide key insights and recommendations for this data'}\n\nProvide your response as JSON with: insight (string), confidence (0-1), recommendations (array of strings).`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const parsed = JSON.parse(content.text);
        return {
          insight: parsed.insight || 'Analysis complete',
          confidence: parsed.confidence || 0.7,
          recommendations: parsed.recommendations || [],
        };
      } catch {
        return {
          insight: content.text.substring(0, 500),
          confidence: 0.6,
          recommendations: ['Review inventory levels', 'Consider promotional pricing'],
        };
      }
    }

    return {
      insight: 'AI analysis complete',
      confidence: 0.7,
      recommendations: [],
    };
  } catch (error) {
    console.error('AI insights error:', error);
    // Fallback to rule-based insights
    return {
      insight: 'Based on current data analysis',
      confidence: 0.5,
      recommendations: ['Monitor stock levels closely', 'Review pricing strategy'],
    };
  }
}

// Export all functions
export const shopFlowAI = {
  recommendProducts,
  forecastInventory,
  suggestPricing,
  segmentCustomer,
  suggestUpsell,
  optimizeStoreLayout,
  getAIInsights,
};

export default shopFlowAI;