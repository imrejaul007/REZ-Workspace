import { Module, forwardRef } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';

/**
 * Recipe Module
 *
 * Manages recipes and their connection to inventory:
 * - Create and manage recipes for menu items
 * - Calculate ingredient requirements for orders
 * - Check inventory availability before fulfillment
 * - Suggest ingredient substitutes
 *
 * Integrates with Inventory module for stock checks
 */
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => InventoryModule),
  ],
  controllers: [RecipeController],
  providers: [RecipeService],
  exports: [RecipeService],
})
export class RecipeModule {}
