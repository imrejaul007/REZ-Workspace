import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import {
  createGuest,
  getGuestById,
  updateGuest,
  getLoyaltyStatus,
  addPoints,
  redeemPoints,
  addStay,
  getStayHistory,
  sendNotification,
  getNotifications,
  markNotificationRead,
  getAllGuests,
} from './services/guest.service.js';

const app = express();
const PORT = 4041;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-guest-mobile-app',
    timestamp: new Date().toISOString(),
  });
});

// Guest Profile Endpoints
app.post('/api/guests', (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = req.body;
    const guest = createGuest(profile);
    res.status(201).json({ guest });
  } catch (error) {
    next(error);
  }
});

app.get('/api/guests', (_req: Request, res: Response) => {
  const guests = getAllGuests();
  res.json({ guests, total: guests.length });
});

app.get('/api/guests/:id', (req: Request, res: Response) => {
  const guest = getGuestById(req.params.id);
  if (!guest) {
    res.status(404).json({ error: 'Guest not found' });
    return;
  }
  res.json({ guest });
});

app.patch('/api/guests/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const guest = updateGuest(req.params.id, req.body);
    if (!guest) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }
    res.json({ guest });
  } catch (error) {
    next(error);
  }
});

// Loyalty Endpoints
app.get('/api/guests/:id/loyalty', (req: Request, res: Response) => {
  const loyalty = getLoyaltyStatus(req.params.id);
  if (!loyalty) {
    res.status(404).json({ error: 'Loyalty status not found' });
    return;
  }
  res.json({ loyalty });
});

app.post('/api/guests/:id/points', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { points } = req.body;
    const loyalty = addPoints(req.params.id, points);
    if (!loyalty) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }
    res.json({ loyalty });
  } catch (error) {
    next(error);
  }
});

app.post('/api/guests/:id/redeem', (req: Request, res: Response) => {
  const { points } = req.body;
  const success = redeemPoints(req.params.id, points);
  if (!success) {
    res.status(400).json({ error: 'Insufficient points or guest not found' });
    return;
  }
  const loyalty = getLoyaltyStatus(req.params.id);
  res.json({ success: true, loyalty });
});

// Stay History Endpoints
app.post('/api/guests/:id/stays', (req: Request, res: Response, next: NextFunction) => {
  try {
    const stay = addStay(req.params.id, req.body);
    res.status(201).json({ stay });
  } catch (error) {
    next(error);
  }
});

app.get('/api/guests/:id/stays', (req: Request, res: Response) => {
  const history = getStayHistory(req.params.id);
  res.json({ stays: history, total: history.length });
});

// Notification Endpoints
app.post('/api/notifications', (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = sendNotification(req.body);
    res.status(201).json({ notification });
  } catch (error) {
    next(error);
  }
});

app.get('/api/guests/:id/notifications', (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === 'true';
  const notifications = getNotifications(req.params.id, unreadOnly);
  res.json({ notifications, total: notifications.length });
});

app.patch('/api/guests/:id/notifications/:notificationId/read', (req: Request, res: Response) => {
  const success = markNotificationRead(req.params.id, req.params.notificationId);
  if (!success) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.json({ success: true });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`ReZ Guest Mobile App Service running on port ${PORT}`);
});

export default app;
