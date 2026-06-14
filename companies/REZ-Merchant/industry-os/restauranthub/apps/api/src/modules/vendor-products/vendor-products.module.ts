import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { VendorProductsController } from './vendor-products.controller';
import { VendorProductsService } from './vendor-products.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VendorProductsController],
  providers: [VendorProductsService],
  exports: [VendorProductsService],
})
export class VendorProductsModule {}
