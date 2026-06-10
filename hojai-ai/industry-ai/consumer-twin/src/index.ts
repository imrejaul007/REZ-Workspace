/**
 * HOJAI - Consumer Twin Engine
 * Port: 5400
 *
 * Predicts consumer behavior and reactions
 * Aiphrodite-style consumer modeling
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

interface ConsumerSegment {
  id: string;
  name: string;
  demographics: {
    age: string;
    income: string;
    location: string;
  };
  psychographics: {
    values: string[];
    interests: string[];
    personality: string[];
  };
  behavior: {
    purchaseFrequency: string;
    brandLoyalty: string;
    priceSensitivity: string;
  };
}

interface ConsumerReaction {
  segment: string;
  sentiment: number; // -1 to 1
  probability: number; // 0 to 1
  engagement: number; // 0 to 100
  conversionLikelihood: number; // 0 to 1
  keyFactors: string[];
  concerns: string[];
}

interface TwinPrediction {
  eventId: string;
  eventType: string;
  reactions: ConsumerReaction[];
  overallSentiment: number;
  overallEngagement: number;
  overallConversion: number;
  topSegments: string[];
  recommendations: string[];
}

// ============================================================================
// CONSUMER SEGMENTS (Realistic personas)
// ============================================================================

const SEGMENTS: ConsumerSegment[] = [
  {
    id: 'early-adopters',
    name: 'Early Adopters',
    demographics: { age: '18-34', income: '50K-100K', location: 'Urban' },
    psychographics: { values: ['innovation', 'status'], interests: ['tech', 'trends'], personality: ['risk-taker', 'opinion-leader'] },
    behavior: { purchaseFrequency: 'high', brandLoyalty: 'low', priceSensitivity: 'low' }
  },
  {
    id: 'mainstream',
    name: 'Mainstream Users',
    demographics: { age: '25-45', income: '40K-80K', location: 'Suburban' },
    psychographics: { values: ['quality', 'convenience'], interests: ['family', 'career'], personality: ['practical', 'balanced'] },
    behavior: { purchaseFrequency: 'medium', brandLoyalty: 'medium', priceSensitivity: 'medium' }
  },
  {
    id: 'value-seekers',
    name: 'Value Seekers',
    demographics: { age: '30-55', income: '30K-60K', location: 'Mixed' },
    psychographics: { values: ['savings', 'family'], interests: ['deals', 'value'], personality: ['cautious', 'practical'] },
    behavior: { purchaseFrequency: 'low', brandLoyalty: 'high', priceSensitivity: 'very-high' }
  },
  {
    id: 'luxury',
    name: 'Luxury Buyers',
    demographics: { age: '35-60', income: '100K+', location: 'Urban' },
    psychographics: { values: ['status', 'quality'], interests: ['premium', 'exclusive'], personality: ['confident', 'selective'] },
    behavior: { purchaseFrequency: 'low', brandLoyalty: 'high', priceSensitivity: 'low' }
  },
  {
    id: 'enterprise',
    name: 'Enterprise Buyers',
    demographics: { age: '30-50', income: '80K+', location: 'Urban' },
    psychographics: { values: ['efficiency', 'roi'], interests: ['productivity', 'solutions'], personality: ['analytical', 'risk-aware'] },
    behavior: { purchaseFrequency: 'medium', brandLoyalty: 'high', priceSensitivity: 'low' }
  }
];

// ============================================================================
// REACTION PREDICTION
// ============================================================================

function predictReaction(segment: ConsumerSegment, eventType: string, description: string): ConsumerReaction {
  // Base probabilities by segment
  const baseSentiment = {
    'early-adopters': 0.7,
    'mainstream': 0.4,
    'value-seekers': 0.1,
    'luxury': 0.5,
    'enterprise': 0.6
  };

  const baseEngagement = {
    'early-adopters': 85,
    'mainstream': 60,
    'value-seekers': 40,
    'luxury': 55,
    'enterprise': 70
  };

  // Adjust based on event type
  let adjustment = 0;
  let keyFactors: string[] = [];
  let concerns: string[] = [];

  const descLower = description.toLowerCase();

  if (eventType === 'product_launch') {
    adjustment = segment.id === 'early-adopters' ? 0.2 : 0;
    keyFactors = ['Innovation', 'Unique features', 'Brand reputation'];
    concerns = ['Price', 'Availability', 'Quality'];
  } else if (eventType === 'pricing_change') {
    adjustment = segment.behavior.priceSensitivity === 'very-high' ? -0.3 :
                 segment.behavior.priceSensitivity === 'high' ? -0.2 :
                 segment.behavior.priceSensitivity === 'low' ? 0.1 : 0;
    keyFactors = ['Value proposition', 'Competitor pricing'];
    concerns = ['Affordability', 'Value for money'];
  } else if (eventType === 'marketing_campaign') {
    adjustment = 0.1;
    keyFactors = ['Brand perception', 'Social proof', 'Emotional appeal'];
    concerns = ['Authenticity', 'Overpromising'];
  } else if (eventType === 'service_update') {
    adjustment = segment.id === 'enterprise' ? 0.2 : 0;
    keyFactors = ['Improvements', 'Bug fixes', 'New features'];
    concerns = ['Learning curve', 'Compatibility'];
  }

  return {
    segment: segment.name,
    sentiment: Math.min(1, Math.max(-1, baseSentiment[segment.id as keyof typeof baseSentiment] + adjustment)),
    probability: 0.5 + Math.random() * 0.4,
    engagement: Math.min(100, baseEngagement[segment.id as keyof typeof baseEngagement] + adjustment * 50),
    conversionLikelihood: 0.2 + Math.random() * 0.5,
    keyFactors,
    concerns
  };
}

// ============================================================================
// ROUTES
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    service: 'consumer-twin',
    status: 'healthy',
    version: '1.0.0',
    port: 5400,
    segments: SEGMENTS.length
  });
});

app.get('/segments', (req, res) => {
  res.json({ segments: SEGMENTS });
});

app.post('/predict', (req, res) => {
  const { eventType, description, segmentIds } = req.body;

  // Select segments
  const targetSegments = segmentIds
    ? SEGMENTS.filter(s => segmentIds.includes(s.id))
    : SEGMENTS;

  // Predict reactions
  const reactions = targetSegments.map(seg => predictReaction(seg, eventType, description));

  // Aggregate
  const overallSentiment = reactions.reduce((sum, r) => sum + r.sentiment, 0) / reactions.length;
  const overallEngagement = reactions.reduce((sum, r) => sum + r.engagement, 0) / reactions.length;
  const overallConversion = reactions.reduce((sum, r) => sum + r.conversionLikelihood, 0) / reactions.length;

  // Top segments
  const topSegments = reactions
    .sort((a, b) => b.sentiment - a.sentiment)
    .slice(0, 3)
    .map(r => r.segment);

  // Recommendations
  const recommendations: string[] = [];
  if (overallSentiment > 0.5) {
    recommendations.push('Proceed with launch - positive reception expected');
    recommendations.push('Target Early Adopters first');
  } else if (overallSentiment < 0) {
    recommendations.push('Consider revising the approach');
    recommendations.push('Address key concerns before launch');
  } else {
    recommendations.push('Mixed reception - customize messaging per segment');
  }

  const prediction: TwinPrediction = {
    eventId: `evt-${Date.now()}`,
    eventType,
    reactions,
    overallSentiment: Math.round(overallSentiment * 100) / 100,
    overallEngagement: Math.round(overallEngagement),
    overallConversion: Math.round(overallConversion * 100) / 100,
    topSegments,
    recommendations
  };

  res.json(prediction);
});

app.post('/segment/:id', (req, res) => {
  const segment = SEGMENTS.find(s => s.id === req.params.id);
  if (!segment) {
    return res.status(404).json({ error: 'Segment not found' });
  }

  const { eventType, description } = req.body;
  const reaction = predictReaction(segment, eventType, description);

  res.json({ segment, reaction });
});

// ============================================================================
// START
// ============================================================================

const PORT = process.env.PORT || 5400;
app.listen(PORT, () => {
  console.log(`Consumer Twin running on port ${PORT}`);
});

export default app;