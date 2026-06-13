import express from 'express';
import { getTeacherRouter } from './routes/teacher.routes';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
const PORT = process.env.TEACHER_TWIN_PORT || 4552;

app.use(express.json());
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'teacher-twin', timestamp: new Date().toISOString() });
});
app.use('/api/v1/teachers', getTeacherRouter());
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => logger.info(`Teacher twin service running on port ${PORT}`));
process.on('SIGTERM', () => { logger.info('Shutting down'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { logger.info('Shutting down'); server.close(() => process.exit(0)); });

export { app };
