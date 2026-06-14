import logger from './utils/logger';

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RABTULAuthService } from './rabtul-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RABTULAuthGuard } from './guards/rabtul-auth.guard';
import { RateLimitGuard } from '../security/rate-limit.guard';
import { PrismaService } from '../prisma/prisma.service';

// Validate JWT_SECRET at module initialization (for backward compatibility)
const validateJwtConfig = (configService: ConfigService) => {
  const JWT_SECRET = configService.get<string>('JWT_SECRET');
  if (!JWT_SECRET) {
    logger.warn('JWT_SECRET not set - using fallback for backward compatibility');
    return {
      secret: 'restopapa-fallback-secret-change-in-production',
      signOptions: {
        expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
      },
    };
  }
  if (JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET must be at least 32 characters long');
  }
  return {
    secret: JWT_SECRET,
    signOptions: {
      expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
    },
  };
};

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: validateJwtConfig,
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RABTULAuthService,
    JwtStrategy,
    LocalStrategy,
    RABTULAuthGuard,
    RateLimitGuard,
    PrismaService,
  ],
  exports: [AuthService, RABTULAuthService],
})
export class AuthModule {}
