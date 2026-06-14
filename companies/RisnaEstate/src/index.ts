import { logger } from '../../shared/logger';
/**
 * RisnaEstate Real Estate API
 *
 * Real Estate OS - Property Marketplace, Property CRM, PropFlow AI
 * Port: 4901
 */

import express, { Request, Response } from 'express';
import { risnaEstateHub } from './hub-client';

const app = express();
app.use(express.json());

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'RisnaEstate',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  const checks = {
    unifiedHub: false,
    hojaiIntelligence: false,
    hojaiMemory: false,
    sutarTwinOS: false,
    rabtulAuth: false,
  };

  try {
    const balance = await risnaEstateHub.getWalletBalance('health-check');
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
    const result = await risnaEstateHub.authenticateUser(phone, name);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/users/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await risnaEstateHub.verifyUser(token);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// PROPERTY LISTINGS
// ============================================

app.post('/api/properties', async (req: Request, res: Response) => {
  try {
    const filters = req.body;

    // Get AI-powered recommendations
    if (filters.user_id) {
      const recommendations = await risnaEstateHub.getPropertyRecommendations(filters.user_id, filters);
      const listings = await risnaEstateHub.getPropertyListings(filters);

      return res.json({
        success: true,
        data: listings,
        recommendations,
      });
    }

    const listings = await risnaEstateHub.getPropertyListings(filters);
    res.json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/properties/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    // Get property details
    const property = await risnaEstateHub.getPropertyDetails(propertyId);

    // Get price prediction from AI
    const pricePrediction = await risnaEstateHub.predictPrice(propertyId);

    // Get property twin
    const twin = await risnaEstateHub.getPropertyTwin(propertyId);

    res.json({ success: true, data: { property, pricePrediction, twin } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/properties/create', async (req: Request, res: Response) => {
  try {
    const listingData = req.body;

    // Create property listing
    const listing = await risnaEstateHub.createPropertyListing(listingData);

    // Create digital twin
    await risnaEstateHub.createPropertyTwin(listing.id, listingData);

    // Get market insights
    const insights = await risnaEstateHub.getMarketInsights(listingData.location?.city);

    res.json({ success: true, data: listing, insights });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.patch('/api/properties/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const updates = req.body;

    const listing = await risnaEstateHub.updatePropertyListing(propertyId, updates);

    // Update digital twin
    await risnaEstateHub.createPropertyTwin(propertyId, updates);

    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// PROPERTY AI ASSISTANT
// ============================================

app.post('/api/property-assistant/query', async (req: Request, res: Response) => {
  try {
    const { user_id, query } = req.body;

    // Get buyer preferences
    const preferences = await risnaEstateHub.getBuyerPreferences(user_id);

    // Get AI response
    const response = await risnaEstateHub.getPropertyAssistantResponse(user_id, query);

    // Store interaction
    await risnaEstateHub.storeBuyerPreference(user_id, {
      last_query: query,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, data: response, preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// BUYER PREFERENCES
// ============================================

app.post('/api/users/:userId/preferences', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const preference = req.body;

    await risnaEstateHub.storeBuyerPreference(userId, preference);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/users/:userId/preferences', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const preferences = await risnaEstateHub.getBuyerPreferences(userId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// CRM / LEADS
// ============================================

app.post('/api/leads', async (req: Request, res: Response) => {
  try {
    const leadData = req.body;

    // Create lead
    const lead = await risnaEstateHub.createLead(leadData);

    // Get intent prediction
    const intent = await risnaEstateHub.getIntentPrediction(leadData.user_id);

    // Award loyalty points
    await risnaEstateHub.awardLoyaltyPoints(leadData.user_id, 50, 'lead_created');

    // Publish event
    await risnaEstateHub.publishLeadEvent(lead.id, 'lead.created', lead);

    res.json({ success: true, data: lead, intent });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/leads/:leadId', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const lead = await risnaEstateHub.getLeadDetails(leadId);
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.patch('/api/leads/:leadId/status', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { status } = req.body;

    const lead = await risnaEstateHub.updateLeadStatus(leadId, status);

    // Publish event
    await risnaEstateHub.publishLeadEvent(leadId, 'lead.status_changed', { status });

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// PROPERTY INTERESTS
// ============================================

app.post('/api/interests', async (req: Request, res: Response) => {
  try {
    const { user_id, property_id } = req.body;

    // Save interest
    const interest = await risnaEstateHub.savePropertyInterest(user_id, property_id);

    // Track view
    await risnaEstateHub.trackPropertyView(user_id, property_id);

    // Award points
    await risnaEstateHub.awardLoyaltyPoints(user_id, 10, 'property_viewed');

    res.json({ success: true, data: interest });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// PAYMENTS & WALLET
// ============================================

app.post('/api/payments/deposit', async (req: Request, res: Response) => {
  try {
    const { user_id, property_id, amount, method } = req.body;

    // Process payment
    const payment = await risnaEstateHub.processPayment(user_id, amount, method);

    // Transfer deposit
    const transfer = await risnaEstateHub.transferDeposit(user_id, property_id, amount);

    res.json({ success: true, data: { payment, transfer } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/users/:userId/wallet', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const balance = await risnaEstateHub.getWalletBalance(userId);
    const points = await risnaEstateHub.getLoyaltyPoints(userId);

    res.json({ success: true, data: { balance, points } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// MARKET ANALYTICS
// ============================================

app.post('/api/analytics/market', async (req: Request, res: Response) => {
  try {
    const { region, period } = req.body;

    // Get analytics from service
    const analytics = await risnaEstateHub.getMarketAnalytics(region, period);

    // Get AI market insights
    const insights = await risnaEstateHub.getMarketInsights(region);

    res.json({ success: true, data: { analytics, insights } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// MARKET SIMULATION
// ============================================

app.post('/api/simulation/market', async (req: Request, res: Response) => {
  try {
    const scenario = req.body;

    // Run market simulation
    const results = await risnaEstateHub.simulateMarketScenario(scenario);

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// PROPFLOW RECOMMENDATIONS
// ============================================

app.get('/api/users/:userId/propflow', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get PropFlow recommendations
    const recommendations = await risnaEstateHub.getPropFlowRecommendations(userId);

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 4901;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(parseInt(PORT as string), HOST as string, () => {
  logger.info(`[RisnaEstate] Real Estate API running on http://${HOST}:${PORT}`);
  logger.info(`[RisnaEstate] Connected to Unified Hub: ${process.env.UNIFIED_HUB_URL || 'http://localhost:4600'}`);
  logger.info(`[RisnaEstate] HOJAI Intelligence: ${process.env.HOJAI_INTELLIGENCE || 'http://localhost:4530'}`);
  logger.info(`[RisnaEstate] SUTAR TwinOS: ${process.env.SUTAR_TWIN_OS || 'http://localhost:4142'}`);
});

export { app };
export default app;