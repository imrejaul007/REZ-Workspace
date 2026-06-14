/**
 * Template Routes
 */

import { Router, Request, Response } from 'express';

const router = Router();

// Built-in notification templates
const templates = {
  streak_milestone: {
    id: 'streak_milestone',
    name: 'Streak Milestone',
    channels: ['push', 'sms', 'email', 'inApp'],
    variables: ['streakDays', 'rewardCoins', 'nextMilestone'],
    push: {
      title: '🔥 {{streakDays}}-Day Streak!',
      body: 'Keep it up! {{nextMilestone}} days until your next reward.',
    },
    sms: 'You\'ve reached a {{streakDays}}-day streak! {{rewardCoins}} coins earned.',
    email: {
      subject: '🔥 {{streakDays}}-Day Streak Milestone!',
      template: 'streak_milestone',
    },
  },
  tier_upgrade: {
    id: 'tier_upgrade',
    name: 'Tier Upgrade',
    channels: ['push', 'sms', 'email', 'inApp'],
    variables: ['oldTier', 'newTier', 'benefits'],
    push: {
      title: '⭐ {{newTier}} Tier!',
      body: 'You\'ve been upgraded! Enjoy exclusive benefits.',
    },
    sms: 'Congratulations! You\'re now a {{newTier}} member on ReZ.',
    email: {
      subject: '⭐ Welcome to {{newTier}} Tier!',
      template: 'tier_upgrade',
    },
  },
  badge_earned: {
    id: 'badge_earned',
    name: 'Badge Earned',
    channels: ['push', 'sms', 'email', 'inApp'],
    variables: ['badgeName', 'badgeDescription', 'rewardCoins'],
    push: {
      title: '🏆 {{badgeName}} Badge!',
      body: 'You\'ve earned a new badge! {{rewardCoins}} coins bonus.',
    },
    sms: 'You earned the {{badgeName}} badge on ReZ!',
    email: {
      subject: '🏆 New Badge: {{badgeName}}',
      template: 'badge_earned',
    },
  },
  points_expiry: {
    id: 'points_expiry',
    name: 'Points Expiring',
    channels: ['push', 'sms', 'email', 'inApp'],
    variables: ['points', 'daysRemaining', 'expiryDate'],
    push: {
      title: '⏰ Points Expiring!',
      body: '{{points}} points expire in {{daysRemaining}} days. Use them now!',
    },
    sms: 'Your {{points}} ReZ points expire in {{daysRemaining}} days.',
    email: {
      subject: '⏰ {{points}} Points Expiring Soon',
      template: 'points_expiry',
    },
  },
  churn_risk: {
    id: 'churn_risk',
    name: 'Win-Back Campaign',
    channels: ['push', 'sms', 'email', 'inApp'],
    variables: ['offer', 'discount', 'expiryDate'],
    push: {
      title: '💝 We Miss You!',
      body: 'Use code WINBACK{{discount}} for {{offer}} off your next order.',
    },
    sms: 'We miss you! Use code WINBACK for {{discount}}% off your next order.',
    email: {
      subject: '💝 We Miss You - Special Offer Inside',
      template: 'churn_risk',
    },
  },
  referral_signup: {
    id: 'referral_signup',
    name: 'Referral Signup',
    channels: ['push', 'sms', 'email', 'inApp'],
    variables: ['friendName', 'rewardCoins'],
    push: {
      title: '🎉 Friend Signed Up!',
      body: '{{friendName}} joined using your link. +{{rewardCoins}} coins!',
    },
    sms: '{{friendName}} joined ReZ with your referral! You earned {{rewardCoins}} coins.',
    email: {
      subject: '🎉 Your Referral Signed Up!',
      template: 'referral_signup',
    },
  },
};

/**
 * GET /api/v1/templates
 * List all templates
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    templates: Object.values(templates).map(t => ({
      id: t.id,
      name: t.name,
      channels: t.channels,
      variables: t.variables,
    })),
  });
});

/**
 * GET /api/v1/templates/:templateId
 * Get template by ID
 */
router.get('/:templateId', (req: Request, res: Response) => {
  const template = templates[req.params.templateId as keyof typeof templates];
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ template });
});

/**
 * POST /api/v1/templates/:templateId/render
 * Render template with variables
 */
router.post('/:templateId/render', (req: Request, res: Response) => {
  const template = templates[req.params.templateId as keyof typeof templates];
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  const { variables, channel = 'push' } = req.body;

  if (!variables) {
    return res.status(400).json({ error: 'Variables required' });
  }

  // Simple template rendering
  const render = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
  };

  let result: unknown = {};

  if (channel === 'push' || channel === 'all') {
    result.push = {
      title: render(template.push.title),
      body: render(template.push.body),
    };
  }

  if (channel === 'sms' || channel === 'all') {
    result.sms = render(template.sms);
  }

  if (channel === 'email' || channel === 'all') {
    result.email = {
      subject: render(template.email.subject),
      template: template.email.template,
      variables,
    };
  }

  if (channel === 'inApp' || channel === 'all') {
    result.push = {
      title: render(template.push.title),
      body: render(template.push.body),
    };
  }

  res.json({ rendered: result });
});

export { router as templateRoutes };
