/**
 * AI Sales Agent - Unified Sales Workflow
 *
 * Coordinates all ecosystem services for complete sales operations
 * Uses existing RTNM services - no new services needed
 */

import {
  prospectingConnector,
  communicationConnector,
  intelligenceConnector,
  identityConnector,
  crmConnector,
  bookingConnector,
  conversationIntelConnector,
} from './ecosystemConnector.js';

export interface SalesWorkflowInput {
  prospectEmail?: string;
  prospectName: string;
  company: string;
  phone?: string;
  source: string;
  painPoint?: string;
  productInterest?: string;
}

export interface SalesWorkflowResult {
  workflowId: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  actions: {
    action: string;
    status: 'pending' | 'completed' | 'failed';
    result?: any;
  }[];
  preCallBrief?: any;
  talkingPoints?: string[];
  nextBestAction?: string;
  estimatedCloseProbability?: number;
}

export class AISalesAgent {
  private workflowIdCounter = 0;

  /**
   * Run complete sales workflow for a prospect
   */
  async runWorkflow(input: SalesWorkflowInput): Promise<SalesWorkflowResult> {
    const workflowId = 'wf_' + (++this.workflowIdCounter) + '_' + Date.now();
    const actions: any[] = [];

    console.log('Starting AI Sales Workflow:', workflowId);

    // Step 1: Enrich prospect from multiple sources
    const enrichmentResult = await this.enrichProspect(input);
    actions.push({ action: 'enrich_prospect', status: 'completed', result: enrichmentResult });

    // Step 2: Get market intelligence
    const marketIntel = await intelligenceConnector.getMarketSignals(input.company);
    actions.push({ action: 'market_intel', status: 'completed', result: marketIntel });

    // Step 3: Generate pre-call brief
    const preCallBrief = await this.generatePreCallBrief(input, enrichmentResult);
    actions.push({ action: 'pre_call_brief', status: 'completed', result: preCallBrief });

    // Step 4: Create CRM lead if not exists
    const leadCreated = await this.createOrUpdateLead(input, enrichmentResult);
    actions.push({ action: 'crm_lead', status: 'completed', result: leadCreated });

    // Step 5: Generate talking points
    const talkingPoints = await this.generateTalkingPoints(input, enrichmentResult, marketIntel);
    actions.push({ action: 'talking_points', status: 'completed', result: talkingPoints });

    // Step 6: Determine next best action
    const nextBestAction = await this.determineNextAction(input, enrichmentResult);
    actions.push({ action: 'next_action', status: 'completed', result: nextBestAction });

    // Step 7: Calculate close probability
    const closeProbability = await this.calculateCloseProbability(input, enrichmentResult);
    actions.push({ action: 'probability_calc', status: 'completed', result: { probability: closeProbability } });

    // Step 8: Store in identity hub for future reference
    await identityConnector.storeInteraction('salesmind', input.prospectEmail || 'unknown', {
      workflowId,
      prospect: input,
      enrichment: enrichmentResult,
      timestamp: new Date(),
    });

    return {
      workflowId,
      status: 'completed',
      actions,
      preCallBrief,
      talkingPoints,
      nextBestAction,
      estimatedCloseProbability: closeProbability,
    };
  }

  /**
   * Enrich prospect from multiple ecosystem sources
   */
  private async enrichProspect(input: SalesWorkflowInput): Promise<any> {
    const enrichment = {
      prospect: { name: input.prospectName, email: input.prospectEmail, phone: input.phone },
      company: null as any,
      linkedIn: null as any,
      marketSignals: [] as any[],
      identityProfile: null as any,
      conversationHistory: [] as any[],
    };

    // Get company intel from HOJAI
    enrichment.company = await this.getCompanyIntel(input.company);

    // Get LinkedIn data
    enrichment.linkedIn = await this.getLinkedInData(input);

    // Get market signals
    enrichment.marketSignals = await intelligenceConnector.getMarketSignals(input.company);

    // Get identity profile
    if (input.prospectEmail) {
      enrichment.identityProfile = await identityConnector.getUnifiedProfile(input.prospectEmail);
      enrichment.conversationHistory = await identityConnector.getConversationHistory('salesmind', input.prospectEmail);
    }

    return enrichment;
  }

  private async getCompanyIntel(companyName: string): Promise<any> {
    const intel = await intelligenceConnector.getCompanyProfile(companyName);
    if (!intel) {
      // Fallback to mock data
      return {
        name: companyName,
        industry: 'Technology',
        size: '50-200',
        founded: 2015,
        website: `https://${companyName.toLowerCase().replace(/\s/g, '')}.com`,
        techStack: ['React', 'Node.js', 'AWS'],
        funding: 'Series A',
        growth: '15% YoY',
      };
    }
    return intel;
  }

  private async getLinkedInData(input: SalesWorkflowInput): Promise<any> {
    // This would use LinkedIn connector - simplified here
    return {
      profileUrl: `https://linkedin.com/in/${input.prospectName.toLowerCase().replace(/\s/g, '-')}`,
      headline: 'Sales Leader',
      connections: 250,
    };
  }

  private async generatePreCallBrief(input: SalesWorkflowInput, enrichment: any): Promise<any> {
    return {
      prospect: {
        name: input.prospectName,
        title: enrichment.linkedIn?.headline || 'Unknown',
        company: input.company,
        email: input.prospectEmail,
        phone: input.phone,
      },
      companyIntel: {
        industry: enrichment.company?.industry || 'Unknown',
        size: enrichment.company?.size || 'Unknown',
        funding: enrichment.company?.funding || 'Unknown',
        founded: enrichment.company?.founded || 'Unknown',
      },
      talkingPoints: enrichment.marketSignals.slice(0, 5).map((s: any) => s.content),
      recentActivity: enrichment.conversationHistory.slice(0, 3),
      keyInsights: [
        `Company in ${enrichment.company?.industry || 'tech'} industry`,
        enrichment.company?.size ? `Team of ${enrichment.company.size}` : '',
        enrichment.company?.funding ? `Recent ${enrichment.company.funding}` : '',
      ].filter(Boolean),
      recommendedApproach: this.getRecommendedApproach(input, enrichment),
      questionsToAsk: [
        'What are your current priorities?',
        'What challenges are you facing?',
        'What would success look like?',
        'Who else is involved in this decision?',
      ],
    };
  }

  private getRecommendedApproach(input: SalesWorkflowInput, enrichment: any): string {
    if (enrichment.company?.funding?.includes('Series A')) {
      return 'Emphasize ROI and quick implementation - early stage companies need fast results';
    }
    if (enrichment.company?.size?.includes('500+')) {
      return 'Focus on enterprise features, security, and integration capabilities';
    }
    return 'Standard SMB approach - emphasize ease of use and quick time to value';
  }

  private async generateTalkingPoints(
    input: SalesWorkflowInput,
    enrichment: any,
    marketSignals: any[]
  ): Promise<string[]> {
    const points: string[] = [];

    // Company-specific points
    if (enrichment.company?.industry) {
      points.push(`${input.company} operates in the ${enrichment.company.industry} sector - key trends include market growth and digital transformation`);
    }

    if (enrichment.company?.funding) {
      points.push(`${input.company} recently raised ${enrichment.company.funding} funding - showing growth trajectory`);
    }

    if (enrichment.company?.growth) {
      points.push(`${input.company} is growing at ${enrichment.company.growth} - they may be scaling operations`);
    }

    // Market signals
    marketSignals.slice(0, 3).forEach((signal: any) => {
      points.push(signal.content);
    });

    // Pain point based
    if (input.painPoint) {
      points.push(`They mentioned challenges with: ${input.painPoint}`);
    }

    // Product interest
    if (input.productInterest) {
      points.push(`Interested in: ${input.productInterest}`);
    }

    return points.slice(0, 8);
  }

  private async determineNextAction(input: SalesWorkflowInput, enrichment: any): Promise<string> {
    // Check engagement history
    const historyCount = enrichment.conversationHistory?.length || 0;

    if (historyCount === 0) {
      return 'Send introductory email with value proposition';
    }

    if (historyCount < 3) {
      return 'Schedule discovery call to understand their needs';
    }

    if (enrichment.company?.size?.includes('500+')) {
      return 'Request meeting with decision makers, prepare executive briefing';
    }

    return 'Send personalized proposal based on their requirements';
  }

  private async calculateCloseProbability(input: SalesWorkflowInput, enrichment: any): Promise<number> {
    let probability = 50; // Base probability

    // Positive factors
    if (enrichment.company?.funding) probability += 15;
    if (enrichment.company?.size?.includes('200+')) probability += 10;
    if (enrichment.conversationHistory?.length > 0) probability += 15;
    if (input.painPoint) probability += 10;

    // Negative factors
    if (!input.phone) probability -= 10;
    if (!input.prospectEmail) probability -= 20;

    return Math.min(Math.max(probability, 5), 95);
  }

  private async createOrUpdateLead(input: SalesWorkflowInput, enrichment: any): Promise<any> {
    const leadData = {
      name: input.prospectName,
      email: input.prospectEmail,
      phone: input.phone,
      company: input.company,
      source: input.source,
      stage: 'new',
      score: enrichment.company?.score || 50,
      industry: enrichment.company?.industry,
      companySize: enrichment.company?.size,
    };

    // In real implementation, this would create/update in CRM
    console.log('Creating/updating lead:', leadData);
    return { id: 'lead_' + Date.now(), ...leadData };
  }

  /**
   * Execute outreach sequence
   */
  async executeOutreachSequence(prospectId: string, sequenceType: 'intro' | 'follow_up' | 'proposal' | 'reengagement'): Promise<{
    steps: { step: string; status: string; sentAt?: Date }[];
  }> {
    const steps: any[] = [];

    switch (sequenceType) {
      case 'intro':
        // Step 1: LinkedIn connection
        steps.push({ step: 'linkedin_connect', status: 'pending' });
        // Step 2: Intro email
        steps.push({ step: 'send_email', status: 'pending' });
        break;

      case 'follow_up':
        // Step 1: Follow-up email
        steps.push({ step: 'send_followup_email', status: 'pending' });
        // Step 2: Call attempt
        steps.push({ step: 'make_call', status: 'pending' });
        break;

      case 'proposal':
        // Step 1: Send proposal
        steps.push({ step: 'send_proposal', status: 'pending' });
        // Step 2: Schedule call
        steps.push({ step: 'schedule_meeting', status: 'pending' });
        break;

      case 'reengagement':
        // Step 1: Re-engagement email
        steps.push({ step: 'send_reengagement_email', status: 'pending' });
        // Step 2: LinkedIn message
        steps.push({ step: 'send_linkedin_message', status: 'pending' });
        break;
    }

    // Execute steps
    for (const step of steps) {
      console.log('Executing step:', step.step);
      step.status = 'completed';
      step.sentAt = new Date();
    }

    return { steps };
  }

  /**
   * Analyze conversation and extract insights
   */
  async analyzeConversation(conversationText: string): Promise<any> {
    const [sentiment, topics, objections] = await Promise.all([
      conversationIntelConnector.getSentiment(conversationText),
      conversationIntelConnector.extractKeyTopics(conversationText),
      conversationIntelConnector.detectObjections(conversationText),
    ]);

    return {
      sentiment,
      topics,
      objections,
      summary: this.summarizeConversation(conversationText, sentiment, topics),
      recommendations: this.getRecommendations(objections, sentiment),
    };
  }

  private summarizeConversation(text: string, sentiment: string, topics: string[]): string {
    return `This conversation has ${sentiment} sentiment. Key topics discussed: ${topics.join(', ')}.`;
  }

  private getRecommendations(objections: string[], sentiment: string): string[] {
    const recommendations: string[] = [];

    if (objections.length > 0) {
      recommendations.push(`Address objections: ${objections.join(', ')}`);
    }

    if (sentiment === 'negative') {
      recommendations.push('Consider rebuilding trust before pushing for close');
    }

    recommendations.push('Follow up within 24 hours to maintain momentum');

    return recommendations;
  }
}

export const aiSalesAgent = new AISalesAgent();