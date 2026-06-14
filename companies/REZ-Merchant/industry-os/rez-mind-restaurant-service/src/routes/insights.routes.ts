import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  RecommendationEngine,
  MenuItem,
  Customer,
  OrderedItem,
  Recommendation,
  ComboSuggestion,
  UpsellSuggestion,
} from '../services/RecommendationEngine';
import { DemandForecastService, HistoricalData } from '../services/DemandForecast';
import { CustomerInsightsService, Customer as CustomerInsightsCustomer } from '../services/CustomerInsights';

const router = Router();

// Initialize services
const recommendationEngine = new RecommendationEngine();
const demandForecastService = new DemandForecastService();
const customerInsightsService = new CustomerInsightsService();

// Validation schemas
const LoadMenuSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      subcategory: z.string().optional(),
      basePrice: z.number().positive(),
      calories: z.number().optional(),
      preparationTime: z.number().optional(),
      spiceLevel: z.enum(['mild', 'medium', 'hot', 'extraHot']).optional(),
      cuisineType: z.string(),
      isVegetarian: z.boolean().optional(),
      isVegan: z.boolean().optional(),
      isGlutenFree: z.boolean().optional(),
      tags: z.array(z.string()).optional().default([]),
      comboPairs: z.array(z.string()).optional(),
    })
  ),
});

const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  preferences: z.object({
    cuisineTypes: z.array(z.string()),
    spiceLevel: z.enum(['mild', 'medium', 'hot', 'extraHot']).optional(),
    portionPreference: z.enum(['small', 'regular', 'large']).optional(),
    priceRange: z.object({ min: z.number(), max: z.number() }).optional(),
    favoriteItems: z.array(z.string()).optional().default([]),
  }),
  dietaryRestrictions: z.array(z.string()).optional().default([]),
  averageOrderValue: z.number().optional().default(0),
  visitFrequency: z.number().optional().default(0),
  lastVisit: z.string().datetime().optional(),
});

const LoadHistoricalDataSchema = z.object({
  data: z.array(
    z.object({
      date: z.string().datetime(),
      hour: z.number().min(0).max(23),
      orders: z.number().min(0),
      revenue: z.number().min(0),
      avgOrderValue: z.number().min(0),
      peakHour: z.boolean(),
      weekend: z.boolean(),
    })
  ),
});

const ChurnPredictionSchema = z.object({
  customerId: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  joinDate: z.string().datetime(),
  totalOrders: z.number().min(0),
  totalSpent: z.number().min(0),
  averageOrderValue: z.number().min(0),
  lastOrderDate: z.string().datetime(),
  favoriteItems: z.array(z.string()).optional().default([]),
  dietaryPreferences: z.array(z.string()).optional().default([]),
  orderFrequency: z.number().min(0),
});

// ==================== MENU & RECOMMENDATIONS ====================

// Load menu items
router.post('/menu/load', async (req: Request, res: Response) => {
  try {
    const validated = LoadMenuSchema.parse(req.body);

    const menuItems: MenuItem[] = validated.items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      basePrice: item.basePrice,
      calories: item.calories,
      preparationTime: item.preparationTime || 15,
      spiceLevel: item.spiceLevel,
      cuisineType: item.cuisineType,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isGlutenFree: item.isGlutenFree,
      tags: item.tags,
      comboPairs: item.comboPairs,
    }));

    recommendationEngine.loadMenu(menuItems);

    res.json({
      success: true,
      message: `Loaded ${menuItems.length} menu items`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to load menu' });
    }
  }
});

// Get personalized recommendations
router.post('/recommendations/personalized', async (req: Request, res: Response) => {
  try {
    const { customer, limit } = req.body;

    const customerData: Customer = {
      id: customer.id,
      name: customer.name,
      preferences: {
        cuisineTypes: customer.preferences.cuisineTypes,
        spiceLevel: customer.preferences.spiceLevel || 'medium',
        portionPreference: customer.preferences.portionPreference || 'regular',
        priceRange: customer.preferences.priceRange || { min: 200, max: 1000 },
        favoriteItems: customer.preferences.favoriteItems || [],
      },
      dietaryRestrictions: customer.dietaryRestrictions || [],
      orderHistory: [],
      averageOrderValue: customer.averageOrderValue || 0,
      visitFrequency: customer.visitFrequency || 0,
      lastVisit: customer.lastVisit ? new Date(customer.lastVisit) : new Date(),
    };

    const recommendations = recommendationEngine.getPersonalizedRecommendations(customerData, limit || 5);

    res.json({
      success: true,
      data: {
        customerId: customer.id,
        recommendations,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
});

// Get combo suggestions
router.get('/combos', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const combos = recommendationEngine.getComboSuggestions(limit);

    res.json({
      success: true,
      data: {
        combos,
        total: combos.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get combo suggestions' });
  }
});

// Get upsell suggestions
router.post('/upsell', async (req: Request, res: Response) => {
  try {
    const { currentOrder } = req.body;

    const orderItems: OrderedItem[] = currentOrder.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price,
      modifiers: item.modifiers,
    }));

    const suggestions = recommendationEngine.getUpsellSuggestions(orderItems);

    res.json({
      success: true,
      data: {
        suggestions,
        total: suggestions.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get upsell suggestions' });
  }
});

// Get weather-based recommendations
router.get('/weather', async (req: Request, res: Response) => {
  try {
    const condition = (req.query.condition as unknown) || 'sunny';
    const temperature = parseInt(req.query.temperature as string) || 25;

    const recommendations = recommendationEngine.getWeatherBasedRecommendations(condition, temperature);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get weather recommendations' });
  }
});

// Get trending items
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const limit = parseInt(req.query.limit as string) || 10;

    const trending = recommendationEngine.getTrendingItems(hours, limit);

    res.json({
      success: true,
      data: {
        trending,
        timeframe: `${hours} hours`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get trending items' });
  }
});

// ==================== DEMAND FORECASTING ====================

// Load historical data
router.post('/forecast/history', async (req: Request, res: Response) => {
  try {
    const validated = LoadHistoricalDataSchema.parse(req.body);

    const historicalData: HistoricalData[] = validated.data.map((item) => ({
      date: new Date(item.date),
      hour: item.hour,
      orders: item.orders,
      revenue: item.revenue,
      avgOrderValue: item.avgOrderValue,
      peakHour: item.peakHour,
      weekend: item.weekend,
    }));

    demandForecastService.loadHistoricalData(historicalData);

    res.json({
      success: true,
      message: `Loaded ${historicalData.length} historical records`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to load historical data' });
    }
  }
});

// Get demand forecast
router.get('/forecast', async (req: Request, res: Response) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const forecast = demandForecastService.forecast(date);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate forecast' });
  }
});

// Get daily forecast
router.get('/forecast/daily', async (req: Request, res: Response) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const forecast = demandForecastService.forecastDay(date);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate daily forecast' });
  }
});

// Get weekly forecast
router.get('/forecast/weekly', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    const forecast = demandForecastService.forecastWeek(startDate);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate weekly forecast' });
  }
});

// Get forecast insights
router.get('/forecast/insights', async (req: Request, res: Response) => {
  try {
    const insights = demandForecastService.getInsightsSummary();

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get forecast insights' });
  }
});

// ==================== CUSTOMER INSIGHTS & CHURN ====================

// Load customers
router.post('/customers/load', async (req: Request, res: Response) => {
  try {
    const { customers } = req.body;

    const customersData: CustomerInsightsCustomer[] = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      joinDate: new Date(c.joinDate),
      totalOrders: c.totalOrders,
      totalSpent: c.totalSpent,
      averageOrderValue: c.averageOrderValue,
      lastOrderDate: new Date(c.lastOrderDate),
      favoriteItems: c.favoriteItems || [],
      dietaryPreferences: c.dietaryPreferences || [],
      orderFrequency: c.orderFrequency,
    }));

    customerInsightsService.loadCustomers(customersData);

    res.json({
      success: true,
      message: `Loaded ${customersData.length} customers`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load customers' });
  }
});

// Predict churn
router.post('/churn/predict', async (req: Request, res: Response) => {
  try {
    const validated = ChurnPredictionSchema.parse(req.body);

    // First load the customer
    const customer: CustomerInsightsCustomer = {
      id: validated.customerId,
      name: validated.name || 'Unknown',
      email: validated.email,
      phone: validated.phone,
      joinDate: new Date(validated.joinDate),
      totalOrders: validated.totalOrders,
      totalSpent: validated.totalSpent,
      averageOrderValue: validated.averageOrderValue,
      lastOrderDate: new Date(validated.lastOrderDate),
      favoriteItems: validated.favoriteItems,
      dietaryPreferences: validated.dietaryPreferences,
      orderFrequency: validated.orderFrequency,
    };

    customerInsightsService.loadCustomers([customer]);
    const prediction = customerInsightsService.predictChurn(validated.customerId);

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to predict churn' });
    }
  }
});

// Batch churn prediction
router.post('/churn/batch', async (req: Request, res: Response) => {
  try {
    const { customers } = req.body;

    const customersData: CustomerInsightsCustomer[] = customers.map((c) => ({
      id: c.id,
      name: c.name || 'Unknown',
      email: c.email,
      phone: c.phone,
      joinDate: new Date(c.joinDate),
      totalOrders: c.totalOrders,
      totalSpent: c.totalSpent,
      averageOrderValue: c.averageOrderValue,
      lastOrderDate: new Date(c.lastOrderDate),
      favoriteItems: c.favoriteItems || [],
      dietaryPreferences: c.dietaryPreferences || [],
      orderFrequency: c.orderFrequency,
    }));

    customerInsightsService.loadCustomers(customersData);
    const predictions = customerInsightsService.predictBatchChurn(customers.map((c) => c.id));

    // Summarize
    const summary = {
      total: predictions.length,
      critical: predictions.filter((p) => p.churnRisk === 'critical').length,
      high: predictions.filter((p) => p.churnRisk === 'high').length,
      medium: predictions.filter((p) => p.churnRisk === 'medium').length,
      low: predictions.filter((p) => p.churnRisk === 'low').length,
    };

    res.json({
      success: true,
      data: {
        predictions,
        summary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to batch predict churn' });
  }
});

// Get at-risk customers
router.get('/churn/at-risk', async (req: Request, res: Response) => {
  try {
    const threshold = (req.query.threshold as 'high' | 'critical') || 'high';
    const atRisk = customerInsightsService.getAtRiskCustomers(threshold);

    res.json({
      success: true,
      data: {
        customers: atRisk,
        count: atRisk.length,
        threshold,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get at-risk customers' });
  }
});

// Get customer LTV
router.post('/ltv', async (req: Request, res: Response) => {
  try {
    const { customerId, name, email, phone, joinDate, totalOrders, totalSpent, averageOrderValue, lastOrderDate, favoriteItems, dietaryPreferences, orderFrequency } = req.body;

    const customer: CustomerInsightsCustomer = {
      id: customerId,
      name: name || 'Unknown',
      email,
      phone,
      joinDate: new Date(joinDate),
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate: new Date(lastOrderDate),
      favoriteItems: favoriteItems || [],
      dietaryPreferences: dietaryPreferences || [],
      orderFrequency,
    };

    customerInsightsService.loadCustomers([customer]);
    const ltv = customerInsightsService.calculateLTV(customerId);

    res.json({
      success: true,
      data: ltv,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to calculate LTV' });
  }
});

// Get customer segments
router.get('/segments', async (req: Request, res: Response) => {
  try {
    const analysis = customerInsightsService.analyzeSegments();

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to analyze segments' });
  }
});

// Get behavior insights
router.post('/behavior', async (req: Request, res: Response) => {
  try {
    const { customerId, name, email, phone, joinDate, totalOrders, totalSpent, averageOrderValue, lastOrderDate, favoriteItems, dietaryPreferences, orderFrequency } = req.body;

    const customer: CustomerInsightsCustomer = {
      id: customerId,
      name: name || 'Unknown',
      email,
      phone,
      joinDate: new Date(joinDate),
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate: new Date(lastOrderDate),
      favoriteItems: favoriteItems || [],
      dietaryPreferences: dietaryPreferences || [],
      orderFrequency,
    };

    customerInsightsService.loadCustomers([customer]);
    const insights = customerInsightsService.getBehaviorInsights(customerId);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get behavior insights' });
  }
});

export default router;
