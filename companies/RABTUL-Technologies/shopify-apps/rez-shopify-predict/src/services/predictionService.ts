/**
 * ReZ Predict - Prediction Service
 */

import { CustomerPrediction, ICustomerPrediction } from '../models/Predictions';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:4123';

export interface CustomerFeatures {
  customerId: string;
  shop: string;
  tenantId: string;
  brandId: string;
  // Demographics
  daysSinceSignUp: number;
  city?: string;
  // Purchase behavior
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate?: Date;
  daysSinceLastOrder: number;
  // Engagement
  emailsOpened: number;
  emailsClicked: number;
  pushEnabled: boolean;
  // Product affinity
  categories: Record<string, number>;
  priceRanges: Record<string, number>;
}

export class PredictionService {
  /**
   * Extract features from customer data
   */
  static extractFeatures(data: {
    customerId: string;
    shop: string;
    tenantId: string;
    brandId: string;
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderDate?: Date;
    signupDate?: Date;
    emailsOpened?: number;
    emailsClicked?: number;
    categories?: Record<string, number>;
    priceRanges?: Record<string, number>;
  }): CustomerFeatures {
    const daysSinceLastOrder = data.lastOrderDate
      ? Math.floor((Date.now() - new Date(data.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const daysSinceSignUp = data.signupDate
      ? Math.floor((Date.now() - new Date(data.signupDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      customerId: data.customerId,
      shop: data.shop,
      tenantId: data.tenantId,
      brandId: data.brandId,
      daysSinceSignUp,
      totalOrders: data.totalOrders,
      totalSpent: data.totalSpent,
      avgOrderValue: data.avgOrderValue,
      lastOrderDate: data.lastOrderDate,
      daysSinceLastOrder,
      emailsOpened: data.emailsOpened || 0,
      emailsClicked: data.emailsClicked || 0,
      pushEnabled: false,
      categories: data.categories || {},
      priceRanges: data.priceRanges || {},
    };
  }

  /**
   * Get predictions for a customer
   */
  static async getCustomerPrediction(features: CustomerFeatures): Promise<ICustomerPrediction> {
    // Check cache
    const cached = await CustomerPrediction.findOne({
      shop: features.shop.toLowerCase(),
      customerId: features.customerId,
    });

    if (cached && this.isPredictionFresh(cached.predictedAt)) {
      return cached;
    }

    // Call ML service
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/api/predict`, {
        features,
        shop: features.shop,
      });

      const predictions = response.data.predictions;

      // Save prediction
      const prediction = await CustomerPrediction.findOneAndUpdate(
        { shop: features.shop.toLowerCase(), customerId: features.customerId },
        {
          shop: features.shop.toLowerCase(),
          tenantId: features.tenantId,
          brandId: features.brandId,
          customerId: features.customerId,
          predictions: {
            ltv: predictions.ltv,
            churnRisk: predictions.churnRisk,
            churnScore: predictions.churnScore,
            revisitProbability: predictions.revisitProbability,
            nextPurchaseDate: predictions.nextPurchaseDate,
            predictedLifetimeOrders: predictions.lifetimeOrders,
            predictedLifetimeValue: predictions.lifetimeValue,
          },
          features: features,
          modelVersion: response.data.modelVersion || 'v1',
          predictedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return prediction;
    } catch (error) {
      console.error('ML service error:', error);

      // Fallback to rule-based predictions
      return this.getRuleBasedPrediction(features);
    }
  }

  /**
   * Rule-based fallback predictions
   */
  static getRuleBasedPrediction(features: CustomerFeatures): ICustomerPrediction {
    // Calculate LTV estimate
    const avgOrderValue = features.avgOrderValue || (features.totalSpent / Math.max(features.totalOrders, 1));
    const expectedOrdersPerYear = features.totalOrders / Math.max(features.daysSinceSignUp / 365, 0.5);
    const ltv = avgOrderValue * expectedOrdersPerYear * 3; // 3 year estimate

    // Calculate churn risk
    let churnScore = 50;
    if (features.daysSinceLastOrder > 60) churnScore += 30;
    else if (features.daysSinceLastOrder > 30) churnScore += 15;
    if (features.totalOrders < 2) churnScore += 10;
    if (features.emailsOpened === 0) churnScore += 5;

    const churnRisk = churnScore > 70 ? 'high' : churnScore > 40 ? 'medium' : 'low';

    // Calculate revisit probability
    const revisitProbability = Math.max(0, Math.min(100, 100 - churnScore));

    return {
      predictions: {
        ltv: Math.round(ltv),
        churnRisk: churnRisk as 'low' | 'medium' | 'high',
        churnScore,
        revisitProbability,
        predictedLifetimeOrders: Math.round(expectedOrdersPerYear * 3),
        predictedLifetimeValue: Math.round(ltv),
      },
      features: features as any,
      modelVersion: 'rule-based-v1',
      predictedAt: new Date(),
    } as any;
  }

  /**
   * Check if prediction is fresh (less than 24 hours old)
   */
  static isPredictionFresh(predictedAt: Date): boolean {
    const hoursSincePrediction = (Date.now() - new Date(predictedAt).getTime()) / (1000 * 60 * 60);
    return hoursSincePrediction < 24;
  }

  /**
   * Get all at-risk customers for a shop
   */
  static async getAtRiskCustomers(shop: string): Promise<ICustomerPrediction[]> {
    return CustomerPrediction.find({
      shop: shop.toLowerCase(),
      'predictions.churnRisk': { $in: ['medium', 'high'] },
    })
      .sort({ 'predictions.churnScore': -1 })
      .limit(100);
  }

  /**
   * Get high-value customers for retention
   */
  static async getHighValueCustomers(shop: string): Promise<ICustomerPrediction[]> {
    return CustomerPrediction.find({
      shop: shop.toLowerCase(),
      'predictions.ltv': { $gte: 5000 },
    })
      .sort({ 'predictions.ltv': -1 })
      .limit(50);
  }

  /**
   * Batch predict for all customers
   */
  static async batchPredict(shop: string, customers: CustomerFeatures[]): Promise<void> {
    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);

      try {
        await axios.post(`${ML_SERVICE_URL}/api/predict/batch`, {
          customers: batch,
          shop,
        });
      } catch (error) {
        console.error(`Batch predict error for batch ${i}:`, error);
      }
    }
  }
}
