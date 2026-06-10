/**
 * HOJAI - Supplier Twin Engine
 * Port: 5420
 *
 * Predicts supplier behavior and negotiations
 *
 * Features:
 * - Supplier profiling
 * - Negotiation prediction
 * - Risk assessment
 * - Pricing behavior
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

interface SupplierProfile {
  id: string;
  name: string;
  category: string;
  reliability: number; // 0-1
  priceSensitivity: number; // 0-1
  leverage: number; // 0-1 (your leverage over them)
  financialHealth: 'strong' | 'moderate' | 'weak';
  dependencies: string[];
}

interface SupplierReaction {
  supplier: string;
  negotiationPosition: 'strong' | 'moderate' | 'weak';
  priceTolerance: number; // 0-1
  deliveryExpectation: number; // days
  loyalty: number; // 0-1
  riskScore: number; // 0-1
}

interface TwinPrediction {
  eventId: string;
  eventType: string;
  reactions: SupplierReaction[];
  overallRisk: number;
  recommendedActions: string[];
}

// ============================================================================
// SUPPLIER DATABASE
// ============================================================================

const SUPPLIERS: SupplierProfile[] = [
  {
    id: 'sup-1',
    name: 'Alpha Components',
    category: 'Electronics',
    reliability: 0.9,
    priceSensitivity: 0.6,
    leverage: 0.5,
    financialHealth: 'strong',
    dependencies: ['Your company']
  },
  {
    id: 'sup-2',
    name: 'Beta Materials',
    category: 'Raw Materials',
    reliability: 0.75,
    priceSensitivity: 0.8,
    leverage: 0.4,
    financialHealth: 'moderate',
    dependencies: ['Your company', 'Other Corp']
  },
  {
    id: 'sup-3',
    name: 'Gamma Logistics',
    category: 'Logistics',
    reliability: 0.85,
    priceSensitivity: 0.5,
    leverage: 0.6,
    financialHealth: 'strong',
    dependencies: ['Your company', 'Partner Inc']
  },
  {
    id: 'sup-4',
    name: 'Delta Parts',
    category: 'Components',
    reliability: 0.6,
    priceSensitivity: 0.9,
    leverage: 0.3,
    financialHealth: 'weak',
    dependencies: ['Your company']
  },
  {
    id: 'sup-5',
    name: 'Epsilon Tech',
    category: 'Software',
    reliability: 0.95,
    priceSensitivity: 0.4,
    leverage: 0.7,
    financialHealth: 'strong',
    dependencies: ['Your company', 'Enterprise Co']
  }
];

// ============================================================================
// PREDICTION ENGINE
// ============================================================================

function predictReaction(supplier: SupplierProfile, eventType: string, description: string): SupplierReaction {
  const descLower = description.toLowerCase();

  // Base negotiation position
  let negotiationPosition: 'strong' | 'moderate' | 'weak';
  if (supplier.leverage > 0.6 && supplier.reliability > 0.8) {
    negotiationPosition = 'weak';
  } else if (supplier.leverage < 0.4 || supplier.financialHealth === 'weak') {
    negotiationPosition = 'strong';
  } else {
    negotiationPosition = 'moderate';
  }

  // Adjust based on event
  let priceTolerance = supplier.priceSensitivity;
  let deliveryExpectation = 14; // days
  let loyalty = supplier.reliability;

  if (eventType === 'price_pressure') {
    priceTolerance = negotiationPosition === 'strong' ? 0.9 : 0.3;
    loyalty -= negotiationPosition === 'strong' ? 0.2 : 0.05;
  } else if (eventType === 'volume_increase') {
    deliveryExpectation += negotiationPosition === 'strong' ? 7 : 0;
    priceTolerance += negotiationPosition === 'strong' ? 0.1 : 0;
  } else if (eventType === 'contract_renewal') {
    priceTolerance = negotiationPosition === 'weak' ? 0.8 : 0.5;
    loyalty += negotiationPosition === 'weak' ? 0.1 : 0;
  }

  // Calculate risk score
  const riskScore = (1 - supplier.reliability) * 0.4 +
                     (supplier.financialHealth === 'weak' ? 0.3 : 0) +
                     (1 - supplier.leverage) * 0.3;

  return {
    supplier: supplier.name,
    negotiationPosition,
    priceTolerance: Math.min(1, Math.max(0, priceTolerance)),
    deliveryExpectation,
    loyalty: Math.min(1, Math.max(0, loyalty)),
    riskScore: Math.round(riskScore * 100) / 100
  };
}

// ============================================================================
// ROUTES
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    service: 'supplier-twin',
    status: 'healthy',
    version: '1.0.0',
    port: 5420,
    suppliers: SUPPLIERS.length
  });
});

app.get('/suppliers', (req, res) => {
  res.json({ suppliers: SUPPLIERS });
});

app.post('/predict', (req, res) => {
  const { eventType, description, supplierIds } = req.body;

  // Select suppliers
  const targetSuppliers = supplierIds
    ? SUPPLIERS.filter(s => supplierIds.includes(s.id))
    : SUPPLIERS;

  // Predict reactions
  const reactions = targetSuppliers.map(s => predictReaction(s, eventType, description));

  // Calculate overall risk
  const overallRisk = reactions.reduce((sum, r) => sum + r.riskScore, 0) / reactions.length;

  // Recommendations
  const actions: string[] = [];
  if (overallRisk > 0.5) {
    actions.push('Diversify supplier base to reduce risk');
    actions.push('Consider backup suppliers for critical components');
  }
  if (reactions.some(r => r.negotiationPosition === 'strong')) {
    actions.push('Approach negotiation carefully - supplier has leverage');
  }
  if (reactions.some(r => r.priceTolerance > 0.7)) {
    actions.push('Room for price negotiation exists');
  }

  const prediction: TwinPrediction = {
    eventId: `evt-${Date.now()}`,
    eventType,
    reactions,
    overallRisk: Math.round(overallRisk * 100) / 100,
    recommendedActions: actions
  };

  res.json(prediction);
});

app.get('/supplier/:id', (req, res) => {
  const supplier = SUPPLIERS.find(s => s.id === req.params.id);
  if (!supplier) {
    return res.status(404).json({ error: 'Supplier not found' });
  }
  res.json(supplier);
});

// ============================================================================
// START
// ============================================================================

const PORT = process.env.PORT || 5420;
app.listen(PORT, () => {
  console.log(`Supplier Twin running on port ${PORT}`);
});

export default app;