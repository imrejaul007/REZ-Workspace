import { Router, Request, Response } from 'express';
import { inventoryAgent, loyaltyAgent, customerAgent, checkoutAgent } from '../../services';
import { logger } from '../../utils/logger';

const router = Router();

// AI Status endpoint
router.get('/status', async (req: Request, res: Response) => {
  try {
    const agents = [
      {
        name: 'Inventory Agent',
        status: 'active',
        capabilities: ['stock_management', 'reorder_automation', 'low_stock_alerts', 'inventory_analytics'],
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Loyalty Agent',
        status: 'active',
        capabilities: ['points_management', 'tier_calculation', 'rewards_redemption', 'customer_engagement'],
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Customer Agent',
        status: 'active',
        capabilities: ['customer_360_profile', 'segmentation', 'churn_prediction', 'recommendations'],
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Checkout Agent',
        status: 'active',
        capabilities: ['fast_checkout', 'multiple_payment_methods', 'loyalty_integration', 'refunds'],
        lastCheck: new Date().toISOString(),
      },
    ];

    // Get quick metrics from each agent
    let inventoryHealth = null;
    let loyaltyStats = null;

    try {
      const health = await inventoryAgent.getInventoryHealth();
      inventoryHealth = { score: health.score, status: health.status };
    } catch (e) {
      inventoryHealth = { error: 'Unable to fetch' };
    }

    try {
      const stats = await loyaltyAgent.getAllTierStats();
      loyaltyStats = {
        totalMembers: stats.reduce((sum, t) => sum + t.memberCount, 0),
        tiers: stats.map((t) => ({ tier: t.tier, count: t.memberCount })),
      };
    } catch (e) {
      loyaltyStats = { error: 'Unable to fetch' };
    }

    res.json({
      success: true,
      system: {
        name: 'SHOPFLOW AI Operating System',
        version: '1.0.0',
        status: 'operational',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      agents,
      metrics: {
        inventory: inventoryHealth,
        loyalty: loyaltyStats,
      },
    });
  } catch (error) {
    logger.error('AI status check failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get AI status',
    });
  }
});

export default router;
