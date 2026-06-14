/**
 * REZ Intent Graph - Core Intent Analysis Service
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { config } from '../config';
import {
  IntentSignal,
  IntentStage,
  IntentLevel,
  IntentAction,
  CompanyIntentProfile,
  AccountPriority,
  IntentTrend,
  DealAcceleration,
  AccountIntentSummary,
  PipelineIntentOverview,
  SignalSource,
  ContentEngagement,
  OutreachResponse,
  Activity,
  Deal,
  Outreach,
} from '../models';
import { logger } from '../utils/logger';

export class IntentService {
  private http = axios.create({ timeout: 10000 });

  /**
   * Analyze intent for a single company
   */
  async analyzeCompanyIntent(companyId: string, windowDays = 30): Promise<CompanyIntentProfile | null> {
    try {
      logger.info(`Analyzing intent for company: ${companyId}`);

      // Fetch data from all B2B services in parallel
      const [signals, activities, outreachData, dealData] = await Promise.all([
        this.fetchSignals(companyId),
        this.fetchActivities(companyId, windowDays),
        this.fetchOutreachData(companyId),
        this.fetchDealData(companyId),
      ]);

      // Calculate component scores
      const signalScore = this.calculateSignalScore(signals);
      const activityScore = this.calculateActivityScore(activities);
      const engagementScore = this.calculateEngagementScore(activities);
      const outreachScore = this.calculateOutreachScore(outreachData);

      // Calculate overall intent score
      const weights = config.intent.weights;
      const overallIntentScore = Math.round(
        signalScore * weights.signalStrength +
        activityScore * weights.activityFrequency +
        engagementScore * weights.contentEngagement +
        outreachScore * weights.outreachResponse
      );

      // Determine intent level and stage
      const intentLevel = this.determineIntentLevel(overallIntentScore);
      const intentStage = this.determineIntentStage(signals, activities, dealData);

      // Generate recommendations
      const recommendedActions = this.generateRecommendations(
        companyId,
        overallIntentScore,
        intentLevel,
        signals,
        activities
      );

      // Calculate confidence
      const confidence = this.calculateConfidence(signals, activities, outreachData);

      // Find timeline dates
      const firstActivityAt = activities.length > 0
        ? activities.reduce((oldest, a) =>
            new Date(a.performedAt) < new Date(oldest.performedAt) ? a : oldest
          ).performedAt
        : undefined;

      const lastActivityAt = activities.length > 0
        ? activities.reduce((newest, a) =>
            new Date(a.performedAt) > new Date(newest.performedAt) ? a : newest
          ).performedAt
        : undefined;

      return {
        companyId,
        companyName: this.getCompanyName(signals, dealData),
        overallIntentScore,
        intentLevel,
        intentStage,
        signalScore,
        activityScore,
        engagementScore,
        outreachScore,
        signals,
        firstActivityAt: firstActivityAt ? new Date(firstActivityAt) : undefined,
        lastActivityAt: lastActivityAt ? new Date(lastActivityAt) : undefined,
        daysSinceLastActivity: lastActivityAt
          ? Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
          : 999,
        predictedStageChange: this.predictStageChange(signals, activities),
        predictedCloseDate: this.predictCloseDate(dealData),
        confidence,
        recommendedActions,
        analyzedAt: new Date(),
        analysisWindow: windowDays,
      };
    } catch (error) {
      logger.error(`Error analyzing company intent: ${error}`);
      return null;
    }
  }

  /**
   * Get prioritized account list
   */
  async getAccountPriorities(limit = 50): Promise<AccountPriority[]> {
    try {
      // Fetch all companies with signals
      const companies = await this.fetchAllTrackedCompanies();

      // Analyze each company
      const analyses = await Promise.all(
        companies.map(c => this.analyzeCompanyIntent(c.companyId))
      );

      // Filter out nulls and sort by weighted value
      const ranked = analyses
        .filter((a): a is CompanyIntentProfile => a !== null)
        .map(a => this.toAccountPriority(a))
        .sort((a, b) => b.weightedValue - a.weightedValue)
        .slice(0, limit);

      // Add ranks
      return ranked.map((p, i) => ({ ...p, rank: i + 1 }));
    } catch (error) {
      logger.error(`Error getting account priorities: ${error}`);
      return [];
    }
  }

  /**
   * Get intent trend for a company
   */
  async getIntentTrend(companyId: string, period: '7d' | '14d' | '30d' | '90d' = '30d'): Promise<IntentTrend | null> {
    try {
      const daysMap = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
      const days = daysMap[period];

      // Fetch historical activities
      const activities = await this.fetchActivities(companyId, days);

      // Generate data points (daily aggregates)
      const dataPoints = this.generateDataPoints(activities, days);

      // Calculate trend
      const firstScore = dataPoints[0]?.score || 0;
      const lastScore = dataPoints[dataPoints.length - 1]?.score || 0;
      const changePercent = firstScore > 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0;

      // Determine trend direction
      const trend = changePercent > 10 ? 'accelerating' : changePercent < -10 ? 'declining' : 'stable';

      // Calculate velocity
      const velocity = changePercent / days;

      return {
        companyId,
        period,
        dataPoints,
        trend,
        changePercent: Math.round(changePercent * 10) / 10,
        velocity: Math.round(velocity * 100) / 100,
        projectedScore7d: lastScore + (velocity * 7),
        projectedStageChange: this.predictStageChangeFromTrend(dataPoints),
      };
    } catch (error) {
      logger.error(`Error getting intent trend: ${error}`);
      return null;
    }
  }

  /**
   * Get deal acceleration analysis
   */
  async getDealAcceleration(dealId: string): Promise<DealAcceleration | null> {
    try {
      // Fetch deal data
      const deal = await this.fetchDeal(dealId);
      if (!deal) return null;

      // Fetch related signals and activities
      const [signals, activities] = await Promise.all([
        this.fetchSignals(deal.companyId),
        this.fetchActivities(deal.companyId, 30),
      ]);

      // Calculate acceleration factors
      const positiveSignals = this.identifyPositiveSignals(signals, activities);
      const negativeSignals = this.identifyNegativeSignals(signals, activities);

      // Calculate scores
      const stakeholderEngagement = this.calculateStakeholderEngagement(activities);
      const contentEngagement = this.calculateContentEngagement(activities);
      const competitionHeat = this.calculateCompetitionHeat(signals);

      // Stage velocity
      const stageVelocity = this.calculateStageVelocity(deal);

      // Acceleration score
      const accelerationScore = this.calculateAccelerationScore(
        positiveSignals,
        negativeSignals,
        stakeholderEngagement,
        contentEngagement
      );

      // Predicted outcome
      const predictedOutcome = this.predictDealOutcome(deal, accelerationScore);

      // Generate actions
      const actions = this.generateDealActions(deal, accelerationScore, positiveSignals, negativeSignals);

      return {
        dealId,
        companyId: deal.companyId,
        positiveSignals,
        negativeSignals,
        stageVelocity,
        stakeholderEngagement,
        contentEngagement,
        competitionHeat,
        accelerationScore,
        predictedOutcome,
        confidence: 75, // Placeholder
        actions,
      };
    } catch (error) {
      logger.error(`Error getting deal acceleration: ${error}`);
      return null;
    }
  }

  /**
   * Get pipeline intent overview
   */
  async getPipelineOverview(): Promise<PipelineIntentOverview> {
    try {
      const priorities = await this.getAccountPriorities(1000);

      // Aggregate by level
      const hotAccounts = priorities.filter(p => p.intentLevel === IntentLevel.HOT);
      const warmAccounts = priorities.filter(p => p.intentLevel === IntentLevel.WARM);
      const coldAccounts = priorities.filter(p => p.intentLevel === IntentLevel.COLD);

      // Aggregate by stage
      const byStage = {} as Record<IntentStage, { count: number; value: number }>;
      Object.values(IntentStage).forEach(stage => {
        const stageAccounts = priorities.filter(p => p.intentStage === stage);
        byStage[stage] = {
          count: stageAccounts.length,
          value: stageAccounts.reduce((sum, a) => sum + a.totalPipelineValue, 0),
        };
      });

      // Find trending accounts
      const trendingHot = priorities.filter(p => p.topAction.priority === 'high').slice(0, 10);
      const trendingCold = priorities.filter(p => p.daysSinceContact > 14).slice(0, 10);

      // Count actions needed
      const immediate = priorities.filter(p => p.topAction.priority === 'critical').length;
      const thisWeek = priorities.filter(p =>
        p.topAction.priority === 'high' || p.topAction.priority === 'critical'
      ).length;
      const thisMonth = priorities.filter(p =>
        p.topAction.priority !== 'low'
      ).length;

      return {
        totalAccounts: priorities.length,
        totalPipelineValue: priorities.reduce((sum, p) => sum + p.totalPipelineValue, 0),
        hotCount: hotAccounts.length,
        hotValue: hotAccounts.reduce((sum, p) => sum + p.totalPipelineValue, 0),
        warmCount: warmAccounts.length,
        warmValue: warmAccounts.reduce((sum, p) => sum + p.totalPipelineValue, 0),
        coldCount: coldAccounts.length,
        coldValue: coldAccounts.reduce((sum, p) => sum + p.totalPipelineValue, 0),
        byStage,
        trendingHot: trendingHot.map(this.toAccountSummary),
        trendingCold: trendingCold.map(this.toAccountSummary),
        actionsRequired: { immediate, thisWeek, thisMonth },
      };
    } catch (error) {
      logger.error(`Error getting pipeline overview: ${error}`);
      return this.getEmptyPipelineOverview();
    }
  }

  // ==================== Private Methods ====================

  private async fetchSignals(companyId: string): Promise<IntentSignal[]> {
    try {
      const response = await this.http.get(
        `${config.services.signalService}/api/signals/company/${companyId}`
      );
      return (response.data?.signals || []).map((s: Record<string, unknown>) => ({
        id: (s.id as string) || uuidv4(),
        source: SignalSource.SIGNALS_SERVICE,
        type: s.type as string,
        title: s.title as string,
        description: s.description as string,
        strength: (s.intensity as number) || 50,
        detectedAt: new Date((s.detectedAt as string) || (s.createdAt as string) || new Date().toISOString()),
        metadata: s.metadata,
      }));
    } catch {
      return [];
    }
  }

  private async fetchActivities(companyId: string, days: number): Promise<Activity[]> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const response = await this.http.get(
        `${config.services.activityService}/api/activities/company/${companyId}?since=${since}`
      );
      return (response.data?.activities || []) as Activity[];
    } catch {
      return [];
    }
  }

  private async fetchOutreachData(companyId: string): Promise<OutreachResponse[]> {
    try {
      const response = await this.http.get(
        `${config.services.outboundService}/api/sequences/company/${companyId}/responses`
      );
      return response.data?.responses || [];
    } catch {
      return [];
    }
  }

  private async fetchDealData(companyId: string): Promise<Deal[]> {
    try {
      const response = await this.http.get(
        `${config.services.dealIntelligence}/api/v1/deals?companyId=${companyId}`
      );
      return (response.data?.deals || []) as Deal[];
    } catch {
      return [];
    }
  }

  private async fetchDeal(dealId: string): Promise<Deal | null> {
    try {
      const response = await this.http.get(
        `${config.services.dealIntelligence}/api/v1/deals/${dealId}`
      );
      return response.data as Deal || null;
    } catch {
      return null;
    }
  }

  private async fetchAllTrackedCompanies(): Promise<{ companyId: string; companyName: string }[]> {
    try {
      const response = await this.http.get(
        `${config.services.signalService}/api/signals/companies`
      );
      return response.data?.companies || [];
    } catch {
      return [];
    }
  }

  private calculateSignalScore(signals: IntentSignal[]): number {
    if (signals.length === 0) return 0;

    const weights = { strong: 100, medium: 70, weak: 40 };
    const totalScore = signals.reduce((sum, s) => {
      const strengthLevel = s.strength >= 80 ? 'strong' : s.strength >= 50 ? 'medium' : 'weak';
      return sum + weights[strengthLevel as keyof typeof weights];
    }, 0);

    return Math.round(totalScore / signals.length);
  }

  private calculateActivityScore(activities: { performedAt: string }[]): number {
    if (activities.length === 0) return 0;

    const now = Date.now();
    const recentCount = activities.filter(a => {
      const daysSince = (now - new Date(a.performedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length;

    // Score based on frequency
    if (recentCount >= 10) return 90;
    if (recentCount >= 5) return 70;
    if (recentCount >= 2) return 50;
    if (recentCount >= 1) return 30;
    return 10;
  }

  private calculateEngagementScore(activities: { type: string }[]): number {
    const engagementTypes = ['email_open', 'link_click', 'demo_view', 'proposal_view', 'document_download'];
    const engaged = activities.filter(a => engagementTypes.includes(a.type)).length;

    if (engaged >= 10) return 90;
    if (engaged >= 5) return 70;
    if (engaged >= 2) return 50;
    if (engaged >= 1) return 30;
    return 0;
  }

  private calculateOutreachScore(responses: OutreachResponse[]): number {
    if (responses.length === 0) return 0;

    const responseRate = responses.filter(r => r.repliedAt).length / responses.length;

    if (responseRate >= 0.5) return 80;
    if (responseRate >= 0.3) return 60;
    if (responseRate >= 0.1) return 40;
    return 20;
  }

  private determineIntentLevel(score: number): IntentLevel {
    const { hot, warm, cold } = config.intent.thresholds;
    if (score >= hot) return IntentLevel.HOT;
    if (score >= warm) return IntentLevel.WARM;
    if (score >= cold) return IntentLevel.COLD;
    return IntentLevel.COLD;
  }

  private determineIntentStage(
    signals: IntentSignal[],
    activities: { type: string }[],
    deals: Record<string, unknown>[]
  ): IntentStage {
    // Check for purchase signals
    if (deals.some(d => d.stage === 'Negotiation')) return IntentStage.DECISION;
    if (deals.some(d => d.stage === 'Proposal')) return IntentStage.DECISION;

    // Check for active engagement
    if (activities.some(a => ['demo_request', 'proposal_request', 'pricing_discussion'].includes(a.type))) {
      return IntentStage.CONSIDERATION;
    }

    // Check for content engagement
    if (activities.some(a => ['email_open', 'link_click', 'case_study_view'].includes(a.type))) {
      return IntentStage.AWARENESS;
    }

    // Check for basic signals
    if (signals.length > 0) return IntentStage.AWARENESS;

    return IntentStage.NONE;
  }

  private generateRecommendations(
    companyId: string,
    score: number,
    level: IntentLevel,
    signals: IntentSignal[],
    activities: { type: string }[]
  ): IntentAction[] {
    const actions: IntentAction[] = [];

    if (level === IntentLevel.HOT) {
      actions.push({
        id: uuidv4(),
        type: 'outreach',
        priority: 'critical',
        title: 'High Intent Detected',
        description: 'This account is showing strong buying signals. Schedule immediate outreach.',
        channel: 'call',
        estimatedImpact: 90,
      });

      if (!activities.some(a => a.type === 'demo')) {
        actions.push({
          id: uuidv4(),
          type: 'meeting',
          priority: 'high',
          title: 'Request Demo',
          description: 'Strong intent signals - perfect time to request a demo call.',
          channel: 'email',
          estimatedImpact: 80,
        });
      }
    }

    if (level === IntentLevel.WARM) {
      actions.push({
        id: uuidv4(),
        type: 'content',
        priority: 'high',
        title: 'Send Case Study',
        description: 'Account is in consideration phase. Share relevant case studies.',
        channel: 'email',
        estimatedImpact: 70,
      });

      actions.push({
        id: uuidv4(),
        type: 'follow_up',
        priority: 'medium',
        title: 'Follow Up on Previous Touch',
        description: 'Re-engage with personalized follow-up.',
        channel: 'linkedin',
        estimatedImpact: 60,
      });
    }

    if (level === IntentLevel.COLD) {
      actions.push({
        id: uuidv4(),
        type: 'nurture',
        priority: 'low',
        title: 'Add to Nurture Sequence',
        description: 'Account showing early signals. Add to long-term nurture.',
        channel: 'email',
        estimatedImpact: 30,
      });

      actions.push({
        id: uuidv4(),
        type: 'content',
        priority: 'low',
        title: 'Share Educational Content',
        description: 'Build awareness with educational content.',
        channel: 'email',
        estimatedImpact: 20,
      });
    }

    return actions;
  }

  private calculateConfidence(signals: IntentSignal[], activities: unknown[], outreach: unknown[]): number {
    let confidence = 50; // Base

    // Signal confidence
    if (signals.length >= 5) confidence += 20;
    else if (signals.length >= 2) confidence += 10;

    // Activity confidence
    if (activities.length >= 10) confidence += 15;
    else if (activities.length >= 3) confidence += 5;

    // Outreach confidence
    if (outreach.length >= 5) confidence += 15;
    else if (outreach.length >= 1) confidence += 5;

    return Math.min(95, confidence);
  }

  private predictStageChange(signals: IntentSignal[], activities: { performedAt: string }[]): Date | undefined {
    const recentSignals = signals.filter(s => {
      const days = (Date.now() - new Date(s.detectedAt).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 14;
    });

    if (recentSignals.length >= 3) {
      // Expect stage change within 14-30 days
      return new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
    }

    return undefined;
  }

  private predictCloseDate(deals: Record<string, unknown>[]): Date | undefined {
    const activeDeal = deals.find(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
    if (activeDeal?.expectedCloseDate) {
      return new Date(activeDeal.expectedCloseDate as string);
    }
    return undefined;
  }

  private getCompanyName(signals: IntentSignal[], deals: Record<string, unknown>[]): string {
    if (deals.length > 0 && (deals[0] as Record<string, unknown>).companyName) {
      return ((deals[0] as Record<string, unknown>).companyName as string) || 'Unknown';
    }
    if (signals.length > 0 && (signals[0] as Record<string, unknown>).companyName) {
      return ((signals[0] as Record<string, unknown>).companyName as string) || 'Unknown';
    }
    return 'Unknown';
  }

  private toAccountPriority(profile: CompanyIntentProfile): AccountPriority {
    return {
      rank: 0,
      companyId: profile.companyId,
      companyName: profile.companyName,
      intentScore: profile.overallIntentScore,
      intentLevel: profile.intentLevel,
      intentStage: profile.intentStage,
      activeDeals: 0, // Would fetch from deal service
      totalPipelineValue: 0, // Would fetch from deal service
      weightedValue: profile.overallIntentScore * 0, // intent * deal_value
      lastActivityAt: profile.lastActivityAt,
      daysSinceContact: profile.daysSinceLastActivity,
      contactFrequency: 0, // Would calculate from activities
      topAction: profile.recommendedActions[0] || {
        id: uuidv4(),
        type: 'follow_up' as const,
        priority: 'medium' as const,
        title: 'No action recommended',
        description: 'Insufficient data for recommendations.',
      },
      secondaryActions: profile.recommendedActions.slice(1),
      risks: [],
      opportunities: [],
    };
  }

  private toAccountSummary(priority: AccountPriority): AccountIntentSummary {
    return {
      companyId: priority.companyId,
      companyName: priority.companyName,
      intentScore: priority.intentScore,
      intentLevel: priority.intentLevel,
      intentStage: priority.intentStage,
      topSignals: [],
      topAction: priority.topAction,
      lastActivityAt: priority.lastActivityAt,
      daysSinceContact: priority.daysSinceContact,
      dealValue: priority.totalPipelineValue,
    };
  }

  private generateDataPoints(activities: { performedAt: string; type: string }[], days: number): IntentTrend['dataPoints'] {
    const points: IntentTrend['dataPoints'] = [];
    const now = Date.now();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();

      const dayActivities = activities.filter(a => {
        const time = new Date(a.performedAt).getTime();
        return time >= dayStart && time <= dayEnd;
      });

      points.push({
        date: new Date(dayStart),
        score: this.calculateActivityScore(dayActivities),
        stage: this.determineIntentStage([], dayActivities, []),
      });
    }

    return points;
  }

  private predictStageChangeFromTrend(dataPoints: IntentTrend['dataPoints']): Date | undefined {
    if (dataPoints.length < 7) return undefined;

    const recent = dataPoints.slice(-7);
    const trend = recent.reduce((sum, p) => sum + p.score, 0) / recent.length;

    if (trend >= 70) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    return undefined;
  }

  private identifyPositiveSignals(signals: IntentSignal[], activities: { type: string }[]): DealAcceleration['positiveSignals'] {
    const positives: DealAcceleration['positiveSignals'] = [];

    // Strong signals
    signals.filter(s => s.strength >= 80).forEach(s => {
      positives.push({
        signal: s.type,
        impact: s.strength,
        description: s.title,
      });
    });

    // Positive activities
    if (activities.some(a => a.type === 'meeting_completed')) {
      positives.push({ signal: 'meeting', impact: 80, description: 'Meeting completed' });
    }
    if (activities.some(a => a.type === 'demo_viewed')) {
      positives.push({ signal: 'demo', impact: 75, description: 'Demo viewed' });
    }

    return positives;
  }

  private identifyNegativeSignals(signals: IntentSignal[], activities: { performedAt: string }[]): DealAcceleration['negativeSignals'] {
    const negatives: DealAcceleration['negativeSignals'] = [];

    // Stale activities
    const staleActivities = activities.filter(a => {
      const days = (Date.now() - new Date(a.performedAt).getTime()) / (1000 * 60 * 60 * 24);
      return days > 14;
    });

    if (staleActivities.length > 5) {
      negatives.push({
        signal: 'stall',
        impact: 70,
        description: `${staleActivities.length} days without engagement`,
      });
    }

    // Negative signals
    signals.filter(s => ['budget_freeze', 'layoff', 'leadership_change_negative'].includes(s.type)).forEach(s => {
      negatives.push({
        signal: s.type,
        impact: 90,
        description: s.title,
      });
    });

    return negatives;
  }

  private calculateStakeholderEngagement(activities: { type: string }[]): number {
    const engagementActivities = activities.filter(a =>
      ['meeting', 'call', 'email_reply', 'linkedin_message'].includes(a.type)
    );

    if (engagementActivities.length >= 10) return 90;
    if (engagementActivities.length >= 5) return 70;
    if (engagementActivities.length >= 2) return 50;
    return 30;
  }

  private calculateContentEngagement(activities: { type: string }[]): number {
    const contentActivities = activities.filter(a =>
      ['email_open', 'link_click', 'case_study_view', 'proposal_view', 'document_download'].includes(a.type)
    );

    if (contentActivities.length >= 10) return 90;
    if (contentActivities.length >= 5) return 70;
    if (contentActivities.length >= 2) return 50;
    return 20;
  }

  private calculateCompetitionHeat(signals: IntentSignal[]): number {
    const competitorSignals = signals.filter(s => s.type === 'competitor_mentioned');
    return Math.min(100, competitorSignals.length * 25);
  }

  private calculateStageVelocity(deal: Record<string, unknown>): number {
    // Days to move through current stage
    const daysInStage = (deal.daysInStage as number) || 30;
    if (daysInStage <= 7) return 90;
    if (daysInStage <= 14) return 70;
    if (daysInStage <= 30) return 50;
    return 30;
  }

  private calculateAccelerationScore(
    positives: DealAcceleration['positiveSignals'],
    negatives: DealAcceleration['negativeSignals'],
    stakeholderEngagement: number,
    contentEngagement: number
  ): number {
    let score = 50;

    // Add positive impact
    positives.forEach(p => { score += p.impact * 0.2; });

    // Subtract negative impact
    negatives.forEach(n => { score -= n.impact * 0.3; });

    // Add engagement scores
    score += stakeholderEngagement * 0.15;
    score += contentEngagement * 0.15;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private predictDealOutcome(deal: Record<string, unknown>, accelerationScore: number): 'close' | 'stall' | 'lose' {
    if ((deal.probability as number) >= 70 && accelerationScore >= 60) return 'close';
    if (accelerationScore < 30) return 'stall';
    return 'close';
  }

  private generateDealActions(
    deal: Record<string, unknown>,
    accelerationScore: number,
    positives: DealAcceleration['positiveSignals'],
    negatives: DealAcceleration['negativeSignals']
  ): IntentAction[] {
    const actions: IntentAction[] = [];

    if (accelerationScore >= 70) {
      actions.push({
        id: uuidv4(),
        type: 'escalate',
        priority: 'high',
        title: 'Accelerate to Close',
        description: 'Deal showing strong signals. Push for commitment.',
        channel: 'call',
      });
    }

    if (negatives.some(n => n.signal === 'stall')) {
      actions.push({
        id: uuidv4(),
        type: 'outreach',
        priority: 'critical',
        title: 'Deal Stalling',
        description: 'Engagement has dropped. Schedule urgent touchpoint.',
        channel: 'call',
      });
    }

    return actions;
  }

  private getEmptyPipelineOverview(): PipelineIntentOverview {
    return {
      totalAccounts: 0,
      totalPipelineValue: 0,
      hotCount: 0,
      hotValue: 0,
      warmCount: 0,
      warmValue: 0,
      coldCount: 0,
      coldValue: 0,
      byStage: {} as Record<IntentStage, { count: number; value: number }>,
      trendingHot: [],
      trendingCold: [],
      actionsRequired: { immediate: 0, thisWeek: 0, thisMonth: 0 },
    };
  }
}

export const intentService = new IntentService();
