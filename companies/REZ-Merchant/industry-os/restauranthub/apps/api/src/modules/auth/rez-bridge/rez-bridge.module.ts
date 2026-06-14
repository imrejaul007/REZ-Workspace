import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RezBridgeController } from './rez-bridge.controller';
import { RezMerchantStrategy } from './rez-merchant.strategy';

/**
 * RezBridgeModule
 *
 * Registers the REZ-to-RestoPapa identity bridge.
 * Import this module in AppModule alongside the existing AuthModule —
 * it does not modify or replace unknown existing auth behaviour.
 *
 * Exports:
 *   RezMerchantStrategy — so other modules can protect routes with
 *     @UseGuards(AuthGuard('rez-merchant')) if needed.
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule,
    // Re-use the same JWT setup as AuthModule so issued tokens are
    // compatible with the existing JwtStrategy / JwtAuthGuard.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RezBridgeController],
  providers: [RezMerchantStrategy],
  exports: [RezMerchantStrategy],
})
export class RezBridgeModule {}
