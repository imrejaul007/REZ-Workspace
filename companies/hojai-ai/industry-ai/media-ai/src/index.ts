/**
 * Media AI Service - Industry AI Vertical
 * "AI-Powered Media Intelligence"
 *
 * @port 4515
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const app = express();
const PORT = parseInt(process.env.PORT || '4515', 10);

app.use(helmet(), cors(), compression(), express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'media-ai', version: '1.0.0', tagline: 'AI-Powered Media Intelligence' }));
app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', (req, res) => res.json({ status: 'ready', agents: ['Content Recommendation Agent', 'Ad Optimization Agent', 'Engagement Agent', 'Monetization Agent'] }));

app.get('/ai/agents', (req, res) => {
  res.json({
    active: true,
    agents: [
      { name: 'Content Recommendation Agent', status: 'active', capabilities: ['Personalization', 'Content scoring', 'Trend detection'] },
      { name: 'Ad Optimization Agent', status: 'active', capabilities: ['CPM optimization', 'Audience targeting', 'ROI tracking'] },
      { name: 'Engagement Agent', status: 'active', capabilities: ['Social listening', 'Sentiment analysis', 'Community management'] },
      { name: 'Monetization Agent', status: 'active', capabilities: ['Revenue optimization', 'Subscription management', 'Pricing'] }
    ]
  });
});

app.use('/api/content', require('./routes/content.js'));
app.use('/api/monetization', require('./routes/monetization.js'));
app.use('/api/analytics', require('./routes/analytics.js'));

app.get('/', (req, res) => res.json({ name: 'Media AI', tagline: 'AI-Powered Media Intelligence', version: '1.0.0', port: PORT }));

app.listen(PORT, () => console.log(`Media AI running on port ${PORT}`));
export default app;
