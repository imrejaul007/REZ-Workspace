import { Router } from 'express';
import { ClientHistoryService, VisitInput, PreferencesInput } from '../services/clientHistoryService';
import { merchantAuth } from '../middleware/merchantAuth';

const router = Router();
const clientHistoryService = new ClientHistoryService();

/**
 * GET /api/client-history/:clientId
 * Get client history by client ID
 */
router.get('/:clientId', merchantAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { storeId } = req.query;

    if (!clientId) {
      res.status(400).json({
        success: false,
        error: 'clientId is required',
      });
      return;
    }

    const history = await clientHistoryService.getHistory(clientId, storeId as string | undefined);

    if (!history) {
      res.status(404).json({
        success: false,
        error: 'Client history not found',
      });
      return;
    }

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/client-history/:clientId/visit
 * Add a visit to client history
 */
router.post('/:clientId/visit', merchantAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { storeId, date, service, staff, amount, rating, notes } = req.body;

    if (!clientId) {
      res.status(400).json({
        success: false,
        error: 'clientId is required',
      });
      return;
    }

    if (!storeId) {
      res.status(400).json({
        success: false,
        error: 'storeId is required',
      });
      return;
    }

    if (!date || !service || !staff || amount === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: date, service, staff, amount',
      });
      return;
    }

    const visitInput: VisitInput = {
      date: new Date(date),
      service,
      staff,
      amount: Number(amount),
      rating: rating ? Number(rating) : undefined,
      notes,
    };

    const history = await clientHistoryService.addVisit(clientId, storeId, visitInput);

    res.status(201).json({
      success: true,
      data: history,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * PUT /api/client-history/:clientId/preferences
 * Update client preferences
 */
router.put('/:clientId/preferences', merchantAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { preferredStaff, preferredTimes, notes, allergies, sensitiveInfo } = req.body;

    if (!clientId) {
      res.status(400).json({
        success: false,
        error: 'clientId is required',
      });
      return;
    }

    const preferencesInput: PreferencesInput = {};

    if (preferredStaff !== undefined) {
      preferencesInput.preferredStaff = preferredStaff;
    }

    if (preferredTimes !== undefined) {
      preferencesInput.preferredTimes = preferredTimes;
    }

    if (notes !== undefined) {
      preferencesInput.notes = notes;
    }

    if (allergies !== undefined) {
      preferencesInput.allergies = allergies;
    }

    if (sensitiveInfo !== undefined) {
      preferencesInput.sensitiveInfo = sensitiveInfo;
    }

    await clientHistoryService.updatePreferences(clientId, preferencesInput);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/client-history/:clientId/tags
 * Add a tag to client history
 */
router.post('/:clientId/tags', merchantAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { tag, storeId } = req.body;

    if (!clientId) {
      res.status(400).json({
        success: false,
        error: 'clientId is required',
      });
      return;
    }

    if (!tag || typeof tag !== 'string') {
      res.status(400).json({
        success: false,
        error: 'tag is required and must be a string',
      });
      return;
    }

    await clientHistoryService.addTag(clientId, tag, storeId);

    res.status(201).json({
      success: true,
      message: 'Tag added successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * DELETE /api/client-history/:clientId/tags/:tag
 * Remove a tag from client history
 */
router.delete('/:clientId/tags/:tag', merchantAuth, async (req, res) => {
  try {
    const { clientId, tag } = req.params;
    const { storeId } = req.query;

    if (!clientId || !tag) {
      res.status(400).json({
        success: false,
        error: 'clientId and tag are required',
      });
      return;
    }

    await clientHistoryService.removeTag(clientId, tag, storeId as string | undefined);

    res.json({
      success: true,
      message: 'Tag removed successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/client-history/top/:storeId
 * Get top clients by total spent for a store
 */
router.get('/top/:storeId', merchantAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit } = req.query;

    if (!storeId) {
      res.status(400).json({
        success: false,
        error: 'storeId is required',
      });
      return;
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    const clients = await clientHistoryService.getTopClients(storeId, limitNum);

    res.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

export default router;
