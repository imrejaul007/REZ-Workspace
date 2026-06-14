import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsController } from './controllers/products.controller';
import { OrdersController } from './controllers/orders.controller';
import { CreditController } from './controllers/credit.controller';
import { ProductsService } from './services/products.service';
import { OrdersService } from './services/orders.service';
import { CreditService } from './services/credit.service';
import { PaymentService } from './services/payment.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProductsController,
    OrdersController,
    CreditController,
  ],
  providers: [
    ProductsService,
    OrdersService,
    CreditService,
    PaymentService,
  ],
  exports: [
    ProductsService,
    OrdersService,
    CreditService,
  ],
})
export class MarketplaceModule {}