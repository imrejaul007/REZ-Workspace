import { Router } from 'express';
import { profileService } from '../../services/profile';

// Hidden KB routes (internal only, not exposed to apps directly)

export const hiddenRouter = Router();

// GET /hidden/:userId - Get hidden KB
hiddenRouter.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const kb = await profileService.getHiddenKB(userId);
  res.json(kb || null);
});

// PATCH /hidden/:userId - Update hidden KB
hiddenRouter.patch('/:userId', async (req, res) => {
  const { userId } = req.params;
  const kb = await profileService.updateHiddenKB(userId, req.body);
  res.json(kb);
});

// POST /hidden/:userId/behavioral - Update behavioral data
hiddenRouter.post('/:userId/behavioral', async (req, res) => {
  const { userId } = req.params;
  const { behavioral } = req.body;

  const current = await profileService.getHiddenKB(userId) || { behavioral: {} };
  const kb = await profileService.updateHiddenKB(userId, {
    behavioral: { ...current.behavioral, ...behavioral },
  });

  res.json(kb);
});

// POST /hidden/:userId/intents - Update intent data
hiddenRouter.post('/:userId/intents', async (req, res) => {
  const { userId } = req.params;
  const { intents } = req.body;

  const current = await profileService.getHiddenKB(userId) || { intents: {} };
  const kb = await profileService.updateHiddenKB(userId, {
    intents: { ...current.intents, ...intents },
  });

  res.json(kb);
});

// POST /hidden/:userId/engagement - Update engagement data
hiddenRouter.post('/:userId/engagement', async (req, res) => {
  const { userId } = req.params;
  const { engagement } = req.body;

  const current = await profileService.getHiddenKB(userId) || { engagement: {} };
  const kb = await profileService.updateHiddenKB(userId, {
    engagement: { ...current.engagement, ...engagement },
  });

  res.json(kb);
});
