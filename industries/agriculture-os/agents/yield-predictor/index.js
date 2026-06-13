const { Agent } = require('../../../core/agent-base');
const { CropTwin } = require('../../services/farm-twin-service/models');
const logger = require('../../../utils/logger');

class YieldPredictorAgent extends Agent {
  constructor(options) {
    super(options);
  }

  async onMessage(message, reply) {
    try {
      const { action, farmId, cropId, data } = message;

      switch (action) {
        case 'predict_yield':
          return await this.predictYield(cropId, reply);
        case 'analyze_crop_health':
          return await this.analyzeCropHealth(cropId, reply);
        case 'recommend_harvest':
          return await this.recommendHarvest(farmId, reply);
        case 'market_advice':
          return await this.marketAdvice(cropId, reply);
        default:
          return reply({ error: 'Unknown action' });
      }
    } catch (error) {
      logger.error('YieldPredictorAgent error:', error);
      return reply({ error: error.message });
    }
  }

  async predictYield(cropId, reply) {
    const crop = await CropTwin.findById(cropId);
    if (!crop) return reply({ error: 'Crop not found' });

    // Simulate yield prediction
    const baseYield = crop.area * 5; // tons per hectare estimate
    const healthMultiplier = crop.healthScore / 100;
    const weatherMultiplier = 0.9 + Math.random() * 0.2;
    const predictedYield = baseYield * healthMultiplier * weatherMultiplier;

    return reply({
      cropId,
      variety: crop.variety,
      predictedYield: {
        value: Math.round(predictedYield * 10) / 10,
        unit: 'tons',
        confidence: 0.85,
        factors: {
          healthScore: crop.healthScore,
          growthStage: crop.growthStage,
          weatherOutlook: 'favorable'
        }
      },
      expectedRevenue: {
        value: Math.round(predictedYield * crop.currentPrice.value * 100) / 100,
        currency: crop.currentPrice.currency
      }
    });
  }

  async analyzeCropHealth(cropId, reply) {
    const crop = await CropTwin.findById(cropId);
    if (!crop) return reply({ error: 'Crop not found' });

    const healthAnalysis = {
      cropId,
      currentScore: crop.healthScore,
      status: crop.healthScore > 70 ? 'healthy' : crop.healthScore > 40 ? 'needs_attention' : 'critical',
      ndviIndex: crop.ndviIndex,
      recommendations: []
    };

    if (crop.healthScore < 70) {
      healthAnalysis.recommendations.push('Consider additional fertilization');
    }
    if (crop.ndviIndex < 0.5) {
      healthAnalysis.recommendations.push('Possible irrigation issues detected');
    }

    return reply(healthAnalysis);
  }

  async recommendHarvest(farmId, reply) {
    const crops = await CropTwin.find({ farm: farmId, marketReadiness: { $ne: 'ready' } });

    const recommendations = crops
      .filter(c => c.growthStage === 'harvest_ready' || c.healthScore > 80)
      .map(c => ({
        cropId: c._id,
        variety: c.variety,
        priority: c.healthScore > 90 ? 'high' : 'medium',
        reason: c.growthStage === 'harvest_ready' ? 'Harvest ready' : 'Optimal health'
      }));

    return reply({ farmId, recommendations });
  }

  async marketAdvice(cropId, reply) {
    const crop = await CropTwin.findById(cropId);
    if (!crop) return reply({ error: 'Crop not found' });

    return reply({
      cropId,
      variety: crop.variety,
      currentPrice: crop.currentPrice,
      advice: {
        sellNow: crop.currentPrice.value > 200,
        holdForBetter: crop.currentPrice.value < 180,
        recommendation: crop.currentPrice.value > 200 ? 'Sell now' : 'Consider holding'
      },
      historicalTrend: 'upward',
      seasonalOutlook: 'favorable'
    });
  }
}

module.exports = YieldPredictorAgent;
