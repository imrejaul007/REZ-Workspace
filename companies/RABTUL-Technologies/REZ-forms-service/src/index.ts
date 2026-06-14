/**
 * REZ Forms Service - AI-Powered Form Builder (Tally Competitor)
 *
 * Features:
 * - AI form generation from natural language
 * - Document-like editor (like Tally/Notion)
 * - Conditional logic & calculations
 * - CorpID identity integration
 * - QR-powered offline forms
 * - Workflow automation
 * - Genie AI agent triggers
 */

import express from 'express';
import { formRoutes } from './routes/forms';
import { submissionRoutes } from './routes/submissions';
import { aiRoutes } from './routes/ai';
import { workflowRoutes } from './routes/workflows';
import { webhookRoutes } from './routes/webhooks';

const app = express();
const PORT = process.env.PORT || 4092;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'REZ Forms', version: '1.0.0' });
});

// API Routes
app.use('/api/forms', formRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/webhooks', webhookRoutes);

// Form rendering (embeddable)
app.get('/f/:formId', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>REZ Forms</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
    #form-container { max-width: 640px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="form-container" data-form-id="${req.params.formId}"></div>
  <script src="/static/embed.js"></script>
</body>
</html>`);
});

// Embed script
app.get('/static/embed.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    document.addEventListener('DOMContentLoaded', () => {
      const container = document.getElementById('form-container');
      const formId = container.dataset.formId;
      fetch('/api/forms/' + formId)
        .then(r => r.json())
        .then(form => {
          // Use textContent to prevent XSS
          const titleEl = document.createElement('h1');
          titleEl.textContent = form.title || '';
          const descEl = document.createElement('p');
          descEl.textContent = form.description || '';
          container.textContent = '';
          container.appendChild(titleEl);
          container.appendChild(descEl);
        });
    });
  `);
});

app.listen(PORT, () => {
  console.log('✅ REZ Forms Service running on port', PORT);
  console.log('📝 API: http://localhost:' + PORT + '/api/docs');
});

export default app;