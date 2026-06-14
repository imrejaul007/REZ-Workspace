/**
 * ReZ Legal Docs Server
 * Serves Terms of Service and Privacy Policy for Shopify apps
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Legal document mapping
const LEGAL_DOCS = {
  'cart-recover': {
    terms: path.join(__dirname, '../rez-shopify-recover/legal/TERMS.md'),
    privacy: path.join(__dirname, '../rez-shopify-recover/legal/PRIVACY.md'),
  },
  'loyalty-boost': {
    terms: path.join(__dirname, '../rez-shopify-rewards/legal/TERMS.md'),
    privacy: path.join(__dirname, '../rez-shopify-rewards/legal/PRIVACY.md'),
  },
  'whatsapp-notify': {
    terms: path.join(__dirname, '../rez-shopify-notify/legal/TERMS.md'),
    privacy: path.join(__dirname, '../rez-shopify-notify/legal/PRIVACY.md'),
  },
  'socialsell': {
    terms: path.join(__dirname, '../rez-shopify-agent/legal/TERMS.md'),
    privacy: path.join(__dirname, '../rez-shopify-agent/legal/PRIVACY.md'),
  },
  'smartupsell': {
    terms: path.join(__dirname, '../rez-shopify-upsell/legal/TERMS.md'),
    privacy: path.join(__dirname, '../rez-shopify-upsell/legal/PRIVACY.md'),
  },
  'segmentai': {
    terms: path.join(__dirname, '../rez-shopify-segments/legal/TERMS.md'),
    privacy: path.join(__dirname, '../rez-shopify-segments/legal/PRIVACY.md'),
  },
  'recox': {
    terms: path.join(__dirname, '../rez-shopify-predict/legal/TERMS.md'),
    privacy: path.join(__dirname, '../rez-shopify-predict/legal/PRIVACY.md'),
  },
};

// Convert markdown to HTML
function mdToHtml(markdown, title) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
    h1 { color: #667EEA; border-bottom: 2px solid #667EEA; padding-bottom: 10px; }
    h2 { color: #764BA2; margin-top: 30px; }
    h3 { color: #555; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    strong { color: #000; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
  </style>
</head>
<body>
${markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .split('\n\n')
    .map(p => p.startsWith('<') ? p : `<p>${p}</p>`)
    .join('\n')
}
  <div class="footer">
    <p><strong>RABTUL Technologies Private Limited</strong></p>
    <p>Last Updated: May 23, 2026</p>
    <p>Contact: legal@rez.money</p>
  </div>
</body>
</html>`;
  return html;
}

// Routes
app.get('/', (req, res) => {
  res.json({
    service: 'ReZ Legal Docs Server',
    version: '1.0.0',
    endpoints: Object.keys(LEGAL_DOCS).map(app => ({
      app,
      terms: `/legal/${app}/terms`,
      privacy: `/legal/${app}/privacy`,
    })),
  });
});

app.get('/legal/:app/terms', (req, res) => {
  const { app } = req.params;
  const docs = LEGAL_DOCS[app];

  if (!docs) {
    return res.status(404).json({ error: 'App not found' });
  }

  if (!fs.existsSync(docs.terms)) {
    return res.status(404).json({ error: 'Terms of Service not found' });
  }

  const content = fs.readFileSync(docs.terms, 'utf-8');
  const title = `ReZ ${app.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - Terms of Service`;
  res.send(mdToHtml(content, title));
});

app.get('/legal/:app/privacy', (req, res) => {
  const { app } = req.params;
  const docs = LEGAL_DOCS[app];

  if (!docs) {
    return res.status(404).json({ error: 'App not found' });
  }

  if (!fs.existsSync(docs.privacy)) {
    return res.status(404).json({ error: 'Privacy Policy not found' });
  }

  const content = fs.readFileSync(docs.privacy, 'utf-8');
  const title = `ReZ ${app.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - Privacy Policy`;
  res.send(mdToHtml(content, title));
});

// Start server
app.listen(PORT, () => {
  console.log(`ReZ Legal Docs Server running on port ${PORT}`);
  console.log(`Legal URLs available at:`);
  Object.keys(LEGAL_DOCS).forEach(app => {
    console.log(`  - http://localhost:${PORT}/legal/${app}/terms`);
    console.log(`  - http://localhost:${PORT}/legal/${app}/privacy`);
  });
});
