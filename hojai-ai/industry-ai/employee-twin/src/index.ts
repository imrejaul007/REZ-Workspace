/**
 * HOJAI - Employee Twin Engine
 * Port: 5410
 *
 * Predicts employee behavior and reactions
 *
 * Features:
 * - Employee persona modeling
 * - Sentiment analysis
 * - Engagement prediction
 * - Retention risk
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

interface EmployeeSegment {
  id: string;
  name: string;
  persona: {
    role: string;
    level: string;
    tenure: string;
    performance: string;
  };
  sentiment: number;
  engagement: number;
  retentionRisk: number;
  satisfactionDrivers: string[];
  dissatisfactionDrivers: string[];
}

interface EmployeeReaction {
  segment: string;
  sentiment: number; // -1 to 1
  engagement: number; // 0 to 100
  retentionRisk: number; // 0 to 1
  productivityImpact: number; // -1 to 1
  keyFactors: string[];
}

interface TwinPrediction {
  eventId: string;
  eventType: string;
  reactions: EmployeeReaction[];
  overallSentiment: number;
  overallEngagement: number;
  retentionImpact: number;
  recommendations: string[];
}

// ============================================================================
// EMPLOYEE SEGMENTS
// ============================================================================

const SEGMENTS: EmployeeSegment[] = [
  {
    id: 'high-performer',
    name: 'High Performers',
    persona: { role: 'Senior', level: 'L5-L7', tenure: '3+ years', performance: 'Exceeds' },
    sentiment: 0.7,
    engagement: 85,
    retentionRisk: 0.2,
    satisfactionDrivers: ['Growth opportunities', 'Recognition', 'Challenging work'],
    dissatisfactionDrivers: ['Lack of promotion', 'Compensation', 'Politics']
  },
  {
    id: 'mid-performer',
    name: 'Mid Performers',
    persona: { role: 'Mid-level', level: 'L3-L5', tenure: '1-3 years', performance: 'Meets' },
    sentiment: 0.4,
    engagement: 65,
    retentionRisk: 0.4,
    satisfactionDrivers: ['Stability', 'Work-life balance', 'Learning'],
    dissatisfactionDrivers: ['Uncertainty', 'Lack of clarity', 'Overwork']
  },
  {
    id: 'new-hire',
    name: 'New Hires',
    persona: { role: 'Junior', level: 'L1-L3', tenure: '<1 year', performance: 'Developing' },
    sentiment: 0.5,
    engagement: 70,
    retentionRisk: 0.5,
    satisfactionDrivers: ['Onboarding', 'Mentorship', 'Culture fit'],
    dissatisfactionDrivers: ['Overwhelm', 'Imposter syndrome', 'Lack of support']
  },
  {
    id: 'tenured',
    name: 'Tenured Employees',
    persona: { role: 'Senior', level: 'L5+', tenure: '5+ years', performance: 'Variable' },
    sentiment: 0.3,
    engagement: 55,
    retentionRisk: 0.3,
    satisfactionDrivers: ['Stability', 'Benefits', 'Seniority'],
    dissatisfactionDrivers: ['Stagnation', 'Change resistance', 'Outdated processes']
  },
  {
    id: 'leadership',
    name: 'Leadership',
    persona: { role: 'Manager+', level: 'L8+', tenure: 'Variable', performance: 'Exceeds' },
    sentiment: 0.6,
    engagement: 80,
    retentionRisk: 0.15,
    satisfactionDrivers: ['Impact', 'Strategy', 'Team success'],
    dissatisfactionDrivers: ['Board pressure', 'Talent retention', 'Change management']
  }
];

// ============================================================================
// REACTION PREDICTION
// ============================================================================

function predictReaction(segment: EmployeeSegment, eventType: string, description: string): EmployeeReaction {
  const descLower = description.toLowerCase();
  let adjustment = 0;
  const keyFactors: string[] = [];

  if (eventType === 'layoffs') {
    adjustment = segment.id === 'tenured' ? 0.2 : segment.id === 'high-performer' ? -0.3 : -0.4;
    keyFactors.push('Job security', 'Team morale', 'Workload');
  } else if (eventType === 'promotion') {
    adjustment = segment.id === 'high-performer' ? 0.3 : segment.id === 'mid-performer' ? 0.2 : 0;
    keyFactors.push('Growth', 'Recognition', 'Fairness');
  } else if (eventType === 'remote_work') {
    adjustment = segment.persona.role === 'Senior' ? 0.2 : 0;
    keyFactors.push('Flexibility', 'Work-life balance', 'Collaboration');
  } else if (eventType === 'compensation_change') {
    adjustment = segment.id === 'high-performer' ? 0.3 : -0.1;
    keyFactors.push('Fairness', 'Market rates', 'Recognition');
  } else if (eventType === 'new_tool') {
    adjustment = segment.persona.level.includes('L1') ? -0.1 : 0.1;
    keyFactors.push('Learning curve', 'Efficiency', 'Adoption');
  } else if (eventType === 'culture_change') {
    adjustment = segment.id === 'tenured' ? -0.2 : 0.1;
    keyFactors.push('Change acceptance', 'Values alignment', 'Leadership trust');
  }

  // Calculate impacts
  const sentiment = Math.min(1, Math.max(-1, segment.sentiment + adjustment));
  const engagement = Math.min(100, Math.max(0, segment.engagement + adjustment * 30));
  const retentionRisk = Math.min(1, Math.max(0, segment.retentionRisk + (adjustment < 0 ? 0.1 : -0.05)));
  const productivityImpact = adjustment * 0.5;

  return {
    segment: segment.name,
    sentiment,
    engagement,
    retentionRisk,
    productivityImpact,
    keyFactors
  };
}

// ============================================================================
// ROUTES
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    service: 'employee-twin',
    status: 'healthy',
    version: '1.0.0',
    port: 5410,
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
  const retentionImpact = reactions.reduce((sum, r) => sum + r.retentionRisk, 0) / reactions.length;

  // Recommendations
  const recommendations: string[] = [];
  if (overallSentiment < 0.2) {
    recommendations.push('Consider communication strategy to address concerns');
    recommendations.push('Monitor high-performer sentiment closely');
  }
  if (retentionImpact > 0.4) {
    recommendations.push('Implement retention measures for at-risk segments');
    recommendations.push('Review compensation competitiveness');
  }
  if (overallEngagement < 60) {
    recommendations.push('Focus on engagement initiatives');
    recommendations.push('Gather feedback through pulse surveys');
  }

  const prediction: TwinPrediction = {
    eventId: `evt-${Date.now()}`,
    eventType,
    reactions,
    overallSentiment: Math.round(overallSentiment * 100) / 100,
    overallEngagement: Math.round(overallEngagement),
    retentionImpact: Math.round(retentionImpact * 100) / 100,
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

const PORT = process.env.PORT || 5410;
app.listen(PORT, () => {
  console.log(`Employee Twin running on port ${PORT}`);
});

export default app;