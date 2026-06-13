import express from 'express';
import { PricingAgent } from './agent';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

const app = express();
const PORT = process.env.PRICING_AGENT_PORT || 4002;

app.use(express.json());

const agent = new PricingAgent();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'pricing-agent', timestamp: new Date().toISOString() });
});

app.get('/skills', (req, res) => {
  res.json(agent.getSkills());
});

app.get('/tools', (req, res) => {
  res.json(agent.getTools());
});

app.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await agent.processMessage({ message, context });
    return res.json(response);
  } catch (error: any) {
    logger.error(`Error processing message: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/history', (req, res) => {
  res.json(agent.getConversationHistory());
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  logger.info(`Pricing agent running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app };
