import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logger } from './logger.js';
import { aiResponseDuration } from './metrics.js';
import type { ParsedIntent, CopilotContext, CopilotMessage } from '../types/index.js';
import { parseIntent, generateIntentResponse } from './intent-parser.service.js';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!config.openai.apiKey) {
    logger.warn('OpenAI API key not configured, using rule-based responses');
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  return openaiClient;
}

// Build conversation context for AI
function buildContextPrompt(context: CopilotContext, userMessage: string): string {
  const campaignsSummary = context.currentCampaigns.length > 0
    ? context.currentCampaigns.map(c =>
      `- ${c.name} (${c.status}): ${c.impressions.toLocaleString()} impressions, ${c.clicks.toLocaleString()} clicks, CTR: ${c.ctr.toFixed(2)}%, CPC: ₹${c.cpc.toFixed(2)}`
    ).join('\n')
    : 'No active campaigns';

  const metricsSummary = context.recentMetrics
    ? `Overall Performance: ${context.recentMetrics.totalImpressions.toLocaleString()} impressions, ${context.recentMetrics.totalClicks.toLocaleString()} clicks, CTR: ${context.recentMetrics.averageCtr.toFixed(2)}%, CPC: ₹${context.recentMetrics.averageCpc.toFixed(2)}, ROAS: ${context.recentMetrics.roas.toFixed(2)}`
    : 'No metrics available';

  return `
Current Campaign Status:
${campaignsSummary}

${metricsSummary}

Recent Recommendations:
${context.recommendations.length > 0 ? context.recommendations.join('\n') : 'No recent recommendations'}

User Message: "${userMessage}"

You are a campaign management assistant for an advertising platform. Help the user manage their campaigns through natural language. Be concise, helpful, and actionable.
`;
}

// Generate AI response using OpenAI
async function generateAIResponse(
  userMessage: string,
  context: CopilotContext,
  previousMessages: CopilotMessage[]
): Promise<string> {
  const client = getOpenAIClient();

  if (!client) {
    // Fallback to rule-based response
    const intent = parseIntent(userMessage);
    const response = generateIntentResponse(intent, {
      campaigns: context.currentCampaigns,
      metrics: context.recentMetrics,
    });
    return response.response;
  }

  const startTime = Date.now();
  const intent = parseIntent(userMessage);

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are a helpful advertising campaign management assistant. You help advertisers manage their campaigns through natural language. Be concise, friendly, and provide actionable insights.',
      },
      {
        role: 'user',
        content: buildContextPrompt(context, userMessage),
      },
    ];

    // Add previous messages for context
    const recentMessages = previousMessages.slice(-6);
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        messages.push({ role: 'user' as const, content: msg.content });
      } else if (msg.role === 'copilot') {
        messages.push({ role: 'assistant' as const, content: msg.content });
      }
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const duration = (Date.now() - startTime) / 1000;
    aiResponseDuration.observe({ intent: intent.action }, duration);

    const response = completion.choices[0]?.message?.content || 'I\'m here to help with your campaigns. What would you like to do?';

    logger.debug('AI response generated', {
      intent: intent.action,
      duration,
      tokens: completion.usage?.total_tokens,
    });

    return response;
  } catch (error) {
    logger.error('OpenAI API error, falling back to rule-based response', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fallback to rule-based response
    const intent = parseIntent(userMessage);
    const response = generateIntentResponse(intent, {
      campaigns: context.currentCampaigns,
      metrics: context.recentMetrics,
    });
    return response.response;
  }
}

// Process user message and generate response
export async function processMessage(
  userMessage: string,
  context: CopilotContext,
  previousMessages: CopilotMessage[]
): Promise<{ response: string; intent: ParsedIntent }> {
  const intent = parseIntent(userMessage);

  logger.info('Processing message', {
    intent: intent.action,
    confidence: intent.confidence,
    messageLength: userMessage.length,
  });

  const response = await generateAIResponse(userMessage, context, previousMessages);

  return {
    response,
    intent,
  };
}

// Generate proactive suggestions based on context
export async function generateSuggestions(
  context: CopilotContext,
  triggerType: 'idle' | 'performance_drop' | 'budget_alert' | 'opportunity'
): Promise<string[]> {
  const suggestions: string[] = [];

  // Check for campaigns with low CTR
  const lowCtrCampaigns = context.currentCampaigns.filter(c => c.ctr < 1);
  if (lowCtrCampaigns.length > 0) {
    suggestions.push(`Consider optimizing ad creative for ${lowCtrCampaigns.length} campaign(s) with CTR below 1%`);
  }

  // Check for campaigns with high CPC
  const highCpcCampaigns = context.currentCampaigns.filter(c => c.cpc > 10);
  if (highCpcCampaigns.length > 0) {
    suggestions.push(`Review bidding strategy for ${highCpcCampaigns.length} campaign(s) with CPC above ₹10`);
  }

  // Check for inactive campaigns
  const pausedCampaigns = context.currentCampaigns.filter(c => c.status === 'paused');
  if (pausedCampaigns.length > 0) {
    suggestions.push(`You have ${pausedCampaigns.length} paused campaign(s) that could be resumed`);
  }

  // Check budget utilization
  const highSpendCampaigns = context.currentCampaigns.filter(c => c.spent / c.budget > 0.9);
  if (highSpendCampaigns.length > 0) {
    suggestions.push(`${highSpendCampaigns.length} campaign(s) are nearing their budget limit`);
  }

  // Performance drop detection
  if (triggerType === 'performance_drop') {
    suggestions.push('Performance has dropped. Consider reviewing targeting or creative');
 }

  // Budget alert
  if (triggerType === 'budget_alert') {
    suggestions.push('Budget alert: Some campaigns are exceeding daily spend targets');
  }

  // Opportunity
  if (triggerType === 'opportunity') {
    suggestions.push('High-performing audience segment detected - consider expanding targeting');
  }

  // Default idle suggestions
  if (suggestions.length === 0) {
    suggestions.push('Your campaigns are performing well. Keep monitoring for optimal results.');
  }

  return suggestions;
}