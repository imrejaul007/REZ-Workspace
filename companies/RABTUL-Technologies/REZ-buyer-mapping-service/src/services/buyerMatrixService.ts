import { BuyerMatrix, Contact, StakeholderMap, IStakeholderMap } from '../models/BuyerMapping';

export interface CoverageAnalysis {
  overall: number;
  economic: number;
  technical: number;
  champion: number;
  executive: number;
}

export interface GapAnalysis {
  type: 'missing_role' | 'low_influence' | 'disengaged' | 'negative';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  priority: number;
}

export interface Recommendation {
  action: string;
  targetContactId?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

export class BuyerMatrixService {
  /**
   * Calculate coverage scores based on stakeholder map
   */
  static calculateCoverage(map: IStakeholderMap): CoverageAnalysis {
    const contacts = map.contacts;
    let economicCount = 0;
    let economicEngaged = 0;
    let technicalCount = 0;
    let technicalEngaged = 0;
    let championCount = 0;
    let championEngaged = 0;
    let executiveCount = 0;
    let executiveEngaged = 0;

    for (const contactId of contacts) {
      const contact = contactId as unknown as typeof contactId & { decisionRole?: string; engagementLevel?: string };
      if (!contact || typeof contact === 'string') continue;

      const role = contact.decisionRole;
      const engagement = contact.engagementLevel;
      const isEngaged = engagement && ['high', 'champion'].includes(engagement);

      if (role === 'economic_buyer' || role === 'executive_sponsor') {
        economicCount++;
        if (isEngaged) economicEngaged++;
      }

      if (role === 'technical_buyer' || role === 'influencer') {
        technicalCount++;
        if (isEngaged) technicalEngaged++;
      }

      if (role === 'champion') {
        championCount++;
        if (isEngaged) championEngaged++;
      }

      if (role === 'executive_sponsor') {
        executiveCount++;
        if (isEngaged) executiveEngaged++;
      }
    }

    // Calculate percentages
    const economic = economicCount > 0 ? (economicEngaged / economicCount) * 100 : 0;
    const technical = technicalCount > 0 ? (technicalEngaged / technicalCount) * 100 : 0;
    const champion = championCount > 0 ? (championEngaged / championCount) * 100 : 0;
    const executive = executiveCount > 0 ? (executiveEngaged / executiveCount) * 100 : 0;

    // Overall is weighted average
    const overall = (economic * 0.3 + technical * 0.25 + champion * 0.25 + executive * 0.2);

    return {
      overall: Math.round(overall),
      economic: Math.round(economic),
      technical: Math.round(technical),
      champion: Math.round(champion),
      executive: Math.round(executive)
    };
  }

  /**
   * Generate gap analysis for a deal
   */
  static async generateGapAnalysis(
    tenantId: string,
    dealId: string,
    accountId: string
  ): Promise<GapAnalysis[]> {
    const gaps: GapAnalysis[] = [];

    // Get existing matrix
    const matrix = await BuyerMatrix.findOne({ tenantId, dealId });

    if (matrix) {
      // Use existing coverage data
      const coverage = matrix.coverage;

      if (coverage.economic < 50) {
        gaps.push({
          type: 'low_influence',
          description: 'Economic buyer coverage is low',
          severity: coverage.economic === 0 ? 'critical' : 'high',
          recommendation: 'Identify and engage economic buyer',
          priority: 1
        });
      }

      if (coverage.technical < 50) {
        gaps.push({
          type: 'low_influence',
          description: 'Technical buyer coverage is low',
          severity: coverage.technical === 0 ? 'critical' : 'high',
          recommendation: 'Identify technical evaluators and schedule demos',
          priority: 2
        });
      }

      if (coverage.champion < 50) {
        gaps.push({
          type: 'disengaged',
          description: 'No strong champion identified',
          severity: coverage.champion === 0 ? 'critical' : 'high',
          recommendation: 'Develop internal champion through relationship building',
          priority: 1
        });
      }

      // Check for negative sentiment
      const negativeContacts = matrix.contacts.filter(c => c.sentiment === 'negative');
      if (negativeContacts.length > 0) {
        gaps.push({
          type: 'negative',
          description: `${negativeContacts.length} stakeholder(s) with negative sentiment`,
          severity: 'high',
          recommendation: 'Address concerns from negative stakeholders',
          priority: 2
        });
      }
    } else {
      // No matrix exists - all critical gaps
      gaps.push(
        {
          type: 'missing_role',
          description: 'No stakeholder map created for this account',
          severity: 'critical',
          recommendation: 'Create stakeholder map with all decision makers',
          priority: 1
        },
        {
          type: 'missing_role',
          description: 'No economic buyer identified',
          severity: 'critical',
          recommendation: 'Identify who controls the budget',
          priority: 1
        },
        {
          type: 'missing_role',
          description: 'No champion identified',
          severity: 'critical',
          recommendation: 'Identify internal advocate',
          priority: 1
        }
      );
    }

    return gaps;
  }

  /**
   * Generate recommendations based on gap analysis
   */
  static generateRecommendations(
    coverage: CoverageAnalysis,
    gaps: GapAnalysis[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const gap of gaps) {
      switch (gap.type) {
        case 'missing_role':
          recommendations.push({
            action: `Identify ${gap.description.replace('No ', '').replace('identified', '')}`,
            priority: gap.severity as 'critical' | 'high',
            reason: gap.recommendation
          });
          break;

        case 'low_influence':
          recommendations.push({
            action: `Increase engagement with ${gap.description.toLowerCase()}`,
            priority: gap.severity as 'critical' | 'high',
            reason: gap.recommendation
          });
          break;

        case 'disengaged':
          recommendations.push({
            action: `Re-engage stakeholders for ${gap.description.toLowerCase()}`,
            priority: gap.severity as 'critical' | 'high',
            reason: gap.recommendation
          });
          break;

        case 'negative':
          recommendations.push({
            action: `Address objections from negative stakeholders`,
            priority: gap.severity as 'critical' | 'high',
            reason: gap.recommendation
          });
          break;
      }
    }

    // Add positive reinforcement recommendations
    if (coverage.champion >= 80) {
      recommendations.push({
        action: 'Leverage champion for references and case studies',
        priority: 'medium',
        reason: 'Strong champion identified - maximize their influence'
      });
    }

    if (coverage.economic >= 80 && coverage.technical >= 80) {
      recommendations.push({
        action: 'Propose and close',
        priority: 'high',
        reason: 'Full coverage achieved - ready to advance deal'
      });
    }

    return recommendations;
  }

  /**
   * Generate or update buyer matrix for a deal
   */
  static async generateMatrix(
    tenantId: string,
    dealId: string,
    accountId: string,
    stakeholderMapId?: string
  ): Promise<BuyerMatrix> {
    let coverage: CoverageAnalysis = {
      overall: 0,
      economic: 0,
      technical: 0,
      champion: 0,
      executive: 0
    };
    let contacts: BuyerMatrix['contacts'] = [];

    if (stakeholderMapId) {
      const map = await StakeholderMap.findById(stakeholderMapId).populate('contacts');
      if (map) {
        coverage = BuyerMatrixService.calculateCoverage(map);

        // Map contacts to matrix format
        const populatedContacts = map.contacts as unknown as Contact[];
        contacts = populatedContacts.map(contact => ({
          contactId: contact._id,
          email: contact.email,
          name: contact.fullName,
          title: contact.title || '',
          decisionRole: contact.decisionRole,
          influenceLevel: contact.influenceLevel,
          engagementLevel: contact.engagementLevel,
          contactStatus: contact.status,
          lastContactedAt: contact.lastContactedAt,
          touchpoints: contact.touchpoints,
          relationshipStrength: this.calculateRelationshipStrength(contact),
          sentiment: this.inferSentiment(contact),
          blockers: [],
          nextActions: [],
          isReachable: this.isReachable(contact)
        }));
      }
    }

    const gaps = await BuyerMatrixService.generateGapAnalysis(tenantId, dealId, accountId);
    const recommendations = BuyerMatrixService.generateRecommendations(coverage, gaps);

    // Upsert matrix
    const matrix = await BuyerMatrix.findOneAndUpdate(
      { tenantId, dealId },
      {
        $set: {
          accountId,
          stakeholderMapId,
          contacts,
          coverage,
          gaps,
          recommendations,
          lastAnalyzedAt: new Date(),
          $inc: { analysisVersion: 1 }
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    return matrix;
  }

  /**
   * Calculate relationship strength based on touchpoints and engagement
   */
  private static calculateRelationshipStrength(contact: Contact): number {
    const touchpointScore = Math.min(contact.touchpoints * 2, 30); // Max 30 from touchpoints

    const engagementScore = {
      none: 0,
      low: 10,
      medium: 25,
      high: 40,
      champion: 50
    }[contact.engagementLevel] || 0;

    const statusScore = {
      identified: 5,
      contacted: 10,
      engaged: 20,
      qualified: 30,
      advocate: 50
    }[contact.status] || 0;

    const coachBonus = contact.isCoach ? 20 : 0;

    return Math.min(touchpointScore + engagementScore + statusScore + coachBonus, 100);
  }

  /**
   * Infer sentiment from contact data
   */
  private static inferSentiment(contact: Contact): 'positive' | 'neutral' | 'negative' | 'unknown' {
    if (contact.isCoach && contact.coachRating && contact.coachRating >= 7) {
      return 'positive';
    }

    if (contact.engagementLevel === 'none' && contact.touchpoints === 0) {
      return 'unknown';
    }

    if (contact.status === 'identified') {
      return 'unknown';
    }

    if (contact.lastContactedAt) {
      const daysSinceContact = Math.floor(
        (Date.now() - contact.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceContact > 30) {
        return 'neutral';
      }
    }

    if (contact.engagementLevel === 'high' || contact.engagementLevel === 'champion') {
      return 'positive';
    }

    if (contact.isCoach && contact.coachRating && contact.coachRating < 5) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Check if contact is reachable
   */
  private static isReachable(contact: Contact): boolean {
    if (!contact.email && !contact.phone) {
      return false;
    }

    if (contact.engagementLevel === 'none' && contact.touchpoints === 0) {
      return true; // Never reached, so likely reachable
    }

    // Check if last contact was more than 7 days ago
    if (contact.lastContactedAt) {
      const daysSinceContact = Math.floor(
        (Date.now() - contact.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceContact >= 7;
    }

    return true;
  }
}
