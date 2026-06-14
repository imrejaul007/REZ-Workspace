import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PricingEngine, MenuItem, WeatherData, PriceCalculation } from '../services/PricingEngine';

const router = Router();
const pricingEngine = new PricingEngine();

// Validation schemas
const CalculatePriceSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  category: z.string(),
  basePrice: z.number().positive(),
  popularityScore: z.number().min(0).max(100).optional().default(50),
  preparationTime: z.number().optional().default(15),
  ingredients: z.array(z.string()).optional().default([]),
  date: z.string().datetime().optional(),
  weather: z
    .object({
      condition: z.enum(['sunny', 'cloudy', 'rainy', 'stormy', 'snowy']),
      temperature: z.number().min(-50).max(60),
      humidity: z.number().min(0).max(100).optional().default(50),
    })
    .optional(),
  demandLevel: z
    .object({
      level: z.enum(['low', 'medium', 'high', 'critical']),
      multiplier: z.number().min(0.5).max(2),
    })
    .optional()
    .default({ level: 'medium', multiplier: 1.0 }),
});

const BatchPricingSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      basePrice: z.number().positive(),
      popularityScore: z.number().min(0).max(100).optional().default(50),
      preparationTime: z.number().optional().default(15),
      ingredients: z.array(z.string()).optional().default([]),
      calories: z.number().optional(),
    })
  ),
  date: z.string().datetime().optional(),
  weather: z
    .object({
      condition: z.enum(['sunny', 'cloudy', 'rainy', 'stormy', 'snowy']),
      temperature: z.number().min(-50).max(60),
      humidity: z.number().min(0).max(100).optional().default(50),
    })
    .optional(),
  demandLevel: z
    .object({
      level: z.enum(['low', 'medium', 'high', 'critical']),
      multiplier: z.number().min(0.5).max(2),
    })
    .optional()
    .default({ level: 'medium', multiplier: 1.0 }),
});

const CompetitorPriceSchema = z.object({
  competitorId: z.string(),
  price: z.number().positive(),
});

// Calculate price for a single item
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const validated = CalculatePriceSchema.parse(req.body);

    const menuItem: MenuItem = {
      id: validated.itemId,
      name: validated.itemName,
      category: validated.category,
      basePrice: validated.basePrice,
      popularityScore: validated.popularityScore,
      preparationTime: validated.preparationTime,
      ingredients: validated.ingredients,
      calories: validated.calories,
    };

    const date = validated.date ? new Date(validated.date) : new Date();
    const weather: WeatherData | undefined = validated.weather
      ? {
          condition: validated.weather.condition,
          temperature: validated.weather.temperature,
          humidity: validated.weather.humidity,
        }
      : undefined;

    const result = pricingEngine.calculatePrice(menuItem, date, weather, validated.demandLevel);

    res.json({
      success: true,
      data: {
        itemId: menuItem.id,
        itemName: menuItem.name,
        pricing: result,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to calculate price',
      });
    }
  }
});

// Batch pricing for multiple items
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const validated = BatchPricingSchema.parse(req.body);

    const menuItems: MenuItem[] = validated.items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      basePrice: item.basePrice,
      popularityScore: item.popularityScore,
      preparationTime: item.preparationTime,
      ingredients: item.ingredients,
      calories: item.calories,
    }));

    const date = validated.date ? new Date(validated.date) : new Date();
    const weather: WeatherData | undefined = validated.weather
      ? {
          condition: validated.weather.condition,
          temperature: validated.weather.temperature,
          humidity: validated.weather.humidity,
        }
      : undefined;

    const pricingMap = pricingEngine.generateMenuPricing(
      menuItems,
      date,
      weather,
      validated.demandLevel
    );

    const pricingResults: Record<string, PriceCalculation> = {};
    pricingMap.forEach((value, key) => {
      pricingResults[key] = value;
    });

    // Calculate summary
    const summary = {
      totalOriginalPrice: menuItems.reduce((sum, item) => sum + item.basePrice, 0),
      totalDynamicPrice: Array.from(pricingMap.values()).reduce(
        (sum, calc) => sum + calc.finalPrice,
        0
      ),
      averageIncrease:
        menuItems.length > 0
          ? (Array.from(pricingMap.values()).reduce((sum, calc) => sum + (calc.finalPrice - calc.originalPrice), 0) /
              menuItems.length)
          : 0,
      peakHourItems: Array.from(pricingMap.values()).filter(
        (calc) => calc.appliedMultipliers.peakHour > 1
      ).length,
    };

    res.json({
      success: true,
      data: {
        pricing: pricingResults,
        summary,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to calculate batch prices',
      });
    }
  }
});

// Set competitor price
router.post('/competitor', async (req: Request, res: Response) => {
  try {
    const validated = CompetitorPriceSchema.parse(req.body);
    pricingEngine.setCompetitorPrice(validated.competitorId, validated.price);

    res.json({
      success: true,
      message: `Competitor ${validated.competitorId} price set to ${validated.price}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to set competitor price',
      });
    }
  }
});

// Analyze competitor pricing
router.post('/competitor/analyze', async (req: Request, res: Response) => {
  try {
    const { itemId, itemName, category, basePrice, popularityScore, preparationTime, ingredients } = req.body;

    const menuItem: MenuItem = {
      id: itemId || 'analyzed-item',
      name: itemName || 'Unknown Item',
      category: category || 'general',
      basePrice: basePrice || 0,
      popularityScore: popularityScore || 50,
      preparationTime: preparationTime || 15,
      ingredients: ingredients || [],
    };

    const analysis = pricingEngine.analyzeCompetitorPricing(menuItem);

    res.json({
      success: true,
      data: {
        item: menuItem,
        analysis,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze competitor pricing',
    });
  }
});

// Get pricing strategy
router.get('/strategy', async (req: Request, res: Response) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const weather: WeatherData | undefined = req.query.weatherCondition
      ? {
          condition: req.query.weatherCondition as WeatherData['condition'],
          temperature: parseInt(req.query.temperature as string) || 25,
          humidity: parseInt(req.query.humidity as string) || 50,
        }
      : undefined;

    const strategy = pricingEngine.getPricingStrategy(date, weather);

    res.json({
      success: true,
      data: {
        date: date.toISOString(),
        weather,
        strategy,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get pricing strategy',
    });
  }
});

// Calculate off-peak discount
router.post('/off-peak-discount', async (req: Request, res: Response) => {
  try {
    const { itemId, itemName, category, basePrice, popularityScore, preparationTime, ingredients } = req.body;
    const targetMargin = parseFloat(req.query.targetMargin as string) || 0.2;

    const menuItem: MenuItem = {
      id: itemId || 'discount-item',
      name: itemName || 'Unknown Item',
      category: category || 'general',
      basePrice: basePrice || 0,
      popularityScore: popularityScore || 50,
      preparationTime: preparationTime || 15,
      ingredients: ingredients || [],
    };

    const discount = pricingEngine.calculateOffPeakDiscount(menuItem, targetMargin);
    const isOffPeak = discount > 0;

    res.json({
      success: true,
      data: {
        item: menuItem,
        discount,
        isOffPeak,
        suggestedDiscountPercent: discount > 0 ? Math.round((discount / menuItem.basePrice) * 100 * 100) / 100 : 0,
        message: isOffPeak
          ? `Offer Rs. ${discount} discount to boost off-peak sales`
          : 'Currently in peak hours - no discount recommended',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate off-peak discount',
    });
  }
});

export default router;
