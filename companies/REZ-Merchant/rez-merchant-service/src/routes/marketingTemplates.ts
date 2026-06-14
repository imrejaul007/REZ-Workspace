
/**
 * Marketing template routes.
 *
 * GET    /marketing/templates        — list templates for this merchant
 * POST   /marketing/templates        — create a template
 * PUT    /marketing/templates/:id    — full update of a template
 * DELETE /marketing/templates/:id    — delete a template
 *
 * Mirrors the monolith's GET|POST|DELETE /api/merchant/marketing/templates
 * from merchantQrRoutes.ts and adds PUT for completeness.
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { MerchantTemplate } from '../models/MerchantTemplate';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

/**
 * GET /marketing/templates
 * List all templates belonging to the authenticated merchant.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, parseInt((req.query.limit as string) || '20', 10));
    const skip = (page - 1) * limit;
    const [templates, total] = await Promise.all([
      MerchantTemplate.find({ merchantId: req.merchantId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MerchantTemplate.countDocuments({ merchantId: req.merchantId }),
    ]);
    res.json({ success: true, data: templates, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

/**
 * POST /marketing/templates
 * Create a new marketing template.
 * Body: { title, body, variables? }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, body, variables } = req.body;
    if (!title || !body) {
      res.status(400).json({ success: false, message: 'title and body are required' });
      return;
    }
    const template = await MerchantTemplate.create({
      merchantId: req.merchantId,
      title,
      body,
      variables: Array.isArray(variables) ? variables : [],
    });
    res.status(201).json({ success: true, data: template });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

/**
 * PUT /marketing/templates/:id
 * Full update of a marketing template.
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid template id' });
      return;
    }
    const { title, body, variables } = req.body;
    if (!title || !body) {
      res.status(400).json({ success: false, message: 'title and body are required' });
      return;
    }
    const template = await MerchantTemplate.findOneAndUpdate(
      { _id: id, merchantId: req.merchantId },
      { $set: { title, body, variables: Array.isArray(variables) ? variables : [] } },
      { new: true },
    );
    if (!template) { res.status(404).json({ success: false, message: 'Template not found or does not belong to this merchant' }); return; }
    res.json({ success: true, data: template });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

/**
 * DELETE /marketing/templates/:id
 * Delete a marketing template owned by the authenticated merchant.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid template id' });
      return;
    }
    const deleted = await MerchantTemplate.findOneAndDelete({ _id: id, merchantId: req.merchantId });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Template not found or does not belong to this merchant' });
      return;
    }
    res.json({ success: true, message: 'Template deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
