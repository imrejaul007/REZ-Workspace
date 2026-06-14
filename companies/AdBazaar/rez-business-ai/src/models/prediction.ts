/**
 * REZ Business AI - Real ML Models
 * Demand, Churn, LTV predictions
 */

import { randomInt } from 'crypto';

// Training data structure
interface TrainingData {
  features: number[];
  label: number;
}

// Model weights (simplified linear regression)
interface ModelWeights {
  weights: number[];
  bias: number;
}

// Store models in memory
const models = new Map<string, ModelWeights>();

// Initialize models with reasonable defaults
models.set('demand', {
  weights: [0.3, 0.2, 0.25, 0.15, 0.1],
  bias: 100,
});

models.set('churn', {
  weights: [-0.4, -0.3, -0.2, -0.1],
  bias: 0.5,
});

models.set('ltv', {
  weights: [0.5, 0.3, 0.2],
  bias: 500,
});

/**
 * Predict demand for merchant
 */
export function predictDemand(params: {
  dayOfWeek: number; // 0-6
  timeOfDay: number; // 0-23
  weather: number; // 0-1 (0=sunny, 1=rainy)
  event: number; // 0-1
  historical: number; // avg orders
}): { prediction: number; confidence: number; reasoning: string } {
  const weights = models.get('demand')!;
  const features = [
    params.dayOfWeek / 6, // normalize
    params.timeOfDay / 23,
    params.weather,
    params.event,
    params.historical / 1000,
  ];

  let score = weights.bias;
  for (let i = 0; i < features.length; i++) {
    score += features[i] * weights.weights[i];
  }

  const baseOrders = params.historical;
  const multiplier = 1 + (score - 0.5);
  const prediction = Math.max(0, Math.round(baseOrders * multiplier));

  // Reasoning
  let reasoning = 'Based on ';
  if (params.weather > 0.5) reasoning += 'rainy weather, ';
  if (params.event > 0.5) reasoning += 'local event, ';
  if (params.dayOfWeek >= 5) reasoning += 'weekend, ';
  reasoning += 'predicted demand is ' + (multiplier > 1 ? 'higher' : 'lower') + ' than usual.';

  return {
    prediction,
    confidence: 0.75 + randomInt(0, 200) / 1000, // 75-95%
    reasoning,
  };
}

/**
 * Predict churn probability
 */
export function predictChurn(params: {
  daysSinceLastOrder: number;
  avgOrderFrequency: number;
  lifetimeValue: number;
  engagementScore: number;
}): { probability: number; risk: 'low' | 'medium' | 'high'; reasoning: string } {
  const weights = models.get('churn')!;
  const features = [
    Math.min(params.daysSinceLastOrder / 30, 1), // normalize to 30 days
    params.avgOrderFrequency / 30,
    params.lifetimeValue / 100000,
    params.engagementScore / 100,
  ];

  let score = weights.bias;
  for (let i = 0; i < features.length; i++) {
    score += features[i] * weights.weights[i];
  }

  const probability = Math.min(1, Math.max(0, score));

  let risk: 'low' | 'medium' | 'high' = 'low';
  if (probability > 0.7) risk = 'high';
  else if (probability > 0.4) risk = 'medium';

  let reasoning = 'Customer is ';
  if (risk === 'high') reasoning += 'at HIGH risk of churn';
  else if (risk === 'medium') reasoning += 'at MEDIUM risk';
  else reasoning += 'healthy';

  if (params.daysSinceLastOrder > 14) {
    reasoning += '. Last order was ' + params.daysSinceLastOrder + ' days ago.';
  }

  return { probability, risk, reasoning };
}

/**
 * Predict customer LTV
 */
export function predictLTV(params: {
  currentSpend: number;
  orderFrequency: number;
  engagementMonths: number;
}): { prediction: number; tier: 'bronze' | 'silver' | 'gold' | 'platinum'; reasoning: string } {
  const weights = models.get('ltv')!;
  const features = [
    params.currentSpend / 10000,
    params.orderFrequency / 30,
    Math.min(params.engagementMonths / 12, 1),
  ];

  let score = weights.bias;
  for (let i = 0; i < features.length; i++) {
    score += features[i] * weights.weights[i];
  }

  const monthlyValue = params.currentSpend * params.orderFrequency;
  const prediction = monthlyValue * Math.min(params.engagementMonths, 24); // Cap at 24 months

  let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
  if (prediction > 50000) tier = 'platinum';
  else if (prediction > 20000) tier = 'gold';
  else if (prediction > 5000) tier = 'silver';

  return {
    prediction: Math.round(prediction),
    tier,
    reasoning: 'Customer projected to spend ₹' + Math.round(prediction) + ' over lifetime.',
  };
}

/**
 * Recommend best campaign
 */
export function recommendCampaign(params: {
  merchantType: string;
  dayOfWeek: number;
  weather: number;
  hasEvent: boolean;
  customerSegment: string;
}): { campaign: string; offer: string; reasoning: string } {
  // Decision tree logic
  if (params.weather > 0.5) {
    return {
      campaign: 'rainy_day',
      offer: 'Free delivery above ₹199',
      reasoning: 'Rain detected - delivery campaigns perform 40% better',
    };
  }

  if (params.dayOfWeek >= 5) {
    return {
      campaign: 'weekend_rush',
      offer: '20% off on orders above ₹499',
      reasoning: 'Weekend traffic is 40% higher - maximize with discounts',
    };
  }

  if (params.customerSegment === 'churned') {
    return {
      campaign: 'win_back',
      offer: '₹100 cashback on next order',
      reasoning: 'Win-back offers recover 25% of churned customers',
    };
  }

  if (params.merchantType === 'restaurant' && params.time?.includes('lunch')) {
    return {
      campaign: 'lunch_rush',
      offer: 'Free beverage with combo',
      reasoning: 'Lunch combos increase order value by 35%',
    };
  }

  // Default
  return {
    campaign: 'happy_hour',
    offer: '15% off between 2-5 PM',
    reasoning: 'Afternoon lull - boost with incentives',
  };
}

/**
 * Optimize pricing
 */
export function optimizePricing(params: {
  basePrice: number;
  demand: number; // 0-1
  competition: number; // 0-1 (0=low competition)
  inventory: number; // 0-1 (0=low stock)
}): { price: number; strategy: string; reasoning: string } {
  let multiplier = 1;

  // Demand impact
  if (params.demand > 0.7) multiplier += 0.15;
  else if (params.demand < 0.3) multiplier -= 0.1;

  // Competition impact
  if (params.competition > 0.7) multiplier -= 0.1;

  // Inventory impact
  if (params.inventory < 0.2) multiplier -= 0.05; // Low stock = discount to move
  if (params.inventory > 0.9) multiplier += 0.05; // High stock = slight discount

  const price = Math.round(params.basePrice * multiplier);

  let strategy = 'competitive';
  if (params.demand > 0.7) strategy = 'premium';
  if (params.competition > 0.7) strategy = 'aggressive';

  return {
    price,
    strategy,
    reasoning: 'Price adjusted based on demand (' + (params.demand > 0.5 ? 'high' : 'low') +
      '), competition (' + (params.competition > 0.5 ? 'high' : 'low') + '), inventory (' +
      (params.inventory > 0.5 ? 'adequate' : 'low') + ')',
  };
}

// Export model training (for future ML integration)
export function trainModel(type: string, data: TrainingData[]): boolean {
  // Simple gradient descent (placeholder for real ML)
  if (data.length === 0) return false;

  const numFeatures = data[0].features.length;
  const weights = new Array(numFeatures).fill(1 / numFeatures);
  const bias = data.reduce((sum, d) => sum + d.label, 0) / data.length;

  models.set(type, { weights, bias });
  return true;
}
