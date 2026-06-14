import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { logger } from './utils/logger';
import { workflowRoutes } from './routes/workflow.routes';
import { triggerRoutes } from './routes/trigger.routes';
import { executionRoutes } from './routes/execution.routes';
import { WorkflowEngine } from './engine/workflow.engine';

config();

const app = express();
const PORT = process.env.PORT || 4680;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'] }));
app.use(express.json());

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-workflow-builder', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/triggers', triggerRoutes);
app.use('/api/v1/executions', executionRoutes);

// Init workflow engine
const engine = new WorkflowEngine();
engine.start();

app.listen(PORT, () => {
  logger.info(`REZ Workflow Builder running on port ${PORT}`);
});

export default app;
