import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Recipe,
  RecipeIngredient,
  OrderItem,
  IngredientRequirement,
  IngredientRequirementResult,
  InventoryCheckResult,
  IngredientStockCheck,
  LowStockRecipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  IngredientSubstitute,
  IngredientUnit,
  areUnitsCompatible,
  convertUnit,
} from './recipe.model';

/**
 * Custom error class for recipe-related operations
 */
export class RecipeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'RecipeError';
  }
}

/**
 * Service for managing recipes and calculating ingredient requirements
 *
 * This service handles:
 * - Recipe CRUD operations
 * - Ingredient requirement calculations for orders
 * - Inventory availability checks
 * - Low stock recipe identification
 */
@Injectable()
export class RecipeService {
  private readonly logger = new Logger(RecipeService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Recipe CRUD Operations
  // ============================================================

  /**
   * Get recipe for a specific menu item
   */
  async getRecipe(menuItemId: string): Promise<Recipe | null> {
    this.logger.debug(`Fetching recipe for menu item: ${menuItemId}`);

    const recipe = await this.prisma.recipe.findUnique({
      where: { menuItemId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
            restaurantId: true,
          },
        },
      },
    });

    if (!recipe) {
      return null;
    }

    return this.mapRecipeFromDb(recipe);
  }

  /**
   * Get recipe by recipe ID
   */
  async getRecipeById(recipeId: string): Promise<Recipe | null> {
    this.logger.debug(`Fetching recipe: ${recipeId}`);

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
            restaurantId: true,
          },
        },
      },
    });

    if (!recipe) {
      return null;
    }

    return this.mapRecipeFromDb(recipe);
  }

  /**
   * Get all recipes for a restaurant
   */
  async getRecipesForRestaurant(restaurantId: string): Promise<Recipe[]> {
    this.logger.debug(`Fetching all recipes for restaurant: ${restaurantId}`);

    const recipes = await this.prisma.recipe.findMany({
      where: {
        menuItem: {
          restaurantId,
        },
        isActive: true,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
            restaurantId: true,
          },
        },
      },
    });

    return recipes.map((r) => this.mapRecipeFromDb(r));
  }

  /**
   * Create or update a recipe for a menu item
   */
  async createRecipe(restaurantId: string, input: CreateRecipeInput): Promise<Recipe> {
    this.logger.log(`Creating recipe for menu item: ${input.menuItemId}`);

    // Validate menu item exists and belongs to restaurant
    const menuItem = await this.prisma.menuItem.findFirst({
      where: {
        id: input.menuItemId,
        restaurantId,
      },
    });

    if (!menuItem) {
      throw new NotFoundException(
        `Menu item ${input.menuItemId} not found in restaurant ${restaurantId}`,
      );
    }

    // Check if recipe already exists
    const existingRecipe = await this.prisma.recipe.findUnique({
      where: { menuItemId: input.menuItemId },
    });

    if (existingRecipe) {
      throw new ConflictException(
        `Recipe already exists for menu item ${input.menuItemId}. Use update instead.`,
      );
    }

    // Validate all ingredients exist
    const ingredientIds = input.ingredients.map((i) => i.ingredientId);
    const existingIngredients = await this.prisma.product.findMany({
      where: {
        id: { in: ingredientIds },
        restaurantId,
      },
    });

    if (existingIngredients.length !== ingredientIds.length) {
      const foundIds = new Set(existingIngredients.map((i) => i.id));
      const missingIds = ingredientIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Ingredients not found: ${missingIds.join(', ')}`,
      );
    }

    // Create recipe with ingredients
    const recipe = await this.prisma.recipe.create({
      data: {
        menuItemId: input.menuItemId,
        prepTime: input.prepTime,
        cookTime: input.cookTime,
        station: input.station,
        ingredients: {
          create: input.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit as string,
            wastagePercentage: ing.wastagePercentage,
          })),
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
            restaurantId: true,
          },
        },
      },
    });

    this.logger.log(`Recipe created: ${recipe.id} for menu item: ${input.menuItemId}`);
    return this.mapRecipeFromDb(recipe);
  }

  /**
   * Update an existing recipe
   */
  async updateRecipe(
    recipeId: string,
    restaurantId: string,
    input: UpdateRecipeInput,
  ): Promise<Recipe> {
    this.logger.log(`Updating recipe: ${recipeId}`);

    // Get existing recipe with ownership check
    const existingRecipe = await this.prisma.recipe.findFirst({
      where: {
        id: recipeId,
        menuItem: {
          restaurantId,
        },
      },
      include: {
        ingredients: true,
        menuItem: true,
      },
    });

    if (!existingRecipe) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }

    // Build update data
    const updateData: {
      prepTime?: number;
      cookTime?: number;
      station?: string;
      isActive?: boolean;
      version?: number;
      ingredients?: {
        deleteMany: { recipeId: string };
        create: Array<{
          ingredientId: string;
          quantity: number;
          unit: string;
          wastagePercentage: number;
        }>;
      };
    } = {
      version: existingRecipe.version + 1,
    };

    if (input.prepTime !== undefined) updateData.prepTime = input.prepTime;
    if (input.cookTime !== undefined) updateData.cookTime = input.cookTime;
    if (input.station !== undefined) updateData.station = input.station;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    // Update ingredients if provided
    if (input.ingredients !== undefined) {
      // Validate ingredients
      if (input.ingredients.length > 0) {
        const ingredientIds = input.ingredients.map((i) => i.ingredientId);
        const existingIngredients = await this.prisma.product.findMany({
          where: {
            id: { in: ingredientIds },
            restaurantId,
          },
        });

        if (existingIngredients.length !== ingredientIds.length) {
          throw new BadRequestException('Some ingredients are invalid');
        }
      }

      updateData.ingredients = {
        deleteMany: { recipeId },
        create: input.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit as string,
          wastagePercentage: ing.wastagePercentage,
        })),
      };
    }

    const updatedRecipe = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: updateData,
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
            restaurantId: true,
          },
        },
      },
    });

    this.logger.log(`Recipe updated: ${recipeId}, version: ${updatedRecipe.version}`);
    return this.mapRecipeFromDb(updatedRecipe);
  }

  /**
   * Delete a recipe (soft delete by setting inactive)
   */
  async deleteRecipe(recipeId: string, restaurantId: string): Promise<void> {
    this.logger.log(`Deleting recipe: ${recipeId}`);

    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id: recipeId,
        menuItem: {
          restaurantId,
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }

    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { isActive: false },
    });

    this.logger.log(`Recipe deleted (inactivated): ${recipeId}`);
  }

  // ============================================================
  // Ingredient Requirement Calculations
  // ============================================================

  /**
   * Calculate all ingredient requirements for order items
   *
   * This method:
   * 1. Fetches recipes for all menu items in the order
   * 2. Aggregates ingredient quantities
   * 3. Accounts for wastage percentages
   */
  async calculateIngredientRequirements(
    orderItems: OrderItem[],
    orderId?: string,
    orderNumber?: string,
  ): Promise<IngredientRequirementResult> {
    const requestId = orderId ?? Math.random().toString(36).substring(7);
    this.logger.debug(`[${requestId}] Calculating ingredient requirements for ${orderItems.length} items`);

    if (orderItems.length === 0) {
      return {
        orderId,
        orderNumber,
        requirements: [],
        totalIngredients: 0,
        calculatedAt: new Date(),
      };
    }

    // Fetch recipes for all menu items
    const menuItemIds = orderItems.map((item) => item.menuItemId);
    const recipes = await this.prisma.recipe.findMany({
      where: {
        menuItemId: { in: menuItemIds },
        isActive: true,
      },
      include: {
        ingredients: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                unit: true,
                stock: true,
                minStock: true,
              },
            },
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Map recipes by menu item ID for quick lookup
    const recipeMap = new Map(recipes.map((r) => [r.menuItemId, r]));

    // Check for menu items without recipes
    const missingRecipes = menuItemIds.filter((id) => !recipeMap.has(id));
    if (missingRecipes.length > 0) {
      this.logger.warn(
        `[${requestId}] No recipe found for menu items: ${missingRecipes.join(', ')}`,
      );
    }

    // Aggregate ingredient requirements
    const aggregatedRequirements = new Map<
      string,
      IngredientRequirement & { usedInItems: NonNullable<IngredientRequirement['usedInItems']> }
    >();

    for (const orderItem of orderItems) {
      const recipe = recipeMap.get(orderItem.menuItemId);
      if (!recipe) continue;

      for (const recipeIngredient of recipe.ingredients) {
        const { ingredient } = recipeIngredient;
        const menuItemName = recipe.menuItem?.name ?? orderItem.menuItemName ?? 'Unknown';

        // Calculate quantity needed including wastage
        const wastageMultiplier = 1 + (recipeIngredient.wastagePercentage / 100);
        const totalQuantity = recipeIngredient.quantity * orderItem.quantity * wastageMultiplier;
        const netQuantity = recipeIngredient.quantity * orderItem.quantity;

        if (aggregatedRequirements.has(ingredient.id)) {
          const existing = aggregatedRequirements.get(ingredient.id)!;
          existing.requiredQuantity += totalQuantity;
          existing.netQuantity += netQuantity;
          existing.wastageQuantity += totalQuantity - netQuantity;
          existing.usedInItems.push({
            menuItemId: recipe.menuItemId,
            menuItemName,
            quantity: orderItem.quantity,
            baseQuantity: recipeIngredient.quantity,
          });
        } else {
          aggregatedRequirements.set(ingredient.id, {
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            unit: ingredient.unit as IngredientUnit,
            requiredQuantity: totalQuantity,
            netQuantity,
            wastageQuantity: totalQuantity - netQuantity,
            wastagePercentage: recipeIngredient.wastagePercentage,
            usedInItems: [
              {
                menuItemId: recipe.menuItemId,
                menuItemName,
                quantity: orderItem.quantity,
                baseQuantity: recipeIngredient.quantity,
              },
            ],
          });
        }
      }
    }

    const requirements = Array.from(aggregatedRequirements.values());

    this.logger.debug(
      `[${requestId}] Calculated ${requirements.length} unique ingredients for order`,
    );

    return {
      orderId,
      orderNumber,
      requirements,
      totalIngredients: requirements.length,
      calculatedAt: new Date(),
    };
  }

  /**
   * Check if sufficient inventory exists for an order
   */
  async checkInventoryForOrder(
    orderItems: OrderItem[],
    restaurantId: string,
    orderId?: string,
    orderNumber?: string,
  ): Promise<InventoryCheckResult> {
    const requestId = orderId ?? Math.random().toString(36).substring(7);
    this.logger.debug(`[${requestId}] Checking inventory for order items`);

    // Get ingredient requirements
    const requirementsResult = await this.calculateIngredientRequirements(
      orderItems,
      orderId,
      orderNumber,
    );

    if (requirementsResult.requirements.length === 0) {
      return {
        canFulfill: true,
        orderId,
        orderNumber,
        checks: [],
        lowStockAlerts: [],
        insufficientItems: [],
        allItemsAvailable: true,
        checkedAt: new Date(),
      };
    }

    // Get current stock levels for all required ingredients
    const ingredientIds = requirementsResult.requirements.map((r) => r.ingredientId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: ingredientIds },
        restaurantId,
      },
      select: {
        id: true,
        name: true,
        unit: true,
        stock: true,
        minStock: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check each ingredient
    const checks: IngredientStockCheck[] = [];
    const lowStockAlerts: IngredientStockCheck[] = [];
    const insufficientItems: IngredientStockCheck[] = [];

    for (const requirement of requirementsResult.requirements) {
      const product = productMap.get(requirement.ingredientId);

      if (!product) {
        // Ingredient not found in inventory - treat as insufficient
        const check: IngredientStockCheck = {
          ingredientId: requirement.ingredientId,
          ingredientName: requirement.ingredientName,
          unit: requirement.unit,
          required: requirement.requiredQuantity,
          available: 0,
          shortage: requirement.requiredQuantity,
          isLowStock: true,
          minStock: 0,
        };
        checks.push(check);
        insufficientItems.push(check);
        continue;
      }

      const shortage = Math.max(0, requirement.requiredQuantity - product.stock);
      const isLowStock = product.minStock !== null && product.stock <= product.minStock;

      const check: IngredientStockCheck = {
        ingredientId: product.id,
        ingredientName: product.name,
        unit: product.unit as IngredientUnit,
        required: requirement.requiredQuantity,
        available: product.stock,
        shortage,
        isLowStock,
        minStock: product.minStock ?? undefined,
      };

      checks.push(check);

      if (shortage > 0) {
        insufficientItems.push(check);
      } else if (isLowStock) {
        lowStockAlerts.push(check);
      }
    }

    const canFulfill = insufficientItems.length === 0;
    const allItemsAvailable = insufficientItems.length === 0 && lowStockAlerts.length === 0;

    this.logger.debug(
      `[${requestId}] Inventory check result: canFulfill=${canFulfill}, insufficient=${insufficientItems.length}, lowStock=${lowStockAlerts.length}`,
    );

    return {
      canFulfill,
      orderId,
      orderNumber,
      checks,
      lowStockAlerts,
      insufficientItems,
      allItemsAvailable,
      checkedAt: new Date(),
    };
  }

  /**
   * Get recipes with low ingredient stock
   *
   * Identifies menu items that cannot be prepared due to low inventory
   */
  async getLowStockRecipes(
    restaurantId: string,
    options: {
      minStockPercentage?: number; // 0-100, consider low if below this percentage of minStock
      limit?: number;
    } = {},
  ): Promise<LowStockRecipe[]> {
    const { minStockPercentage = 100, limit = 50 } = options;
    this.logger.debug(`Fetching low stock recipes for restaurant: ${restaurantId}`);

    // Get all active recipes for the restaurant
    const recipes = await this.prisma.recipe.findMany({
      where: {
        isActive: true,
        menuItem: {
          restaurantId,
          isAvailable: true,
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                unit: true,
                stock: true,
                minStock: true,
              },
            },
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: limit,
    });

    const lowStockRecipes: LowStockRecipe[] = [];

    for (const recipe of recipes) {
      const affectedIngredients: LowStockRecipe['affectedIngredients'] = [];

      for (const recipeIngredient of recipe.ingredients) {
        const { ingredient } = recipeIngredient;
        const requiredForOneServing = recipeIngredient.quantity;
        const minStock = ingredient.minStock ?? 0;
        const currentStock = ingredient.stock;

        // Calculate max servings possible
        const maxServings =
          minStock > 0 ? Math.floor(currentStock / requiredForOneServing) : Infinity;

        // Determine stock percentage relative to minStock
        const stockPercentage = minStock > 0 ? (currentStock / minStock) * 100 : 100;

        // Ingredient is low if stock is at or below minStock threshold
        const isLowStock = stockPercentage <= minStockPercentage;

        if (isLowStock) {
          affectedIngredients.push({
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            currentStock,
            minStock,
            requiredForOneServing,
            maxServingsPossible: maxServings === Infinity ? 999 : maxServings,
            unit: ingredient.unit as IngredientUnit,
          });
        }
      }

      if (affectedIngredients.length > 0) {
        const lowestStockPercentage = Math.min(
          ...affectedIngredients.map((a) =>
            a.minStock > 0 ? (a.currentStock / a.minStock) * 100 : 100,
          ),
        );

        lowStockRecipes.push({
          recipeId: recipe.id,
          menuItemId: recipe.menuItemId,
          menuItemName: recipe.menuItem?.name ?? 'Unknown',
          affectedIngredients,
          lowestStockPercentage,
          shouldFlag: lowestStockPercentage <= 20, // Flag if below 20% of minStock
        });
      }
    }

    // Sort by lowest stock percentage
    lowStockRecipes.sort((a, b) => a.lowestStockPercentage - b.lowestStockPercentage);

    this.logger.debug(`Found ${lowStockRecipes.length} recipes with low stock`);
    return lowStockRecipes;
  }

  // ============================================================
  // Substitute Management
  // ============================================================

  /**
   * Get ingredient substitutes when an ingredient is low
   *
   * This method finds alternative ingredients that can be used
   * based on common culinary substitutions
   */
  async getIngredientSubstitutes(
    ingredientId: string,
    restaurantId: string,
  ): Promise<IngredientSubstitute[]> {
    this.logger.debug(`Finding substitutes for ingredient: ${ingredientId}`);

    // Get the original ingredient
    const originalIngredient = await this.prisma.product.findFirst({
      where: {
        id: ingredientId,
        restaurantId,
      },
    });

    if (!originalIngredient) {
      throw new NotFoundException(`Ingredient ${ingredientId} not found`);
    }

    // Common culinary substitutes mapping
    const substitutesMap: Record<string, Array<{ name: string; factor: number; notes?: string }>> = {
      // Proteins
      'chicken': [
        { name: 'paneer', factor: 1, notes: 'Vegetarian substitute, similar texture' },
        { name: 'tofu', factor: 1, notes: 'Vegan substitute, absorbs flavors well' },
        { name: 'turkey', factor: 1, notes: 'Leaner alternative' },
      ],
      'paneer': [
        { name: 'tofu', factor: 1, notes: 'Vegan substitute' },
        { name: 'cottage cheese', factor: 1, notes: 'Similar texture' },
      ],
      // Grains
      'rice': [
        { name: 'quinoa', factor: 1, notes: 'Higher protein alternative' },
        { name: 'couscous', factor: 1, notes: 'Quick-cooking alternative' },
      ],
      'wheat flour': [
        { name: 'almond flour', factor: 0.75, notes: 'Gluten-free, may need binding agents' },
        { name: 'oats flour', factor: 1, notes: 'Whole grain alternative' },
      ],
      // Dairy
      'milk': [
        { name: 'almond milk', factor: 1, notes: 'Dairy-free alternative' },
        { name: 'coconut milk', factor: 1, notes: 'Rich, dairy-free alternative' },
        { name: 'soy milk', factor: 1, notes: 'High protein dairy-free alternative' },
      ],
      'butter': [
        { name: 'ghee', factor: 0.85, notes: 'Clarified butter, higher smoke point' },
        { name: 'vegetable oil', factor: 0.8, notes: 'Dairy-free alternative' },
        { name: 'coconut oil', factor: 1, notes: 'Dairy-free alternative' },
      ],
      'cream': [
        { name: 'coconut cream', factor: 1, notes: 'Dairy-free alternative' },
        { name: 'cashew cream', factor: 1, notes: 'Rich, homemade alternative' },
      ],
      // Vegetables
      'onion': [
        { name: 'shallots', factor: 0.5, notes: 'Milder flavor, use less' },
        { name: 'leeks', factor: 0.75, notes: 'Similar allium flavor' },
      ],
      'tomato': [
        { name: 'canned tomatoes', factor: 1, notes: 'Year-round availability' },
        { name: 'tomato puree', factor: 0.5, notes: 'More concentrated, use less' },
      ],
    };

    // Find substitutes based on ingredient name
    const ingredientNameLower = originalIngredient.name.toLowerCase();
    const possibleSubstitutes = substitutesMap[ingredientNameLower] || [];

    // Also search for similar ingredients in the restaurant's inventory
    const similarIngredients = await this.prisma.product.findMany({
      where: {
        restaurantId,
        id: { not: ingredientId },
        categoryId: originalIngredient.categoryId, // Same category
        stock: { gt: 0 },
      },
      take: 5,
    });

    const substitutes: IngredientSubstitute[] = [];

    // Add mapped substitutes
    for (const sub of possibleSubstitutes) {
      const foundSub = similarIngredients.find(
        (s) => s.name.toLowerCase().includes(sub.name) || sub.name.includes(s.name.toLowerCase()),
      );

      if (foundSub) {
        substitutes.push({
          ingredientId: originalIngredient.id,
          ingredientName: originalIngredient.name,
          substituteId: foundSub.id,
          substituteName: foundSub.name,
          unit: foundSub.unit as IngredientUnit,
          conversionFactor: sub.factor,
          notes: sub.notes,
          isRecommended: true,
        });
      }
    }

    // Add similar ingredients as potential substitutes
    for (const similar of similarIngredients) {
      if (!substitutes.some((s) => s.substituteId === similar.id)) {
        substitutes.push({
          ingredientId: originalIngredient.id,
          ingredientName: originalIngredient.name,
          substituteId: similar.id,
          substituteName: similar.name,
          unit: similar.unit as IngredientUnit,
          conversionFactor: 1,
          isRecommended: false,
        });
      }
    }

    return substitutes;
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  /**
   * Map database recipe to TypeScript interface
   */
  private mapRecipeFromDb(recipe: {
    id: string;
    menuItemId: string;
    prepTime: number;
    cookTime: number;
    station: string;
    isActive: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    ingredients: Array<{
      id: string;
      recipeId: string;
      ingredientId: string;
      quantity: number;
      unit: string;
      wastagePercentage: number;
      ingredient: {
        id: string;
        name: string;
      };
    }>;
  }): Recipe {
    return {
      id: recipe.id,
      menuItemId: recipe.menuItemId,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      station: recipe.station as Recipe['station'],
      isActive: recipe.isActive,
      version: recipe.version,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      ingredients: recipe.ingredients.map((ing) => ({
        ingredientId: ing.ingredientId,
        ingredientName: ing.ingredient.name,
        quantity: ing.quantity,
        unit: ing.unit as RecipeIngredient['unit'],
        wastagePercentage: ing.wastagePercentage,
      })),
    };
  }

  /**
   * Get recipe statistics for a restaurant
   */
  async getRecipeStats(restaurantId: string): Promise<{
    totalRecipes: number;
    recipesByStation: Record<string, number>;
    avgPrepTime: number;
    avgCookTime: number;
    mostComplexRecipe: Recipe | null;
  }> {
    const recipes = await this.prisma.recipe.findMany({
      where: {
        isActive: true,
        menuItem: {
          restaurantId,
        },
      },
      include: {
        ingredients: true,
      },
    });

    if (recipes.length === 0) {
      return {
        totalRecipes: 0,
        recipesByStation: {},
        avgPrepTime: 0,
        avgCookTime: 0,
        mostComplexRecipe: null,
      };
    }

    const recipesByStation: Record<string, number> = {};
    let totalPrepTime = 0;
    let totalCookTime = 0;
    let maxIngredients = 0;
    let mostComplex: typeof recipes[0] | null = null;

    for (const recipe of recipes) {
      totalPrepTime += recipe.prepTime;
      totalCookTime += recipe.cookTime;
      recipesByStation[recipe.station] = (recipesByStation[recipe.station] || 0) + 1;

      if (recipe.ingredients.length > maxIngredients) {
        maxIngredients = recipe.ingredients.length;
        mostComplex = recipe;
      }
    }

    return {
      totalRecipes: recipes.length,
      recipesByStation,
      avgPrepTime: Math.round(totalPrepTime / recipes.length),
      avgCookTime: Math.round(totalCookTime / recipes.length),
      mostComplexRecipe: mostComplex
        ? this.mapRecipeFromDb({
            ...mostComplex,
            ingredients: mostComplex.ingredients.map((ing) => ({
              ...ing,
              ingredient: { id: ing.ingredientId, name: '' },
            })),
          })
        : null,
    };
  }
}
