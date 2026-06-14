/**
 * AI Lead Scoring
 *
 * ML-powered lead scoring using:
 * - OpenAI for analysis
 * - Pattern matching for historical data
 * - Weighted scoring algorithm
 */

const { v4: uuidv4 } = require('uuid');

// Scoring weights
const WEIGHTS = {
  engagement: 0.25,
  demographic: 0.20,
  firmographic: 0.20,
  behavioral: 0.20,
  intent: 0.15
};

/**
 * Score a single prospect
 */
async function scoreProspect(prospect, options = {}) {
  const { useAI = true } = options;

  const scores = {
    engagement: await scoreEngagement(prospect),
    demographic: scoreDemographic(prospect),
    firmographic: scoreFirmographic(prospect),
    behavioral: scoreBehavioral(prospect),
    intent: await scoreIntent(prospect, useAI)
  };

  // Calculate weighted overall score
  const overall = Math.round(
    scores.engagement * WEIGHTS.engagement +
    scores.demographic * WEIGHTS.demographic +
    scores.firmographic * WEIGHTS.firmographic +
    scores.behavioral * WEIGHTS.behavioral +
    scores.intent * WEIGHTS.intent
  );

  // Determine tier
  const tier = getTier(overall);

  // Generate reasons
  const reasons = generateReasons(scores, prospect);

  return {
    scores,
    overall,
    tier,
    reasons,
    scoredAt: new Date().toISOString()
  };
}

/**
 * Score engagement level
 */
function scoreEngagement(prospect) {
  const engagement = prospect.engagement || {};
  let score = 0;

  // Email engagement
  if (engagement.emailsSent > 0) {
    score += Math.min(engagement.emailsSent * 5, 25);
  }
  if (engagement.emailsOpened > 0) {
    score += Math.min(engagement.emailsOpened * 10, 30);
  }
  if (engagement.emailsClicked > 0) {
    score += Math.min(engagement.emailsClicked * 15, 25);
  }
  if (engagement.emailsReplied > 0) {
    score += Math.min(engagement.emailsReplied * 20, 40);
  }

  // Other engagement
  if (engagement.callsConnected > 0) {
    score += Math.min(engagement.callsConnected * 15, 30);
  }
  if (engagement.meetings > 0) {
    score += Math.min(engagement.meetings * 25, 50);
  }
  if (engagement.linkedinMessages > 0) {
    score += Math.min(engagement.linkedinMessages * 5, 15);
  }
  if (engagement.whatsappMessages > 0) {
    score += Math.min(engagement.whatsappMessages * 5, 15);
  }

  return Math.min(score, 100);
}

/**
 * Score demographic factors
 */
function scoreDemographic(prospect) {
  let score = 0;

  // Seniority scoring
  const seniorityScores = {
    'C-level': 40,
    'VP': 35,
    'Director': 30,
    'Manager': 20,
    'IC': 10
  };
  score += seniorityScores[prospect.seniority] || 15;

  // Has direct contact info
  if (prospect.email) score += 15;
  if (prospect.phone) score += 10;

  // Complete name
  if (prospect.firstName && prospect.lastName) score += 10;

  // Has title
  if (prospect.title) score += 15;

  // Location (India tier 1)
  const tier1Cities = ['mumbai', 'bangalore', 'delhi', 'hyderabad', 'chennai', 'pune', 'gurgaon', 'noida'];
  if (prospect.location && tier1Cities.some(c => prospect.location.toLowerCase().includes(c))) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Score firmographic factors
 */
function scoreFirmographic(prospect) {
  let score = 0;

  // Company size
  if (prospect.companySize) {
    const size = parseInt(prospect.companySize) || 0;
    if (size >= 1000) score += 35;
    else if (size >= 500) score += 30;
    else if (size >= 200) score += 25;
    else if (size >= 50) score += 20;
    else if (size >= 10) score += 15;
    else score += 10;
  }

  // Company domain
  if (prospect.companyDomain) {
    score += 15;
    // Premium domains
    if (prospect.companyDomain.includes('.com')) score += 10;
  }

  // Industry match
  const targetIndustries = ['technology', 'saas', 'fintech', 'ecommerce', 'retail', 'healthcare'];
  if (prospect.industry && targetIndustries.some(i => prospect.industry.toLowerCase().includes(i))) {
    score += 20;
  }

  // Has company name
  if (prospect.company) score += 10;

  // Has LinkedIn
  if (prospect.linkedinUrl) score += 10;

  return Math.min(score, 100);
}

/**
 * Score behavioral factors
 */
function scoreBehavioral(prospect) {
  let score = 0;

  // Recency of last engagement
  const lastEngaged = prospect.lastEngagedAt ? new Date(prospect.lastEngagedAt) : null;
  const daysSince = lastEngaged ? Math.floor((Date.now() - lastEngaged.getTime()) / (1000 * 60 * 60 * 24)) : 999;

  if (daysSince === 0) score += 40;
  else if (daysSince <= 3) score += 35;
  else if (daysSince <= 7) score += 30;
  else if (daysSince <= 14) score += 20;
  else if (daysSince <= 30) score += 10;

  // Recency of creation
  const createdAt = prospect.createdAt ? new Date(prospect.createdAt) : null;
  const daysOld = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Fresh leads are better
  if (daysOld <= 7) score += 15;
  else if (daysOld <= 30) score += 10;

  // Source quality
  const sourceScores = {
    'gtm': 20,
    'linkedin': 25,
    'referral': 30,
    'api': 15,
    'import': 10
  };
  score += sourceScores[prospect.source] || 10;

  // Status progression
  const statusScores = {
    'new': 5,
    'contacted': 15,
    'qualified': 25,
    'engaged': 35,
    'customer': 40,
    'churned': 0
  };
  score += statusScores[prospect.status] || 5;

  return Math.min(score, 100);
}

/**
 * Score intent signals
 */
async function scoreIntent(prospect, useAI = true) {
  let score = 0;

  // Tag-based intent
  const highIntentTags = ['hot-lead', 'decision-maker', 'budget-approved', 'ready-to-buy', 'urgent'];
  const mediumIntentTags = ['interested', 'evaluating', 'comparison', 'review'];
  const lowIntentTags = ['cold', 'not-interested', 'unsubscribed'];

  const tags = prospect.tags || [];
  if (tags.some(t => highIntentTags.includes(t.toLowerCase()))) score += 50;
  else if (tags.some(t => mediumIntentTags.includes(t.toLowerCase()))) score += 30;
  else if (tags.some(t => lowIntentTags.includes(t.toLowerCase()))) score -= 30;

  // Pain point alignment
  const painPoints = prospect.painPoints || [];
  const targetPains = ['customer churn', 'high cac', 'low retention', 'no loyalty', 'engagement'];
  if (painPoints.some(p => targetPains.some(t => p.toLowerCase().includes(t)))) {
    score += 25;
  }

  // AI-powered intent analysis
  if (useAI && prospect.title && prospect.company) {
    try {
      const aiScore = await getAIIntentScore(prospect);
      score += aiScore;
    } catch (e) {
      // Fallback to rule-based
    }
  }

  // Competitor using indicator
  if (prospect.competitorUsing) {
    score += 15; // They're already in market
  }

  // Budget indicator
  if (prospect.budget && prospect.budget >= 10000) {
    score += 20;
  }

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Get AI-powered intent score
 */
async function getAIIntentScore(prospect) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-demo' });

    const prompt = `Analyze this prospect's buying intent (0-30 points):

Company: ${prospect.company}
Title: ${prospect.title}
Pain Points: ${(prospect.painPoints || []).join(', ') || 'None specified'}
Budget: ${prospect.budget ? '₹' + prospect.budget : 'Not specified'}

Return JSON: {"score": 0-30, "reason": "brief reason"}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 100
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.score || 0;
  } catch (e) {
    return 15; // Default mid-score
  }
}

/**
 * Get tier from score
 */
function getTier(score) {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

/**
 * Generate scoring reasons
 */
function generateReasons(scores, prospect) {
  const reasons = [];

  if (scores.engagement >= 70) {
    reasons.push('Highly engaged with previous outreach');
  } else if (scores.engagement >= 40) {
    reasons.push('Moderate engagement with campaigns');
  } else if (scores.engagement < 10 && prospect.engagement?.emailsSent > 0) {
    reasons.push('Has received emails but low engagement');
  }

  if (scores.demographic >= 60) {
    reasons.push(`${prospect.seniority || 'Senior'} decision-maker with complete contact info`);
  } else if (scores.demographic < 30) {
    reasons.push('Missing key contact information');
  }

  if (scores.firmographic >= 60) {
    reasons.push(`Strong company fit (${prospect.industry || prospect.company || 'target sector'})`);
  }

  if (scores.intent >= 60) {
    reasons.push('High intent signals detected');
  } else if (scores.intent >= 30) {
    reasons.push('Moderate buying signals');
  }

  // Seniority-based
  if (['C-level', 'VP'].includes(prospect.seniority)) {
    reasons.push('Executive level contact - high influence');
  }

  return reasons;
}

/**
 * Batch score prospects
 */
async function scoreBatch(prospects, options = {}) {
  const results = [];

  for (const prospect of prospects) {
    try {
      const scoring = await scoreProspect(prospect, options);
      results.push({
        prospectId: prospect.id,
        ...scoring
      });
    } catch (e) {
      results.push({
        prospectId: prospect.id,
        error: e.message
      });
    }
  }

  return results;
}

/**
 * Get cohort analysis
 */
function getCohortAnalysis(prospects) {
  // Group by creation date
  const cohorts = {};

  for (const prospect of prospects) {
    const cohort = prospect.createdAt ? new Date(prospect.createdAt).toISOString().split('T')[0] : 'unknown';
    if (!cohorts[cohort]) {
      cohorts[cohort] = { total: 0, byTier: { A: 0, B: 0, C: 0, D: 0 }, converted: 0 };
    }

    cohorts[cohort].total++;
    const score = prospect.scores?.overall || 50;
    if (score >= 80) cohorts[cohort].byTier.A++;
    else if (score >= 60) cohorts[cohort].byTier.B++;
    else if (score >= 40) cohorts[cohort].byTier.C++;
    else cohorts[cohort].byTier.D++;

    if (prospect.status === 'customer') {
      cohorts[cohort].converted++;
    }
  }

  return cohorts;
}

/**
 * Get scoring distribution
 */
function getDistribution(prospects) {
  const distribution = {
    A: { count: 0, prospects: [] },
    B: { count: 0, prospects: [] },
    C: { count: 0, prospects: [] },
    D: { count: 0, prospects: [] }
  };

  for (const prospect of prospects) {
    const score = prospect.scores?.overall || 50;
    const tier = getTier(score);
    distribution[tier].count++;
    distribution[tier].prospects.push({
      id: prospect.id,
      name: prospect.fullName,
      company: prospect.company,
      score
    });
  }

  return distribution;
}

module.exports = {
  scoreProspect,
  scoreBatch,
  scoreEngagement,
  scoreDemographic,
  scoreFirmographic,
  scoreBehavioral,
  scoreIntent,
  getTier,
  getCohortAnalysis,
  getDistribution,
  WEIGHTS
};