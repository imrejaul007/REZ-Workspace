/**
 * GENIE Relationship Twin Service
 * Port: 4705
 */
import express from 'express';
import routes from './routes/routes.js';

const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'healthy', service: 'genie-relationship-twin' }));
app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
app.get('/health/ready', (_req, res) => res.json({ status: 'ready' }));
app.use('/api', routes);

const PORT = process.env.PORT || 4705;
app.listen(PORT, () => console.log(`\nGenie Relationship Twin - Port ${PORT}\n`));
export default app;
