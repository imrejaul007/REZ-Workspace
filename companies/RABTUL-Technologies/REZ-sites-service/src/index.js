/**
 * REZ Sites Service - Webflow Competitor
 * No-code websites
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4106;

app.use(express.json());

// In-memory storage
const sites = new Map();
const components = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'REZ Sites', version: '1.0.0' });
});

// Create site
app.post('/api/sites', (req, res) => {
  const { userId, name, slug, pages, theme, settings } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Site name is required' });
  }

  const site = {
    id: uuidv4(),
    userId,
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status: 'draft', // draft, published
    pages: pages || [{
      id: uuidv4(),
      name: 'Home',
      path: '/',
      components: [],
    }],
    theme: theme || {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, system-ui',
    },
    settings: settings || {
      favicon: null,
      ogImage: null,
      analyticsId: null,
    },
    customDomain: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
  };

  sites.set(site.id, site);
  res.status(201).json(site);
});

// List sites
app.get('/api/sites', (req, res) => {
  const userId = req.headers['x-user-id'];
  const userSites = Array.from(sites.values())
    .filter(s => !userId || s.userId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  res.json({ sites: userSites, total: userSites.length });
});

// Get site
app.get('/api/sites/:id', (req, res) => {
  const site = sites.get(req.params.id);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }
  res.json(site);
});

// Update site
app.patch('/api/sites/:id', (req, res) => {
  const site = sites.get(req.params.id);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }

  const updated = {
    ...site,
    ...req.body,
    id: site.id,
    updatedAt: new Date(),
  };

  sites.set(site.id, updated);
  res.json(updated);
});

// Delete site
app.delete('/api/sites/:id', (req, res) => {
  if (!sites.has(req.params.id)) {
    return res.status(404).json({ error: 'Site not found' });
  }
  sites.delete(req.params.id);
  res.status(204).send();
});

// Publish site
app.post('/api/sites/:id/publish', (req, res) => {
  const site = sites.get(req.params.id);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }

  site.status = 'published';
  site.publishedAt = new Date();
  site.updatedAt = new Date();
  sites.set(site.id, site);

  res.json(site);
});

// Get page with components
app.get('/api/sites/:siteId/pages/:pageId', (req, res) => {
  const site = sites.get(req.params.siteId);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }

  const page = site.pages.find(p => p.id === req.params.pageId);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const pageComponents = Array.from(components.values())
    .filter(c => c.pageId === req.params.pageId)
    .sort((a, b) => a.order - b.order);

  res.json({ ...page, components: pageComponents });
});

// Add component to page
app.post('/api/sites/:siteId/pages/:pageId/components', (req, res) => {
  const site = sites.get(req.params.siteId);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }

  const page = site.pages.find(p => p.id === req.params.pageId);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const { type, props, order } = req.body;

  const component = {
    id: uuidv4(),
    siteId: req.params.siteId,
    pageId: req.params.pageId,
    type: type || 'div',
    props: props || {},
    order: order ?? page.components?.length || 0,
  };

  components.set(component.id, component);

  if (!page.components) page.components = [];
  page.components.push(component.id);
  sites.set(site.id, site);

  res.status(201).json(component);
});

// Update component
app.patch('/api/components/:id', (req, res) => {
  const component = components.get(req.params.id);
  if (!component) {
    return res.status(404).json({ error: 'Component not found' });
  }

  const updated = {
    ...component,
    ...req.body,
    id: component.id,
  };

  components.set(component.id, updated);
  res.json(updated);
});

// Delete component
app.delete('/api/components/:id', (req, res) => {
  if (!components.has(req.params.id)) {
    return res.status(404).json({ error: 'Component not found' });
  }
  components.delete(req.params.id);
  res.status(204).send();
});

// Get analytics
app.get('/api/sites/:id/analytics', (req, res) => {
  const site = sites.get(req.params.id);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }

  res.json({
    views: site.views || 0,
    uniqueVisitors: site.uniqueVisitors || 0,
    topPages: site.pages?.map(p => ({ name: p.name, views: p.views || 0 })) || [],
    topReferrers: ['Direct', 'Google', 'Social'],
    bounceRate: 0.45,
    avgSessionDuration: 120,
  });
});

// Public site route
app.get('/:slug', (req, res) => {
  const site = Array.from(sites.values()).find(s => s.slug === req.params.slug);

  if (!site || site.status !== 'published') {
    return res.status(404).send('Site not found');
  }

  site.views = (site.views || 0) + 1;
  sites.set(site.id, site);

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${site.name}</title>
  <meta property="og:title" content="${site.name}">
  ${site.settings?.ogImage ? `<meta property="og:image" content="${site.settings.ogImage}">` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${site.theme.fontFamily};
      background: ${site.theme.backgroundColor};
      color: ${site.theme.textColor || '#000'};
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; }
    .logo { font-weight: bold; font-size: 1.5rem; color: ${site.theme.primaryColor}; }
    .nav-links { display: flex; gap: 20px; }
    .nav-links a { color: inherit; text-decoration: none; }
    .hero { text-align: center; padding: 100px 20px; }
    h1 { font-size: 3.5rem; margin-bottom: 20px; color: ${site.theme.primaryColor}; }
    .subtitle { font-size: 1.5rem; opacity: 0.8; margin-bottom: 40px; }
    .cta {
      display: inline-block;
      padding: 16px 40px;
      background: ${site.theme.primaryColor};
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
    }
    footer { text-align: center; padding: 40px; border-top: 1px solid rgba(0,0,0,0.1); margin-top: 100px; }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <div class="logo">${site.name}</div>
      <div class="nav-links">
        <a href="#">Home</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </div>
    </nav>
    <div class="hero">
      <h1>${site.name}</h1>
      <p class="subtitle">Built with REZ Sites</p>
      <a href="#" class="cta">Get Started</a>
    </div>
  </div>
  <footer>
    <p>Powered by REZ Sites</p>
  </footer>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`✅ REZ Sites running on port ${PORT}`);
});

export default app;