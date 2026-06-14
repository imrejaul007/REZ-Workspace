/**
 * REZ Consumer API
 *
 * Consumer App - Genie AI, Wallet, Rewards, Safe QR
 * Port: 4200
 *
 * Integrations:
 * - Unified Hub (4600) - RABTUL services
 * - HOJAI Genie (4703-4707) - Personal AI
 * - HOJAI Intelligence (4750-4754) - AI Suite
 * - SUTAR OS (4140-4254) - TwinOS, Goals
 * - Voice AI (4760-4780) - Voice commands
 */

import express, { Request, Response } from 'express';
import { rezConsumerHub } from './hub-client';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '4200', 10);

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-Consumer',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  const checks = {
    unifiedHub: false,
    genieMemory: false,
    genieRelation: false,
    genieBriefing: false,
    commerceAI: false,
    customerAI: false,
    voiceOS: false,
    sutarTwinOS: false,
  };

  try {
    const balance = await rezConsumerHub.getWalletBalance('health-check');
    checks.unifiedHub = true;
  } catch {}

  res.json({ status: 'ready', checks });
});

// ============================================
// USER AUTHENTICATION
// ============================================

app.post('/api/users/auth', async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;
    const result = await rezConsumerHub.authenticateUser(phone, name);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/users/otp/verify', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    const result = await rezConsumerHub.verifyOTP(phone, otp);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// WALLET & PAYMENTS
// ============================================

app.get('/api/users/:userId/wallet', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const balance = await rezConsumerHub.getWalletBalance(userId);
    const points = await rezConsumerHub.getLoyaltyPoints(userId);

    res.json({ success: true, data: { balance, points } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/wallet/credit', async (req: Request, res: Response) => {
  try {
    const { user_id, amount, source } = req.body;
    const result = await rezConsumerHub.creditWallet(user_id, amount, source);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/payments', async (req: Request, res: Response) => {
  try {
    const { user_id, amount, method } = req.body;
    const payment = await rezConsumerHub.makePayment({ userId: user_id, amount, method });

    // Track payment event
    await rezConsumerHub.trackEvent(user_id, 'payment.initiated', { amount, method });

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// ORDERS
// ============================================

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const orderData = req.body;

    // Create order
    const order = await rezConsumerHub.createOrder(orderData);

    // Get fraud check
    const fraudCheck = await rezConsumerHub.checkFraud(orderData.user_id, 'order', orderData.amount);

    if (fraudCheck?.risk_level === 'high') {
      return res.status(403).json({
        success: false,
        error: 'Transaction blocked due to fraud risk',
        fraud: fraudCheck,
      });
    }

    // Track event
    await rezConsumerHub.trackEvent(orderData.user_id, 'order.created', order);
    await rezConsumerHub.publishCommerceEvent(orderData.user_id, 'order.created', order);

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const status = await rezConsumerHub.getOrderStatus(orderId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// GENIE MEMORY - Personal Experiences
// ============================================

app.post('/api/genie/remember', async (req: Request, res: Response) => {
  try {
    const { user_id, content, importance } = req.body;

    // Store in Genie Memory
    const memory = await rezConsumerHub.remember(user_id, content, importance);

    // Also update user twin
    await rezConsumerHub.updateUserTwin(user_id, {
      last_memory: content,
      memory_importance: importance,
    });

    res.json({ success: true, data: memory });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/genie/recall', async (req: Request, res: Response) => {
  try {
    const { user_id, query } = req.body;
    const memories = await rezConsumerHub.recall(user_id, query);
    res.json({ success: true, data: memories });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/genie/memories/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const memories = await rezConsumerHub.getMemories(userId);
    res.json({ success: true, data: memories });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// GENIE RELATIONSHIP - Personal Connections
// ============================================

app.post('/api/genie/relationships/track', async (req: Request, res: Response) => {
  try {
    const { user_id, target_id, type, strength } = req.body;
    const relationship = await rezConsumerHub.trackRelationship(user_id, target_id, type, strength);
    res.json({ success: true, data: relationship });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/genie/relationships/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const relationships = await rezConsumerHub.getRelationships(userId);
    res.json({ success: true, data: relationships });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/genie/relationships/:userId/insights', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const insights = await rezConsumerHub.getRelationshipInsights(userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// GENIE BRIEFING - Daily Updates
// ============================================

app.post('/api/genie/briefing/generate', async (req: Request, res: Response) => {
  try {
    const { user_id, date } = req.body;
    const briefing = await rezConsumerHub.generateDailyBriefing(user_id, date);
    res.json({ success: true, data: briefing });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/genie/briefing/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const briefing = await rezConsumerHub.getBriefing(userId);
    res.json({ success: true, data: briefing });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/genie/briefing/:userId/weekly', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const briefing = await rezConsumerHub.getWeeklyBriefing(userId);
    res.json({ success: true, data: briefing });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// AI INSIGHTS
// ============================================

app.get('/api/insights/commerce/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const insight = await rezConsumerHub.getCommerceInsight(userId, 'overview');
    res.json({ success: true, data: insight });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/insights/customer/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const insight = await rezConsumerHub.getCustomerInsight(userId);
    res.json({ success: true, data: insight });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/insights/marketing/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const offer = await rezConsumerHub.getMarketingOffer(userId);
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/insights/financial/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const summary = await rezConsumerHub.getFinancialSummary(userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// RECOMMENDATIONS
// ============================================

app.get('/api/recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { context } = req.query;

    const recommendations = await rezConsumerHub.getRecommendations(
      userId,
      context ? JSON.parse(context as string) : undefined
    );

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/recommendations/:userId/personal', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const recommendations = await rezConsumerHub.getPersonalRecommendations(userId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// AI ASSISTANT
// ============================================

app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { user_id, message } = req.body;

    // Chat with AI assistant
    const response = await rezConsumerHub.chatWithAssistant(user_id, message);

    // Store interaction in memory
    await rezConsumerHub.remember(user_id, `Chat: ${message} -> ${response?.message || 'responded'}`);

    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// VOICE AI
// ============================================

app.post('/api/voice/command', async (req: Request, res: Response) => {
  try {
    const { user_id, audio } = req.body;
    const result = await rezConsumerHub.voiceCommand(user_id, audio);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/voice/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice } = req.body;
    const audio = await rezConsumerHub.textToSpeech(text, voice);
    res.json({ success: true, data: audio });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// USER TWIN (SUTAR OS)
// ============================================

app.post('/api/twin', async (req: Request, res: Response) => {
  try {
    const { user_id, data } = req.body;
    const twin = await rezConsumerHub.createUserTwin(user_id, data);
    res.json({ success: true, data: twin });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/twin/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const twin = await rezConsumerHub.getUserTwin(userId);
    res.json({ success: true, data: twin });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.patch('/api/twin/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const twin = await rezConsumerHub.updateUserTwin(userId, updates);
    res.json({ success: true, data: twin });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// USER GOALS (SUTAR OS)
// ============================================

app.post('/api/goals', async (req: Request, res: Response) => {
  try {
    const { user_id, goal } = req.body;
    const result = await rezConsumerHub.setUserGoal(user_id, goal);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/goals/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const goals = await rezConsumerHub.getUserGoals(userId);
    res.json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// ANALYTICS & TRACKING
// ============================================

app.post('/api/analytics/track', async (req: Request, res: Response) => {
  try {
    const { user_id, event, data } = req.body;
    await rezConsumerHub.trackEvent(user_id, event, data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/analytics/page-view', async (req: Request, res: Response) => {
  try {
    const { user_id, page } = req.body;
    await rezConsumerHub.trackPageView(user_id, page);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/analytics/search', async (req: Request, res: Response) => {
  try {
    const { user_id, query } = req.body;
    await rezConsumerHub.trackSearch(user_id, query);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// INTENT PREDICTION
// ============================================

app.get('/api/intent/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const intent = await rezConsumerHub.predictIntent(userId);
    res.json({ success: true, data: intent });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/intent/:userId/next-action', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const action = await rezConsumerHub.predictNextAction(userId);
    res.json({ success: true, data: action });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// USER PROFILE
// ============================================

app.get('/api/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await rezConsumerHub.getUserProfile(userId);

    // Enrich with Genie data
    const memories = await rezConsumerHub.getMemories(userId);
    const relationships = await rezConsumerHub.getRelationships(userId);
    const twin = await rezConsumerHub.getUserTwin(userId);

    res.json({
      success: true,
      data: { profile, memories, relationships, twin },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.patch('/api/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const profile = await rezConsumerHub.updateUserProfile(userId, updates);

    // Update twin as well
    await rezConsumerHub.updateUserTwin(userId, updates);

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// BOOKINGS
// ============================================

app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    const bookingData = req.body;
    const booking = await rezConsumerHub.createBooking(bookingData);

    // Track event
    await rezConsumerHub.trackEvent(bookingData.user_id, 'booking.created', booking);

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/bookings/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const booking = await rezConsumerHub.getBookingStatus(bookingId);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// USER PREFERENCES
// ============================================

app.post('/api/preferences', async (req: Request, res: Response) => {
  try {
    const { user_id, ...preferences } = req.body;
    await rezConsumerHub.storePreference(user_id, preferences);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const preferences = await rezConsumerHub.getPreferences(userId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n📱 REZ CONSUMER API (${PORT}) - Running ✅\n`);
  console.log('Integrations:');
  console.log(`  Unified Hub: ${process.env.UNIFIED_HUB_URL || 'http://localhost:4600'}`);
  console.log(`  Genie Memory: ${process.env.GENIE_MEMORY || 'http://localhost:4703'}`);
  console.log(`  Genie Briefing: ${process.env.GENIE_BRIEFING || 'http://localhost:4706'}`);
  console.log(`  Commerce AI: ${process.env.COMMERCE_AI || 'http://localhost:4750'}`);
  console.log(`  SUTAR TwinOS: ${process.env.SUTAR_TWIN_OS || 'http://localhost:4142'}`);
  console.log(`  Voice OS: ${process.env.VOICE_OS || 'http://localhost:4760'}`);
});

export { app };
export default app;