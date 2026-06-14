import type {
  Ingredient,
  Recipe,
  StockMovement,
  ForecastData,
  Alert,
  StockOverview,
  DemandFactor,
  RecommendedOrder,
} from '../types';

// Base API URL - in production, this would come from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Simulated delay for development
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock data for development
const mockIngredients: Ingredient[] = [
  {
    id: '1',
    name: 'All-Purpose Flour',
    category: 'Dry Goods',
    unit: 'kg',
    currentStock: 45,
    minimumStock: 20,
    maximumStock: 100,
    costPerUnit: 1.5,
    supplier: 'Sysco Foods',
    lastRestocked: '2024-02-15',
    expiryDays: 180,
    status: 'healthy',
  },
  {
    id: '2',
    name: 'Olive Oil',
    category: 'Oils',
    unit: 'L',
    currentStock: 8,
    minimumStock: 15,
    maximumStock: 50,
    costPerUnit: 12.5,
    supplier: 'Italian Imports',
    lastRestocked: '2024-02-10',
    expiryDays: 365,
    status: 'low',
  },
  {
    id: '3',
    name: 'Fresh Basil',
    category: 'Herbs',
    unit: 'bunch',
    currentStock: 2,
    minimumStock: 10,
    maximumStock: 30,
    costPerUnit: 3.25,
    supplier: 'Local Farm',
    lastRestocked: '2024-02-18',
    expiryDays: 5,
    status: 'critical',
  },
  {
    id: '4',
    name: 'Chicken Breast',
    category: 'Proteins',
    unit: 'kg',
    currentStock: 0,
    minimumStock: 25,
    maximumStock: 75,
    costPerUnit: 9.8,
    supplier: 'Premium Meats',
    lastRestocked: '2024-02-14',
    expiryDays: 3,
    status: 'out',
  },
  {
    id: '5',
    name: 'Parmesan Cheese',
    category: 'Dairy',
    unit: 'kg',
    currentStock: 12,
    minimumStock: 8,
    maximumStock: 25,
    costPerUnit: 22.0,
    supplier: 'Italian Imports',
    lastRestocked: '2024-02-17',
    expiryDays: 60,
    status: 'healthy',
  },
  {
    id: '6',
    name: 'San Marzano Tomatoes',
    category: 'Canned Goods',
    unit: 'case',
    currentStock: 5,
    minimumStock: 12,
    maximumStock: 40,
    costPerUnit: 45.0,
    supplier: 'Italian Imports',
    lastRestocked: '2024-02-12',
    expiryDays: 730,
    status: 'low',
  },
  {
    id: '7',
    name: 'Pasta (Spaghetti)',
    category: 'Dry Goods',
    unit: 'kg',
    currentStock: 35,
    minimumStock: 15,
    maximumStock: 80,
    costPerUnit: 2.8,
    supplier: 'Barilla',
    lastRestocked: '2024-02-16',
    expiryDays: 540,
    status: 'healthy',
  },
  {
    id: '8',
    name: 'Heavy Cream',
    category: 'Dairy',
    unit: 'L',
    currentStock: 4,
    minimumStock: 10,
    maximumStock: 30,
    costPerUnit: 6.5,
    supplier: 'Organic Dairy Co',
    lastRestocked: '2024-02-18',
    expiryDays: 14,
    status: 'low',
  },
];

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Classic Margherita Pizza',
    description: 'Traditional Italian pizza with tomato, mozzarella, and fresh basil',
    ingredients: [
      { ingredientId: '1', ingredientName: 'All-Purpose Flour', quantity: 0.25, unit: 'kg', cost: 0.38 },
      { ingredientId: '6', ingredientName: 'San Marzano Tomatoes', quantity: 0.15, unit: 'case', cost: 6.75 },
      { ingredientId: '5', ingredientName: 'Parmesan Cheese', quantity: 0.05, unit: 'kg', cost: 1.1 },
      { ingredientId: '3', ingredientName: 'Fresh Basil', quantity: 0.1, unit: 'bunch', cost: 0.33 },
    ],
    preparationTime: 25,
    sellingPrice: 18.0,
    foodCost: 8.56,
    margin: 52.4,
    popularity: 85,
    status: 'active',
  },
  {
    id: '2',
    name: 'Chicken Alfredo Pasta',
    description: 'Creamy pasta with grilled chicken and parmesan sauce',
    ingredients: [
      { ingredientId: '7', ingredientName: 'Pasta (Spaghetti)', quantity: 0.2, unit: 'kg', cost: 0.56 },
      { ingredientId: '4', ingredientName: 'Chicken Breast', quantity: 0.15, unit: 'kg', cost: 1.47 },
      { ingredientId: '8', ingredientName: 'Heavy Cream', quantity: 0.1, unit: 'L', cost: 0.65 },
      { ingredientId: '5', ingredientName: 'Parmesan Cheese', quantity: 0.04, unit: 'kg', cost: 0.88 },
    ],
    preparationTime: 30,
    sellingPrice: 22.5,
    foodCost: 3.56,
    margin: 84.2,
    popularity: 92,
    status: 'active',
  },
  {
    id: '3',
    name: 'Basil Pesto Bruschetta',
    description: 'Toasted bread topped with fresh basil pesto and tomatoes',
    ingredients: [
      { ingredientId: '1', ingredientName: 'All-Purpose Flour', quantity: 0.1, unit: 'kg', cost: 0.15 },
      { ingredientId: '2', ingredientName: 'Olive Oil', quantity: 0.02, unit: 'L', cost: 0.25 },
      { ingredientId: '3', ingredientName: 'Fresh Basil', quantity: 0.15, unit: 'bunch', cost: 0.49 },
      { ingredientId: '5', ingredientName: 'Parmesan Cheese', quantity: 0.03, unit: 'kg', cost: 0.66 },
    ],
    preparationTime: 15,
    sellingPrice: 9.5,
    foodCost: 1.55,
    margin: 83.7,
    popularity: 78,
    status: 'active',
  },
];

const mockMovements: StockMovement[] = [
  {
    id: '1',
    ingredientId: '1',
    ingredientName: 'All-Purpose Flour',
    type: 'in',
    quantity: 50,
    date: '2024-02-20T10:30:00Z',
    reason: 'Weekly delivery from Sysco Foods',
    user: 'John Manager',
    cost: 75.0,
  },
  {
    id: '2',
    ingredientId: '4',
    ingredientName: 'Chicken Breast',
    type: 'out',
    quantity: 15,
    date: '2024-02-20T12:45:00Z',
    reason: 'Used for lunch service',
    user: 'Chef Maria',
    cost: 147.0,
  },
  {
    id: '3',
    ingredientId: '3',
    ingredientName: 'Fresh Basil',
    type: 'waste',
    quantity: 2,
    date: '2024-02-20T14:00:00Z',
    reason: 'Expired product',
    user: 'Chef Maria',
    cost: 6.5,
  },
  {
    id: '4',
    ingredientId: '5',
    ingredientName: 'Parmesan Cheese',
    type: 'out',
    quantity: 3,
    date: '2024-02-20T18:30:00Z',
    reason: 'Used for dinner service',
    user: 'Chef Antonio',
    cost: 66.0,
  },
  {
    id: '5',
    ingredientId: '8',
    ingredientName: 'Heavy Cream',
    type: 'adjustment',
    quantity: -1,
    date: '2024-02-20T16:15:00Z',
    reason: 'Inventory correction - spillage',
    user: 'John Manager',
    cost: 6.5,
  },
  {
    id: '6',
    ingredientId: '6',
    ingredientName: 'San Marzano Tomatoes',
    type: 'out',
    quantity: 4,
    date: '2024-02-19T20:00:00Z',
    reason: 'Used for prep',
    user: 'Chef Maria',
    cost: 180.0,
  },
];

const mockAlerts: Alert[] = [
  {
    id: '1',
    ingredientId: '4',
    ingredientName: 'Chicken Breast',
    type: 'out_of_stock',
    message: 'Chicken Breast is completely out of stock. Immediate reorder required.',
    priority: 'high',
    createdAt: '2024-02-20T08:00:00Z',
    status: 'active',
  },
  {
    id: '2',
    ingredientId: '3',
    ingredientName: 'Fresh Basil',
    type: 'critical_stock',
    message: 'Fresh Basil is critically low (2 units, minimum: 10). Expiring in 5 days.',
    priority: 'high',
    createdAt: '2024-02-20T06:00:00Z',
    status: 'active',
  },
  {
    id: '3',
    ingredientId: '2',
    ingredientName: 'Olive Oil',
    type: 'low_stock',
    message: 'Olive Oil is running low (8L, minimum: 15L). Consider reordering soon.',
    priority: 'medium',
    createdAt: '2024-02-19T22:00:00Z',
    status: 'active',
  },
  {
    id: '4',
    ingredientId: '8',
    ingredientName: 'Heavy Cream',
    type: 'expiring_soon',
    message: 'Heavy Cream expires in 14 days. Use in high-margin dishes.',
    priority: 'medium',
    createdAt: '2024-02-18T20:00:00Z',
    status: 'snoozed',
    snoozedUntil: '2024-02-21T20:00:00Z',
  },
  {
    id: '5',
    ingredientId: '6',
    ingredientName: 'San Marzano Tomatoes',
    type: 'low_stock',
    message: 'San Marzano Tomatoes are low (5 cases, minimum: 12).',
    priority: 'medium',
    createdAt: '2024-02-20T10:00:00Z',
    status: 'active',
  },
];

// Generate forecast data for next 7 days
const generateForecastData = (): ForecastData[] => {
  const baseDemand = 150;
  const data: ForecastData[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();

    // Weekend boost
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1;
    // Random variation
    const variation = 0.9 + Math.random() * 0.2;

    const predicted = Math.round(baseDemand * weekendMultiplier * variation);
    const uncertainty = 0.1 + (i * 0.02); // Uncertainty grows over time
    const confidence = Math.max(0.7, 0.98 - uncertainty);

    data.push({
      date: date.toISOString().split('T')[0],
      predicted,
      lowerBound: Math.round(predicted * (1 - uncertainty)),
      upperBound: Math.round(predicted * (1 + uncertainty)),
      confidence: Math.round(confidence * 100),
    });
  }

  return data;
};

const mockDemandFactors: DemandFactor[] = [
  { name: 'Weekend Traffic', impact: 'positive', description: 'Expected 30% higher traffic on Saturday/Sunday', weight: 0.3 },
  { name: 'Weather (Rain)', impact: 'negative', description: 'Rain expected, may reduce walk-in customers', weight: -0.15 },
  { name: 'Local Event', impact: 'positive', description: 'Food festival nearby on Saturday', weight: 0.25 },
  { name: 'Seasonal Menu', impact: 'positive', description: 'Spring menu launching this week', weight: 0.2 },
];

const mockRecommendations: RecommendedOrder[] = [
  { ingredientId: '4', ingredientName: 'Chicken Breast', currentStock: 0, recommendedQuantity: 50, urgency: 'high', reason: 'Out of stock', estimatedCost: 490.0 },
  { ingredientId: '3', ingredientName: 'Fresh Basil', currentStock: 2, recommendedQuantity: 20, urgency: 'high', reason: 'Critical level, expiring soon', estimatedCost: 65.0 },
  { ingredientId: '2', ingredientName: 'Olive Oil', currentStock: 8, recommendedQuantity: 30, urgency: 'medium', reason: 'Below minimum threshold', estimatedCost: 375.0 },
  { ingredientId: '8', ingredientName: 'Heavy Cream', currentStock: 4, recommendedQuantity: 15, urgency: 'medium', reason: 'Below minimum threshold', estimatedCost: 97.5 },
  { ingredientId: '6', ingredientName: 'San Marzano Tomatoes', currentStock: 5, recommendedQuantity: 20, urgency: 'medium', reason: 'Below minimum threshold', estimatedCost: 900.0 },
];

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Ingredients
  async getIngredients(): Promise<Ingredient[]> {
    await delay(300);
    return mockIngredients;
  }

  async getIngredient(id: string): Promise<Ingredient | undefined> {
    await delay(200);
    return mockIngredients.find((i) => i.id === id);
  }

  async createIngredient(data: Omit<Ingredient, 'id'>): Promise<Ingredient> {
    await delay(300);
    const newIngredient: Ingredient = {
      ...data,
      id: String(mockIngredients.length + 1),
    };
    mockIngredients.push(newIngredient);
    return newIngredient;
  }

  async updateIngredient(id: string, data: Partial<Ingredient>): Promise<Ingredient> {
    await delay(300);
    const index = mockIngredients.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Ingredient not found');
    mockIngredients[index] = { ...mockIngredients[index], ...data };
    return mockIngredients[index];
  }

  async deleteIngredient(id: string): Promise<void> {
    await delay(200);
    const index = mockIngredients.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Ingredient not found');
    mockIngredients.splice(index, 1);
  }

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    await delay(300);
    return mockRecipes;
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    await delay(200);
    return mockRecipes.find((r) => r.id === id);
  }

  // Stock Movements
  async getStockMovements(filters?: {
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<StockMovement[]> {
    await delay(300);
    let filtered = [...mockMovements];

    if (filters?.type && filters.type !== 'all') {
      filtered = filtered.filter((m) => m.type === filters.type);
    }

    if (filters?.startDate) {
      filtered = filtered.filter((m) => m.date >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter((m) => m.date <= filters.endDate!);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createStockMovement(data: Omit<StockMovement, 'id'>): Promise<StockMovement> {
    await delay(300);
    const newMovement: StockMovement = {
      ...data,
      id: String(mockMovements.length + 1),
    };
    mockMovements.unshift(newMovement);
    return newMovement;
  }

  // Forecast
  async getForecast(): Promise<ForecastData[]> {
    await delay(400);
    return generateForecastData();
  }

  async getDemandFactors(): Promise<DemandFactor[]> {
    await delay(200);
    return mockDemandFactors;
  }

  async getRecommendations(): Promise<RecommendedOrder[]> {
    await delay(300);
    return mockRecommendations;
  }

  // Alerts
  async getAlerts(status?: string): Promise<Alert[]> {
    await delay(300);
    if (status) {
      return mockAlerts.filter((a) => a.status === status);
    }
    return mockAlerts;
  }

  async snoozeAlert(id: string, until: string): Promise<Alert> {
    await delay(200);
    const alert = mockAlerts.find((a) => a.id === id);
    if (!alert) throw new Error('Alert not found');
    alert.status = 'snoozed';
    alert.snoozedUntil = until;
    return alert;
  }

  async dismissAlert(id: string): Promise<Alert> {
    await delay(200);
    const alert = mockAlerts.find((a) => a.id === id);
    if (!alert) throw new Error('Alert not found');
    alert.status = 'dismissed';
    return alert;
  }

  // Dashboard
  async getStockOverview(): Promise<StockOverview> {
    await delay(400);
    return {
      totalIngredients: mockIngredients.length,
      healthyStock: mockIngredients.filter((i) => i.status === 'healthy').length,
      lowStock: mockIngredients.filter((i) => i.status === 'low').length,
      criticalStock: mockIngredients.filter((i) => i.status === 'critical').length,
      outOfStock: mockIngredients.filter((i) => i.status === 'out').length,
      totalValue: mockIngredients.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0),
      lowStockItems: mockIngredients.filter((i) => i.status !== 'healthy'),
      recentMovements: mockMovements.slice(0, 5),
    };
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
