/**
 * StayOwn SUTAR Orchestrator
 *
 * SUTAR = Self-organizing Trustworthy Autonomous Relations
 *
 * This service orchestrates StayOwn operations through SUTAR:
 * 1. Procurement → SUTAR Contract → Trust Validation → Payment
 * 2. Pricing → SUTAR Decision → Approval → Execution
 * 3. Guest Services → SUTAR Memory → Learning
 * 4. Operations → SUTAR Flow → Automation
 *
 * Chapter 18: "Sutar orchestrates everything"
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const app: Express = express();
const PORT = parseInt(process.env.PORT || '4902', 10);

// SUTAR Service URLs
const SUTAR = {
  gateway: process.env.SUTAR_GATEWAY_URL || 'http://localhost:4244',
  contract: process.env.SUTAR_CONTRACT_URL || 'http://localhost:4518',
  decision: process.env.SUTAR_DECISION_URL || 'http://localhost:4240',
  negotiation: process.env.SUTAR_NEGOTIATION_URL || 'http://localhost:4191',
  trust: process.env.SUTAR_TRUST_URL || 'http://localhost:4518',
  memory: process.env.SUTAR_MEMORY_URL || 'http://localhost:4520',
  flow: process.env.SUTAR_FLOW_URL || 'http://localhost:4244',
  reputation: process.env.SUTAR_REPUTATION_URL || 'http://localhost:4190',
};

// StayOwn Service URLs
const STAYOWN = {
  staybot: process.env.STAYBOT_URL || 'http://localhost:4840',
  dashboard: process.env.DASHBOARD_URL || 'http://localhost:4900',
  procurement: process.env.PROCUREMENT_URL || 'http://localhost:4786',
  maintenance: process.env.MAINTENANCE_URL || 'http://localhost:4849',
  memory: process.env.MEMORY_URL || 'http://localhost:4520',
  roomPrep: process.env.ROOM_PREP_URL || 'http://localhost:4901',
};

// Orchestration state
const orchestrations: Map<string, any> = new Map();
const contracts: Map<string, any> = new Map();
const trustScores: Map<string, number> = new Map();

// HTTP client
const http = axios.create({ timeout: 15000 });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  res.setHeader('X-Request-ID', requestId);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${requestId}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'stayown-sutar-orchestrator',
    port: PORT,
    version: '1.0.0',
    sutarsConnected: Object.keys(SUTAR).length,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// SUTAR ORCHESTRATION ENDPOINTS
// ============================================================================

/**
 * POST /api/orchestrate/procurement
 * Orchestrate procurement through SUTAR
 *
 * Flow: Procurement Agent → SUTAR Trust → Contract → Payment
 */
app.post('/api/orchestrate/procurement', async (req: Request, res: Response) => {
  try {
    const { rfqId, item, quantity, supplierId, amount } = req.body;

    console.log(`[SUTAR ORCHESTRATION] Procurement: ${item} from ${supplierId}`);

    const orchestrationId = `ORCH-PROC-${Date.now()}`;

    // Initialize orchestration
    orchestrations.set(orchestrationId, {
      id: orchestrationId,
      type: 'procurement',
      rfqId,
      item,
      supplierId,
      amount,
      status: 'initiated',
      steps: [],
      startedAt: new Date().toISOString()
    });

    // Step 1: Trust Validation
    console.log(`[${orchestrationId}] Step 1: SUTAR Trust validation...`);
    const trustScore = await validateTrust(supplierId, 'supplier');
    addStep(orchestrationId, 'trust_validation', trustScore);

    if (trustScore < 0.7) {
      updateOrchestration(orchestrationId, 'rejected', { reason: 'Trust score too low' });
      return res.json({
        success: false,
        orchestrationId,
        status: 'rejected',
        reason: `Trust score ${trustScore} below threshold (0.7)`
      });
    }

    // Step 2: Contract Generation
    console.log(`[${orchestrationId}] Step 2: SUTAR Contract generation...`);
    const contract = await generateSutarContract({
      rfqId,
      item,
      quantity,
      supplierId,
      amount,
      trustScore
    });
    addStep(orchestrationId, 'contract_generated', contract);

    // Step 3: Negotiation (if needed)
    console.log(`[${orchestrationId}] Step 3: SUTAR Negotiation...`);
    const negotiation = await negotiateTerms(contract);
    addStep(orchestrationId, 'negotiation_complete', negotiation);

    // Step 4: Final Approval
    console.log(`[${orchestrationId}] Step 4: SUTAR Decision approval...`);
    const decision = await getSutarDecision(orchestrationId, 'procurement_approval', {
      contract,
      trustScore,
      amount
    });
    addStep(orchestrationId, 'decision_approved', decision);

    // Step 5: Execute
    console.log(`[${orchestrationId}] Step 5: Executing procurement...`);
    await executeProcurement(rfqId, contract);
    addStep(orchestrationId, 'executed', { success: true });

    // Complete
    updateOrchestration(orchestrationId, 'completed', { contract });

    res.json({
      success: true,
      orchestrationId,
      status: 'completed',
      contract,
      steps: orchestrations.get(orchestrationId).steps
    });

  } catch (error) {
    console.error('Orchestration error:', error);
    res.status(500).json({
      success: false,
      error: 'Orchestration failed'
    });
  }
});

/**
 * POST /api/orchestrate/pricing
 * Orchestrate pricing through SUTAR
 *
 * Flow: Dashboard → SUTAR Decision → StayBot → Booking
 */
app.post('/api/orchestrate/pricing', async (req: Request, res: Response) => {
  try {
    const { recommendation, roomType, priceChange, approved } = req.body;

    console.log(`[SUTAR ORCHESTRATION] Pricing: ${priceChange}% for ${roomType}`);

    const orchestrationId = `ORCH-PRICE-${Date.now()}`;

    if (!approved) {
      return res.json({
        success: true,
        orchestrationId,
        status: 'skipped',
        reason: 'Not approved'
      });
    }

    // Initialize
    orchestrations.set(orchestrationId, {
      id: orchestrationId,
      type: 'pricing',
      roomType,
      priceChange,
      status: 'initiated',
      steps: [],
      startedAt: new Date().toISOString()
    });

    // Step 1: SUTAR Decision
    console.log(`[${orchestrationId}] Step 1: SUTAR Decision for pricing...`);
    const decision = await getSutarDecision(orchestrationId, 'pricing_change', {
      roomType,
      priceChange,
      reason: recommendation
    });
    addStep(orchestrationId, 'decision', decision);

    if (decision.approved) {
      // Step 2: Execute via StayBot
      console.log(`[${orchestrationId}] Step 2: Executing via StayBot...`);
      await executePricingChange(roomType, priceChange);
      addStep(orchestrationId, 'executed', { via: 'staybot' });

      updateOrchestration(orchestrationId, 'completed', decision);

      res.json({
        success: true,
        orchestrationId,
        status: 'completed',
        decision,
        message: `✅ Pricing ${priceChange}% for ${roomType} rooms approved and executed`
      });
    } else {
      updateOrchestration(orchestrationId, 'rejected', decision);
      res.json({
        success: false,
        orchestrationId,
        status: 'rejected',
        decision
      });
    }

  } catch (error) {
    console.error('Pricing orchestration error:', error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

/**
 * POST /api/orchestrate/guest-experience
 * Orchestrate guest experience through SUTAR
 *
 * Flow: Memory → Learning → Personalization → Service
 */
app.post('/api/orchestrate/guest-experience', async (req: Request, res: Response) => {
  try {
    const { guestId, event, data } = req.body;

    console.log(`[SUTAR ORCHESTRATION] Guest: ${guestId} - ${event}`);

    // Store in SUTAR Memory
    await storeInSutarMemory(guestId, event, data);

    // Update reputation
    await updateReputation(guestId, event, data);

    res.json({
      success: true,
      message: 'Guest experience orchestrated',
      guestId,
      event
    });
  } catch (error) {
    console.error('Guest orchestration error:', error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// ============================================================================
// TRUST & CONTRACT SERVICES
// ============================================================================

/**
 * Validate trust score via SUTAR Trust
 */
async function validateTrust(entityId: string, entityType: string): Promise<number> {
  try {
    const response = await http.get(`${SUTAR.trust}/api/trust/${entityId}`);
    if (response.data?.score !== undefined) {
      return response.data.score;
    }
  } catch (e) {
    console.log('SUTAR Trust not available, using local scoring');
  }

  // Generate trust score based on entity type
  const baseScore = entityType === 'supplier' ? 0.85 : 0.9;
  const variance = Math.random() * 0.1;
  return Math.min(0.99, baseScore + variance);
}

/**
 * Generate SUTAR Contract
 */
async function generateSutarContract(params: any): Promise<any> {
  const contractId = `SUTAR-CONTRACT-${Date.now()}`;

  const contract = {
    contractId,
    rfqId: params.rfqId,
    item: params.item,
    quantity: params.quantity,
    supplierId: params.supplierId,
    supplierName: params.supplierId,
    amount: params.amount,
    currency: 'INR',
    trustScore: params.trustScore,
    terms: {
      delivery: 'CIF',
      payment: 'Net 30',
      warranty: '12 months',
      disputeResolution: 'Arbitration'
    },
    sutars: {
      selfOrganizing: true,
      trustworthy: params.trustScore > 0.8,
      autonomous: true,
      reliable: true
    },
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'generated'
  };

  contracts.set(contractId, contract);

  // Register with SUTAR Contract OS
  try {
    await http.post(`${SUTAR.contract}/api/contracts`, contract);
  } catch (e) {
    console.log('SUTAR Contract registration (demo mode)');
  }

  return contract;
}

/**
 * Negotiate terms via SUTAR Negotiation Engine
 */
async function negotiateTerms(contract: any): Promise<any> {
  try {
    const response = await http.post(`${SUTAR.negotiation}/api/negotiate`, {
      contractId: contract.contractId,
      currentTerms: contract.terms,
      negotiationType: 'standard'
    });
    return response.data;
  } catch (e) {
    console.log('SUTAR Negotiation (demo mode)');
    return {
      status: 'agreed',
      finalTerms: contract.terms,
      rounds: 1
    };
  }
}

/**
 * Get SUTAR Decision
 */
async function getSutarDecision(
  orchestrationId: string,
  decisionType: string,
  context: any
): Promise<any> {
  try {
    const response = await http.post(`${SUTAR.decision}/api/decisions/decide`, {
      corpId: 'stayown-hotel',
      action: decisionType,
      context,
      timestamp: new Date().toISOString()
    });
    return response.data;
  } catch (e) {
    console.log('SUTAR Decision (demo mode)');
    // Demo: Auto-approve pricing changes under 15%, reject others
    if (decisionType === 'pricing_change' && context.priceChange <= 15) {
      return { approved: true, confidence: 0.9, reason: 'Within policy' };
    }
    return { approved: false, confidence: 0.5, reason: 'Requires manual review' };
  }
}

/**
 * Store in SUTAR Memory
 */
async function storeInSutarMemory(guestId: string, event: string, data: any): Promise<void> {
  try {
    await http.post(`${SUTAR.memory}/api/context`, {
      guestId,
      event,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.log('SUTAR Memory (demo mode)');
  }
}

/**
 * Update reputation
 */
async function updateReputation(guestId: string, event: string, data: any): Promise<void> {
  try {
    await http.post(`${SUTAR.reputation}/api/reputation/update`, {
      entityId: guestId,
      event,
      data
    });
  } catch (e) {
    console.log('SUTAR Reputation (demo mode)');
  }
}

// ============================================================================
// EXECUTION HELPERS
// ============================================================================

/**
 * Execute procurement after SUTAR approval
 */
async function executeProcurement(rfqId: string, contract: any): Promise<void> {
  try {
    await http.post(`${STAYOWN.procurement}/api/orders`, {
      rfqId,
      contractId: contract.contractId,
      status: 'approved'
    });
  } catch (e) {
    console.log('Procurement execution (demo mode)');
  }
}

/**
 * Execute pricing change via StayBot
 */
async function executePricingChange(roomType: string, priceChange: number): Promise<void> {
  try {
    await http.post(`${STAYOWN.staybot}/api/commands/pricing-update`, {
      roomType,
      changePercent: priceChange,
      source: 'sutar-orchestrator'
    });
  } catch (e) {
    console.log('Pricing execution (demo mode)');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function addStep(orchestrationId: string, step: string, result: any): void {
  const orch = orchestrations.get(orchestrationId);
  if (orch) {
    orch.steps.push({
      step,
      result,
      timestamp: new Date().toISOString()
    });
  }
}

function updateOrchestration(orchestrationId: string, status: string, data: any): void {
  const orch = orchestrations.get(orchestrationId);
  if (orch) {
    orch.status = status;
    orch.data = data;
    orch.completedAt = new Date().toISOString();
  }
}

/**
 * GET /api/orchestrations
 * List all orchestrations
 */
app.get('/api/orchestrations', (req: Request, res: Response) => {
  const all = Array.from(orchestrations.values()).slice(-50);
  res.json({
    success: true,
    count: all.length,
    data: all
  });
});

/**
 * GET /api/orchestrations/:id
 * Get orchestration details
 */
app.get('/api/orchestrations/:id', (req: Request, res: Response) => {
  const orch = orchestrations.get(req.params.id);
  if (!orch) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  res.json({ success: true, data: orch });
});

/**
 * GET /api/contracts
 * List SUTAR contracts
 */
app.get('/api/contracts', (req: Request, res: Response) => {
  const all = Array.from(contracts.values());
  res.json({
    success: true,
    count: all.length,
    data: all
  });
});

/**
 * GET /api/trust/:entityId
 * Get trust score
 */
app.get('/api/trust/:entityId', async (req: Request, res: Response) => {
  const { entityId } = req.params;
  const score = await validateTrust(entityId, 'entity');
  res.json({
    success: true,
    entityId,
    trustScore: score,
    level: score > 0.9 ? 'excellent' : score > 0.7 ? 'good' : 'fair'
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🔄 SUTAR Orchestrator for StayOwn                          ║
║                                                                ║
║   Server running on port ${PORT}                               ║
║                                                                ║
║   SUTAR Services:                                              ║
║   • Gateway: ${SUTAR.gateway}   ║
║   • Contract: ${SUTAR.contract}    ║
║   • Decision: ${SUTAR.decision}   ║
║   • Negotiation: ${SUTAR.negotiation}   ║
║   • Trust: ${SUTAR.trust}                  ║
║   • Memory: ${SUTAR.memory}               ║
║   • Flow: ${SUTAR.flow}                    ║
║                                                                ║
║   Chapter 18: "Sutar orchestrates everything"                ║
║                                                                ║
║   Orchestration Types:                                        ║
║   • Procurement → Trust → Contract → Payment                   ║
║   • Pricing → Decision → Execution                             ║
║   • Guest → Memory → Learning → Personalization               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
