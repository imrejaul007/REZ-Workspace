import { Router } from 'express';
import { WaitlistService, WaitlistInput } from '../services/waitlistService';
import { merchantAuth } from '../middleware/merchantAuth';

const router = Router();
const waitlistService = new WaitlistService();

/**
 * POST /api/waitlist
 * Add a customer to the waitlist
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { storeId, customerId, customerName, phone, partySize, quotedTime, notes } = req.body;

    if (!storeId || !customerName || !phone || !partySize) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: storeId, customerName, phone, partySize',
      });
      return;
    }

    if (partySize < 1) {
      res.status(400).json({
        success: false,
        error: 'Party size must be at least 1',
      });
      return;
    }

    const input: WaitlistInput = {
      storeId,
      customerId,
      customerName,
      phone,
      partySize,
      quotedTime: quotedTime ? new Date(quotedTime) : undefined,
      notes,
    };

    const entry = await waitlistService.addToWaitlist(input);

    res.status(201).json({
      success: true,
      data: entry,
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
 * GET /api/waitlist?storeId=:storeId
 * Get the current waitlist for a store
 */
router.get('/', merchantAuth, async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'storeId is required',
      });
      return;
    }

    const waitlist = await waitlistService.getWaitlist(storeId);

    res.json({
      success: true,
      data: waitlist,
      count: waitlist.length,
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
 * GET /api/waitlist/position/:phone?storeId=:storeId
 * Get the current position of a customer by phone number
 */
router.get('/position/:phone', merchantAuth, async (req, res) => {
  try {
    const { phone } = req.params;
    const { storeId } = req.query;

    if (!phone) {
      res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
      return;
    }

    const position = await waitlistService.getPosition(phone);

    res.json({
      success: true,
      data: {
        phone,
        position,
        found: position !== null,
      },
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
 * POST /api/waitlist/:id/seat
 * Seat a customer from the waitlist
 */
router.post('/:id/seat', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await waitlistService.seatCustomer(id);

    res.json({
      success: true,
      message: 'Customer has been seated',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/waitlist/:id/cancel
 * Cancel a waitlist entry
 */
router.post('/:id/cancel', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await waitlistService.cancelEntry(id);

    res.json({
      success: true,
      message: 'Waitlist entry has been cancelled',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/waitlist/:id/no-show
 * Mark a customer as no-show
 */
router.post('/:id/no-show', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await waitlistService.markNoShow(id);

    res.json({
      success: true,
      message: 'Customer has been marked as no-show',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/waitlist/estimate?storeId=:storeId&partySize=:partySize
 * Get estimated wait time for a party size
 */
router.get('/estimate', merchantAuth, async (req, res) => {
  try {
    const { storeId, partySize } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'storeId is required',
      });
      return;
    }

    const size = parseInt(partySize as string, 10);
    if (isNaN(size) || size < 1) {
      res.status(400).json({
        success: false,
        error: 'partySize must be a valid number >= 1',
      });
      return;
    }

    const estimatedMinutes = await waitlistService.getEstimatedWait(storeId, size);

    res.json({
      success: true,
      data: {
        estimatedWaitMinutes: estimatedMinutes,
        partySize: size,
      },
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
 * POST /api/waitlist/:id/notify
 * Notify the next customer in line
 */
router.post('/:id/notify', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the storeId from the entry and notify next
    const { Waitlist } = await import('../models/Waitlist');
    const entry = await Waitlist.findById(id);
    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'Waitlist entry not found',
      });
      return;
    }

    await waitlistService.notifyNext(entry.storeId.toString());

    res.json({
      success: true,
      message: 'Notification sent to next customer',
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
