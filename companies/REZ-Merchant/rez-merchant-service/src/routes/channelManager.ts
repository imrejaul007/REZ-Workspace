/**
 * Channel Manager API Routes
 * Provides endpoints for managing OTA (Online Travel Agency) integrations
 */

import { Router, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { merchantAuth } from '../middleware/auth';
import { ChannelManagerService, ChannelType } from '../services/channelManager';

const router = Router();
router.use(merchantAuth);

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function requireAuth(req: Request, res: Response): Types.ObjectId | null {
  const merchantId = (req as unknown).merchantId;
  if (!merchantId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return null;
  }
  return toObjectId(merchantId);
}

function handleError(res: Response, e) {
  const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
  res.status(500).json({ success: false, message });
}

// GET /merchant/channels
router.get('/', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const merchantId = requireAuth(req, res);
    if (!merchantId) return;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }
    const channels = await ChannelManagerService.getChannels(merchantId, toObjectId(storeId as string));
    res.json({ success: true, data: channels });
  } catch (e) { handleError(res, e); }
});

// GET /merchant/channels/connected
router.get('/connected', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const merchantId = requireAuth(req, res);
    if (!merchantId) return;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }
    const channels = await ChannelManagerService.getConnectedChannels(merchantId, toObjectId(storeId as string));
    res.json({ success: true, data: channels });
  } catch (e) { handleError(res, e); }
});

// POST /merchant/channels/connect
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { storeId, channelType, credentials } = req.body;
    const merchantId = requireAuth(req, res);
    if (!merchantId) return;
    if (!storeId || !channelType || !credentials) {
      res.status(400).json({ success: false, message: 'storeId, channelType, and credentials are required' });
      return;
    }
    const validChannels: ChannelType[] = ['booking_com', 'expedia', 'airbnb', 'makemytrip', 'goibibo'];
    if (!validChannels.includes(channelType)) {
      res.status(400).json({ success: false, message: 'Invalid channel type' });
      return;
    }
    const channel = await ChannelManagerService.connectChannel(merchantId, toObjectId(storeId), channelType, credentials);
    res.status(201).json({ success: true, data: channel });
  } catch (e) { handleError(res, e); }
});

// POST /merchant/channels/disconnect
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const { storeId, channelType } = req.body;
    const merchantId = requireAuth(req, res);
    if (!merchantId) return;
    if (!storeId || !channelType) {
      res.status(400).json({ success: false, message: 'storeId and channelType are required' });
      return;
    }
    await ChannelManagerService.disconnectChannel(merchantId, toObjectId(storeId), channelType);
    res.json({ success: true, message: 'Channel disconnected successfully' });
  } catch (e) { handleError(res, e); }
});

// PATCH /merchant/channels/settings
router.patch('/settings', async (req: Request, res: Response) => {
  try {
    const { storeId, channelType, settings } = req.body;
    const merchantId = requireAuth(req, res);
    if (!merchantId) return;
    if (!storeId || !channelType || !settings) {
      res.status(400).json({ success: false, message: 'storeId, channelType, and settings are required' });
      return;
    }
    await ChannelManagerService.updateSyncSettings(merchantId, toObjectId(storeId), channelType, settings);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (e) { handleError(res, e); }
});

// GET /merchant/channels/sync
router.get('/sync', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const merchantId = requireAuth(req, res);
    if (!merchantId) return;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }
    const statuses = await ChannelManagerService.getSyncStatus(merchantId, toObjectId(storeId as string));
    res.json({ success: true, data: statuses });
  } catch (e) { handleError(res, e); }
});

// POST /merchant/channels/sync/availability
router.post('/sync/availability', async (req: Request, res: Response) => {
  try {
    const { storeId, channelType, availability } = req.body;
    const merchantId = requireAuth(req, res);
    if (!merchantId) return;
    if (!storeId || !channelType || !availability) {
      res.status(400).json({ success: false, message: 'storeId, channelType, and availability are required' });
      return;
    }
    const result = await ChannelManagerService.syncAvailability(merchantId, toObjectId(storeId), channelType, availability);
    res.json({ success: true, data: result });
  } catch (e) { handleError(res, e); }
});

// GET /merchant/channels/bookings
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const { storeId, channelType, status, checkInFrom, checkInTo, limit, skip } = req.query;
    const merchantId = requireAuth(req, res);
    if (!merchantId) return;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }
    const options: unknown = {};
    if (channelType) options.channelType = channelType;
    if (status) options.status = status;
    if (checkInFrom) options.checkInFrom = new Date(checkInFrom as string);
    if (checkInTo) options.checkInTo = new Date(checkInTo as string);
    if (limit) options.limit = parseInt(limit as string);
    if (skip) options.skip = parseInt(skip as string);
    const result = await ChannelManagerService.getChannelBookings(merchantId, toObjectId(storeId as string), options);
    res.json({ success: true, data: result.bookings, total: result.total });
  } catch (e) { handleError(res, e); }
});

// GET /merchant/channels/revenue
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const { storeId, fromDate, toDate } = req.query;
    const merchantId = requireAuth(req, res);
    if (!merchantId) return;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }
    if (!fromDate || !toDate) {
      res.status(400).json({ success: false, message: 'fromDate and toDate are required' });
      return;
    }
    const revenues = await ChannelManagerService.getChannelRevenue(
      merchantId, toObjectId(storeId as string), new Date(fromDate as string), new Date(toDate as string)
    );
    res.json({ success: true, data: revenues });
  } catch (e) { handleError(res, e); }
});

// GET /merchant/channels/:channelType
router.get('/:channelType', async (req: Request, res: Response) => {
  try {
    const { channelType } = req.params;
    const { storeId } = req.query;
    const merchantId = requireAuth(req, res);
    if (!merchantId) return;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }
    const channels = await ChannelManagerService.getChannels(merchantId, toObjectId(storeId as string));
    const channel = channels.find((ch) => ch.channelType === channelType);
    if (!channel) {
      res.status(404).json({ success: false, message: 'Channel not found' });
      return;
    }
    res.json({ success: true, data: channel });
  } catch (e) { handleError(res, e); }
});

export default router;
