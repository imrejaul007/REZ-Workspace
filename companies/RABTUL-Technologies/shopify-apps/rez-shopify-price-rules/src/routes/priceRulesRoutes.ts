import { Router } from 'express';
import { z } from 'zod';
import { priceRulesService } from '../services/priceRulesService.js';
import { PriceRuleSchema, TieredPricingSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/rules', (req, res) => {
  try {
    const rule = PriceRuleSchema.parse(req.body);
    const created = priceRulesService.createRule(rule);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else {
      logger.error('Failed to create rule', { error });
      res.status(500).json({ success: false, error: 'Failed to create rule' });
    }
  }
});

router.get('/rules/:id', (req, res) => {
  const rule = priceRulesService.getRule(req.params.id);
  rule ? res.json({ success: true, data: rule }) : res.status(404).json({ success: false, error: 'Rule not found' });
});

router.get('/shops/:shopId/rules', (req, res) => {
  const { active } = req.query;
  const rules = priceRulesService.getShopRules(req.params.shopId, active === 'true');
  res.json({ success: true, data: rules });
});

router.patch('/rules/:id', (req, res) => {
  const rule = priceRulesService.updateRule(req.params.id, req.body);
  rule ? res.json({ success: true, data: rule }) : res.status(404).json({ success: false, error: 'Rule not found' });
});

router.delete('/rules/:id', (req, res) => {
  const deleted = priceRulesService.deleteRule(req.params.id);
  res.json({ success: deleted });
});

router.post('/evaluate', (req, res) => {
  const { ruleId, originalPrice, context } = req.body;
  const result = priceRulesService.applyRule(ruleId, originalPrice, context);
  result ? res.json({ success: true, data: result }) : res.status(400).json({ success: false, error: 'Rule not applicable' });
});

router.post('/find-applicable', (req, res) => {
  const { shopId, context } = req.body;
  const rules = priceRulesService.findApplicableRules(shopId, context);
  res.json({ success: true, data: rules });
});

router.post('/tiered', (req, res) => {
  try {
    const { shopifyProductId, tiers } = TieredPricingSchema.parse(req.body);
    const tiered = priceRulesService.createTieredPricing(shopifyProductId, tiers);
    res.status(201).json({ success: true, data: tiered });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to create tiered pricing' });
  }
});

router.get('/tiered/:productId', (req, res) => {
  const tiered = priceRulesService.getTieredPricing(req.params.productId);
  tiered ? res.json({ success: true, data: tiered }) : res.status(404).json({ success: false, error: 'Tiered pricing not found' });
});

router.post('/tiered/:productId/calculate', (req, res) => {
  const { quantity, basePrice } = req.body;
  const result = priceRulesService.calculateTieredPrice(req.params.productId, quantity, basePrice);
  result ? res.json({ success: true, data: result }) : res.status(400).json({ success: false, error: 'No applicable tier' });
});

router.get('/rules/:id/stats', (req, res) => {
  const stats = priceRulesService.getStats(req.params.id);
  res.json({ success: true, data: stats });
});

export default router;
