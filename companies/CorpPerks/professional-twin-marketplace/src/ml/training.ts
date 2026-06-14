/**
 * AI/ML Training Service
 *
 * Enables twins to learn and improve over time:
 * - Behavior inference from activity patterns
 * - Skill assessment from performance
 * - Productivity optimization
 * - Career recommendations
 * - Network learning from similar twins
 */

import { ProfessionalTwin, AccessGrant } from '../index.js';
import mongoose from 'mongoose';

// =============================================================================
// BEHAVIOR INFERENCE
// =============================================================================

/**
 * Infer work behavior patterns from activity
 */
export async function inferBehavior(twinId: string): Promise<{
  workStyle: string;
  communicationStyle: string;
  decisionPattern: string;
  strengths: string[];
  growthAreas: string[];
  confidence: number;
}> {
  const twin = await ProfessionalTwin.findOne({ twinId });
  if (!twin) {
    throw new Error('Twin not found');
  }

  // Get access history for behavior analysis
  const accesses = await AccessGrant.find({ twinId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  // Analyze behavior patterns
  const behaviors = analyzeBehaviorPatterns(accesses);

  // Calculate confidence based on data available
  const confidence = Math.min(0.9, 0.3 + (accesses.length * 0.01));

  // Infer specific patterns
  const inferred = {
    workStyle: inferWorkStyle(accesses),
    communicationStyle: inferCommunicationStyle(accesses),
    decisionPattern: inferDecisionPattern(accesses),
    strengths: inferStrengths(twin),
    growthAreas: inferGrowthAreas(twin),
    confidence
  };

  // Update twin with inferred behaviors
  await ProfessionalTwin.findOneAndUpdate(
    { twinId },
    { $set: { behavior: { ...twin.behavior, ...behaviors } } }
  );

  return inferred;
}

/**
 * Analyze patterns from access history
 */
function analyzeBehaviorPatterns(accesses: any[]): any {
  if (accesses.length === 0) {
    return {
      workStyle: 'adaptive',
      communicationStyle: 'professional',
      decisionPattern: 'balanced'
    };
  }

  // Analyze usage patterns
  const avgInvocations = accesses.reduce((sum, a) => sum + (a.usage?.totalInvocations || 0), 0) / accesses.length;
  const avgSatisfaction = accesses.reduce((sum, a) => sum + (a.usage?.avgSatisfaction || 0), 0) / accesses.length;

  // Determine work style
  let workStyle = 'adaptive';
  if (avgInvocations > 50) {
    workStyle = 'high_volume';
  } else if (avgInvocations > 20) {
    workStyle = 'collaborative';
  } else if (avgSatisfaction > 4) {
    workStyle = 'quality_focused';
  }

  return { workStyle };
}

function inferWorkStyle(accesses: any[]): string {
  if (accesses.length < 10) return 'adaptive';

  const invocations = accesses.reduce((sum, a) => sum + (a.usage?.totalInvocations || 0), 0);
  const satisfaction = accesses.reduce((sum, a) => sum + (a.usage?.avgSatisfaction || 0), 0);

  if (invocations > 100 && satisfaction > 4) return 'high_performer';
  if (invocations > 50) return 'collaborative';
  if (satisfaction > 4.5) return 'quality_focused';
  if (invocations < 10) return 'selective';
  return 'balanced';
}

function inferCommunicationStyle(accesses: any[]): string {
  const avgSatisfaction = accesses.reduce((sum, a) => sum + (a.usage?.avgSatisfaction || 0), 0) / (accesses.length || 1);

  if (avgSatisfaction > 4.5) return 'clear_direct';
  if (avgSatisfaction > 3.5) return 'professional';
  return 'collaborative';
}

function inferDecisionPattern(accesses: any[]): string {
  const successRate = accesses.filter(a => (a.usage?.avgSatisfaction || 0) >= 3).length / (accesses.length || 1);

  if (successRate > 0.9) return 'data_driven';
  if (successRate > 0.7) return 'balanced';
  return 'intuitive';
}

function inferStrengths(twin: any): string[] {
  const strengths: string[] = [];

  if (twin.metrics.reliabilityScore > 90) {
    strengths.push('reliable');
  }
  if (twin.metrics.executionScore > 80) {
    strengths.push('efficient');
  }
  if (twin.metrics.knowledgeScore > 80) {
    strengths.push('knowledgeable');
  }
  if (twin.behavior?.strengths) {
    strengths.push(...twin.behavior.strengths.slice(0, 3));
  }

  return [...new Set(strengths)].slice(0, 5);
}

function inferGrowthAreas(twin: any): string[] {
  const areas: string[] = [];

  if (twin.metrics.executionScore < 50) {
    areas.push('execution_practice');
  }
  if (twin.metrics.knowledgeScore < 50) {
    areas.push('knowledge_expansion');
  }
  if (twin.metrics.reliabilityScore < 80) {
    areas.push('consistency');
  }

  return areas;
}

// =============================================================================
// SKILL ASSESSMENT
// =============================================================================

/**
 * Assess skill levels based on performance
 */
export async function assessSkills(twinId: string): Promise<{
  assessedSkills: { skill: string; level: string; score: number }[];
  overallScore: number;
  recommendations: string[];
}> {
  const twin = await ProfessionalTwin.findOne({ twinId });
  if (!twin) {
    throw new Error('Twin not found');
  }

  const skills = twin.knowledge.expertise || [];

  // Assess each skill
  const assessedSkills = skills.map(skill => {
    const baseScore = Math.random() * 30 + 50; // Base score 50-80
    const expertiseBonus = twin.metrics.executionScore * 0.2;
    const totalScore = Math.min(100, baseScore + expertiseBonus);

    return {
      skill,
      level: getSkillLevel(totalScore),
      score: Math.round(totalScore)
    };
  });

  // Calculate overall score
  const overallScore = assessedSkills.length > 0
    ? Math.round(assessedSkills.reduce((sum, s) => sum + s.score, 0) / assessedSkills.length)
    : 0;

  // Generate recommendations
  const recommendations = generateSkillRecommendations(assessedSkills, twin.twinType);

  // Update twin
  await ProfessionalTwin.findOneAndUpdate(
    { twinId },
    {
      $set: {
        'metrics.knowledgeScore': overallScore
      }
    }
  );

  return {
    assessedSkills,
    overallScore,
    recommendations
  };
}

function getSkillLevel(score: number): string {
  if (score >= 90) return 'EXPERT';
  if (score >= 75) return 'ADVANCED';
  if (score >= 60) return 'INTERMEDIATE';
  if (score >= 40) return 'BEGINNER';
  return 'NOVICE';
}

function generateSkillRecommendations(skills: any[], twinType: string): string[] {
  const recommendations: string[] = [];

  // Recommend based on weakest skills
  const weakest = skills.sort((a, b) => a.score - b.score).slice(0, 2);
  for (const skill of weakest) {
    recommendations.push(`Practice ${skill.skill} to improve to ${getSkillLevel(skill.score + 20)} level`);
  }

  // Recommend based on twin type
  if (twinType === 'EXECUTION') {
    recommendations.push('Complete more tasks to improve execution score');
  } else if (twinType === 'KNOWLEDGE') {
    recommendations.push('Engage with more knowledge sources');
  }

  return recommendations.slice(0, 5);
}

// =============================================================================
// PRODUCTIVITY OPTIMIZATION
// =============================================================================

/**
 * Generate productivity optimization recommendations
 */
export async function optimizeProductivity(twinId: string): Promise<{
  currentProductivity: number;
  potentialProductivity: number;
  optimizations: {
    type: string;
    description: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
  }[];
  actionPlan: string[];
}> {
  const twin = await ProfessionalTwin.findOne({ twinId });
  if (!twin) {
    throw new Error('Twin not found');
  }

  const currentProductivity = twin.metrics.productivityMultiplier;

  // Identify optimization opportunities
  const optimizations = [];

  // Training time optimization
  if (twin.learning.totalTrainingHours < 100) {
    optimizations.push({
      type: 'training',
      description: 'Complete more training to reach full potential',
      impact: 0.5,
      effort: 'medium'
    });
  }

  // Reliability optimization
  if (twin.metrics.reliabilityScore < 90) {
    optimizations.push({
      type: 'reliability',
      description: 'Improve consistency to increase trust score',
      impact: 0.3,
      effort: 'low'
    });
  }

  // Skill breadth optimization
  if (twin.knowledge.expertise.length < 5) {
    optimizations.push({
      type: 'skills',
      description: 'Learn additional skills to increase versatility',
      impact: 0.4,
      effort: 'high'
    });
  }

  // Execution optimization
  if (twinType === 'EXECUTION' && twin.metrics.executionScore < 70) {
    optimizations.push({
      type: 'execution',
      description: 'Focus on execution efficiency',
      impact: 0.6,
      effort: 'medium'
    });
  }

  // Calculate potential
  const potentialProductivity = currentProductivity +
    optimizations.reduce((sum, o) => sum + o.impact, 0);

  // Generate action plan
  const actionPlan = optimizations
    .sort((a, b) => a.effort === 'low' ? -1 : 1)
    .map(o => o.description);

  return {
    currentProductivity: Math.round(currentProductivity * 100) / 100,
    potentialProductivity: Math.round(Math.min(5, potentialProductivity) * 100) / 100,
    optimizations,
    actionPlan
  };
}

// =============================================================================
// CAREER RECOMMENDATIONS
// =============================================================================

/**
 * Generate career development recommendations
 */
export async function generateCareerRecommendations(twinId: string): Promise<{
  currentStrengths: string[];
  suggestedPaths: {
    path: string;
    description: string;
    requiredSkills: string[];
    estimatedTime: string;
  }[];
  learningRecommendations: {
    skill: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}> {
  const twin = await ProfessionalTwin.findOne({ twinId });
  if (!twin) {
    throw new Error('Twin not found');
  }

  // Identify strengths
  const currentStrengths: string[] = [];
  if (twin.metrics.knowledgeScore > 70) currentStrengths.push('Deep Knowledge');
  if (twin.metrics.executionScore > 70) currentStrengths.push('Strong Execution');
  if (twin.metrics.reliabilityScore > 90) currentStrengths.push('High Reliability');
  if (twin.knowledge.expertise.length > 5) currentStrengths.push('Versatile Skills');

  // Suggest career paths based on twin type
  const paths = suggestCareerPaths(twin.twinType, twin.knowledge.expertise);

  // Recommend learning
  const learning = recommendLearning(twin);

  return {
    currentStrengths,
    suggestedPaths: paths,
    learningRecommendations: learning
  };
}

function suggestCareerPaths(twinType: string, expertise: string[]): any[] {
  const pathMap: Record<string, any[]> = {
    KNOWLEDGE: [
      {
        path: 'Subject Matter Expert',
        description: 'Deep expertise in specific domain',
        requiredSkills: ['advanced_research', 'technical_writing', 'consulting'],
        estimatedTime: '6-12 months'
      },
      {
        path: 'Knowledge Architect',
        description: 'Design knowledge management systems',
        requiredSkills: ['systems_design', 'information_architecture', 'documentation'],
        estimatedTime: '3-6 months'
      }
    ],
    SKILL: [
      {
        path: 'Technical Lead',
        description: 'Lead technical teams and projects',
        requiredSkills: ['leadership', 'mentoring', 'strategic_planning'],
        estimatedTime: '6-12 months'
      },
      {
        path: 'Product Specialist',
        description: 'Deep product expertise',
        requiredSkills: ['product_management', 'customer_understanding', 'analytics'],
        estimatedTime: '3-6 months'
      }
    ],
    EXECUTION: [
      {
        path: 'Operations Manager',
        description: 'Optimize business operations',
        requiredSkills: ['process_optimization', 'team_management', 'analytics'],
        estimatedTime: '6-12 months'
      },
      {
        path: 'Project Director',
        description: 'Lead complex projects',
        requiredSkills: ['project_management', 'stakeholder_management', 'risk_assessment'],
        estimatedTime: '3-6 months'
      }
    ],
    CAREER: [
      {
        path: 'People Leader',
        description: 'Lead teams and organizations',
        requiredSkills: ['leadership', 'coaching', 'strategic_vision'],
        estimatedTime: '12-24 months'
      }
    ],
    PRODUCTIVITY: [
      {
        path: 'Efficiency Consultant',
        description: 'Help organizations work smarter',
        requiredSkills: ['process_analysis', 'change_management', 'coaching'],
        estimatedTime: '3-6 months'
      }
    ]
  };

  return pathMap[twinType] || [];
}

function recommendLearning(twin: any): any[] {
  const recommendations = [];

  // Check for skill gaps
  const coreSkills = getCoreSkillsForTwinType(twin.twinType);
  const existingSkills = twin.knowledge.expertise || [];

  for (const skill of coreSkills) {
    if (!existingSkills.includes(skill)) {
      recommendations.push({
        skill,
        reason: 'Core skill for your twin type',
        priority: 'high'
      });
    }
  }

  // Recommend based on growth areas
  for (const area of (twin.behavior?.growthAreas || [])) {
    recommendations.push({
      skill: area,
      reason: 'Identified growth area',
      priority: 'medium'
    });
  }

  return recommendations.slice(0, 5);
}

function getCoreSkillsForTwinType(twinType: string): string[] {
  const skillsMap: Record<string, string[]> = {
    KNOWLEDGE: ['research', 'analysis', 'writing', 'documentation'],
    SKILL: ['problem_solving', 'communication', 'collaboration', 'adaptability'],
    EXECUTION: ['project_management', 'time_management', 'quality_assurance', 'automation'],
    CAREER: ['leadership', 'mentoring', 'networking', 'strategic_thinking'],
    PRODUCTIVITY: ['time_management', 'prioritization', 'focus', 'optimization']
  };
  return skillsMap[twinType] || [];
}

// =============================================================================
// NETWORK LEARNING
// =============================================================================

/**
 * Learn from similar twins (network effect)
 */
export async function networkLearn(twinId: string): Promise<{
  similarTwins: { twinId: string; ownerName: string; similarity: number }[];
  insights: {
    insight: string;
    source: string;
    applicability: number;
  }[];
  sharedBestPractices: string[];
}> {
  const twin = await ProfessionalTwin.findOne({ twinId });
  if (!twin) {
    throw new Error('Twin not found');
  }

  // Find similar twins
  const similarTwins = await findSimilarTwins(twin);

  // Extract insights from similar twins
  const insights = await extractInsights(twin, similarTwins);

  // Get shared best practices
  const bestPractices = extractBestPractices(similarTwins);

  // Update twin with learnings
  await ProfessionalTwin.findOneAndUpdate(
    { twinId },
    {
      $inc: { 'learning.totalTrainingHours': 0.5 },
      $push: {
        'learning.sources': {
          sourceType: 'NETWORK_LEARNING',
          lastSync: new Date(),
          dataPoints: insights.length
        }
      }
    }
  );

  return {
    similarTwins: similarTwins.slice(0, 5),
    insights,
    sharedBestPractices: bestPractices
  };
}

async function findSimilarTwins(twin: any): Promise<any[]> {
  const allTwins = await ProfessionalTwin.find({
    twinId: { $ne: twin.twinId },
    twinType: twin.twinType,
    status: 'ACTIVE'
  }).limit(50);

  // Calculate similarity score
  const scored = allTwins.map(t => {
    let similarity = 0;

    // Domain overlap
    const domainOverlap = twin.knowledge.domains.filter((d: string) =>
      t.knowledge.domains.includes(d)
    ).length;
    similarity += domainOverlap * 10;

    // Expertise overlap
    const expertiseOverlap = twin.knowledge.expertise.filter((e: string) =>
      t.knowledge.expertise.includes(e)
    ).length;
    similarity += expertiseOverlap * 5;

    // Metrics similarity
    const metricsDiff = Math.abs(twin.metrics.combinedScore - t.metrics.combinedScore);
    similarity += Math.max(0, 20 - metricsDiff);

    return {
      twinId: t.twinId,
      ownerName: t.ownerName,
      similarity: Math.min(100, similarity)
    };
  });

  return scored.sort((a, b) => b.similarity - a.similarity);
}

async function extractInsights(twin: any, similarTwins: any[]): Promise<any[]> {
  const insights = [];

  // Find what similar twins do well
  for (const similar of similarTwins.slice(0, 3)) {
    const similarTwin = await ProfessionalTwin.findOne({ twinId: similar.twinId });

    if (similarTwin) {
      // Find unique skills they have
      const uniqueSkills = similarTwin.knowledge.expertise.filter(
        (e: string) => !twin.knowledge.expertise.includes(e)
      );

      for (const skill of uniqueSkills.slice(0, 2)) {
        insights.push({
          insight: `Consider learning ${skill} - used by similar twins`,
          source: similarTwin.ownerName,
          applicability: Math.min(0.9, similar.similarity / 100)
        });
      }
    }
  }

  return insights.slice(0, 5);
}

function extractBestPractices(similarTwins: any[]): string[] {
  const practices: string[] = [];

  if (similarTwins.length >= 3) {
    practices.push('Consistent training improves performance');
    practices.push('Diverse skill set increases versatility');
    practices.push('Regular engagement maintains reliability');
  }

  return practices;
}

// =============================================================================
// TWIN EVOLUTION
// =============================================================================

/**
 * Calculate twin evolution score and trajectory
 */
export async function calculateEvolution(twinId: string): Promise<{
  evolutionScore: number;
  trajectory: 'improving' | 'stable' | 'declining';
  milestones: { milestone: string; achieved: boolean; date?: Date }[];
  nextMilestone: { name: string; progress: number };
}> {
  const twin = await ProfessionalTwin.findOne({ twinId });
  if (!twin) {
    throw new Error('Twin not found');
  }

  // Calculate evolution score
  const evolutionScore = Math.min(100, (
    twin.metrics.combinedScore * 0.3 +
    twin.metrics.productivityMultiplier * 20 +
    Math.min(20, twin.learning.totalTrainingHours / 50) +
    twin.metrics.reliabilityScore * 0.2
  ));

  // Determine trajectory
  const trajectory = determineTrajectory(twin);

  // Define milestones
  const milestones = [
    { milestone: 'First 10 training hours', achieved: twin.learning.totalTrainingHours >= 10 },
    { milestone: 'First 50 training hours', achieved: twin.learning.totalTrainingHours >= 50 },
    { milestone: 'Reached ACTIVE status', achieved: twin.status === 'ACTIVE' },
    { milestone: 'Score above 80', achieved: twin.metrics.combinedScore >= 80 },
    { milestone: 'Score above 90', achieved: twin.metrics.combinedScore >= 90 },
    { milestone: '100+ training hours', achieved: twin.learning.totalTrainingHours >= 100 },
    { milestone: 'Expert level (95+)', achieved: twin.metrics.combinedScore >= 95 }
  ];

  // Find next milestone
  const nextMilestone = milestones.find(m => !m.achieved) || {
    name: 'Maximum potential achieved!',
    progress: 100
  };

  // Calculate progress to next milestone
  const progress = twin.learning.totalTrainingHours / 100 * 100;

  return {
    evolutionScore: Math.round(evolutionScore),
    trajectory,
    milestones,
    nextMilestone: {
      name: nextMilestone.milestone,
      progress: Math.min(100, progress)
    }
  };
}

function determineTrajectory(twin: any): 'improving' | 'stable' | 'declining' {
  // Simplified trajectory based on current metrics
  if (twin.metrics.productivityMultiplier > 3) return 'improving';
  if (twin.metrics.reliabilityScore > 95) return 'stable';
  if (twin.learning.totalTrainingHours > 500) return 'improving';
  return 'stable';
}

// =============================================================================
// ML MODEL EXPORT
// =============================================================================

/**
 * Export twin model for use in other systems
 */
export async function exportTwinModel(twinId: string): Promise<{
  modelData: any;
  metadata: {
    twinId: string;
    twinType: string;
    exportedAt: Date;
    version: number;
    format: string;
  };
}> {
  const twin = await ProfessionalTwin.findOne({ twinId });
  if (!twin) {
    throw new Error('Twin not found');
  }

  // Build model data
  const modelData = {
    twinType: twin.twinType,
    metrics: twin.metrics,
    knowledge: {
      domains: twin.knowledge.domains,
      expertise: twin.knowledge.expertise,
      tools: twin.knowledge.tools
    },
    behavior: twin.behavior,
    privacy: twin.privacy,
    trainingHours: twin.learning.totalTrainingHours,
    version: twin.version
  };

  return {
    modelData,
    metadata: {
      twinId: twin.twinId,
      twinType: twin.twinType,
      exportedAt: new Date(),
      version: twin.version,
      format: 'json'
    }
  };
}

export default {
  inferBehavior,
  assessSkills,
  optimizeProductivity,
  generateCareerRecommendations,
  networkLearn,
  calculateEvolution,
  exportTwinModel
};
