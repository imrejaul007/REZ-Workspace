import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { EmailService } from './services/email.service';
import { VerificationService } from './services/verification.service';
import { SecureTokenService } from './secure-token.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required. Set it in your .env file.');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN') || '15m',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    TokenBlacklistService,
    EmailService,
    VerificationService,
    SecureTokenService,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    TokenBlacklistService,
    EmailService,
    VerificationService,
    JwtModule,
  ],
})
export class AuthModule {}
