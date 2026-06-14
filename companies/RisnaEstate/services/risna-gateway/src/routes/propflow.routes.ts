/**
 * PropFlow AI Routes
 * Proxies AI agent requests to PropFlow and Agent Runtime
 */

import { Router } from 'express';
import axios, { AxiosInstance } from 'axios';

const router = Router();

const PROPFLOW_URL = process.env.PROPFLOW_URL || 'http://localhost:4807';
const HOJAI_RUNTIME_URL = process.env.HOJAI_RUNTIME_URL || 'http://localhost:4700';

const propflowClient: AxiosInstance = axios.create({
  baseURL: PROPFLOW_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

const hojaiClient: AxiosInstance = axios.create({
  baseURL: HOJAI_RUNTIME_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

// ============================================
// AI PROPERTY MATCHING
// ============================================

/**
 * POST /api/ai/property/match
 * Match properties to a lead using AI
 */
router.post('/property/match', async (req, res) => {
  try {
    const response = await propflowClient.post('/api/ai/property/match', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        code: 'AI_PROPERTY_MATCH_ERROR',
        message: error.response?.data?.error || 'Property matching service unavailable'
      }
    });
  }
});

// ============================================
// AI LEAD QUALIFICATION
// ============================================

/**
 * POST /api/ai/lead/qualify
 * Qualify a lead using AI
 */
router.post('/lead/qualify', async (req, res) => {
  try {
    const response = await propflowClient.post('/api/ai/lead/qualify', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        code: 'AI_LEAD_QUALIFY_ERROR',
        message: error.response?.data?.error || 'Lead qualification service unavailable'
      }
    });
  }
});

// ============================================
// AI VISIT SCHEDULING
// ============================================

/**
 * POST /api/ai/visit/schedule
 * Schedule a site visit using AI
 */
router.post('/visit/schedule', async (req, res) => {
  try {
    const response = await propflowClient.post('/api/ai/visit/schedule', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        code: 'AI_VISIT_SCHEDULE_ERROR',
        message: error.response?.data?.error || 'Visit scheduling service unavailable'
      }
    });
  }
});

// ============================================
// AI DEAL ANALYSIS
// ============================================

/**
 * POST /api/ai/deal/analyze
 * Analyze a deal using AI
 */
router.post('/deal/analyze', async (req, res) => {
  try {
    const response = await propflowClient.post('/api/ai/deal/analyze', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        code: 'AI_DEAL_ANALYZE_ERROR',
        message: error.response?.data?.error || 'Deal analysis service unavailable'
      }
    });
  }
});

// ============================================
// AI MARKET ANALYSIS
// ============================================

/**
 * POST /api/ai/market/analyze
 * Analyze market trends using AI
 */
router.post('/market/analyze', async (req, res) => {
  try {
    const response = await propflowClient.post('/api/ai/market/analyze', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        code: 'AI_MARKET_ANALYZE_ERROR',
        message: error.response?.data?.error || 'Market analysis service unavailable'
      }
    });
  }
});

// ============================================
// AI INVESTMENT ADVICE
// ============================================

/**
 * POST /api/ai/investment/advise
 * Get investment advice using AI
 */
router.post('/investment/advise', async (req, res) => {
  try {
    const response = await propflowClient.post('/api/ai/investment/advise', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        code: 'AI_INVESTMENT_ADVISE_ERROR',
        message: error.response?.data?.error || 'Investment advice service unavailable'
      }
    });
  }
});

// ============================================
// AI STATUS CHECK
// ============================================

/**
 * GET /api/ai/status
 * Get AI agent status
 */
router.get('/status', async (req, res) => {
  try {
    const response = await propflowClient.get('/ai/status');
    res.json(response.data);
  } catch (error: any) {
    // Return fallback status if PropFlow is not running
    res.json({
      status: 'degraded',
      llm: {
        configured: false,
        message: 'Add ANTHROPIC_API_KEY to enable LLM'
      },
      agents: [
        { name: 'PropertyAgent', status: 'fallback' },
        { name: 'LeadAgent', status: 'fallback' },
        { name: 'SiteVisitAgent', status: 'fallback' },
        { name: 'DealAgent', status: 'fallback' }
      ],
      message: 'AI service running in fallback (rule-based) mode'
    });
  }
});

// ============================================
// AGENT RUNTIME HEALTH
// ============================================

/**
 * GET /api/ai/runtime/health
 * Get Agent Runtime health
 */
router.get('/runtime/health', async (req, res) => {
  try {
    const response = await hojaiClient.get('/health');
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 503).json({
      status: 'unavailable',
      components: {
        llm: false,
        memory: false,
        tools: false,
        rag: false
      },
      message: 'Agent Runtime not configured. Add ANTHROPIC_API_KEY to enable.'
    });
  }
});

export default router;
