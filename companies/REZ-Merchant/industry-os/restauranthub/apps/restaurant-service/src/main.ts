import logger from './utils/logger';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import helmet from 'helmet';
import { AppModule } from './app.module';
// import { LoggerService } from './shared/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Microservice setup
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379') || 6379,
      password: process.env.REDIS_PASSWORD,
      retryAttempts: 5,
      retryDelay: 3000,
    },
  });

  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  // const logger = app.get(LoggerService);
  // app.useLogger(logger);

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('RestoPapa Restaurant Service')
    .setDescription('Restaurant Management microservice API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('restaurants')
    .addTag('menus')
    .addTag('categories')
    .addTag('media')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Health check
  app.use('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'restaurant-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  await app.startAllMicroservices();
  
  const port = process.env.RESTAURANT_SERVICE_PORT || 3003;
  await app.listen(port);
  
  logger.info(`Restaurant Service is running on: http://localhost:${port}`);
}

bootstrap();