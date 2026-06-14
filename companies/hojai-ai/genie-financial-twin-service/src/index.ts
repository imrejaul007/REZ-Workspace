import express from 'express';
const app = express();
app.use(express.json());
app.get('/health', (_, res) => res.json({ status: 'healthy', service: 'genie-financial-twin' }));
app.get('/health/live', (_, res) => res.json({ status: 'ok' }));
app.get('/health/ready', (_, res) => res.json({ status: 'ready' }));
app.get('/api/financial/summary', (_, res) => res.json({ success: true, data: { income: 0, expenses: 0, savings: 0, investments: [] } }));
app.listen(4731, () => console.log('Genie Financial Twin - Port 4731'));
export default app;
