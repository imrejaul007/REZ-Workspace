import logger from './utils/logger';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
// import { LoggerService } from './shared/logger.service';
// import { ServiceDiscoveryService } from './services/service-discovery.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security and performance
  app.use(helmet());
  app.use(compression());
  
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3000', // For development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // NOTE: No global prefix here — path handling is done in ApiProxyMiddleware
  // to ensure http-proxy-middleware sees the correct URL for upstream forwarding.

  // const logger = app.get(LoggerService);
  // app.useLogger(logger);

  // Initialize service discovery
  // const serviceDiscovery = app.get(ServiceDiscoveryService);
  // await serviceDiscovery.initialize();

  // Swagger for API Gateway
  const config = new DocumentBuilder()
    .setTitle('RestoPapa API Gateway')
    .setDescription('Unified API Gateway for all microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('gateway')
    .addTag('health')
    .addTag('metrics')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Health check
  app.use('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: [], // serviceDiscovery.getHealthyServices(),
    });
  });

  const port = process.env.API_GATEWAY_PORT || 3000;
  await app.listen(port);
  
  logger.info(`API Gateway is running on: http://localhost:${port}`);
  logger.info(`Health check: http://localhost:${port}/health`);
  logger.info(`API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();