import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecipeService } from './recipe.service';
import {
  CreateRecipeSchema,
  UpdateRecipeSchema,
  CreateRecipeInput,
  UpdateRecipeInput,
} from './recipe.model';

/**
 * Recipe Controller
 *
 * REST endpoints for recipe management:
 * - CRUD operations for recipes
 * - Ingredient requirement calculations
 * - Inventory checks
 * - Low stock alerts
 * - Substitute suggestions
 */
@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  // ==========================================
  // RECIPE CRUD
  // ==========================================

  /**
   * Get recipe for a specific menu item
   */
  @Get('menu-item/:menuItemId')
  async getRecipeByMenuItem(@Param('menuItemId') menuItemId: string) {
    const recipe = await this.recipeService.getRecipe(menuItemId);
    if (!recipe) {
      return { success: true, recipe: null, message: 'No recipe found for this menu item' };
    }
    return { success: true, recipe };
  }

  /**
   * Get recipe by ID
   */
  @Get(':recipeId')
  async getRecipeById(@Param('recipeId') recipeId: string) {
    const recipe = await this.recipeService.getRecipeById(recipeId);
    if (!recipe) {
      return { success: false, error: 'Recipe not found' };
    }
    return { success: true, recipe };
  }

  /**
   * Get all recipes for a restaurant
   */
  @Get('restaurant/:restaurantId')
  async getRecipesForRestaurant(@Param('restaurantId') restaurantId: string) {
    const recipes = await this.recipeService.getRecipesForRestaurant(restaurantId);
    return {
      success: true,
      recipes,
      count: recipes.length,
    };
  }

  /**
   * Create a new recipe
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRecipe(
    @Body() createRecipeDto: CreateRecipeInput & { restaurantId: string }
  ) {
    const validated = CreateRecipeSchema.parse(createRecipeDto);
    const recipe = await this.recipeService.createRecipe(validated.restaurantId, validated);
    return {
      success: true,
      recipe,
    };
  }

  /**
   * Update an existing recipe
   */
  @Put(':recipeId')
  async updateRecipe(
    @Param('recipeId') recipeId: string,
    @Body() updateRecipeDto: UpdateRecipeInput & { restaurantId: string }
  ) {
    const validated = UpdateRecipeSchema.parse(updateRecipeDto);
    const recipe = await this.recipeService.updateRecipe(
      recipeId,
      validated.restaurantId,
      validated
    );
    return {
      success: true,
      recipe,
    };
  }

  /**
   * Delete a recipe (soft delete)
   */
  @Delete(':recipeId')
  @HttpCode(HttpStatus.OK)
  async deleteRecipe(
    @Param('recipeId') recipeId: string,
    @Query('restaurantId') restaurantId: string
  ) {
    await this.recipeService.deleteRecipe(recipeId, restaurantId);
    return {
      success: true,
      message: 'Recipe deleted successfully',
    };
  }

  // ==========================================
  // INGREDIENT CALCULATIONS
  // ==========================================

  /**
   * Calculate ingredient requirements for order items
   */
  @Post('calculate-requirements')
  @HttpCode(HttpStatus.OK)
  async calculateRequirements(
    @Body()
    body: {
      orderId?: string;
      orderNumber?: string;
      items: Array<{ menuItemId: string; quantity: number; menuItemName?: string }>;
    }
  ) {
    const result = await this.recipeService.calculateIngredientRequirements(body.items, body.orderId, body.orderNumber);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Check inventory availability for an order
   */
  @Post('check-inventory')
  @HttpCode(HttpStatus.OK)
  async checkInventory(
    @Body()
    body: {
      restaurantId: string;
      orderId?: string;
      orderNumber?: string;
      items: Array<{ menuItemId: string; quantity: number }>;
    }
  ) {
    const result = await this.recipeService.checkInventoryForOrder(
      body.items,
      body.restaurantId,
      body.orderId,
      body.orderNumber
    );
    return {
      success: true,
      ...result,
    };
  }

  // ==========================================
  // LOW STOCK MANAGEMENT
  // ==========================================

  /**
   * Get recipes with low ingredient stock
   */
  @Get('low-stock/:restaurantId')
  async getLowStockRecipes(
    @Param('restaurantId') restaurantId: string,
    @Query('minStockPercentage') minStockPercentage?: string,
    @Query('limit') limit?: string
  ) {
    const result = await this.recipeService.getLowStockRecipes(restaurantId, {
      minStockPercentage: minStockPercentage ? parseInt(minStockPercentage, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return {
      success: true,
      recipes: result,
      count: result.length,
    };
  }

  /**
   * Get ingredient substitutes
   */
  @Get('substitutes/:ingredientId')
  async getSubstitutes(
    @Param('ingredientId') ingredientId: string,
    @Query('restaurantId') restaurantId: string
  ) {
    const substitutes = await this.recipeService.getIngredientSubstitutes(ingredientId, restaurantId);
    return {
      success: true,
      substitutes,
    };
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  /**
   * Get recipe statistics for a restaurant
   */
  @Get('stats/:restaurantId')
  async getRecipeStats(@Param('restaurantId') restaurantId: string) {
    const stats = await this.recipeService.getRecipeStats(restaurantId);
    return {
      success: true,
      stats,
    };
  }
}
