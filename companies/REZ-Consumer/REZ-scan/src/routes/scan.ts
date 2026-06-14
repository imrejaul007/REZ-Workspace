/**
 * REZ Scan - QR Scanner Routes
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const scanRouter = Router();

// QR Types
const QR_TYPES = {
  PAYMENT: 'payment',
  RESTAURANT: 'restaurant',
  PRODUCT: 'product',
  EVENT: 'event',
  LOYALTY: 'loyalty',
  CREATOR: 'creator',
  VERIFY: 'verify',
  SMART_LINK: 'smart_link',
  GENERAL: 'general'
};

// In-memory store
const scanHistory = new Map();

/**
 * POST /api/scan
 * Scan a QR code
 */
scanRouter.post('/', async (req, res) => {
  try {
    const { qrContent, userId, location, deviceId } = req.body;

    // Parse QR content
    const parsed = parseQR(qrContent);

    const scanEvent = {
      scan_id: uuidv4(),
      user_id: userId,
      qr_type: parsed.type,
      qr_content: qrContent,
      parsed_data: parsed.data,
      location: location || null,
      device_id: deviceId,
      timestamp: new Date(),
      action_taken: null,
    };

    scanHistory.set(scanEvent.scan_id, scanEvent);

    res.json({
      success: true,
      data: {
        scan: scanEvent,
        action: getActionForType(parsed.type),
        message: getMessageForType(parsed.type),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process scan' });
  }
});

/**
 * GET /api/scan/history/:userId
 * Get scan history
 */
scanRouter.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = '50' } = req.query;

    let history = Array.from(scanHistory.values())
      .filter(s => s.user_id === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (type) {
      history = history.filter(s => s.qr_type === type);
    }

    history = history.slice(0, parseInt(limit as string, 10));

    res.json({
      success: true,
      data: { scans: history, total: history.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

/**
 * GET /api/scan/history/:userId/stats
 * Get scan statistics
 */
scanRouter.get('/history/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const history = Array.from(scanHistory.values()).filter(s => s.user_id === userId);

    const stats = {
      total_scans: history.length,
      by_type: {} as Record<string, number>,
      today: history.filter(s => isToday(new Date(s.timestamp))).length,
      this_week: history.filter(s => isThisWeek(new Date(s.timestamp))).length,
    };

    history.forEach(scan => {
      stats.by_type[scan.qr_type] = (stats.by_type[scan.qr_type] || 0) + 1;
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// Helper functions
function parseQR(qrContent: string): { type: string; data: unknown } {
  if (qrContent.startsWith('REZ:')) {
    const parts = qrContent.split(':');
    return { type: parts[1], data: parts[2] };
  }
  if (qrContent.includes('razorpay') || qrContent.includes('paytm') || qrContent.includes('upi')) {
    return { type: QR_TYPES.PAYMENT, data: qrContent };
  }
  if (qrContent.includes('menu') || qrContent.includes('restaurant')) {
    return { type: QR_TYPES.RESTAURANT, data: qrContent };
  }
  if (qrContent.startsWith('REZWARRANTY') || qrContent.includes('verify')) {
    return { type: QR_TYPES.VERIFY, data: qrContent };
  }
  return { type: QR_TYPES.GENERAL, data: qrContent };
}

function getActionForType(type: string): string {
  const actions: Record<string, string> = {
    [QR_TYPES.PAYMENT]: 'Open payment',
    [QR_TYPES.RESTAURANT]: 'View menu',
    [QR_TYPES.PRODUCT]: 'Verify product',
    [QR_TYPES.EVENT]: 'View event',
    [QR_TYPES.LOYALTY]: 'Collect points',
    [QR_TYPES.CREATOR]: 'Follow creator',
    [QR_TYPES.VERIFY]: 'Check warranty',
    [QR_TYPES.SMART_LINK]: 'Open link',
  };
  return actions[type] || 'Open';
}

function getMessageForType(type: string): string {
  const messages: Record<string, string> = {
    [QR_TYPES.PAYMENT]: 'Payment QR detected',
    [QR_TYPES.RESTAURANT]: 'Restaurant menu found!',
    [QR_TYPES.PRODUCT]: 'Product QR verified',
    [QR_TYPES.VERIFY]: 'Warranty check available',
  };
  return messages[type] || 'QR code scanned successfully';
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  return date >= weekStart;
}
