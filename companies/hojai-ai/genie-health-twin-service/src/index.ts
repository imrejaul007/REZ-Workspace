import express from 'express';
const app = express();
app.use(express.json());
app.get('/health', (_, res) => res.json({ status: 'healthy', service: 'genie-health-twin' }));
app.get('/health/live', (_, res) => res.json({ status: 'ok' }));
app.get('/health/ready', (_, res) => res.json({ status: 'ready' }));
app.get('/api/health/summary', (_, res) => res.json({ success: true, data: { fitness_level: 'moderate', health_goals: [], metrics: {} } }));
app.listen(4730, () => console.log('Genie Health Twin - Port 4730'));
export default app;
