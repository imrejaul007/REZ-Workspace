import winston from 'winston';
const { combine, timestamp, printf, colorize } = winston.format;
const log = printf(({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`);
const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), colorize(), log),
  transports: [new winston.transports.Console()]
});
export default logger;
