/**
 * REZ Go Product Intelligence Routes
 *
 * Get full product info:
 * - Ingredients
 * - Nutrition
 * - Health insights
 * - Tutorials
 * - Comparisons
 */

import { Router, Request, Response } from 'express';
import { ProductIntelligence } from '../models/ProductIntelligence.js';
import { GoProduct } from '../models/GoProduct.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/product-intelligence/:productId
 * Get full product intelligence
 */
router.get('/:productId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    // Get product
    const product = await GoProduct.findOne({ productId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get intelligence
    let intelligence = await ProductIntelligence.findOne({ productId });

    // If no intelligence exists, create mock data for demo
    if (!intelligence) {
      intelligence = await ProductIntelligence.create({
        productId,
        barcode: product.barcode,
        ...getMockIntelligence(product.name, product.category),
      });
    }

    res.json({
      success: true,
      product: {
        productId: product.productId,
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        mrp: product.mrp,
        imageUrl: product.imageUrl,
        weight: product.weight,
        weightUnit: product.weightUnit,
      },
      intelligence: {
        ingredients: intelligence.ingredients,
        ingredientsRaw: intelligence.ingredientsRaw,
        nutrition: intelligence.nutrition,
        allergens: intelligence.allergens,
        healthScore: intelligence.healthScore,
        healthInsights: intelligence.healthInsights,
        healthWarnings: intelligence.healthWarnings,
        tutorials: intelligence.tutorials,
        alternatives: intelligence.alternatives,
        howToUse: intelligence.howToUse,
        storageInstructions: intelligence.storageInstructions,
        shelfLife: intelligence.shelfLife,
        countryOfOrigin: intelligence.countryOfOrigin,
        avgRating: intelligence.avgRating,
        reviewCount: intelligence.reviewCount,
        topPros: intelligence.topPros,
        topCons: intelligence.topCons,
        aiSummary: intelligence.aiSummary,
        aiHighlights: intelligence.aiHighlights,
      },
    });
  } catch (error) {
    console.error('Product intelligence error:', error);
    res.status(500).json({ error: 'Failed to get product intelligence' });
  }
});

/**
 * GET /api/product-intelligence/barcode/:barcode
 * Get intelligence by barcode
 */
router.get('/barcode/:barcode', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;

    const product = await GoProduct.findOne({ barcode });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let intelligence = await ProductIntelligence.findOne({ productId: product.productId });

    if (!intelligence) {
      intelligence = await ProductIntelligence.create({
        productId: product.productId,
        barcode: product.barcode,
        ...getMockIntelligence(product.name, product.category),
      });
    }

    res.json({
      success: true,
      product: {
        productId: product.productId,
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        mrp: product.mrp,
      },
      intelligence,
    });
  } catch (error) {
    console.error('Barcode intelligence error:', error);
    res.status(500).json({ error: 'Failed to get intelligence' });
  }
});

/**
 * GET /api/product-intelligence/nutrition/:productId
 * Get nutrition info
 */
router.get('/nutrition/:productId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    let intelligence = await ProductIntelligence.findOne({ productId });

    if (!intelligence) {
      const product = await GoProduct.findOne({ productId });
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      intelligence = await ProductIntelligence.create({
        productId,
        barcode: product.barcode,
        ...getMockIntelligence(product.name, product.category),
      });
    }

    res.json({
      success: true,
      nutrition: intelligence.nutrition,
      servingSize: intelligence.servingSize,
    });
  } catch (error) {
    console.error('Nutrition error:', error);
    res.status(500).json({ error: 'Failed to get nutrition' });
  }
});

/**
 * GET /api/product-intelligence/health/:productId
 * Get health insights
 */
router.get('/health/:productId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    let intelligence = await ProductIntelligence.findOne({ productId });

    if (!intelligence) {
      const product = await GoProduct.findOne({ productId });
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      intelligence = await ProductIntelligence.create({
        productId,
        barcode: product.barcode,
        ...getMockIntelligence(product.name, product.category),
      });
    }

    res.json({
      success: true,
      healthScore: intelligence.healthScore,
      insights: intelligence.healthInsights,
      warnings: intelligence.healthWarnings,
      allergens: intelligence.allergens,
    });
  } catch (error) {
    console.error('Health insights error:', error);
    res.status(500).json({ error: 'Failed to get health insights' });
  }
});

/**
 * GET /api/product-intelligence/tutorials/:productId
 * Get tutorials
 */
router.get('/tutorials/:productId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    let intelligence = await ProductIntelligence.findOne({ productId });

    if (!intelligence) {
      const product = await GoProduct.findOne({ productId });
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      intelligence = await ProductIntelligence.create({
        productId,
        barcode: product.barcode,
        ...getMockIntelligence(product.name, product.category),
      });
    }

    res.json({
      success: true,
      tutorials: intelligence.tutorials,
    });
  } catch (error) {
    console.error('Tutorials error:', error);
    res.status(500).json({ error: 'Failed to get tutorials' });
  }
});

/**
 * GET /api/product-intelligence/compare
 * Compare products
 */
router.get('/compare', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { productIds } = req.query;

    if (!productIds) {
      return res.status(400).json({ error: 'productIds is required' });
    }

    const ids = (productIds as string).split(',');
    const products = await GoProduct.find({
      productId: { $in: ids },
    });

    const intelligence = await ProductIntelligence.find({
      productId: { $in: ids },
    });

    const productData = products.map((p) => {
      const intel = intelligence.find((i) => i.productId === p.productId);
      return {
        product: p,
        intelligence: intel || getMockIntelligence(p.name, p.category),
      };
    });

    res.json({
      success: true,
      products: productData,
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ error: 'Failed to compare products' });
  }
});

// Mock intelligence generator for demo
function getMockIntelligence(name: string, category?: string): Partial<any> {
  const isFood = category?.toLowerCase().includes('food') ||
                 category?.toLowerCase().includes('snack') ||
                 category?.toLowerCase().includes('dairy');

  const isHealth = category?.toLowerCase().includes('health') ||
                   name.toLowerCase().includes('vitamin') ||
                   name.toLowerCase().includes('protein');

  if (isFood) {
    return {
      ingredients: ['Water', 'Sugar', 'Salt', 'Natural Flavors'],
      ingredientsRaw: 'Water, Sugar, Salt, Natural Flavors, Artificial Colors',
      nutrition: {
        servingSize: '100g',
        calories: 150,
        protein: 2,
        carbs: 30,
        fat: 3,
        fiber: 1,
        sugar: 15,
        sodium: 200,
      },
      allergens: {
        contains: [],
        mayContain: ['Peanuts', 'Tree Nuts', 'Milk'],
        traces: [],
        dietary: {
          vegetarian: true,
          vegan: false,
          glutenFree: true,
          dairyFree: false,
          nutFree: false,
          halal: true,
          kosher: false,
          jain: false,
        },
      },
      healthScore: 65,
      healthInsights: [
        { type: 'info', category: 'sugar', message: 'Contains 15g sugar per serving', severity: 'medium' },
        { type: 'tip', category: 'nutrition', message: 'Good source of protein', severity: 'low' },
      ],
      healthWarnings: ['Contains artificial colors'],
      tutorials: [
        { type: 'recipe', title: '3 Easy Recipes', url: 'https://example.com/recipes', language: 'en' },
      ],
      howToUse: 'Consume as part of a balanced diet',
      storageInstructions: 'Store in cool, dry place',
      shelfLife: '6 months from manufacturing date',
      countryOfOrigin: 'India',
      avgRating: 4.2,
      reviewCount: 1250,
      topPros: ['Great taste', 'Fresh'],
      topCons: ['High sugar'],
      aiSummary: 'A popular snack with moderate nutritional value. Good for occasional consumption.',
      aiHighlights: ['Contains natural flavors', 'Source of quick energy'],
    };
  }

  if (isHealth) {
    return {
      nutrition: {
        servingSize: '1 tablet',
        calories: 5,
        protein: 0,
        carbs: 1,
        vitamins: { 'Vitamin D': 1000, 'Calcium': 500 },
      },
      allergens: {
        contains: [],
        mayContain: [],
        traces: [],
        dietary: {
          vegetarian: true,
          vegan: true,
          glutenFree: true,
          dairyFree: true,
          nutFree: true,
          halal: true,
          kosher: true,
          jain: true,
        },
      },
      healthScore: 95,
      healthInsights: [
        { type: 'info', category: 'health', message: 'Supports bone health', severity: 'low' },
        { type: 'tip', category: 'nutrition', message: 'Take with food for better absorption', severity: 'low' },
      ],
      howToUse: 'Take 1 tablet daily with food',
      storageInstructions: 'Store in a cool, dry place away from direct sunlight',
      shelfLife: '24 months',
      countryOfOrigin: 'India',
      manufacturer: 'PharmaCare Labs',
      avgRating: 4.7,
      reviewCount: 3420,
      topPros: ['Effective', 'No side effects', 'Good value'],
      topCons: [],
      aiSummary: 'A high-quality vitamin D3 supplement with excellent bioavailability.',
      aiHighlights: ['Supports immune system', 'Promotes bone health', 'Easy to swallow'],
    };
  }

  return {
    healthScore: 75,
    healthInsights: [],
    howToUse: 'Use as directed',
    storageInstructions: 'Store in a cool, dry place',
    avgRating: 4.0,
    reviewCount: 500,
    aiSummary: 'A quality product from a trusted brand.',
    aiHighlights: ['Trusted brand', 'Good quality'],
  };
}

export default router;
