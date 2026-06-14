import express from 'express';
const app = express();
app.use(express.json());
app.get('/health', (_, res) => res.json({ status: 'healthy', service: 'genie-founder-twin' }));
app.get('/health/live', (_, res) => res.json({ status: 'ok' }));
app.get('/health/ready', (_, res) => res.json({ status: 'ready' }));
app.get('/api/founder/summary', (_, res) => res.json({ success: true, data: { companies: [], investments: [], total_companies: 0, total_investments: 0 } }));
app.listen(4709, () => console.log('Genie Founder Twin - Port 4709'));
export default app;
