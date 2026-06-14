import { Router } from 'express';
import { z } from 'zod';
import { socialLoginService } from '../services/socialLoginService.js';
import { SocialAuthRequestSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/auth/social', (req, res) => {
  try {
    const request = SocialAuthRequestSchema.parse(req.body);
    const response = socialLoginService.authenticate(request);
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else {
      logger.error('Social auth failed', { error });
      res.status(500).json({ success: false, error: 'Authentication failed' });
    }
  }
});

router.post('/link', (req, res) => {
  const { customerId, provider, providerId, profile } = req.body;
  if (!customerId || !provider || !providerId) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  const link = socialLoginService.linkAccount(customerId, provider, providerId, profile);
  link ? res.json({ success: true, data: link }) : res.status(409).json({ success: false, error: 'Account already linked to another customer' });
});

router.delete('/link/:customerId/:provider', (req, res) => {
  const deleted = socialLoginService.unlinkAccount(req.params.customerId, req.params.provider as any);
  res.json({ success: deleted });
});

router.get('/links/:customerId', (req, res) => {
  const links = socialLoginService.getCustomerLinks(req.params.customerId);
  res.json({ success: true, data: links });
});

router.get('/stats', (req, res) => {
  const { customerId } = req.query;
  const stats = socialLoginService.getStats(customerId as string | undefined);
  res.json({ success: true, data: stats });
});

router.get('/oauth/:provider/url', (req, res) => {
  const { provider } = req.params;
  const { redirectUri, state } = req.query;

  const urls: Record<string, string> = {
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri || 'http://localhost:3111/callback'}&response_type=code&scope=email profile&state=${state || ''}`,
    facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${redirectUri || 'http://localhost:3111/callback'}&scope=email&state=${state || ''}`,
    apple: `https://appleid.apple.com/auth/authorize?client_id=${process.env.APPLE_CLIENT_ID}&redirect_uri=${redirectUri || 'http://localhost:3111/callback'}&response_type=code id_token&scope=email&state=${state || ''}`
  };

  const url = urls[provider];
  url ? res.json({ success: true, data: { url } }) : res.status(400).json({ success: false, error: 'Unsupported provider' });
});

export default router;
