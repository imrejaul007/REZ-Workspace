#!/usr/bin/env python3
"""
Restaurant OS Skills Generator
Generates all service files for the Restaurant OS twins and integrations
"""

import os
import shutil

BASE_PATH = "/Users/rejaulkarim/Documents/RTMN/industries/restaurant-os/skills"

SERVICES = [
    "kitchen-twin-service",
    "inventory-twin-service",
    "customer-twin-service",
    "staff-twin-service",
    "loyalty-twin-service"
]

PORTS = {
    "kitchen-twin-service": 4015,
    "inventory-twin-service": 4016,
    "customer-twin-service": 4017,
    "staff-twin-service": 4018,
    "loyalty-twin-service": 4019
}

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)

def generate_tsconfig(service_name):
    return '''{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
'''

def generate_package_json(service_name):
    return f'''{{
  "name": "@restaurant-os/{service_name.replace('-', '-')}",
  "version": "1.0.0",
  "description": "{service_name.replace('-', ' ').title()} for Restaurant OS",
  "main": "dist/index.js",
  "scripts": {{
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "docker:build": "docker build -t {service_name} .",
    "docker:run": "docker-compose up -d"
  }},
  "dependencies": {{
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "mongoose": "^8.0.3",
    "amqplib": "^0.10.3",
    "uuid": "^9.0.1",
    "winston": "^3.11.0",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    "axios": "^1.6.2"
  }},
  "devDependencies": {{
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/amqplib": "^0.10.4",
    "@types/uuid": "^9.0.7",
    "@types/node": "^20.10.5",
    "@types/jest": "^29.5.11",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@types/supertest": "^6.0.2",
    "supertest": "^6.3.3"
  }},
  "engines": {{
    "node": ">=18.0.0"
  }}
}}
'''

def generate_logger():
    return '''import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

import fs from 'fs';
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
'''

def generate_message_broker():
    return '''import amqp, { Connection, Channel } from 'amqplib';
import { logger } from './logger';

class MessageBroker {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;

  async connect(): Promise<void> {
    const url = process.env.RABBITMQ_URI || 'amqp://localhost:5672';

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange('restaurant.events', 'topic', { durable: true });

      await this.channel.assertQueue('restaurant.events', { durable: true });

      await this.channel.bindQueue('restaurant.events', 'restaurant.events', '#');

      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', { error: err.message });
        this.handleReconnect();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.handleReconnect();
      });

      this.reconnectAttempts = 0;
      logger.info('Connected to RabbitMQ', { url });
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error: (error as Error).message });
      this.handleReconnect();
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(`Attempting to reconnect to RabbitMQ in ${delay}ms`, {
      attempt: this.reconnectAttempts
    });

    setTimeout(async () => {
      await this.connect();
    }, delay);
  }

  async publish(routingKey: string, message: object): Promise<boolean> {
    if (!this.channel) {
      logger.warn('RabbitMQ channel not available, message not published', { routingKey });
      return false;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const published = this.channel.publish('restaurant.events', routingKey, messageBuffer, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      });

      if (published) {
        logger.debug('Message published', { routingKey });
      } else {
        logger.warn('Message not published, channel buffer full', { routingKey });
      }

      return published;
    } catch (error) {
      logger.error('Failed to publish message', {
        routingKey,
        error: (error as Error).message
      });
      return false;
    }
  }

  async subscribe(
    queue: string,
    handler: (message: object) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      logger.error('RabbitMQ channel not available');
      return;
    }

    await this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel?.ack(msg);
        } catch (error) {
          logger.error('Failed to process message', {
            queue,
            error: (error as Error).message
          });
          this.channel?.nack(msg, false, true);
        }
      }
    });

    logger.info('Subscribed to queue', { queue });
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', { error: (error as Error).message });
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}

export const messageBroker = new MessageBroker();
'''

def generate_cors():
    return '''import cors from 'cors';
import { Request, Response } from 'express';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:4010',
  'http://localhost:4011',
  'http://localhost:4013',
  'http://localhost:4014',
  'http://localhost:4022',
  'http://localhost:4058',
  'http://localhost:4060',
  'http://localhost:4082',
  'http://localhost:4091'
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400
});
'''

def generate_error_handler():
    return '''import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.statusCode.toString(),
        message: err.message,
        isOperational: err.isOperational
      }
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.message
      }
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format'
      }
    });
  }

  if ((err as any).code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: 'Duplicate entry'
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message
    }
  });
};
'''

def generate_index(port, service_name):
    name = service_name.replace('-', '')
    return f'''import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';

import {{ logger }} from './utils/logger';
import {{ messageBroker }} from './utils/message-broker';
import {{ corsMiddleware }} from './middleware/cors';
import {{ rateLimiter }} from './middleware/rate-limiter';
import {{ errorHandler, notFoundHandler }} from './middleware/error-handler';
import {name}Routes from './routes/{name}.routes';

const app = express();
const PORT = parseInt(process.env.SERVICE_PORT || '{port}');

// Security middleware
app.use(helmet());
app.use(compression());

// CORS
app.use(corsMiddleware);

// Body parsing
app.use(express.json({{ limit: '10mb' }}));
app.use(express.urlencoded({{ extended: true }}));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', async (req, res) => {{
  res.json({{
    status: 'healthy',
    service: process.env.SERVICE_NAME || '{service_name}',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    rabbitmq: messageBroker.isConnected() ? 'connected' : 'disconnected'
  }});
}});

// Readiness check
app.get('/ready', async (req, res) => {{
  const isDbReady = mongoose.connection.readyState === 1;
  const isMqReady = messageBroker.isConnected();

  if (isDbReady && isMqReady) {{
    res.json({{ status: 'ready' }});
  }} else {{
    res.status(503).json({{
      status: 'not ready',
      mongodb: isDbReady ? 'connected' : 'disconnected',
      rabbitmq: isMqReady ? 'connected' : 'disconnected'
    }});
  }}
}});

// API routes
app.use('/api/twins/{service_name.replace("-", "/")}', {name}Routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {{
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/{service_name.replace("-", "_")}';

  try {{
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB', {{ uri: mongoUri }});
  }} catch (error) {{
    logger.error('Failed to connect to MongoDB', {{ error: (error as Error).message }});
    throw error;
  }}
}}

// Message broker connection
async function connectMessageBroker(): Promise<void> {{
  try {{
    await messageBroker.connect();
  }} catch (error) {{
    logger.warn('Failed to connect to RabbitMQ, will retry in background', {{
      error: (error as Error).message
    }});
  }}
}}

// Graceful shutdown
async function shutdown(): Promise<void> {{
  logger.info('Shutting down gracefully...');

  try {{
    await messageBroker.close();
    await mongoose.connection.close();
    logger.info('Shutdown complete');
    process.exit(0);
  }} catch (error) {{
    logger.error('Error during shutdown', {{ error: (error as Error).message }});
    process.exit(1);
  }}
}}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {{
  try {{
    await connectDatabase();
    await connectMessageBroker();

    app.listen(PORT, () => {{
      logger.info(`{service_name.replace("-", " ").title()} started`, {{
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      }});
    }});
  }} catch (error) {{
    logger.error('Failed to start server', {{ error: (error as Error).message }});
    process.exit(1);
  }}
}}

start();

export {{ app }};
'''

def generate_dockerfile(port):
    return f'''FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src/ ./src/

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN mkdir -p /app/logs

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

COPY .env.example .env

EXPOSE {port}

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:{port}/health || exit 1

CMD ["node", "dist/index.js"]
'''

def generate_docker_compose(service_name, port):
    return f'''version: '3.8'

services:
  {service_name}:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: {service_name}
    restart: unless-stopped
    ports:
      - "{port}:{port}"
    environment:
      - NODE_ENV=production
      - SERVICE_NAME={service_name}
      - SERVICE_PORT={port}
      - MONGODB_URI=mongodb://mongodb:27017/{service_name.replace("-", "_")}
      - RABBITMQ_URI=amqp://rabbitmq:5672
      - LOG_LEVEL=info
    depends_on:
      - mongodb
      - rabbitmq
    networks:
      - restaurant-os-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:{port}/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  restaurant-os-network:
    external: true
'''

def generate_jest_config():
    return '''/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000
};
'''

def generate_rate_limiter():
    return '''import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    });
  }
});

export const rateLimiter = apiRateLimiter;
'''

def generate_env_example(service_name, port):
    return f'''# {service_name.replace("-", " ").title()} Environment Configuration

SERVICE_NAME={service_name}
SERVICE_PORT={port}
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/{service_name.replace("-", "_")}

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URI=amqp://localhost:5672

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
'''

def main():
    for service_name in SERVICES:
        port = PORTS.get(service_name, 4015)
        service_path = os.path.join(BASE_PATH, service_name)

        # Create directory structure
        os.makedirs(f"{service_path}/src/controllers", exist_ok=True)
        os.makedirs(f"{service_path}/src/middleware", exist_ok=True)
        os.makedirs(f"{service_path}/src/models", exist_ok=True)
        os.makedirs(f"{service_path}/src/routes", exist_ok=True)
        os.makedirs(f"{service_path}/src/schemas", exist_ok=True)
        os.makedirs(f"{service_path}/src/services", exist_ok=True)
        os.makedirs(f"{service_path}/src/utils", exist_ok=True)
        os.makedirs(f"{service_path}/tests", exist_ok=True)
        os.makedirs(f"{service_path}/docker", exist_ok=True)

        # Generate base files
        create_file(f"{service_path}/package.json", generate_package_json(service_name))
        create_file(f"{service_path}/tsconfig.json", generate_tsconfig(service_name))
        create_file(f"{service_path}/jest.config.js", generate_jest_config())
        create_file(f"{service_path}/.env.example", generate_env_example(service_name, port))

        # Generate utility files
        create_file(f"{service_path}/src/utils/logger.ts", generate_logger())
        create_file(f"{service_path}/src/utils/message-broker.ts", generate_message_broker())

        # Generate middleware files
        create_file(f"{service_path}/src/middleware/cors.ts", generate_cors())
        create_file(f"{service_path}/src/middleware/error-handler.ts", generate_error_handler())
        create_file(f"{service_path}/src/middleware/rate-limiter.ts", generate_rate_limiter())

        # Generate docker files
        create_file(f"{service_path}/docker/Dockerfile", generate_dockerfile(port))
        create_file(f"{service_path}/docker/docker-compose.yml", generate_docker_compose(service_name, port))

        # Generate index
        create_file(f"{service_path}/src/index.ts", generate_index(port, service_name))

        print(f"Generated {service_name}")

if __name__ == "__main__":
    main()
