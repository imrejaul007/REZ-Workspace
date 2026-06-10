/**
 * HOJAI - Franchise Twin Engine
 * Port: 5430
 *
 * Predicts franchisee decisions and behavior
 *
 * Features:
 * - Franchisee profiling
 * - Decision prediction
 * - Performance forecasting
 * - Growth propensity
 *
 * Version: 1.0.0
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================================
// TYPES
// ============================================================================

interface FranchiseeProfile {
  id: string;
  name: string;
  location: string;
  type: 'individual' | 'multi-unit' | 'corporate';
  tenure: number; // years
  performance: 'top' | 'average' | 'struggling';
  expansionInterest: number; // 0-1
  compliance: number; // 0-1
  financialCapacity: 'strong' | 'moderate' | 'limited';
}

interface FranchiseeReaction {
  franchisee: string;
  expansionPropensity: number; // 0-1
  reinvestmentLikelihood: number; // 0-1
  complianceScore: number; // 0-1
  riskScore: number; // 0-1
  keyConcerns: string[];
}

interface TwinPrediction {
  eventId: string;
  eventType: string;
  reactions: FranchiseeReaction[];
  expansionPipeline: number; // potential new locations
  overallHealth: number; // 0-1
  recommendations: string[];
}

// ============================================================================
// FRANCHISEE DATABASE
// ============================================================================

const FRANCHISEES: FranchiseeProfile[] = [
  {
    id: 'fran-1',
    name: 'Metro Store Owners',
    location: 'Mumbai',
    type: 'multi-unit',
    tenure: 8,
    performance: 'top',
    expansionInterest: 0.9,
    compliance: 0.95,
    financialCapacity: 'strong'
  },
  {
    id: 'fran-2',
    name: 'Delhi Retailers',
    location: 'Delhi NCR',
    type: 'individual',
    tenure: 5,
    performance: 'average',
    expansionInterest: 0.5,
    compliance: 0.85,
    financialCapacity: 'moderate'
  },
  {
    id: 'fran-3',
    name: 'Bangalore Tech',
    location: 'Bangalore',
    type: 'corporate',
    tenure: 3,
    performance: 'top',
    expansionInterest: 0.8,
    compliance: 0.98,
    financialCapacity: 'strong'
  },
  {
    id: 'fran-4',
    name: 'Jaipur Stores',
    location: 'Jaipur',
    type: 'individual',
    tenure: 2,
    performance: 'struggling',
    expansionInterest: 0.2,
    compliance: 0.7,
    financialCapacity: 'limited'
  },
  {
    id: 'fran-5',
    name: 'Pune Outlets',
    location: 'Pune',
    type: 'multi-unit',
    tenure: 6,
    performance: 'average',
    expansionInterest: 0.6,
    compliance: 0.88,
    financialCapacity: 'moderate'
  }
];

// ============================================================================
// PREDICTION ENGINE
// ============================================================================

function predictReaction(franchisee: FranchiseeProfile, eventType: string): FranchiseeReaction {
  let expansionPropensity = franchisee.expansionInterest;
  let reinvestmentLikelihood = 0.5;
  let complianceScore = franchisee.compliance;
  const concerns: string[] = [];

  if (eventType === 'new_territory') {
    expansionPropensity += franchisee.type === 'multi-unit' ? 0.15 : 0.05;
    reinvestmentLikelihood = franchisee.performance === 'top' ? 0.85 : 0.5;
  } else if (eventType === 'royalty_increase') {
    expansionPropensity -= franchisee.performance === 'struggling' ? 0.3 : 0.1;
    reinvestmentLikelihood -= franchisee.financialCapacity === 'limited' ? 0.4 : 0.1;
    complianceScore -= franchisee.financialCapacity === 'limited' ? 0.1 : 0;
    concerns.push('Cost pressure', 'Margin squeeze');
  } else if (eventType === 'marketing_support') {
    expansionPropensity += franchisee.performance === 'average' ? 0.2 : 0.1;
    reinvestmentLikelihood += 0.15;
    concerns.push('Brand awareness');
  } else if (eventType === 'technology_update') {
    complianceScore -= franchisee.tenure > 5 ? 0.1 : 0;
    concerns.push('Learning curve', 'Implementation cost');
  }

  // Calculate risk
  const riskScore = (franchisee.performance === 'struggling' ? 0.3 : 0) +
                   (franchisee.financialCapacity === 'limited' ? 0.2 : 0) +
                   (1 - franchisee.compliance) * 0.3 +
                   (1 - expansionPropensity) * 0.2;

  return {
    franchisee: franchisee.name,
    expansionPropensity: Math.min(1, Math.max(0, expansionPropensity)),
    reinvestmentLikelihood: Math.min(1, Math.max(0, reinvestmentLikelihood)),
    complianceScore: Math.min(1, Math.max(0, complianceScore)),
    riskScore: Math.round(riskScore * 100) / 100,
    keyConcerns: concerns
  };
}

// ============================================================================
// ROUTES
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    service: 'franchise-twin',
    status: 'healthy',
    version: '1.0.0',
    port: 5430,
    franchisees: FRANCHISEES.length
  });
});

app.get('/franchisees', (req, res) => {
  res.json({ franchisees: FRANCHISEES });
});

app.post('/predict', (req, res) => {
  const { eventType, franchiseeIds } = req.body;

  const targetFranchisees = franchiseeIds
    ? FRANCHISEES.filter(f => franchiseeIds.includes(f.id))
    : FRANCHISEES;

  const reactions = targetFranchisees.map(f => predictReaction(f, eventType));

  // Calculate pipeline potential
  const expansionPipeline = reactions.reduce((sum, r) => sum + r.expansionPropensity, 0) / reactions.length * targetFranchisees.length;

  // Overall health
  const overallHealth = reactions.reduce((sum, r) => sum + (1 - r.riskScore), 0) / reactions.length;

  // Recommendations
  const recommendations: string[] = [];
  if (expansionPipeline > targetFranchisees.length * 0.5) {
    recommendations.push('Strong expansion pipeline - prioritize top performers');
  }
  if (reactions.some(r => r.riskScore > 0.5)) {
    recommendations.push('Some franchisees at risk - provide support');
  }
  if (reactions.every(r => r.complianceScore > 0.8)) {
    recommendations.push('Good compliance across network');
  }

  const prediction: TwinPrediction = {
    eventId: `evt-${Date.now()}`,
    eventType,
    reactions,
    expansionPipeline: Math.round(expansionPipeline * 10) / 10,
    overallHealth: Math.round(overallHealth * 100) / 100,
    recommendedActions: recommendations
  };

  res.json(prediction);
});

app.get('/franchisee/:id', (req, res) => {
  const franchisee = FRANCHISEES.find(f => f.id === req.params.id);
  if (!franchisee) {
    return res.status(404).json({ error: 'Franchisee not found' });
  }
  res.json(franchisee);
});

// ============================================================================
// START
// ============================================================================

const PORT = process.env.PORT || 5430;
app.listen(PORT, () => {
  console.log(`Franchise Twin running on port ${PORT}`);
});

export default app;