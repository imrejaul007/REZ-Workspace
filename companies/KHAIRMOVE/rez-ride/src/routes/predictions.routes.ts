import { Router, Request, Response } from 'express';
import { predictiveSuggestionsService } from '../services/predictive-suggestions.service';

const router = Router();

/**
 * @route GET /api/predictions/:userId
 * @desc Get personalized predictions for user
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const suggestions = await predictiveSuggestionsService.getSuggestions(userId);

    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

/**
 * @route GET /api/predictions/:userId/destination
 * @desc Predict destination based on context
 */
router.get('/:userId/destination', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const predictions = await predictiveSuggestionsService.predictDestination(userId, {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string),
    });

    res.json({ success: true, data: predictions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to predict destination' });
  }
});

/**
 * @route GET /api/predictions/:userId/routine
 * @desc Check for routine ride suggestions
 */
router.get('/:userId/routine', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const suggestion = await predictiveSuggestionsService.checkRoutineRide(userId);

    res.json({
      success: true,
      data: suggestion || { hasRoutine: false },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check routine' });
  }
});

/**
 * @route GET /api/predictions/surge/:lat/:lng
 * @desc Predict surge pricing
 */
router.get('/surge/:lat/:lng', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.params;

    const surge = await predictiveSuggestionsService.predictSurge(
      parseFloat(lat),
      parseFloat(lng)
    );

    res.json({ success: true, data: surge });
  } catch (error) {
    res.status(500).json({ error: 'Failed to predict surge' });
  }
});

/**
 * @route GET /api/predictions/:userId/offers
 * @desc Get predicted offers based on user patterns
 */
router.get('/:userId/offers', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const offers = await predictiveSuggestionsService.getPredictedOffers(userId);

    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get predicted offers' });
  }
});

export default router;
