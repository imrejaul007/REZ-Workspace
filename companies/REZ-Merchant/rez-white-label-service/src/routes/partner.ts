import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { Partner } from '../models/Partner';

const router = Router();

// Plan pricing
const PLAN_PRICES = {
  starter: 25000,
  professional: 75000,
  enterprise: 200000
};

// Onboard new partner
router.post('/onboard', async (req: Request, res: Response) => {
  try {
    const { partnerName, partnerEmail, domain, brandName, plan = 'starter' } = req.body;

    // Generate API key
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Default modules based on plan
    const modules = plan === 'enterprise'
      ? ['loyalty', 'rewards', 'analytics', 'api', 'white-label', 'custom']
      : plan === 'professional'
      ? ['loyalty', 'rewards', 'analytics', 'api']
      : ['loyalty', 'rewards', 'api'];

    const partner = new Partner({
      partnerName,
      partnerEmail,
      domain,
      brandName,
      plan,
      modules,
      apiKeys: [{ key: apiKey, name: 'Primary', permissions: modules }],
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    });

    await partner.save();

    res.status(201).json({
      partnerId: partner._id,
      apiKey,
      domain: partner.domain,
      plan: partner.plan,
      modules: partner.modules,
      trialEndsAt: partner.trialEndsAt,
      dashboard: `https://dashboard.${domain}`,
      docs: 'https://api.rez.money/docs'
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get partner info
router.get('/:partnerId', async (req: Request, res: Response) => {
  try {
    const partner = await Partner.findById(req.params.partnerId);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    res.json({
      partnerId: partner._id,
      brandName: partner.brandName,
      domain: partner.domain,
      plan: partner.plan,
      status: partner.status,
      modules: partner.modules,
      usage: partner.usage,
      trialEndsAt: partner.trialEndsAt
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get API key
router.get('/:partnerId/apikey', async (req: Request, res: Response) => {
  try {
    const partner = await Partner.findById(req.params.partnerId);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const activeKey = partner.apiKeys.find(k => k.active);

    res.json({
      apiKey: activeKey?.key,
      permissions: activeKey?.permissions,
      createdAt: activeKey?.createdAt
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Generate new API key
router.post('/:partnerId/apikey/regenerate', async (req: Request, res: Response) => {
  try {
    const { name = 'New Key' } = req.body;
    const partner = await Partner.findById(req.params.partnerId);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Deactivate old keys
    partner.apiKeys.forEach(k => k.active = false);

    // Generate new key
    const newKey = crypto.randomBytes(32).toString('hex');
    partner.apiKeys.push({
      key: newKey,
      name,
      permissions: partner.modules,
      active: true
    });

    await partner.save();

    res.json({
      apiKey: newKey,
      message: 'Key regenerated successfully'
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update branding
router.patch('/:partnerId/branding', async (req: Request, res: Response) => {
  try {
    const { logo, primaryColor, secondaryColor } = req.body;

    const partner = await Partner.findById(req.params.partnerId);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    if (logo) partner.logo = logo;
    if (primaryColor) partner.primaryColor = primaryColor;
    if (secondaryColor) partner.secondaryColor = secondaryColor;

    await partner.save();

    res.json({
      success: true,
      branding: {
        logo: partner.logo,
        primaryColor: partner.primaryColor,
        secondaryColor: partner.secondaryColor
      }
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get plans
router.get('/plans', (req, res) => {
  res.json({
    plans: [
      {
        name: 'Starter',
        price: 25000,
        period: 'month',
        modules: ['loyalty', 'rewards', 'api'],
        features: [
          'Up to 10,000 users',
          'Basic analytics',
          'Email support',
          'API access'
        ]
      },
      {
        name: 'Professional',
        price: 75000,
        period: 'month',
        modules: ['loyalty', 'rewards', 'analytics', 'api', 'white-label'],
        features: [
          'Up to 100,000 users',
          'Advanced analytics',
          'Priority support',
          'Custom branding',
          'Webhook support'
        ]
      },
      {
        name: 'Enterprise',
        price: 200000,
        period: 'month',
        modules: ['loyalty', 'rewards', 'analytics', 'api', 'white-label', 'custom'],
        features: [
          'Unlimited users',
          'Custom development',
          'Dedicated support',
          'SLA guarantee',
          'Custom integrations',
          'On-premise option'
        ]
      }
    ]
  });
});

// Track usage
router.post('/:partnerId/usage', async (req: Request, res: Response) => {
  try {
    const { apiCalls = 0, storage = 0, bandwidth = 0, users = 0, transactions = 0 } = req.body;

    const partner = await Partner.findById(req.params.partnerId);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    partner.usage = {
      apiCalls: (partner.usage.apiCalls || 0) + apiCalls,
      storage: (partner.usage.storage || 0) + storage,
      bandwidth: (partner.usage.bandwidth || 0) + bandwidth,
      users: Math.max(partner.usage.users || 0, users),
      transactions: (partner.usage.transactions || 0) + transactions,
      month: new Date()
    };

    await partner.save();

    res.json({
      success: true,
      usage: partner.usage
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get usage
router.get('/:partnerId/usage', async (req: Request, res: Response) => {
  try {
    const partner = await Partner.findById(req.params.partnerId);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    res.json({
      usage: partner.usage,
      plan: partner.plan,
      modules: partner.modules
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
