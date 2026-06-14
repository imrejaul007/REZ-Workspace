/**
 * REZ Pages Service - Carrd.co Competitor
 * Create beautiful one-page sites
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4100;

app.use(express.json());

// In-memory storage
const pages = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'REZ Pages', version: '1.0.0' });
});

// Create page
app.post('/api/pages', (req, res) => {
  const { userId, title, slug, components, settings, theme } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const page = {
    id: uuidv4(),
    slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    userId,
    title,
    components: components || [],
    settings: {
      customDomain: settings?.customDomain || null,
      password: settings?.password || null,
      published: false,
      ...settings,
    },
    theme: theme || {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    views: 0,
  };

  pages.set(page.id, page);
  res.status(201).json(page);
});

// List pages
app.get('/api/pages', (req, res) => {
  const userId = req.headers['x-user-id'];
  const userPages = Array.from(pages.values())
    .filter(p => !userId || p.userId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  res.json({ pages: userPages, total: userPages.length });
});

// Get page
app.get('/api/pages/:id', (req, res) => {
  const page = pages.get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }
  res.json(page);
});

// Update page
app.patch('/api/pages/:id', (req, res) => {
  const page = pages.get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const updated = {
    ...page,
    ...req.body,
    id: page.id,
    userId: page.userId,
    updatedAt: new Date(),
  };

  pages.set(page.id, updated);
  res.json(updated);
});

// Delete page
app.delete('/api/pages/:id', (req, res) => {
  if (!pages.has(req.params.id)) {
    return res.status(404).json({ error: 'Page not found' });
  }
  pages.delete(req.params.id);
  res.status(204).send();
});

// Publish page
app.post('/api/pages/:id/publish', (req, res) => {
  const page = pages.get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  page.settings.published = true;
  page.updatedAt = new Date();
  pages.set(page.id, page);

  res.json(page);
});

// Track view
app.post('/api/pages/:id/view', (req, res) => {
  const page = pages.get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  page.views++;
  pages.set(page.id, page);

  res.json({ views: page.views });
});

// Get analytics
app.get('/api/pages/:id/analytics', (req, res) => {
  const page = pages.get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  res.json({
    views: page.views,
    uniqueVisitors: Math.floor(page.views * 0.7),
    topReferrers: ['Direct', 'Instagram', 'Twitter'],
  });
});

// Public page route
app.get('/:slug', (req, res) => {
  const page = Array.from(pages.values()).find(p => p.slug === req.params.slug);

  if (!page || !page.settings.published) {
    return res.status(404).send('Page not found');
  }

  // Check password
  if (page.settings.password) {
    const providedPassword = req.query.password;
    if (providedPassword !== page.settings.password) {
      return res.send(`<!DOCTYPE html>
        <html>
        <head><title>Password Required</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui;">
          <div style="text-align:center;">
            <h2>This page is password protected</h2>
            <form method="get">
              <input type="password" name="password" placeholder="Enter password" style="padding:10px;border:1px solid #ccc;border-radius:5px;">
              <button type="submit" style="padding:10px 20px;background:#000;color:#fff;border:none;border-radius:5px;cursor:pointer;">Enter</button>
            </form>
          </div>
        </body>
        </html>`);
    }
  }

  // Render page
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${page.theme.fontFamily || 'system-ui'}; background: ${page.theme.backgroundColor}; color: ${page.theme.textColor || '#000'}; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 3rem; margin-bottom: 20px; color: ${page.theme.primaryColor}; }
    p { font-size: 1.2rem; line-height: 1.6; margin-bottom: 20px; }
    .btn { display: inline-block; padding: 15px 30px; background: ${page.theme.primaryColor}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .hero { text-align: center; padding: 80px 20px; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-top: 60px; }
    .feature { padding: 30px; background: rgba(0,0,0,0.05); border-radius: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>${page.title}</h1>
      ${page.components.filter(c => c.type === 'hero').map(c => `<p>${c.content || ''}</p>`).join('')}
      ${page.components.filter(c => c.type === 'cta').map(c => `<a href="${c.url || '#'}" class="btn">${c.text || 'Get Started'}</a>`).join('')}
    </div>
    <div class="features">
      ${page.components.filter(c => c.type === 'feature').map(c => `
        <div class="feature">
          <h3>${c.title || ''}</h3>
          <p>${c.description || ''}</p>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`✅ REZ Pages running on port ${PORT}`);
});

export default app;