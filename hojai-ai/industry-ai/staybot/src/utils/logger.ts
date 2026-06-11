/**
 * STAYBOT - Logger Utility
 * Winston-based structured logging for the Hotel AI Operating System
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Custom format for structured logging
const structuredFormat = winston.format.printf(({ level, message, timestamp, service, ...metadata }) => {
  const log = {
    timestamp,
    level,
    service,
    message,
    requestId: metadata.requestId || null,
    agentId: metadata.agentId || null,
    guestId: metadata.guestId || null,
    ...metadata,
  };
  return JSON.stringify(log);
});

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    structuredFormat
  ),
  defaultMeta: { service: 'staybot' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1
            ? ` ${JSON.stringify(meta)}`
            : '';
          return `${timestamp} [${level}] ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// Add request context
export const createRequestLogger = (requestId: string = uuidv4()) => {
  return {
    info: (message: string, meta?: Record<string, any>) =>
      logger.info(message, { requestId, ...meta }),
    error: (message: string, meta?: Record<string, any>) =>
      logger.error(message, { requestId, ...meta }),
    warn: (message: string, meta?: Record<string, any>) =>
      logger.warn(message, { requestId, ...meta }),
    debug: (message: string, meta?: Record<string, any>) =>
      logger.debug(message, { requestId, ...meta }),
  };
};

// Add agent context
export const createAgentLogger = (agentId: string, agentType: string) => {
  return {
    info: (message: string, meta?: Record<string, any>) =>
      logger.info(message, { agentId, agentType, ...meta }),
    error: (message: string, meta?: Record<string, any>) =>
      logger.error(message, { agentId, agentType, ...meta }),
    warn: (message: string, meta?: Record<string, any>) =>
      logger.warn(message, { agentId, agentType, ...meta }),
    debug: (message: string, meta?: Record<string, any>) =>
      logger.debug(message, { agentId, agentType, ...meta }),
  };
};

// Log AI agent activities
export const logAIActivity = (
  agentId: string,
  action: string,
  details: Record<string, any>
) => {
  logger.info(`AI Agent Activity`, {
    agentId,
    action,
    activityType: 'ai_agent',
    ...details,
  });
};

// Log guest interactions
export const logGuestInteraction = (
  guestId: string,
  interaction: string,
  details: Record<string, any>
) => {
  logger.info(`Guest Interaction`, {
    guestId,
    interaction,
    activityType: 'guest_interaction',
    ...details,
  });
};

// Log AXP protocol messages
export const logAXPMessage = (
  direction: 'sent' | 'received',
  message: Record<string, any>
) => {
  logger.info(`AXP Protocol ${direction.toUpperCase()}`, {
    activityType: 'axp_protocol',
    direction,
    messageId: message?.header?.message_id,
    sender: message?.header?.sender,
    receiver: message?.header?.receiver,
    action: message?.header?.action,
  });
};

// Log revenue events
export const logRevenueEvent = (
  event: string,
  details: Record<string, any>
) => {
  logger.info(`Revenue Event`, {
    activityType: 'revenue',
    event,
    ...details,
  });
};

// Log system health
export const logHealthEvent = (
  component: string,
  status: 'healthy' | 'degraded' | 'down',
  details?: Record<string, any>
) => {
  const level = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
  logger[level](`Health Event: ${component}`, {
    activityType: 'health',
    component,
    status,
    ...details,
  });
};

export default logger;
