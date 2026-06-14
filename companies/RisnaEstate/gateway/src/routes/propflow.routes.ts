import { logger } from '../../shared/logger';
/**
 * PropFlow Integration Routes for RisnaEstate Gateway
 *
 * These routes integrate PropFlow deal logic and AI agents into the RisnaEstate gateway.
 * All routes are prefixed with /api/deals and /api/ai in the main app.ts
 *
 * Port: 3000 (main gateway)
 * Target: risna-deal-service (port 4128)
 */

import { Router } from 'express';
import axios, { AxiosInstance } from 'axios';

const router = Router();

// Service URLs
const DEAL_SERVICE_URL = process.env.DEAL_SERVICE_URL || 'http://localhost:4128';
const HOJAI_RUNTIME_URL = process.env.HOJAI_RUNTIME_URL || 'http://localhost:4700';

// Create HTTP clients
const dealServiceClient: AxiosInstance = axios.create({
  baseURL: DEAL_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const hojaiClient: AxiosInstance = axios.create({
  baseURL: HOJAI_RUNTIME_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================
// DEAL ROUTES (from PropFlow)
// ============================================

/**
 * GET /api/deals
 * List all deals with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      stage,
      brokerId,
      minValue,
      maxValue,
      propertyId,
      leadId,
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const params: Record<string, any> = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy,
      sortOrder
    };

    if (stage) params.stage = stage;
    if (brokerId) params.brokerId = brokerId;
    if (minValue) params.minValue = parseInt(minValue as string);
    if (maxValue) params.maxValue = parseInt(maxValue as string);
    if (propertyId) params.propertyId = propertyId;
    if (leadId) params.leadId = leadId;

    const response = await dealServiceClient.get('/deals', { params });

    res.json({
      success: true,
      data: response.data,
      meta: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    logger.error('Error fetching deals:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deals',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * GET /api/deals/pipeline
 * Get pipeline view with aggregated data
 */
router.get('/pipeline', async (req, res) => {
  try {
    const { brokerId, timeframe } = req.query;

    const response = await dealServiceClient.get('/deals/pipeline', {
      params: { brokerId, timeframe }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    logger.error('Error fetching pipeline:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pipeline',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * GET /api/deals/:id
 * Get single deal by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await dealServiceClient.get(`/deals/${id}`);

    res.json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
      return;
    }
    logger.error('Error fetching deal:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deal',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * POST /api/deals
 * Create a new deal
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      value,
      currency = 'INR',
      propertyId,
      leadId,
      brokerId,
      stage = 'lead',
      expectedCloseDate
    } = req.body;

    // Validate required fields
    if (!title || !value) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'title and value are required'
      });
      return;
    }

    const dealData = {
      title,
      description,
      value: parseFloat(value),
      currency,
      propertyId,
      leadId,
      brokerId,
      stage,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined
    };

    const response = await dealServiceClient.post('/deals', dealData);

    res.status(201).json({
      success: true,
      data: response.data,
      message: 'Deal created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating deal:', error.message);
    res.status(400).json({
      success: false,
      error: 'Failed to create deal',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * PUT /api/deals/:id
 * Update a deal
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const response = await dealServiceClient.put(`/deals/${id}`, updateData);

    res.json({
      success: true,
      data: response.data,
      message: 'Deal updated successfully'
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
      return;
    }
    logger.error('Error updating deal:', error.message);
    res.status(400).json({
      success: false,
      error: 'Failed to update deal',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * DELETE /api/deals/:id
 * Delete a deal
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await dealServiceClient.delete(`/deals/${id}`);

    res.status(204).send();
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
      return;
    }
    logger.error('Error deleting deal:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete deal',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * POST /api/deals/:id/stage
 * Move deal to a new stage
 */
router.post('/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes, performedBy = 'system' } = req.body;

    if (!stage) {
      res.status(400).json({
        success: false,
        error: 'Stage is required'
      });
      return;
    }

    const response = await dealServiceClient.post(`/deals/${id}/stage`, {
      stage,
      notes,
      performedBy
    });

    res.json({
      success: true,
      data: response.data,
      message: `Deal moved to ${stage}`
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
      return;
    }
    logger.error('Error moving deal stage:', error.message);
    res.status(400).json({
      success: false,
      error: 'Failed to move deal stage',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * POST /api/deals/:id/activities
 * Add activity to a deal
 */
router.post('/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, description, performedBy = 'system' } = req.body;

    if (!type || !title) {
      res.status(400).json({
        success: false,
        error: 'type and title are required'
      });
      return;
    }

    const response = await dealServiceClient.post(`/deals/${id}/activities`, {
      type,
      title,
      description,
      performedBy
    });

    res.status(201).json({
      success: true,
      data: response.data,
      message: 'Activity added successfully'
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
      return;
    }
    logger.error('Error adding activity:', error.message);
    res.status(400).json({
      success: false,
      error: 'Failed to add activity',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * GET /api/deals/:id/activities
 * Get activities for a deal
 */
router.get('/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const response = await dealServiceClient.get(`/deals/${id}/activities`, {
      params: { limit: parseInt(limit as string), offset: parseInt(offset as string) }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
      return;
    }
    logger.error('Error fetching activities:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * POST /api/deals/:id/documents
 * Attach document to a deal
 */
router.post('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const { filename, url, type, size, uploadedBy = 'system' } = req.body;

    if (!filename || !url) {
      res.status(400).json({
        success: false,
        error: 'filename and url are required'
      });
      return;
    }

    const response = await dealServiceClient.post(`/deals/${id}/documents`, {
      filename,
      url,
      type,
      size,
      uploadedBy
    });

    res.status(201).json({
      success: true,
      data: response.data,
      message: 'Document attached successfully'
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
      return;
    }
    logger.error('Error attaching document:', error.message);
    res.status(400).json({
      success: false,
      error: 'Failed to attach document',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * GET /api/deals/:id/documents
 * Get documents for a deal
 */
router.get('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await dealServiceClient.get(`/deals/${id}/documents`);

    res.json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
      return;
    }
    logger.error('Error fetching documents:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * GET /api/deals/analytics
 * Get deal analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate, brokerId } = req.query;

    const response = await dealServiceClient.get('/deals/analytics', {
      params: { startDate, endDate, brokerId }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    logger.error('Error fetching analytics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.response?.data?.message || error.message
    });
  }
});

// ============================================
// AI ROUTES (from PropFlow Agents)
// ============================================

/**
 * POST /api/ai/property/match
 * Property Matcher Agent - Match properties to lead preferences
 */
router.post('/property/match', async (req, res) => {
  try {
    const { leadId, preferences, budget, properties } = req.body;

    if (!preferences || !budget) {
      res.status(400).json({
        success: false,
        error: 'preferences and budget are required'
      });
      return;
    }

    // Call HOJAI agent runtime
    const response = await hojaiClient.post('/agents/property-matcher/invoke', {
      agent: 'PropertyMatcherAgent',
      input: {
        leadId,
        preferences,
        budget,
        properties: properties || []
      },
      config: {
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        temperature: 0.7,
        maxTokens: 2000
      }
    });

    res.json({
      success: true,
      data: response.data,
      agent: 'PropertyMatcherAgent'
    });
  } catch (error: any) {
    logger.error('Error in property matching:', error.message);

    // Fallback to direct deal service if HOJAI is unavailable
    try {
      const fallbackResponse = await dealServiceClient.post('/ai/property/match', req.body);
      res.json({
        success: true,
        data: fallbackResponse.data,
        agent: 'PropertyMatcherAgent (fallback)'
      });
    } catch (fallbackError: any) {
      res.status(500).json({
        success: false,
        error: 'Property matching failed',
        message: error.message
      });
    }
  }
});

/**
 * POST /api/ai/lead/qualify
 * Lead Qualification Agent - Score and qualify leads
 */
router.post('/lead/qualify', async (req, res) => {
  try {
    const { leadId, propertyId, leadData, propertyData } = req.body;

    if (!leadId) {
      res.status(400).json({
        success: false,
        error: 'leadId is required'
      });
      return;
    }

    // Call HOJAI agent runtime
    const response = await hojaiClient.post('/agents/lead-qualifier/invoke', {
      agent: 'LeadQualificationAgent',
      input: {
        leadId,
        propertyId,
        leadData,
        propertyData
      },
      config: {
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        temperature: 0.5,
        maxTokens: 1500
      }
    });

    res.json({
      success: true,
      data: response.data,
      agent: 'LeadQualificationAgent'
    });
  } catch (error: any) {
    logger.error('Error in lead qualification:', error.message);

    // Fallback
    try {
      const fallbackResponse = await dealServiceClient.post('/ai/lead/qualify', req.body);
      res.json({
        success: true,
        data: fallbackResponse.data,
        agent: 'LeadQualificationAgent (fallback)'
      });
    } catch (fallbackError: any) {
      res.status(500).json({
        success: false,
        error: 'Lead qualification failed',
        message: error.message
      });
    }
  }
});

/**
 * POST /api/ai/offer/negotiate
 * Offer Negotiation Agent - Assist with offer negotiations
 */
router.post('/offer/negotiate', async (req, res) => {
  try {
    const { dealId, offerAmount, counterOffer = false, marketData } = req.body;

    if (!dealId || !offerAmount) {
      res.status(400).json({
        success: false,
        error: 'dealId and offerAmount are required'
      });
      return;
    }

    // Call HOJAI agent runtime
    const response = await hojaiClient.post('/agents/offer-negotiator/invoke', {
      agent: 'OfferNegotiationAgent',
      input: {
        dealId,
        offerAmount,
        counterOffer,
        marketData
      },
      config: {
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        temperature: 0.6,
        maxTokens: 2000
      }
    });

    res.json({
      success: true,
      data: response.data,
      agent: 'OfferNegotiationAgent'
    });
  } catch (error: any) {
    logger.error('Error in offer negotiation:', error.message);
    res.status(500).json({
      success: false,
      error: 'Offer negotiation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/market/analyze
 * Market Analysis Agent - Analyze market trends
 */
router.post('/market/analyze', async (req, res) => {
  try {
    const { location, propertyType, timeframe = '3months' } = req.body;

    if (!location || !propertyType) {
      res.status(400).json({
        success: false,
        error: 'location and propertyType are required'
      });
      return;
    }

    // Call HOJAI agent runtime
    const response = await hojaiClient.post('/agents/market-analyzer/invoke', {
      agent: 'MarketAnalysisAgent',
      input: {
        location,
        propertyType,
        timeframe
      },
      config: {
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        temperature: 0.7,
        maxTokens: 2500
      }
    });

    res.json({
      success: true,
      data: response.data,
      agent: 'MarketAnalysisAgent'
    });
  } catch (error: any) {
    logger.error('Error in market analysis:', error.message);
    res.status(500).json({
      success: false,
      error: 'Market analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/investment/advise
 * Investment Advisor Agent - Provide investment recommendations
 */
router.post('/investment/advise', async (req, res) => {
  try {
    const { budget, goals, riskTolerance = 'medium', timeline } = req.body;

    if (!budget || !goals) {
      res.status(400).json({
        success: false,
        error: 'budget and goals are required'
      });
      return;
    }

    // Call HOJAI agent runtime
    const response = await hojaiClient.post('/agents/investment-advisor/invoke', {
      agent: 'InvestmentAdvisorAgent',
      input: {
        budget,
        goals,
        riskTolerance,
        timeline
      },
      config: {
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        temperature: 0.6,
        maxTokens: 2500
      }
    });

    res.json({
      success: true,
      data: response.data,
      agent: 'InvestmentAdvisorAgent'
    });
  } catch (error: any) {
    logger.error('Error in investment advice:', error.message);
    res.status(500).json({
      success: false,
      error: 'Investment advice failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/deal/score
 * Score a deal using AI
 */
router.post('/deal/score', async (req, res) => {
  try {
    const { dealId } = req.body;

    if (!dealId) {
      res.status(400).json({
        success: false,
        error: 'dealId is required'
      });
      return;
    }

    // Get deal from service
    const dealResponse = await dealServiceClient.get(`/deals/${dealId}`);
    const deal = dealResponse.data;

    // Score the deal using AI
    const response = await hojaiClient.post('/agents/deal-scorer/invoke', {
      agent: 'DealScorerAgent',
      input: {
        deal,
        factors: [
          'value',
          'stage',
          'daysInStage',
          'activities',
          'propertyValue',
          'leadQuality'
        ]
      },
      config: {
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        temperature: 0.3,
        maxTokens: 1000
      }
    });

    // Update deal with AI score
    const { score, recommendation } = response.data;
    await dealServiceClient.put(`/deals/${dealId}`, {
      aiScore: score,
      aiRecommendation: recommendation,
      lastAIAction: new Date()
    });

    res.json({
      success: true,
      data: {
        dealId,
        aiScore: score,
        recommendation,
        updatedAt: new Date()
      }
    });
  } catch (error: any) {
    logger.error('Error scoring deal:', error.message);
    res.status(500).json({
      success: false,
      error: 'Deal scoring failed',
      message: error.message
    });
  }
});

export { router as propflowRoutes };