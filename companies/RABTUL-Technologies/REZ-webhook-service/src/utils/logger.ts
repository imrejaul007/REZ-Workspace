import winston from 'winston';
const { combine, timestamp, printf, colorize, errors } = winston.format;
const logFormat = printf(({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`);
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [new winston.transports.Console({ format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat) })]
});
export default logger;
