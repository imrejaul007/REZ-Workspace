import winston from 'winston';
import config from '../config';
export const logger = winston.createLogger({ level: config.logging.level, format: winston.format.combine(winston.format.timestamp(), winston.format.json()), defaultMeta: { service: 'airzy-hotel-extension' }, transports: [new winston.transports.Console()] });
export default logger;