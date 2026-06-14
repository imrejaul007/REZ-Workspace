import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RezClientModule } from '@restopapa/rez-client';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [ConfigModule, RezClientModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
