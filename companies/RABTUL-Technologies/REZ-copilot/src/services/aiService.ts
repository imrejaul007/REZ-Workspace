/**
 * REZ Copilot - AI Coaching Service
 * Core deal coaching and revenue intelligence logic
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DealContext,
  CompanyContext,
  DealAnalysis,
  CoachingAction,
  TalkTrack,
  RiskItem,
  OpportunityItem,
  CompetitiveInsight,
  EmailDraft,
  CallPrep,
  AgendaItem,
  SignalContext,
  ActivityContext,
  ResearchResult,
  ResearchInsight,
  ModelConfig,
} from '../types';
import { config } from '../config/services';

// Mock LLM integration - in production, connect to HOJAI LLM Gateway (port 4730)
export class AICoachingService {
  private modelConfig: ModelConfig;

  constructor() {
    this.modelConfig = {
      provider: config.ai.defaultProvider as ModelConfig['provider'],
      model: config.ai.defaultModel,
      temperature: config.ai.temperature,
      maxTokens: config.ai.maxTokens,
    };
  }

  /**
   * Analyze a deal and provide comprehensive coaching
   */
  async analyzeDeal(deal: DealContext, company: CompanyContext): Promise<DealAnalysis> {
    // Calculate overall score based on multiple factors
    const overallScore = this.calculateDealScore(deal, company);

    // Determine momentum
    const momentum = this.calculateMomentum(deal, company);

    // Determine health status
    const healthStatus = this.calculateHealthStatus(deal, company, overallScore);

    // Identify strengths and weaknesses
    const strengths = this.identifyStrengths(deal, company);
    const weaknesses = this.identifyWeaknesses(deal, company);

    // Generate risks
    const risks = this.identifyRisks(deal, company);

    // Identify opportunities
    const opportunities = this.identifyOpportunities(deal, company);

    // Generate next best actions
    const nextBestActions = this.generateNextBestActions(deal, company, risks, opportunities);

    // Generate talk tracks
    const recommendedTalkTracks = this.generateTalkTracks(deal, company);

    // Identify competitive insights
    const competitiveInsights = this.analyzeCompetitivePosition(deal, company);

    return {
      dealId: deal.dealId,
      overallScore,
      momentum,
      healthStatus,
      strengths,
      weaknesses,
      risks,
      opportunities,
      nextBestActions,
      recommendedTalkTracks,
      competitiveInsights,
      generatedAt: new Date(),
    };
  }

  /**
   * Calculate overall deal health score (0-100)
   */
  private calculateDealScore(deal: DealContext, company: CompanyContext): number {
    let score = 50; // Base score

    // Engagement factor (40% weight)
    const engagementScore = this.calculateEngagementScore(deal, company);
    score += engagementScore * 0.4;

    // Timing factor (20% weight)
    const timingScore = this.calculateTimingScore(deal);
    score += timingScore * 0.2;

    // Activity factor (20% weight)
    const activityScore = this.calculateActivityScore(deal, company);
    score += activityScore * 0.2;

    // Signal factor (20% weight)
    const signalScore = this.calculateSignalScore(company.signals);
    score += signalScore * 0.2;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private calculateEngagementScore(deal: DealContext, company: CompanyContext): number {
    let score = 0;
    const contacts = company.contacts || [];

    // Average engagement of contacts
    if (contacts.length > 0) {
      const avgEngagement = contacts.reduce((sum, c) => sum + (c.engagementScore || 50), 0) / contacts.length;
      score += avgEngagement;
    }

    // Recency of last activity
    if (company.recentActivities.length > 0) {
      const lastActivity = company.recentActivities[0];
      const daysSinceActivity = Math.floor(
        (Date.now() - new Date(lastActivity.performedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActivity <= 1) score += 10;
      else if (daysSinceActivity <= 3) score += 5;
      else if (daysSinceActivity <= 7) score += 0;
      else score -= 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateTimingScore(deal: DealContext): number {
    let score = 50;

    // Days in current stage
    if (deal.daysInStage <= 7) score += 20;
    else if (deal.daysInStage <= 14) score += 10;
    else if (deal.daysInStage <= 30) score += 0;
    else if (deal.daysInStage <= 60) score -= 20;
    else score -= 40;

    // Expected close date proximity
    const daysToClose = Math.floor(
      (new Date(deal.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysToClose <= 7) score += 15;
    else if (daysToClose <= 30) score += 10;
    else if (daysToClose <= 90) score += 0;
    else score -= 10;

    return Math.min(100, Math.max(0, score));
  }

  private calculateActivityScore(deal: DealContext, company: CompanyContext): number {
    let score = 0;
    const activities = company.recentActivities || [];

    // Count activities in last 7 days
    const recentActivities = activities.filter((a) => {
      const daysSince = Math.floor(
        (Date.now() - new Date(a.performedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince <= 7;
    });

    // Activity velocity scoring
    if (recentActivities.length >= 5) score += 40;
    else if (recentActivities.length >= 3) score += 25;
    else if (recentActivities.length >= 1) score += 10;
    else score -= 20;

    // Variety of activity types
    const activityTypes = new Set(recentActivities.map((a) => a.type));
    if (activityTypes.size >= 3) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private calculateSignalScore(signals: SignalContext[]): number {
    if (!signals || signals.length === 0) return 0;

    let score = 0;
    for (const signal of signals) {
      if (signal.strength === 'strong') score += 33;
      else if (signal.strength === 'medium') score += 20;
      else score += 7;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate deal momentum
   */
  private calculateMomentum(deal: DealContext, company: CompanyContext): DealAnalysis['momentum'] {
    const engagementTrend = this.getEngagementTrend(deal, company);
    const activityTrend = this.getActivityTrend(company.recentActivities);
    const signalTrend = this.getSignalTrend(company.signals);

    const avgTrend = (engagementTrend + activityTrend + signalTrend) / 3;

    if (avgTrend > 0.2) return 'accelerating';
    if (avgTrend < -0.2) return 'declining';
    return 'stalled';
  }

  private getEngagementTrend(deal: DealContext, company: CompanyContext): number {
    // Simplified trend calculation
    const recentContacts = company.contacts.filter((c) => {
      if (!c.lastTouchedAt) return false;
      const daysSince = Math.floor(
        (Date.now() - new Date(c.lastTouchedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince <= 14;
    });

    return recentContacts.length > 0 ? 0.5 : -0.3;
  }

  private getActivityTrend(activities: ActivityContext[]): number {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const thisWeek = activities.filter(
      (a) => new Date(a.performedAt).getTime() >= weekAgo
    ).length;
    const lastWeek = activities.filter(
      (a) =>
        new Date(a.performedAt).getTime() >= twoWeeksAgo &&
        new Date(a.performedAt).getTime() < weekAgo
    ).length;

    if (thisWeek > lastWeek * 1.2) return 0.5;
    if (thisWeek < lastWeek * 0.8) return -0.5;
    return 0;
  }

  private getSignalTrend(signals: SignalContext[]): number {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSignals = signals.filter(
      (s) => new Date(s.detectedAt).getTime() >= weekAgo
    );

    return recentSignals.length > 2 ? 0.3 : -0.1;
  }

  /**
   * Calculate health status
   */
  private calculateHealthStatus(
    deal: DealContext,
    company: CompanyContext,
    score: number
  ): DealAnalysis['healthStatus'] {
    if (score >= 70) return 'healthy';
    if (score >= 40) return 'at_risk';

    // Check for critical indicators
    const criticalSignals = company.signals.filter(
      (s) => s.strength === 'strong' && (s.type === 'layoff' || s.type === 'budget_freeze')
    );
    if (criticalSignals.length > 0) return 'critical';

    const noRecentActivity =
      company.recentActivities.length === 0 ||
      Math.floor(
        (Date.now() - new Date(company.recentActivities[0].performedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ) > 14;

    if (noRecentActivity && deal.daysInStage > 30) return 'critical';

    return 'at_risk';
  }

  /**
   * Identify deal strengths
   */
  private identifyStrengths(deal: DealContext, company: CompanyContext): string[] {
    const strengths: string[] = [];

    // Strong engagement
    if (company.contacts.length >= 3) {
      strengths.push('Strong multi-stakeholder engagement');
    }

    // Positive signals
    const positiveSignals = company.signals.filter(
      (s) => s.type === 'funding' || s.type === 'expansion' || s.type === 'leadership_change_positive'
    );
    if (positiveSignals.length > 0) {
      strengths.push('Positive company momentum detected');
    }

    // High activity
    if (company.recentActivities.length >= 5) {
      strengths.push('High engagement velocity');
    }

    // Strong probability
    if (deal.probability >= 70) {
      strengths.push('High win probability based on deal characteristics');
    }

    // Clear next steps
    if (deal.nextStep) {
      strengths.push('Clear next steps defined');
    }

    return strengths;
  }

  /**
   * Identify deal weaknesses
   */
  private identifyWeaknesses(deal: DealContext, company: CompanyContext): string[] {
    const weaknesses: string[] = [];

    // Long time in stage
    if (deal.daysInStage > 30) {
      weaknesses.push(`Deal stalled in ${deal.stage} for ${deal.daysInStage} days`);
    }

    // Low engagement
    if (company.contacts.length <= 1) {
      weaknesses.push('Limited stakeholder engagement');
    }

    // Negative signals
    const negativeSignals = company.signals.filter(
      (s) => s.type === 'layoff' || s.type === 'budget_freeze' || s.type === 'leadership_change_negative'
    );
    if (negativeSignals.length > 0) {
      weaknesses.push('Negative company signals detected');
    }

    // No recent activity
    if (company.recentActivities.length === 0) {
      weaknesses.push('No recent engagement activities');
    }

    // High value, low probability
    if (deal.value > 100000 && deal.probability < 30) {
      weaknesses.push('High-value deal with low probability');
    }

    return weaknesses;
  }

  /**
   * Identify deal risks
   */
  private identifyRisks(deal: DealContext, company: CompanyContext): RiskItem[] {
    const risks: RiskItem[] = [];

    // Engagement risk
    if (company.recentActivities.length === 0) {
      risks.push({
        category: 'engagement',
        severity: 'high',
        description: 'No engagement activities in the last 14+ days',
        mitigation: 'Schedule a check-in call or send a value-add email',
      });
    }

    // Timing risk
    const daysToClose = Math.floor(
      (new Date(deal.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysToClose <= 7 && deal.probability < 50) {
      risks.push({
        category: 'timing',
        severity: 'critical',
        description: `Close date in ${daysToClose} days but probability is only ${deal.probability}%`,
        mitigation: 'Escalate to champion for commitment or adjust timeline',
      });
    }

    // Competition risk
    const competitorSignals = company.signals.filter(
      (s) => s.type === 'competitor_mentioned' || s.type === 'competitor_purchase'
    );
    if (competitorSignals.length > 0) {
      risks.push({
        category: 'competition',
        severity: 'high',
        description: 'Competitor activity detected',
        mitigation: 'Confirm differentiation and urgency',
      });
    }

    // Stakeholder risk
    if (company.contacts.length < 2) {
      risks.push({
        category: 'stakeholder',
        severity: 'medium',
        description: 'Single point of contact - no buying committee visibility',
        mitigation: 'Map and engage additional stakeholders',
      });
    }

    // Budget risk
    const budgetSignals = company.signals.filter(
      (s) => s.type === 'budget_freeze' || s.type === 'cost_cutting'
    );
    if (budgetSignals.length > 0) {
      risks.push({
        category: 'budget',
        severity: 'high',
        description: 'Budget constraints detected in company signals',
        mitigation: 'Understand budget implications and adjust deal scope',
      });
    }

    return risks.slice(0, config.analysis.maxRisks);
  }

  /**
   * Identify opportunities
   */
  private identifyOpportunities(deal: DealContext, company: CompanyContext): OpportunityItem[] {
    const opportunities: OpportunityItem[] = [];

    // Expansion opportunity
    if (deal.probability > 60 && deal.value < 50000) {
      opportunities.push({
        category: 'expansion',
        description: 'Consider expanding deal size with additional modules or users',
        potentialImpact: 'high',
        actionRequired: 'Identify expansion opportunities in discovery call',
      });
    }

    // Champion building
    const executiveContacts = company.contacts.filter(
      (c) => c.engagementScore && c.engagementScore > 70
    );
    if (executiveContacts.length > 0) {
      opportunities.push({
        category: 'advocacy',
        description: 'Strong internal champion identified - leverage for references',
        potentialImpact: 'high',
        actionRequired: 'Request introduction to additional executives',
      });
    }

    // Positive momentum
    const expansionSignals = company.signals.filter(
      (s) => s.type === 'funding' || s.type === 'expansion' || s.type === 'hiring'
    );
    if (expansionSignals.length > 0) {
      opportunities.push({
        category: 'acceleration',
        description: 'Company showing growth signals - prime time for expansion conversations',
        potentialImpact: 'medium',
        actionRequired: 'Schedule business review to discuss growth plans',
      });
    }

    // Multi-threading
    if (company.contacts.length >= 3) {
      opportunities.push({
        category: 'referral',
        description: 'Strong multi-threaded relationships - potential for referrals',
        potentialImpact: 'medium',
        actionRequired: 'Request warm introductions to other teams',
      });
    }

    return opportunities.slice(0, config.analysis.maxOpportunities);
  }

  /**
   * Generate next best actions
   */
  private generateNextBestActions(
    deal: DealContext,
    company: CompanyContext,
    risks: RiskItem[],
    opportunities: OpportunityItem[]
  ): CoachingAction[] {
    const actions: CoachingAction[] = [];

    // Critical risk action
    const criticalRisk = risks.find((r) => r.severity === 'critical');
    if (criticalRisk) {
      actions.push({
        type: 'risk_alert',
        priority: 'critical',
        title: `Critical Risk: ${criticalRisk.category}`,
        description: criticalRisk.description,
        actionItems: criticalRisk.mitigation ? [criticalRisk.mitigation] : undefined,
        confidence: 0.9,
      });
    }

    // Next step reminder
    if (deal.nextStep) {
      actions.push({
        type: 'suggest_next_steps',
        priority: 'high',
        title: 'Follow Next Step',
        description: deal.nextStep,
        actionItems: [deal.nextStep],
        confidence: 0.95,
      });
    }

    // Engagement opportunity
    if (company.contacts.length > 0) {
      const topContact = company.contacts.reduce((best, current) => {
        const bestScore = best.engagementScore || 0;
        const currentScore = current.engagementScore || 0;
        return currentScore > bestScore ? current : best;
      });

      actions.push({
        type: 'opportunity',
        priority: 'medium',
        title: `Engage ${topContact.name}`,
        description: `Your most engaged contact at ${company.companyName} hasn't been reached out to recently`,
        actionItems: [`Send a personalized check-in to ${topContact.name}`],
        confidence: 0.85,
      });
    }

    // Research action
    const highRiskSignals = company.signals.filter(
      (s) => s.strength === 'strong' && (s.type === 'funding' || s.type === 'hiring')
    );
    if (highRiskSignals.length > 0) {
      actions.push({
        type: 'research',
        priority: 'low',
        title: 'Research Company News',
        description: 'Strong signals detected - prepare talking points',
        actionItems: highRiskSignals.map((s) => s.title),
        confidence: 0.8,
      });
    }

    // Competitive positioning
    const competitorSignals = company.signals.filter(
      (s) => s.type === 'competitor_mentioned'
    );
    if (competitorSignals.length > 0) {
      actions.push({
        type: 'suggest_next_steps',
        priority: 'high',
        title: 'Prepare Competitive Response',
        description: 'Competitor mentioned - differentiate your value prop',
        actionItems: [
          'Review competitive battle cards',
          'Prepare differentiation talking points',
        ],
        confidence: 0.9,
      });
    }

    return actions;
  }

  /**
   * Generate talk tracks
   */
  private generateTalkTracks(deal: DealContext, company: CompanyContext): TalkTrack[] {
    const talkTracks: TalkTrack[] = [];

    // Discovery talk track
    talkTracks.push({
      scenario: 'Discovery Call',
      objective: 'Understand business challenges and build relationship',
      keyPoints: [
        `Understand ${company.companyName}'s growth priorities`,
        'Identify key pain points and current solutions',
        'Map decision-making process and stakeholders',
        'Establish credibility and rapport',
      ],
      exampleQuestions: [
        `What are ${company.companyName}'s top priorities this quarter?`,
        'What would success look like for this initiative?',
        'Who else is involved in this decision?',
      ],
      objectionHandlers: [
        {
          objection: "We're happy with our current solution",
          response: 'That\'s great to hear. Many of our customers felt the same way until they discovered [specific pain point]. What would it take to earn a conversation?',
          confidence: 0.8,
        },
      ],
    });

    // Technical evaluation talk track
    talkTracks.push({
      scenario: 'Technical Evaluation',
      objective: 'Address technical concerns and demonstrate value',
      keyPoints: [
        'Present ROI and business case',
        'Address security and compliance requirements',
        'Show implementation approach',
        'Confirm timeline and resource requirements',
      ],
      objectionHandlers: [
        {
          objection: 'Your solution is too expensive',
          response: 'Let\'s look beyond sticker price. Based on [specific benefit], customers typically see ROI in [timeframe]. What would it take to move forward?',
          confidence: 0.75,
        },
      ],
    });

    // Close conversation talk track
    talkTracks.push({
      scenario: 'Closing Conversation',
      objective: 'Drive to commitment and next steps',
      keyPoints: [
        'Summarize agreed-upon value',
        'Confirm mutual next steps',
        'Address final objections',
        'Set clear timeline and escalation path',
      ],
      exampleQuestions: [
        'What would need to be true for us to move forward?',
        'Is there anything else holding up the decision?',
        'Who needs to be involved in the final approval?',
      ],
    });

    return talkTracks.slice(0, config.analysis.maxTalkTracks);
  }

  /**
   * Analyze competitive position
   */
  private analyzeCompetitivePosition(deal: DealContext, company: CompanyContext): CompetitiveInsight[] {
    const insights: CompetitiveInsight[] = [];

    // Check for competitor signals
    const competitorSignals = company.signals.filter(
      (s) => s.type === 'competitor_mentioned' || s.type === 'competitor_purchase'
    );

    if (competitorSignals.length > 0) {
      for (const signal of competitorSignals) {
        insights.push({
          competitor: signal.source || 'Unknown Competitor',
          threat: signal.strength === 'strong' ? 'high' : 'medium',
          evidence: signal.description,
          counterStrategy: 'Emphasize unique differentiators and customer success stories',
        });
      }
    }

    // Industry typical competitors
    const industry = company.industry || '';
    if (industry.includes('Technology') || industry.includes('SaaS')) {
      insights.push({
        competitor: 'Salesforce / HubSpot',
        threat: 'medium',
        counterStrategy: 'Position on [specific differentiator] and faster time-to-value',
      });
    }

    return insights;
  }

  /**
   * Generate email draft
   */
  async generateEmailDraft(
    deal: DealContext,
    contact: { name: string; email: string; title?: string },
    objective: string,
    tone: 'formal' | 'casual' | 'persuasive' | 'collaborative' = 'collaborative',
    keyPoints?: string[]
  ): Promise<EmailDraft> {
    // Template-based generation (in production, use LLM)
    const templates = this.getEmailTemplates(objective, tone);

    let body = templates.body
      .replace('{{contactName}}', contact.name)
      .replace('{{companyName}}', company?.companyName || deal.companyName)
      .replace('{{dealName}}', deal.dealName)
      .replace('{{ownerName}}', deal.ownerName);

    // Add key points
    if (keyPoints && keyPoints.length > 0) {
      const pointsList = keyPoints.map((p) => `- ${p}`).join('\n');
      body += `\n\nKey talking points:\n${pointsList}`;
    }

    // Add call to action
    if (objective === 'meeting_request') {
      body += `\n\nWould you have 30 minutes this week to connect? I'm happy to work around your schedule.`;
    } else if (objective === 'follow_up') {
      body += `\n\nJust following up on my previous note. Happy to hop on a quick call if you have any questions.`;
    }

    return {
      subject: templates.subject,
      body,
      tone,
      recommendedLength: keyPoints && keyPoints.length > 3 ? 'long' : 'medium',
      callToAction: this.getCallToAction(objective),
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    };
  }

  private getEmailTemplates(objective: string, tone: string): { subject: string; body: string } {
    const templates: Record<string, { subject: string; body: string }> = {
      follow_up: {
        subject: 'Following up - {{dealName}}',
        body: `Hi {{contactName}},

I wanted to follow up on our recent conversation about {{dealName}}.

Have you had a chance to review the materials I shared? I'm happy to answer any questions or schedule a call to discuss next steps.

Looking forward to hearing from you.

Best regards,
{{ownerName}}`,
      },
      meeting_request: {
        subject: 'Quick sync on {{companyName}} priorities',
        body: `Hi {{contactName}},

I hope this message finds you well. I wanted to reach out to schedule a brief call to discuss how we can help {{companyName}} achieve your goals.

Based on our previous conversations, I believe there are some exciting opportunities we could explore together.

Would you have 30 minutes available this week? I'm flexible and happy to work around your schedule.

Best regards,
{{ownerName}}`,
      },
      introduction: {
        subject: 'How {{companyName}} can achieve [specific benefit]',
        body: `Hi {{contactName}},

I came across {{companyName}} and was impressed by your work in the {{industry || 'space'}}.

I wanted to share how similar companies have achieved [specific benefit] by working with us. Would you be open to a brief conversation?

Best regards,
{{ownerName}}`,
      },
      proposal: {
        subject: 'Proposal for {{dealName}}',
        body: `Hi {{contactName}},

Thank you for your time during our recent conversations. Based on our discussion, I've put together a proposal for {{dealName}}.

Please find the details below and let me know if you have any questions.

I'm happy to schedule a call to walk through the proposal and discuss any questions you might have.

Best regards,
{{ownerName}}`,
      },
    };

    return templates[objective] || templates.follow_up;
  }

  private getCallToAction(objective: string): string {
    const ctas: Record<string, string> = {
      follow_up: 'Reply to confirm receipt or schedule a call',
      meeting_request: 'Book a meeting time via calendar link',
      introduction: 'Reply to express interest or request more info',
      proposal: 'Review and provide feedback',
      check_in: 'Share any updates or questions',
    };
    return ctas[objective] || 'Reply to continue the conversation';
  }

  /**
   * Generate call preparation
   */
  async generateCallPrep(
    deal: DealContext,
    contact: { name: string; email: string; title?: string },
    callObjective?: string,
    duration: number = 30
  ): Promise<CallPrep> {
    const agenda: AgendaItem[] = [
      {
        topic: 'Rapport building',
        duration: '3-5 min',
        objective: 'Reconnect and set positive tone',
      },
      {
        topic: 'Review progress',
        duration: '5-10 min',
        objective: 'Confirm alignment on previous discussions',
      },
      {
        topic: 'Deep dive on objectives',
        duration: '10-15 min',
        objective: callObjective || 'Understand current priorities and blockers',
      },
      {
        topic: 'Next steps',
        duration: '5 min',
        objective: 'Confirm action items and timeline',
      },
    ];

    const keyQuestions = this.generateDiscoveryQuestions(deal, contact);

    return {
      dealId: deal.dealId,
      contactName: contact.name,
      agenda,
      keyQuestions,
      discoveryAreas: [
        'Current challenges and pain points',
        'Decision-making criteria',
        'Timeline and budget availability',
        'Stakeholder alignment',
      ],
      competitivePositioning: 'Be ready to address any competitor mentions with differentiation points',
      successCriteria: [
        'Clear understanding of next steps',
        'Commitment to follow-up actions',
        'Escalation path if needed',
      ],
      icebreakers: [
        `How was your experience at ${deal.companyName} this quarter?`,
        'Any exciting initiatives you\'re working on?',
      ],
      closingAttempt: 'Based on our conversation today, it sounds like [summary]. Can we move forward with [next step]?',
    };
  }

  private generateDiscoveryQuestions(
    deal: DealContext,
    contact: { name: string; title?: string }
  ): string[] {
    const questions: string[] = [
      'What are the top priorities for your team this quarter?',
      'What would success look like for this initiative?',
      'Who else is involved in this decision?',
      'What timeline are you working toward?',
    ];

    if (contact.title?.toLowerCase().includes('executive') || contact.title?.toLowerCase().includes('director')) {
      questions.push('What business outcomes are you measured on?');
      questions.push('How does this initiative tie to company strategy?');
    }

    return questions;
  }

  /**
   * Research company for deal context
   */
  async researchCompany(company: CompanyContext): Promise<ResearchResult> {
    const insights: ResearchInsight[] = [];

    // Process signals into insights
    for (const signal of company.signals) {
      insights.push({
        type: this.mapSignalTypeToInsight(signal.type),
        title: signal.title,
        summary: signal.description,
        relevance: signal.strength === 'strong' ? 0.9 : signal.strength === 'medium' ? 0.7 : 0.5,
        publishedAt: signal.detectedAt,
      });
    }

    // Add industry context
    if (company.industry) {
      insights.push({
        type: 'general',
        title: `${company.industry} Industry Trends`,
        summary: `Company operates in the ${company.industry} sector. Monitor for regulatory changes and market shifts.`,
        relevance: 0.6,
      });
    }

    // Add company size context
    if (company.employeeCount) {
      insights.push({
        type: 'general',
        title: 'Company Size Context',
        summary: `Company has ${company.employeeCount} employees. Large organizations typically have longer sales cycles.`,
        relevance: 0.5,
      });
    }

    return {
      query: company.companyName,
      insights,
      sources: [
        `Signal data from REZ Signal Service`,
        `Company profile from REZ TAM Builder`,
        `Activity data from REZ Activity Service`,
      ],
      generatedAt: new Date(),
    };
  }

  private mapSignalTypeToInsight(type: string): ResearchInsight['type'] {
    const mapping: Record<string, ResearchInsight['type']> = {
      funding: 'funding',
      hiring: 'hiring',
      expansion: 'news',
      layoff: 'news',
      technology_change: 'technology',
      new_executive: 'executive',
      competitor_mentioned: 'competitor',
      budget_freeze: 'news',
    };
    return mapping[type] || 'general';
  }

  /**
   * Generate chat response (mock - in production, use LLM)
   */
  async generateChatResponse(
    message: string,
    deal?: DealContext,
    company?: CompanyContext
  ): Promise<string> {
    // Simple pattern matching for demo
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('risk') || lowerMessage.includes('concern')) {
      if (deal) {
        const analysis = await this.analyzeDeal(deal, company!);
        const criticalRisks = analysis.risks.filter((r) => r.severity === 'critical' || r.severity === 'high');
        if (criticalRisks.length > 0) {
          return `I see some concerns here:\n\n${criticalRisks
            .map((r) => `⚠️ ${r.category.toUpperCase()}: ${r.description}\n   → ${r.mitigation}`)
            .join('\n\n')}`;
        }
        return 'No critical risks detected. The deal looks relatively stable.';
      }
    }

    if (lowerMessage.includes('next step') || lowerMessage.includes('action')) {
      if (deal) {
        const actions = this.generateNextBestActions(deal, company!, [], []);
        return `Based on the deal context, here are the recommended next steps:\n\n${actions
          .map((a, i) => `${i + 1}. **${a.title}**\n   ${a.description}`)
          .join('\n\n')}`;
      }
    }

    if (lowerMessage.includes('email') || lowerMessage.includes('draft')) {
      return 'I can help draft an email. Use the POST /api/email/generate endpoint with dealId and objective.';
    }

    if (lowerMessage.includes('call') || lowerMessage.includes('prep')) {
      return 'I can generate call preparation notes. Use POST /api/call-prep/generate with dealId and contactId.';
    }

    // Default response
    return `I understand you're asking about "${message.substring(0, 50)}..."\n\nI can help with:\n- Deal analysis and coaching\n- Risk identification\n- Next best actions\n- Email drafting\n- Call preparation\n- Company research\n\nWhat specific aspect would you like to explore?`;
  }
}

// Export singleton instance
export const aiCoachingService = new AICoachingService();
