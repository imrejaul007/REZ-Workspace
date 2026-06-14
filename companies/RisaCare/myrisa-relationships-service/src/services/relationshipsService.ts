import { v4 as uuidv4 } from 'uuid';
import {
  Relationship,
  InteractionRecord,
  RelationshipGoal,
  RelationshipHealthScore,
  AddRelationshipInput,
  LogInteractionInput,
  SetGoalInput,
  Partner,
  InteractionTypeValue
} from '../models/relationships.js';
import {
  RelationshipStatus,
  InteractionType,
  GoalStatus
} from '../models/relationships.js';

// In-memory storage (in production, replace with database)
class InMemoryStore {
  relationships: Map<string, Relationship> = new Map();
  interactions: Map<string, InteractionRecord[]> = new Map(); // relationshipId -> interactions
  goals: Map<string, RelationshipGoal[]> = new Map(); // userId -> goals

  clear() {
    this.relationships.clear();
    this.interactions.clear();
    this.goals.clear();
  }
}

const store = new InMemoryStore();

export class RelationshipsService {
  /**
   * Add a new relationship for a user
   */
  addRelationship(userId: string, data: AddRelationshipInput): Relationship {
    const partnerId = uuidv4();
    const relationshipId = uuidv4();
    const now = new Date().toISOString();

    const partner: Partner = {
      id: partnerId,
      name: data.partner.name,
      birthday: data.partner.birthday,
      anniversary: data.partner.anniversary,
      photoUrl: data.partner.photoUrl,
      notes: data.partner.notes
    };

    const relationship: Relationship = {
      id: relationshipId,
      userId,
      partner,
      status: data.status || RelationshipStatus.ACTIVE,
      startDate: data.startDate || now.split('T')[0],
      qualityScore: 5,
      communicationScore: 5,
      intimacyScore: 5,
      trustScore: 5,
      conflictResolutionScore: 5,
      createdAt: now,
      updatedAt: now
    };

    store.relationships.set(relationshipId, relationship);
    store.interactions.set(relationshipId, []);

    return relationship;
  }

  /**
   * Get all relationships for a user
   */
  getRelationships(userId: string): Relationship[] {
    return Array.from(store.relationships.values())
      .filter(r => r.userId === userId && r.status !== RelationshipStatus.ENDED)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get a single relationship by ID
   */
  getRelationship(relationshipId: string): Relationship | undefined {
    return store.relationships.get(relationshipId);
  }

  /**
   * Update a relationship
   */
  updateRelationship(relationshipId: string, updates: Partial<Relationship>): Relationship | undefined {
    const relationship = store.relationships.get(relationshipId);
    if (!relationship) return undefined;

    const updated: Relationship = {
      ...relationship,
      ...updates,
      id: relationship.id, // prevent ID change
      userId: relationship.userId, // prevent user change
      partner: updates.partner ? { ...relationship.partner, ...updates.partner } : relationship.partner,
      updatedAt: new Date().toISOString()
    };

    store.relationships.set(relationshipId, updated);
    return updated;
  }

  /**
   * Delete (archive) a relationship
   */
  deleteRelationship(relationshipId: string): boolean {
    const relationship = store.relationships.get(relationshipId);
    if (!relationship) return false;

    relationship.status = RelationshipStatus.ENDED;
    relationship.updatedAt = new Date().toISOString();
    store.relationships.set(relationshipId, relationship);
    return true;
  }

  /**
   * Log a new interaction for a relationship
   */
  logInteraction(relationshipId: string, data: LogInteractionInput): InteractionRecord | undefined {
    const relationship = store.relationships.get(relationshipId);
    if (!relationship) return undefined;

    // Normalize conflicts to ensure resolved is always boolean
    const normalizedConflicts = (data.conflicts ?? []).map(c => ({
      description: c.description,
      resolution: c.resolution,
      resolved: c.resolved ?? false
    }));

    const interaction: InteractionRecord = {
      id: uuidv4(),
      relationshipId,
      type: data.type,
      date: data.date || new Date().toISOString().split('T')[0],
      duration: data.duration,
      quality: data.quality ?? 3,
      notes: data.notes,
      tags: data.tags ?? [],
      conflicts: normalizedConflicts,
      createdAt: new Date().toISOString()
    };

    const interactions = store.interactions.get(relationshipId) || [];
    interactions.push(interaction);
    store.interactions.set(relationshipId, interactions);

    // Update relationship scores based on interaction
    this.updateRelationshipScoresFromInteraction(relationshipId, interaction);

    return interaction;
  }

  /**
   * Update relationship scores based on a new interaction
   */
  private updateRelationshipScoresFromInteraction(relationshipId: string, interaction: InteractionRecord): void {
    const relationship = store.relationships.get(relationshipId);
    if (!relationship) return;

    const interactions = store.interactions.get(relationshipId) || [];
    const recentInteractions = this.getRecentInteractions(interactions, 30);

    // Calculate new average scores
    const qualityScores = recentInteractions.map(i => i.quality);
    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 3;

    // Communication score based on calls and messages
    const communicationTypes: InteractionTypeValue[] = [InteractionType.CALL, InteractionType.VIDEO_CALL, InteractionType.TEXT];
    const communicationCount = recentInteractions.filter(
      i => communicationTypes.includes(i.type as InteractionTypeValue)
    ).length;
    const communicationScore = Math.min(10, Math.max(1, communicationCount / recentInteractions.length * 5));

    // Conflict resolution score based on resolved conflicts
    const conflicts = recentInteractions.flatMap(i => i.conflicts);
    const resolvedConflicts = conflicts.filter(c => c.resolved).length;
    const conflictResolutionScore = conflicts.length > 0
      ? (resolvedConflicts / conflicts.length) * 10
      : 5;

    // Intimacy score based on quality time and sentimental moments
    const intimateTypes: InteractionTypeValue[] = [InteractionType.DATE, InteractionType.QUALITY_TIME, InteractionType.SENTIMENTAL_MOMENT];
    const intimateCount = recentInteractions.filter(
      i => intimateTypes.includes(i.type as InteractionTypeValue)
    ).length;
    const intimacyScore = Math.min(10, Math.max(1, intimateCount / recentInteractions.length * 10));

    // Update relationship
    relationship.qualityScore = Math.round(avgQuality * 10) / 10;
    relationship.communicationScore = Math.round(communicationScore * 10) / 10;
    relationship.intimacyScore = Math.round(intimacyScore * 10) / 10;
    relationship.conflictResolutionScore = Math.round(conflictResolutionScore * 10) / 10;
    relationship.updatedAt = new Date().toISOString();

    store.relationships.set(relationshipId, relationship);
  }

  /**
   * Get recent interactions (last N days)
   */
  private getRecentInteractions(interactions: InteractionRecord[], days: number): InteractionRecord[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return interactions.filter(i => new Date(i.date) >= cutoffDate);
  }

  /**
   * Get interactions for a relationship
   */
  getInteractions(relationshipId: string, days?: number): InteractionRecord[] {
    const interactions = store.interactions.get(relationshipId) || [];

    if (days) {
      return this.getRecentInteractions(interactions, days);
    }

    return interactions.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  /**
   * Calculate relationship health score for a user
   */
  getRelationshipHealth(userId: string): RelationshipHealthScore {
    const relationships = this.getRelationships(userId);

    if (relationships.length === 0) {
      return {
        userId,
        overallScore: 0,
        communicationScore: 0,
        intimacyScore: 0,
        trustScore: 0,
        conflictResolutionScore: 0,
        qualityTimeScore: 0,
        emotionalSupportScore: 0,
        growthScore: 0,
        trend: 'stable',
        recentInteractions: 0,
        calculatedAt: new Date().toISOString()
      };
    }

    // Calculate averages across all relationships
    const avgScores = {
      quality: 0,
      communication: 0,
      intimacy: 0,
      trust: 0,
      conflictResolution: 0
    };

    relationships.forEach(r => {
      avgScores.quality += r.qualityScore;
      avgScores.communication += r.communicationScore;
      avgScores.intimacy += r.intimacyScore;
      avgScores.trust += r.trustScore;
      avgScores.conflictResolution += r.conflictResolutionScore;
    });

    const count = relationships.length;
    avgScores.quality /= count;
    avgScores.communication /= count;
    avgScores.intimacy /= count;
    avgScores.trust /= count;
    avgScores.conflictResolution /= count;

    // Count recent interactions
    let totalRecentInteractions = 0;
    relationships.forEach(r => {
      const interactions = store.interactions.get(r.id) || [];
      totalRecentInteractions += this.getRecentInteractions(interactions, 30).length;
    });

    // Calculate trend (compare last 7 days vs previous 7 days)
    const trend = this.calculateTrend(relationships);

    // Convert 0-10 scores to 0-100
    return {
      userId,
      overallScore: Math.round((avgScores.quality + avgScores.communication + avgScores.intimacy + avgScores.trust + avgScores.conflictResolution) / 5 * 10),
      communicationScore: Math.round(avgScores.communication * 10),
      intimacyScore: Math.round(avgScores.intimacy * 10),
      trustScore: Math.round(avgScores.trust * 10),
      conflictResolutionScore: Math.round(avgScores.conflictResolution * 10),
      qualityTimeScore: Math.round(avgScores.quality * 10),
      emotionalSupportScore: Math.round((avgScores.communication + avgScores.intimacy) / 2 * 10),
      growthScore: Math.round(avgScores.quality * 10), // Placeholder
      trend,
      recentInteractions: totalRecentInteractions,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate trend by comparing interaction frequency
   */
  private calculateTrend(relationships: Relationship[]): 'improving' | 'stable' | 'declining' {
    const now = new Date();
    const lastWeekCutoff = new Date(now);
    lastWeekCutoff.setDate(lastWeekCutoff.getDate() - 7);
    const twoWeeksAgoCutoff = new Date(now);
    twoWeeksAgoCutoff.setDate(twoWeeksAgoCutoff.getDate() - 14);

    let thisWeekCount = 0;
    let lastWeekCount = 0;

    relationships.forEach(r => {
      const interactions = store.interactions.get(r.id) || [];
      interactions.forEach(i => {
        const date = new Date(i.date);
        if (date >= lastWeekCutoff) {
          thisWeekCount++;
        } else if (date >= twoWeeksAgoCutoff) {
          lastWeekCount++;
        }
      });
    });

    if (thisWeekCount > lastWeekCount * 1.2) return 'improving';
    if (thisWeekCount < lastWeekCount * 0.8) return 'declining';
    return 'stable';
  }

  /**
   * Set a relationship goal for a user
   */
  setRelationshipGoal(userId: string, data: SetGoalInput): RelationshipGoal {
    const goal: RelationshipGoal = {
      id: uuidv4(),
      userId,
      relationshipId: data.relationshipId,
      title: data.title,
      description: data.description,
      targetDate: data.targetDate,
      status: GoalStatus.ACTIVE,
      priority: data.priority || 'medium',
      progress: 0,
      metrics: data.metrics ? {
        targetValue: data.metrics.targetValue,
        currentValue: data.metrics.currentValue || 0,
        unit: data.metrics.unit
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const goals = store.goals.get(userId) || [];
    goals.push(goal);
    store.goals.set(userId, goals);

    return goal;
  }

  /**
   * Get goals for a user
   */
  getGoals(userId: string, relationshipId?: string): RelationshipGoal[] {
    const goals = store.goals.get(userId) || [];
    return goals
      .filter(g => !relationshipId || g.relationshipId === relationshipId)
      .filter(g => g.status === GoalStatus.ACTIVE)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  /**
   * Update goal progress
   */
  updateGoalProgress(goalId: string, userId: string, progress: number, currentValue?: number): RelationshipGoal | undefined {
    const goals = store.goals.get(userId);
    if (!goals) return undefined;

    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return undefined;

    const goal = goals[goalIndex];
    goal.progress = Math.min(100, Math.max(0, progress));
    if (currentValue !== undefined && goal.metrics) {
      goal.metrics.currentValue = currentValue;
    }
    if (goal.metrics?.targetValue && goal.metrics?.currentValue) {
      goal.progress = Math.round((goal.metrics.currentValue / goal.metrics.targetValue) * 100);
    }
    if (goal.progress >= 100) {
      goal.status = GoalStatus.ACHIEVED;
    }
    goal.updatedAt = new Date().toISOString();

    goals[goalIndex] = goal;
    store.goals.set(userId, goals);

    return goal;
  }

  /**
   * Generate relationship insights for a user
   */
  getInsights(userId: string): {
    summary: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    upcomingMilestones: { type: string; date: string; description: string }[];
    communicationPattern: { avgFrequency: string; preferredType: string };
    qualityTimeAnalysis: { avgQualityScore: number; trend: string };
  } {
    const relationships = this.getRelationships(userId);
    const healthScore = this.getRelationshipHealth(userId);
    const goals = this.getGoals(userId);

    // Calculate strengths
    const strengths: string[] = [];
    if (healthScore.communicationScore >= 70) {
      strengths.push('Strong communication with your partner');
    }
    if (healthScore.trustScore >= 70) {
      strengths.push('High trust levels in your relationship');
    }
    if (healthScore.intimacyScore >= 70) {
      strengths.push('Good quality time and emotional connection');
    }
    if (healthScore.conflictResolutionScore >= 70) {
      strengths.push('Healthy conflict resolution skills');
    }

    // Calculate areas for improvement
    const areasForImprovement: string[] = [];
    if (healthScore.communicationScore < 50) {
      areasForImprovement.push('Consider scheduling more regular check-ins');
    }
    if (healthScore.trustScore < 50) {
      areasForImprovement.push('Focus on building trust through consistent actions');
    }
    if (healthScore.intimacyScore < 50) {
      areasForImprovement.push('Plan more quality time activities together');
    }
    if (healthScore.conflictResolutionScore < 50) {
      areasForImprovement.push('Work on healthy communication during disagreements');
    }
    if (healthScore.qualityTimeScore < 50) {
      areasForImprovement.push('Set aside dedicated time for your relationship');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (relationships.length > 0) {
      const recentInteractions = this.getInteractions(relationships[0].id, 7);
      if (recentInteractions.length < 2) {
        recommendations.push('Schedule at least one quality conversation this week');
      }
    }
    if (goals.length === 0) {
      recommendations.push('Set a relationship goal to track your progress');
    }
    if (healthScore.recentInteractions < 10) {
      recommendations.push('Try to increase your interaction frequency gradually');
    }
    if (healthScore.trend === 'declining') {
      recommendations.push('Your interaction frequency has been declining - consider planning a date soon');
    }

    // Calculate communication pattern
    const allInteractions: InteractionRecord[] = [];
    relationships.forEach(r => {
      allInteractions.push(...this.getInteractions(r.id, 30));
    });

    const interactionCount = allInteractions.length;
    const avgFrequency = interactionCount >= 30 ? 'daily' :
                         interactionCount >= 15 ? 'every other day' :
                         interactionCount >= 7 ? 'weekly' : 'less than weekly';

    const typeCounts: Record<string, number> = {};
    allInteractions.forEach(i => {
      typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
    });
    const preferredType = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'in_person';

    // Calculate quality time analysis
    const avgQualityScore = allInteractions.length > 0
      ? allInteractions.reduce((sum, i) => sum + i.quality, 0) / allInteractions.length
      : 0;

    const qualityTimeTrend = healthScore.trend;

    // Find upcoming milestones
    const upcomingMilestones: { type: string; date: string; description: string }[] = [];
    relationships.forEach(r => {
      if (r.partner.anniversary) {
        const anniversary = new Date(r.partner.anniversary);
        const today = new Date();
        const daysUntil = Math.ceil((anniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil > 0 && daysUntil <= 30) {
          upcomingMilestones.push({
            type: 'anniversary',
            date: r.partner.anniversary,
            description: `Anniversary with ${r.partner.name} in ${daysUntil} days`
          });
        }
      }
      if (r.partner.birthday) {
        const birthday = new Date(r.partner.birthday);
        const today = new Date();
        birthday.setFullYear(today.getFullYear());
        const daysUntil = Math.ceil((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil > 0 && daysUntil <= 30) {
          upcomingMilestones.push({
            type: 'birthday',
            date: birthday.toISOString().split('T')[0],
            description: `${r.partner.name}'s birthday in ${daysUntil} days`
          });
        }
      }
    });

    // Generate summary
    let summary = `You have ${relationships.length} active relationship${relationships.length !== 1 ? 's' : ''}. `;
    if (healthScore.overallScore >= 70) {
      summary += 'Your relationship health looks positive with good overall scores.';
    } else if (healthScore.overallScore >= 40) {
      summary += 'There is room for improvement in your relationship health.';
    } else {
      summary += 'Consider focusing more on nurturing your relationships.';
    }

    return {
      summary,
      strengths: strengths.length > 0 ? strengths : ['Keep up the good work in your relationship'],
      areasForImprovement,
      recommendations,
      upcomingMilestones,
      communicationPattern: {
        avgFrequency,
        preferredType: preferredType.replace('_', ' ')
      },
      qualityTimeAnalysis: {
        avgQualityScore: Math.round(avgQualityScore * 10) / 10,
        trend: qualityTimeTrend
      }
    };
  }
}

// Export singleton instance
export const relationshipsService = new RelationshipsService();
