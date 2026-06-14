import { logger } from '../../shared/logger';
/**
 * RisaCare Nutrition Service v2.0
 * Port 4725 - AI-powered diet planning and calorie tracking
 * Now with MongoDB support
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 4725;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_nutrition';
const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== MONGOOSE SCHEMAS ====================

// Food Item Schema
const FoodItemSchema = new mongoose.Schema({
  foodId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  genericName: String,
  category: { type: String, index: true },
  servingSize: Number,
  servingUnit: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  fiber: Number,
  sugar: Number,
  sodium: Number,
  glycemicIndex: Number,
  tags: [String]
}, { timestamps: true });

// Meal Log Schema
const MealLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
  foods: [{
    foodId: String,
    name: String,
    servings: Number,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  }],
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFat: Number,
  notes: String
}, { timestamps: true });

MealLogSchema.index({ userId: 1, date: -1 });

// Diet Plan Schema
const DietPlanSchema = new mongoose.Schema({
  planId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  name: String,
  goal: { type: String, enum: ['weight_loss', 'weight_gain', 'maintain', 'muscle_gain', 'health'] },
  dailyCalorieTarget: Number,
  macroSplit: {
    protein: Number,
    carbs: Number,
    fat: Number
  },
  meals: [{
    type: String,
    calories: Number,
    foods: [String]
  }],
  startDate: String,
  endDate: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Water Log Schema
const WaterLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  amount: Number,
  unit: { type: String, default: 'ml' }
}, { timestamps: true });

WaterLogSchema.index({ userId: 1, date: -1 });

// Models
const FoodItemModel = mongoose.model('FoodItem', FoodItemSchema);
const MealLogModel = mongoose.model('MealLog', MealLogSchema);
const DietPlanModel = mongoose.model('DietPlan', DietPlanSchema);
const WaterLogModel = mongoose.model('WaterLog', WaterLogSchema);

// ==================== HEALTH CHECK ====================

app.get('/health', async (_req: Request, res: Response) => {
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'healthy',
    service: 'risa-care-nutrition',
    version: '2.0.0',
    port: PORT,
    database: dbStates[mongoose.connection.readyState as keyof typeof dbStates] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// ==================== FOOD DATABASE ====================

app.get('/foods/search', async (req: Request, res: Response) => {
  const { q, limit = '20' } = req.query;
  if (!q) {
    return res.status(400).json({ success: false, error: 'Query parameter q is required' });
  }
  const query = (q as string).toLowerCase();
  const foods = await FoodItemModel.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
      { genericName: { $regex: query, $options: 'i' } }
    ]
  }).limit(parseInt(limit as string, 10));
  res.json({ success: true, data: foods });
});

app.get('/foods', async (_req: Request, res: Response) => {
  const foods = await FoodItemModel.find().limit(100);
  res.json({ success: true, data: foods });
});

app.get('/foods/:id', async (req: Request, res: Response) => {
  const food = await FoodItemModel.findOne({ foodId: req.params.id });
  if (!food) {
    return res.status(404).json({ success: false, error: 'Food not found' });
  }
  res.json({ success: true, data: food });
});

app.post('/foods', async (req: Request, res: Response) => {
  const food = await FoodItemModel.create({ foodId: uuidv4(), ...req.body });
  res.status(201).json({ success: true, data: food });
});

// ==================== MEAL LOGS ====================

app.post('/meals', async (req: Request, res: Response) => {
  const log = await MealLogModel.create({ logId: uuidv4(), ...req.body });
  res.status(201).json({ success: true, data: log });
});

app.get('/meals/user/:userId', async (req: Request, res: Response) => {
  const { date } = req.query;
  const query: any = { userId: req.params.userId };
  if (date) query.date = date as string;
  const logs = await MealLogModel.find(query).sort({ date: -1 });
  res.json({ success: true, data: logs });
});

app.get('/meals/:id', async (req: Request, res: Response) => {
  const log = await MealLogModel.findOne({ logId: req.params.id });
  if (!log) {
    return res.status(404).json({ success: false, error: 'Meal log not found' });
  }
  res.json({ success: true, data: log });
});

// ==================== DIET PLANS ====================

app.post('/plans', async (req: Request, res: Response) => {
  const plan = await DietPlanModel.create({ planId: uuidv4(), ...req.body });
  res.status(201).json({ success: true, data: plan });
});

app.get('/plans/user/:userId', async (req: Request, res: Response) => {
  const plans = await DietPlanModel.find({ userId: req.params.userId, isActive: true });
  res.json({ success: true, data: plans });
});

app.put('/plans/:id', async (req: Request, res: Response) => {
  const plan = await DietPlanModel.findOneAndUpdate({ planId: req.params.id }, req.body, { new: true });
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Plan not found' });
  }
  res.json({ success: true, data: plan });
});

// ==================== WATER TRACKING ====================

app.post('/water', async (req: Request, res: Response) => {
  const log = await WaterLogModel.create({ logId: uuidv4(), ...req.body });
  res.status(201).json({ success: true, data: log });
});

app.get('/water/user/:userId', async (req: Request, res: Response) => {
  const { date } = req.query;
  const query: any = { userId: req.params.userId };
  if (date) query.date = date as string;
  const logs = await WaterLogModel.find(query).sort({ date: -1 });
  res.json({ success: true, data: logs });
});

// ==================== SEED DATA ====================

async function seedFoods() {
  const count = await FoodItemModel.countDocuments();
  if (count > 0) return;

  const foods = [
    { foodId: 'food_001', name: 'Chicken Breast', category: 'Protein', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: 'g' },
    { foodId: 'food_002', name: 'Brown Rice', category: 'Grains', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, servingSize: 100, servingUnit: 'g' },
    { foodId: 'food_003', name: 'Broccoli', category: 'Vegetables', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingSize: 100, servingUnit: 'g' },
    { foodId: 'food_004', name: 'Salmon', category: 'Protein', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: 100, servingUnit: 'g' },
    { foodId: 'food_005', name: 'Egg', category: 'Protein', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: 100, servingUnit: 'g' },
    { foodId: 'food_006', name: 'Banana', category: 'Fruits', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 100, servingUnit: 'g' },
    { foodId: 'food_007', name: 'Greek Yogurt', category: 'Dairy', calories: 59, protein: 10, carbs: 3.6, fat: 0.7, servingSize: 100, servingUnit: 'g' },
    { foodId: 'food_008', name: 'Almonds', category: 'Nuts', calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: 100, servingUnit: 'g' },
    { foodId: 'food_009', name: 'Oats', category: 'Grains', calories: 389, protein: 17, carbs: 66, fat: 7, servingSize: 100, servingUnit: 'g' },
    { foodId: 'food_010', name: 'Sweet Potato', category: 'Vegetables', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingSize: 100, servingUnit: 'g' }
  ];

  await FoodItemModel.insertMany(foods);
  logger.info('Seeded 10 food items');
}

// ==================== ERROR HANDLING ====================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

// ==================== START SERVER ====================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected for Nutrition Service');
    await seedFoods();

    app.listen(PORT, () => {
      logger.info(`RisaCare Nutrition Service v2.0 started on port ${PORT}`);
      logger.info(`Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  mongoose.connection.close();
  process.exit(0);
});

startServer();
export default app;