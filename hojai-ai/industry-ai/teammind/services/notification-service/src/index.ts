import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// In-memory stores
const notifications: Map<string, any> = new Map();
const preferences: Map<string, any> = new Map();

// Notification types
const NOTIFICATION_TYPES = ['task', 'meeting', 'kpi', 'team', 'system', 'reminder'];

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'notification-service', timestamp: new Date().toISOString() });
});

// Get all notifications for a user
app.get('/api/notifications', (req: Request, res: Response) => {
  const { userId, unreadOnly, type } = req.query;
  let filtered = Array.from(notifications.values());

  if (userId) {
    filtered = filtered.filter((n: any) => n.userId === userId);
  }
  if (unreadOnly === 'true') {
    filtered = filtered.filter((n: any) => !n.read);
  }
  if (type) {
    filtered = filtered.filter((n: any) => n.type === type);
  }

  // Sort by createdAt descending
  filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Create a notification
app.post('/api/notifications', (req: Request, res: Response) => {
  const { userId, type, title, message, priority, metadata } = req.body;

  if (!userId || !title) {
    res.status(400).json({ success: false, error: 'userId and title are required' });
    return;
  }

  if (type && !NOTIFICATION_TYPES.includes(type)) {
    res.status(400).json({ success: false, error: `type must be one of: ${NOTIFICATION_TYPES.join(', ')}` });
    return;
  }

  const notification = {
    id: uuidv4(),
    userId,
    type: type || 'system',
    title,
    message: message || '',
    priority: priority || 'normal',
    read: false,
    metadata: metadata || {},
    createdAt: new Date().toISOString()
  };

  notifications.set(notification.id, notification);
  res.status(201).json({ success: true, data: notification });
});

// Mark notification as read
app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const notification = notifications.get(id);

  if (!notification) {
    res.status(404).json({ success: false, error: 'Notification not found' });
    return;
  }

  notification.read = true;
  notification.readAt = new Date().toISOString();
  notifications.set(id, notification);

  res.json({ success: true, data: notification });
});

// Mark all notifications as read for a user
app.post('/api/notifications/read-all', (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, error: 'userId is required' });
    return;
  }

  const userNotifications = Array.from(notifications.values()).filter(
    (n: any) => n.userId === userId && !n.read
  );

  userNotifications.forEach((n: any) => {
    n.read = true;
    n.readAt = new Date().toISOString();
    notifications.set(n.id, n);
  });

  res.json({ success: true, markedCount: userNotifications.length });
});

// Get unread count
app.get('/api/notifications/unread-count', (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ success: false, error: 'userId is required' });
    return;
  }

  const count = Array.from(notifications.values()).filter(
    (n: any) => n.userId === userId && !n.read
  ).length;

  res.json({ success: true, userId, unreadCount: count });
});

// Delete a notification
app.delete('/api/notifications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = notifications.delete(id);

  if (deleted) {
    res.json({ success: true, message: 'Notification deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Notification not found' });
  }
});

// User notification preferences
app.get('/api/preferences/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const prefs = preferences.get(userId) || {
    userId,
    email: true,
    push: true,
    types: NOTIFICATION_TYPES
  };

  res.json({ success: true, data: prefs });
});

app.put('/api/preferences/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { email, push, types } = req.body;

  const prefs = {
    userId,
    email: email !== undefined ? email : true,
    push: push !== undefined ? push : true,
    types: types || NOTIFICATION_TYPES,
    updatedAt: new Date().toISOString()
  };

  preferences.set(userId, prefs);
  res.json({ success: true, data: prefs });
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});

export default app;