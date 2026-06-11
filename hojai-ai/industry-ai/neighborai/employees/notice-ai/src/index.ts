import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3021;

app.use(express.json());

// In-memory stores
const notices: Map<string, any> = new Map();
const categories: Map<string, any> = new Map();
const subscriptions: Map<string, any> = new Map();

// Initialize default categories
const defaultCategories = [
  { id: 'event', name: 'Community Events', color: '#4CAF50' },
  { id: 'maintenance', name: 'Maintenance', color: '#FF9800' },
  { id: 'security', name: 'Security Alert', color: '#F44336' },
  { id: 'amenity', name: 'Amenity Reservation', color: '#2196F3' },
  { id: 'general', name: 'General Notice', color: '#9E9E9E' }
];

defaultCategories.forEach(c => categories.set(c.id, c));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'notice-ai', timestamp: new Date().toISOString() });
});

// Get all categories
app.get('/api/categories', (_req: Request, res: Response) => {
  const categoryList = Array.from(categories.values());
  res.json({ success: true, count: categoryList.length, data: categoryList });
});

// Create notice
app.post('/api/notices', (req: Request, res: Response) => {
  const { title, content, category, priority, authorId, targetAudience, validUntil, attachments } = req.body;

  if (!title || !content) {
    res.status(400).json({ success: false, error: 'title and content are required' });
    return;
  }

  const notice = {
    id: uuidv4(),
    title,
    content,
    category: category || 'general',
    priority: priority || 'normal',
    authorId: authorId || 'system',
    targetAudience: targetAudience || 'all',
    validUntil: validUntil || null,
    attachments: attachments || [],
    views: 0,
    pinned: false,
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  notices.set(notice.id, notice);
  res.status(201).json({ success: true, data: notice });
});

// Get all notices
app.get('/api/notices', (req: Request, res: Response) => {
  const { category, priority, status, pinned, search } = req.query;
  let filtered = Array.from(notices.values()).filter((n: any) => n.status === 'published');

  if (category) {
    filtered = filtered.filter((n: any) => n.category === category);
  }
  if (priority) {
    filtered = filtered.filter((n: any) => n.priority === priority);
  }
  if (status) {
    filtered = filtered.filter((n: any) => n.status === status);
  }
  if (pinned === 'true') {
    filtered = filtered.filter((n: any) => n.pinned === true);
  }
  if (search) {
    const searchLower = (search as string).toLowerCase();
    filtered = filtered.filter((n: any) =>
      n.title.toLowerCase().includes(searchLower) ||
      n.content.toLowerCase().includes(searchLower)
    );
  }

  // Sort: pinned first, then by createdAt
  filtered.sort((a: any, b: any) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get notice by ID
app.get('/api/notices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const notice = notices.get(id);

  if (!notice) {
    res.status(404).json({ success: false, error: 'Notice not found' });
    return;
  }

  // Increment view count
  notice.views += 1;
  notices.set(id, notice);

  res.json({ success: true, data: notice });
});

// Update notice
app.put('/api/notices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const notice = notices.get(id);

  if (!notice) {
    res.status(404).json({ success: false, error: 'Notice not found' });
    return;
  }

  const { title, content, category, priority, targetAudience, validUntil, pinned } = req.body;
  const updated = {
    ...notice,
    ...(title && { title }),
    ...(content && { content }),
    ...(category && { category }),
    ...(priority && { priority }),
    ...(targetAudience && { targetAudience }),
    ...(validUntil !== undefined && { validUntil }),
    ...(pinned !== undefined && { pinned }),
    updatedAt: new Date().toISOString()
  };

  notices.set(id, updated);
  res.json({ success: true, data: updated });
});

// Delete notice
app.delete('/api/notices/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  if (!notices.has(id)) {
    res.status(404).json({ success: false, error: 'Notice not found' });
    return;
  }

  notices.delete(id);
  res.json({ success: true, message: 'Notice deleted' });
});

// Subscribe to category
app.post('/api/subscriptions', (req: Request, res: Response) => {
  const { residentId, categoryId, notifyEmail, notifyPush } = req.body;

  if (!residentId || !categoryId) {
    res.status(400).json({ success: false, error: 'residentId and categoryId are required' });
    return;
  }

  const category = categories.get(categoryId);
  if (!category) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }

  const subscription = {
    id: uuidv4(),
    residentId,
    categoryId,
    categoryName: category.name,
    notifyEmail: notifyEmail !== false,
    notifyPush: notifyPush !== false,
    active: true,
    createdAt: new Date().toISOString()
  };

  subscriptions.set(subscription.id, subscription);
  res.status(201).json({ success: true, data: subscription });
});

// Get subscriptions for resident
app.get('/api/subscriptions/:residentId', (req: Request, res: Response) => {
  const { residentId } = req.params;
  const subs = Array.from(subscriptions.values()).filter((s: any) => s.residentId === residentId);

  res.json({ success: true, count: subs.length, data: subs });
});

// Get notice statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  const allNotices = Array.from(notices.values());

  res.json({
    success: true,
    data: {
      totalNotices: allNotices.length,
      publishedNotices: allNotices.filter((n: any) => n.status === 'published').length,
      pinnedNotices: allNotices.filter((n: any) => n.pinned).length,
      totalViews: allNotices.reduce((sum: number, n: any) => sum + n.views, 0),
      byCategory: allNotices.reduce((acc: any, n: any) => {
        acc[n.category] = (acc[n.category] || 0) + 1;
        return acc;
      }, {}),
      byPriority: allNotices.reduce((acc: any, n: any) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      }, {})
    }
  });
});

app.listen(PORT, () => {
  console.log(`Notice AI service running on port ${PORT}`);
});

export default app;