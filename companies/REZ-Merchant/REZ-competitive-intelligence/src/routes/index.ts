import { Router, Request, Response } from 'express';
import { Competitor, CompetitorPrice, MarketAnalysis } from '../models/Competitor';
import { logger } from '../config/logger';

const router = Router();

// Competitors
router.get('/competitors', async (req: Request, res: Response) => {
  try {
    const { city, businessType, priceRange, search } = req.query;
    const query: Record<string, any> = { isActive: true };
    if (city) query['location.city'] = city;
    if (businessType) query.businessType = businessType;
    if (priceRange) query.priceRange = priceRange;
    if (search) query.name = { $regex: search, $options: 'i' };

    const competitors = await Competitor.find(query).sort({ rating: -1 });
    res.json({ success: true, data: competitors, count: competitors.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch competitors' } });
  }
});

router.get('/competitors/:id', async (req: Request, res: Response) => {
  try {
    const competitor = await Competitor.findById(req.params.id);
    if (!competitor) return res.status(404).json({ success: false, error: { message: 'Competitor not found' } });
    res.json({ success: true, data: competitor });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch competitor' } });
  }
});

router.post('/competitors', async (req: Request, res: Response) => {
  try {
    const competitor = await Competitor.create(req.body);
    res.status(201).json({ success: true, data: competitor });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.put('/competitors/:id', async (req: Request, res: Response) => {
  try {
    const competitor = await Competitor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!competitor) return res.status(404).json({ success: false, error: { message: 'Competitor not found' } });
    res.json({ success: true, data: competitor });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Prices
router.post('/competitors/:id/prices', async (req: Request, res: Response) => {
  try {
    const { productName, price, unit } = req.body;
    const competitorPrice = await CompetitorPrice.create({
      competitorId: req.params.id, productName, price, unit,
    });
    res.status(201).json({ success: true, data: competitorPrice });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.get('/competitors/:id/prices', async (req: Request, res: Response) => {
  try {
    const prices = await CompetitorPrice.find({ competitorId: req.params.id }).sort({ lastUpdated: -1 });
    res.json({ success: true, data: prices, count: prices.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch prices' } });
  }
});

// Market Analysis
router.get('/analysis', async (req: Request, res: Response) => {
  try {
    const { region, category } = req.query;
    const query: Record<string, any> = {};
    if (region) query.region = region;
    if (category) query.category = category;

    const analysis = await MarketAnalysis.find(query).sort({ date: -1 }).limit(10);
    res.json({ success: true, data: analysis, count: analysis.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch analysis' } });
  }
});

router.post('/analysis', async (req: Request, res: Response) => {
  try {
    const analysis = await MarketAnalysis.create({ ...req.body, date: new Date() });
    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Comparison
router.get('/compare/:id', async (req: Request, res: Response) => {
  try {
    const competitor = await Competitor.findById(req.params.id);
    if (!competitor) return res.status(404).json({ success: false, error: { message: 'Competitor not found' } });

    const prices = await CompetitorPrice.find({ competitorId: req.params.id });
    const similarCompetitors = await Competitor.find({
      _id: { $ne: req.params.id },
      businessType: competitor.businessType,
      'location.city': competitor.location.city,
      isActive: true,
    }).limit(5);

    res.json({
      success: true,
      data: {
        competitor,
        prices,
        similarCompetitors,
        avgRating: similarCompetitors.reduce((sum, c) => sum + (c.rating || 0), 0) / Math.max(similarCompetitors.length, 1),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch comparison' } });
  }
});

export default router;
