/**
 * REZ Links Service - Linktree Competitor
 * Link-in-bio for creators
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4101;

app.use(express.json());

// In-memory storage
const linkPages = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'REZ Links', version: '1.0.0' });
});

// Create link page
app.post('/api/links', (req, res) => {
  const { userId, username, title, bio, avatar, theme, links } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const page = {
    id: uuidv4(),
    username,
    userId,
    title: title || username,
    bio: bio || '',
    avatar: avatar || null,
    theme: theme || {
      background: '#ffffff',
      textColor: '#000000',
      buttonColor: '#000000',
      buttonTextColor: '#ffffff',
      style: 'minimal',
    },
    links: links || [],
    qrCode: null,
    views: 0,
    clicks: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  linkPages.set(username, page);
  res.status(201).json(page);
});

// List link pages
app.get('/api/links', (req, res) => {
  const userId = req.headers['x-user-id'];
  const userPages = Array.from(linkPages.values())
    .filter(p => !userId || p.userId === userId);

  res.json({ pages: userPages, total: userPages.length });
});

// Get link page by username
app.get('/api/links/:username', (req, res) => {
  const page = linkPages.get(req.params.username);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }
  res.json(page);
});

// Update link page
app.patch('/api/links/:username', (req, res) => {
  const page = linkPages.get(req.params.username);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const updated = {
    ...page,
    ...req.body,
    id: page.id,
    username: page.username,
    updatedAt: new Date(),
  };

  linkPages.set(page.username, updated);
  res.json(updated);
});

// Delete link page
app.delete('/api/links/:username', (req, res) => {
  if (!linkPages.has(req.params.username)) {
    return res.status(404).json({ error: 'Page not found' });
  }
  linkPages.delete(req.params.username);
  res.status(204).send();
});

// Add link to page
app.post('/api/links/:username/links', (req, res) => {
  const page = linkPages.get(req.params.username);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const link = {
    id: uuidv4(),
    ...req.body,
    clicks: 0,
  };

  page.links.push(link);
  linkPages.set(page.username, page);

  res.status(201).json(link);
});

// Track link click
app.post('/api/links/:username/links/:linkId/click', (req, res) => {
  const page = linkPages.get(req.params.username);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const link = page.links.find(l => l.id === req.params.linkId);
  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  link.clicks++;
  page.clicks++;
  linkPages.set(page.username, page);

  res.json({ clicks: link.clicks });
});

// Track page view
app.post('/api/links/:username/view', (req, res) => {
  const page = linkPages.get(req.params.username);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  page.views++;
  linkPages.set(page.username, page);

  res.json({ views: page.views });
});

// Get analytics
app.get('/api/links/:username/analytics', (req, res) => {
  const page = linkPages.get(req.params.username);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  res.json({
    views: page.views,
    clicks: page.clicks,
    topLinks: page.links
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
      .map(l => ({ title: l.title, clicks: l.clicks })),
    clicksByDate: {},
  });
});

// Public page route
app.get('/:username', (req, res) => {
  const page = linkPages.get(req.params.username);

  if (!page) {
    return res.status(404).send('Page not found');
  }

  const { theme, title, bio, avatar, links } = page;

  // Theme styles
  const styles = {
    minimal: 'text-align:center;',
    gradient: `background: linear-gradient(135deg, ${theme.background || '#667eea'}, ${theme.backgroundEnd || '#764ba2'});`,
    dark: 'background:#000;color:#fff;',
    glass: 'background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);',
  };

  const bgStyle = styles[theme.style] || styles.minimal;

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui; ${bgStyle} min-height: 100vh; padding: 40px 20px; }
    .container { max-width: 400px; margin: 0 auto; text-align: center; }
    .avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; margin-bottom: 20px; border: 3px solid ${theme.buttonColor}; }
    h1 { font-size: 1.5rem; margin-bottom: 8px; color: ${theme.textColor}; }
    .bio { color: ${theme.textColor}; opacity: 0.7; margin-bottom: 30px; font-size: 0.9rem; }
    .links { display: flex; flex-direction: column; gap: 12px; }
    .link { display: block; padding: 16px 20px; background: ${theme.buttonColor}; color: ${theme.buttonTextColor}; text-decoration: none; border-radius: 12px; font-weight: 600; transition: transform 0.2s; }
    .link:hover { transform: scale(1.02); }
    .link img { width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; }
    .footer { margin-top: 40px; color: ${theme.textColor}; opacity: 0.5; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    ${avatar ? `<img src="${avatar}" class="avatar" alt="${title}">` : ''}
    <h1>${title}</h1>
    <p class="bio">${bio}</p>
    <div class="links">
      ${links.map(link => `
        <a href="/api/links/${username}/links/${link.id}/redirect" class="link" target="_blank" rel="noopener">
          ${link.icon ? `<img src="${link.icon}" alt="">` : ''}
          ${link.title}
        </a>
      `).join('')}
    </div>
    <p class="footer">Powered by REZ Links</p>
  </div>
</body>
</html>`);
});

// Redirect with tracking
app.get('/api/links/:username/links/:linkId/redirect', (req, res) => {
  const page = linkPages.get(req.params.username);
  if (!page) {
    return res.redirect('/');
  }

  const link = page.links.find(l => l.id === req.params.linkId);
  if (!link || !link.url) {
    return res.redirect('/');
  }

  // Track click
  link.clicks++;
  page.clicks++;
  linkPages.set(page.username, page);

  res.redirect(link.url);
});

app.listen(PORT, () => {
  console.log(`✅ REZ Links running on port ${PORT}`);
});

export default app;