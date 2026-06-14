import { Module } from '@nestjs/common';
import { MerchantLoansService } from './merchant-loans.service';
import { MerchantLoansController } from './merchant-loans.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Merchant Loans Module
 *
 * Connects POS data to RidZa merchant loans for credit scoring:
 * - Generate financial profiles from order data
 * - Calculate credit scores based on revenue patterns
 * - Provide loan recommendations
 * - Submit applications to RidZa
 */
@Module({
  imports: [PrismaModule],
  controllers: [MerchantLoansController],
  providers: [MerchantLoansService],
  exports: [MerchantLoansService],
})
export class MerchantLoansModule {}
