import { logger } from '../../shared/logger';
/**
 * MyRisa Genie Health Service
 * AI Health Assistant for MyRisa
 *
 * Integrates with:
 * - HOJAI AI (LLM, Memory)
 * - MyRisa services (context)
 * - Genie Memory (personal context)
 */

import axios from 'axios';

// HOJAI AI URLs
const HOJAI_LLM_URL = process.env.HOJAI_LLM_URL || 'http://localhost:4500';
const HOJAI_MEMORY_URL = process.env.HOJAI_MEMORY_URL || 'http://localhost:4520';
const GENIE_MEMORY_URL = process.env.GENIE_MEMORY_URL || 'http://localhost:4703';

export class GenieHealthService {

  // ============================================
  // CONTEXT GATHERING
  // ============================================

  /**
   * Gather all health context for a user
   */
  async gatherContext(userId: string): Promise<{
    womensHealth?: any;
    mentalHealth?: any;
    sleep?: any;
    workLife?: any;
    relationships?: any;
    recentEvents?: any[];
  }> {
    const context: any = {
      recentEvents: []
    };

    try {
      // Gather from MyRisa services
      const services = [
        { url: `http://localhost:4820/api/insights/${userId}`, key: 'womensHealth' },
        { url: `http://localhost:4722/api/mood/${userId}/insights`, key: 'mentalHealth' },
        { url: `http://localhost:4729/api/sleep/${userId}/analysis`, key: 'sleep' },
        { url: `http://localhost:4822/api/insights/${userId}`, key: 'workLife' },
        { url: `http://localhost:4823/api/health`, key: 'relationships' },
      ];

      const results = await Promise.allSettled(
        services.map(s => axios.get(s.url, { timeout: 3000 }).then(r => ({ key: s.key, data: r.data }))
      );

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          context[result.value.key] = result.value.data;
        }
      });

      // Try to get from Genie Memory
      try {
        const genieResponse = await axios.get(`${GENIE_MEMORY_URL}/memories/${userId}`, { timeout: 3000 });
        context.genieMemory = genieResponse.data;
      } catch {
        // Genie memory not available
      }

    } catch (error) {
      logger.error('Error gathering context:', error);
    }

    return context;
  }

  // ============================================
  // AI CONVERSATIONS
  // ============================================

  /**
   * Chat with Genie Health
   */
  async chat(userId: string, message: string, conversationHistory?: any[]): Promise<{
    response: string;
    suggestions?: string[];
    actions?: any[];
  }> {
    // Gather context
    const context = await this.gatherContext(userId);

    // Build prompt
    const prompt = this.buildHealthPrompt(message, context, conversationHistory || []);

    try {
      // Call HOJAI LLM
      const llmResponse = await axios.post(`${HOJAI_LLM_URL}/api/llm/chat`, {
        prompt,
        userId,
        system: 'You are Genie Health, a caring AI health assistant. You provide supportive, informative health guidance. Always recommend consulting healthcare professionals for medical advice.'
      }, { timeout: 15000 });

      return {
        response: llmResponse.data.response,
        suggestions: llmResponse.data.suggestions,
        actions: llmResponse.data.actions
      };

    } catch (error) {
      // Fallback to local response
      return this.localResponse(message, context);
    }
  }

  /**
   * Build health-specific prompt
   */
  private buildHealthPrompt(message: string, context: any, history: any[]): string {
    let prompt = `You are Genie Health, a supportive AI health assistant. `;
    prompt += `User message: "${message}"\n\n`;

    // Add context if available
    if (context.womensHealth) {
      prompt += `\nWomen's Health context: ${JSON.stringify(context.womensHealth)}\n`;
    }
    if (context.mentalHealth) {
      prompt += `\nMental Health context: ${JSON.stringify(context.mentalHealth)}\n`;
    }
    if (context.sleep) {
      prompt += `\nSleep context: ${JSON.stringify(context.sleep)}\n`;
    }
    if (context.workLife) {
      prompt += `\nWork-Life context: ${JSON.stringify(context.workLife)}\n`;
    }

    // Add recent events
    if (context.recentEvents?.length > 0) {
      prompt += `\nRecent health events: ${JSON.stringify(context.recentEvents)}\n`;
    }

    prompt += `\nProvide a caring, informative response.`;
    prompt += `\nAlways remind users to consult healthcare professionals.`;

    return prompt;
  }

  /**
   * Local response (fallback when LLM unavailable)
   */
  private localResponse(message: string, context: any): {
    response: string;
    suggestions?: string[];
    actions?: any[];
  } {
    const lowerMessage = message.toLowerCase();

    // Cycle/Period related
    if (lowerMessage.includes('period') || lowerMessage.includes('cycle')) {
      return {
        response: this.getPeriodResponse(lowerMessage, context),
        suggestions: [
          'Track your period',
          'Log symptoms',
          'View cycle prediction'
        ],
        actions: [
          { type: 'navigate', target: '/health' }
        ]
      };
    }

    // Mood/Mental related
    if (lowerMessage.includes('mood') || lowerMessage.includes('stress') || lowerMessage.includes('anxious')) {
      return {
        response: this.getMentalResponse(lowerMessage, context),
        suggestions: [
          'Log your mood',
          'Start breathing exercise',
          'Talk to someone'
        ],
        actions: [
          { type: 'navigate', target: '/mind' }
        ]
      };
    }

    // Sleep related
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
      return {
        response: this.getSleepResponse(lowerMessage, context),
        suggestions: [
          'Log your sleep',
          'Set bedtime reminder',
          'View sleep analysis'
        ],
        actions: [
          { type: 'navigate', target: '/sleep' }
        ]
      };
    }

    // Fatigue/Energy related
    if (lowerMessage.includes('tired') || lowerMessage.includes('fatigue') || lowerMessage.includes('exhausted')) {
      return {
        response: 'I notice you\'ve been feeling tired. This could be related to sleep quality, stress, nutrition, or your menstrual cycle. ' +
          'Would you like me to analyze your recent health patterns? ' +
          'Tracking your energy levels helps identify patterns that affect your wellbeing.',
        suggestions: [
          'Track energy daily',
          'Check sleep patterns',
          'Review stress levels'
        ]
      };
    }

    // General response
    return {
      response: 'I\'m here to help with your health journey. ' +
        'I can assist with tracking your periods, mood, sleep, work-life balance, and more. ' +
        'What aspect of your wellbeing would you like to focus on today?',
      suggestions: [
        'Track my mood',
        'Log my period',
        'Check my sleep',
        'View my insights'
      ]
    };
  }

  private getPeriodResponse(message: string, context: any): string {
    const prediction = context.womensHealth?.cyclePrediction;

    if (message.includes('next') && message.includes('period')) {
      if (prediction?.nextPeriodStart) {
        return `Based on your tracking, your next period is predicted to start around ${prediction.nextPeriodStart}. ` +
          `Your cycle has been ${context.womensHealth?.analytics?.cycleRegularity || 'regular'}. ` +
          `Would you like me to set a reminder?`;
      }
      return 'I don\'t have enough cycle data yet. Start tracking your periods to get predictions and insights.';
    }

    if (message.includes('fertile') || message.includes('ovulation')) {
      if (prediction?.fertileWindowStart) {
        return `Your fertile window is predicted for ${prediction.fertileWindowStart} to ${prediction.fertileWindowEnd}. ` +
          `Ovulation typically occurs around ${prediction.ovulationDate}.`;
      }
      return 'Track your cycles consistently to get fertility predictions.';
    }

    return 'I can help you track your menstrual cycle, predict your next period, ' +
      'and understand your fertility window. Would you like to log your current symptoms or view predictions?';
  }

  private getMentalResponse(message: string, context: any): string {
    const moodData = context.mentalHealth;

    if (message.includes('stressed') || message.includes('anxious')) {
      return 'Stress and anxiety are common. Here are some things that might help:\n\n' +
        '• Deep breathing exercises\n' +
        '• Regular physical activity\n' +
        '• Adequate sleep\n' +
        '• Limiting caffeine\n' +
        '• Talking to someone you trust\n\n' +
        'Would you like me to guide you through a breathing exercise?';
    }

    if (message.includes('sad') || message.includes('depressed')) {
      return 'I hear that you\'re feeling down. ' +
        'It\'s important to acknowledge your feelings. ' +
        'Have you been sleeping well? Eating regularly? ' +
        'Would you like me to help you track your mood patterns?';
    }

    return 'Tracking your mental wellness helps identify patterns. ' +
      'Would you like to log how you\'re feeling today?';
  }

  private getSleepResponse(message: string, context: any): string {
    const sleepData = context.sleep;

    if (sleepData?.averageSleep) {
      return `Your average sleep is ${sleepData.averageSleep} hours. ` +
        `${sleepData.sleepDebt > 0 ? `You have a sleep debt of ${sleepData.sleepDebt} hours. ` : ''}` +
        'Would you like tips to improve your sleep quality?';
    }

    return 'Good sleep is foundational to wellbeing. ' +
      'Track your sleep patterns to get personalized recommendations. ' +
      'Would you like to log your last night\'s sleep?';
  }

  // ============================================
  // INSIGHTS
  // ============================================

  /**
   * Generate daily health briefing
   */
  async generateDailyBriefing(userId: string): Promise<{
    greeting: string;
    summary: string;
    insights: string[];
    reminders: string[];
    actions: any[];
  }> {
    const context = await this.gatherContext(userId);

    return {
      greeting: this.getGreeting(),
      summary: this.generateSummary(context),
      insights: this.generateInsights(context),
      reminders: this.generateReminders(context),
      actions: this.suggestActions(context)
    };
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning! How are you feeling today?';
    if (hour < 17) return 'Good afternoon! How\'s your day going?';
    return 'Good evening! How was your day?';
  }

  private generateSummary(context: any): string {
    const parts: string[] = [];

    if (context.sleep?.quality) {
      parts.push(`Sleep: ${context.sleep.quality}`);
    }
    if (context.womensHealth?.cyclePhase) {
      parts.push(`Cycle: ${context.womensHealth.cyclePhase}`);
    }
    if (context.workLife?.burnoutRisk) {
      parts.push(`Work stress: ${context.workLife.burnoutRisk}`);
    }

    return parts.length > 0
      ? `Today: ${parts.join(' | ')}`
      : 'Track your health to get personalized insights.';
  }

  private generateInsights(context: any): string[] {
    const insights: string[] = [];

    if (context.sleep?.sleepDebt > 3) {
      insights.push('You have accumulated sleep debt. Prioritize rest this week.');
    }

    if (context.mentalHealth?.stressTrend === 'increasing') {
      insights.push('Your stress has been rising. Consider taking breaks.');
    }

    if (context.womensHealth?.analytics?.irregularCycles) {
      insights.push('Your cycles have been irregular. Consider consulting a doctor.');
    }

    if (context.workLife?.burnoutRisk === 'high') {
      insights.push('Your burnout risk is elevated. Take action to prevent exhaustion.');
    }

    return insights.length > 0 ? insights : ['Keep tracking to get personalized insights.'];
  }

  private generateReminders(context: any): string[] {
    const reminders: string[] = [];

    if (context.womensHealth?.upcomingPeriod) {
      reminders.push(`Period expected in ${context.womensHealth.upcomingPeriod} days`);
    }

    if (context.mentalHealth?.therapyDue) {
      reminders.push('Time for therapy session?');
    }

    return reminders;
  }

  private suggestActions(context: any): any[] {
    const actions: any[] = [];

    if (context.sleep?.sleepDebt > 2) {
      actions.push({ label: 'Set bedtime reminder', icon: '😴', action: 'sleep' });
    }

    if (context.womensHealth) {
      actions.push({ label: 'Log symptoms', icon: '🌸', action: 'womensHealth' });
    }

    if (context.mentalHealth) {
      actions.push({ label: 'Log mood', icon: '😊', action: 'mentalHealth' });
    }

    return actions;
  }

  // ============================================
  // PREDICTIONS
  // ============================================

  /**
   * Predict health patterns
   */
  async predictPatterns(userId: string): Promise<{
    predictions: any[];
    confidence: number;
  }> {
    const context = await this.gatherContext(userId);
    const predictions: any[] = [];

    // Cycle prediction
    if (context.womensHealth?.prediction) {
      predictions.push({
        type: 'period',
        prediction: `Next period: ${context.womensHealth.prediction.nextPeriodStart}`,
        confidence: context.womensHealth.prediction.confidence
      });
    }

    // Energy prediction
    if (context.sleep?.patterns) {
      predictions.push({
        type: 'energy',
        prediction: context.sleep.patterns.energyTrend,
        confidence: 0.75
      });
    }

    // Mood prediction
    if (context.mentalHealth?.trends) {
      predictions.push({
        type: 'mood',
        prediction: context.mentalHealth.trends.moodTrend,
        confidence: 0.7
      });
    }

    return {
      predictions,
      confidence: predictions.length > 0 ? 0.8 : 0
    };
  }
}

export const genieHealthService = new GenieHealthService();