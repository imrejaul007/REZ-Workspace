import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    process.env.NODE_ENV === 'production' ? winston.format.json() : winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'restaurant-crm' },
});

export default logger;