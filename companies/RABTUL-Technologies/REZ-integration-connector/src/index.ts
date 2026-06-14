import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './utils/logger';
import connectorRoutes from './routes/connectors';

const app = express();
const PORT = process.env.PORT || 4314;

app.use(helmet(), cors(), express.json());
app.get('/health', (_req, res) => res.json({ service: 'REZ Integration Connector', status: 'healthy' }));
app.use('/api/connectors', connectorRoutes);
app.listen(PORT, () => logger.info(`REZ Integration Connector running on port ${PORT}`));
export { app };
