import { v4 as uuidv4 } from 'uuid';
import { Conversation, ConversationDocument } from '../models/conversation.model.js';
import { getCampaigns, getCampaignMetrics, getRecommendations } from './campaign.service.js';
import { processMessage, generateSuggestions } from './ai.service.js';
import { cacheContext, getCachedContext } from './cache.service.js';
import { logger } from './logger.js';
import { conversationsTotal, messagesTotal, suggestionsGenerated } from './metrics.js';
import type {
  CopilotConversation,
  CopilotMessage,
  CopilotContext,
  ChatRequest,
  ChatResponse,
  CopilotSuggestion,
} from '../types/index.js';

// Build context for a conversation
export async function buildContext(
  advertiserId: string,
  campaignId?: string
): Promise<CopilotContext> {
  // Check cache first
  const cachedContext = await getCachedContext(advertiserId);
  if (cachedContext) {
    return cachedContext as CopilotContext;
  }

  const campaigns = await getCampaigns(advertiserId);
  const metrics = await getCampaignMetrics(advertiserId);
  const recommendations = await getRecommendations(advertiserId);

  // Filter campaigns if specific campaignId provided
  const currentCampaigns = campaignId
    ? campaigns.filter(c => c.campaignId === campaignId)
    : campaigns;

  const context: CopilotContext = {
    currentCampaigns,
    recentMetrics: metrics,
    recommendations,
  };

  // Cache for 60 seconds
  await cacheContext(advertiserId, context, 60);

  return context;
}

// Create a new conversation
export async function createConversation(
  advertiserId: string,
  campaignId?: string
): Promise<ConversationDocument> {
  const conversationId = uuidv4();
  const context = await buildContext(advertiserId, campaignId);

  const conversation = new Conversation({
    conversationId,
    advertiserId,
    campaignId,
    messages: [],
    context,
    status: 'active',
  });

  await conversation.save();
  conversationsTotal.inc({ advertiser_id: advertiserId });

  logger.info('Conversation created', { conversationId, advertiserId });

  return conversation;
}

// Get or create conversation
export async function getOrCreateConversation(
  conversationId: string | undefined,
  advertiserId: string,
  campaignId?: string
): Promise<ConversationDocument> {
  if (conversationId) {
    const existing = await Conversation.findByConversationId(conversationId);
    if (existing && existing.advertiserId === advertiserId) {
      return existing;
    }
  }

  return createConversation(advertiserId, campaignId);
}

// Add message to conversation
export async function addMessage(
  conversation: ConversationDocument,
  role: 'user' | 'copilot' | 'system',
  content: string,
  actions?: CopilotMessage['actions']
): Promise<CopilotMessage> {
  const message: CopilotMessage = {
    id: uuidv4(),
    role,
    content,
    timestamp: new Date(),
    actions,
  };

  conversation.messages.push(message);
  conversation.updatedAt = new Date();
  await conversation.save();

  messagesTotal.inc({ role, type: 'message' });

  return message;
}

// Process chat message
export async function processChat(
  request: ChatRequest,
  advertiserId: string
): Promise<ChatResponse> {
  const { message, conversationId, campaignId } = request;

  // Get or create conversation
  const conversation = await getOrCreateConversation(
    conversationId,
    advertiserId,
    campaignId
  );

  // Get context
  const context = await buildContext(advertiserId, campaignId || conversation.campaignId);

  // Add user message
  await addMessage(conversation, 'user', message);

  // Process message with AI
  const { response, intent } = await processMessage(
    message,
    context,
    conversation.messages.slice(0, -1)
  );

  // Determine if any actions should be executed
  const actions = determineActions(intent, context);

  // Add copilot response
  const copilotMessage = await addMessage(conversation, 'copilot', response, actions);

  logger.info('Chat processed', {
    conversationId: conversation.conversationId,
    intent: intent.action,
    hasActions: actions && actions.length > 0,
  });

  return {
    conversationId: conversation.conversationId,
    message: copilotMessage,
    context,
    actions,
  };
}

// Determine actions based on intent
function determineActions(
  intent: { action: string; entities: Record<string, unknown> },
  context: CopilotContext
): CopilotMessage['actions'] {
  const actions: CopilotMessage['actions'] = [];

  switch (intent.action) {
    case 'pause_campaigns':
      context.currentCampaigns
        .filter(c => c.status === 'active')
        .forEach(c => {
          actions.push({
            type: 'pause_campaign',
            params: { campaignId: c.campaignId, campaignName: c.name },
            executed: false,
          });
        });
      break;

    case 'resume_campaigns':
      context.currentCampaigns
        .filter(c => c.status === 'paused')
        .forEach(c => {
          actions.push({
            type: 'resume_campaign',
            params: { campaignId: c.campaignId, campaignName: c.name },
            executed: false,
          });
        });
      break;

    case 'adjust_budget':
      if (intent.entities.campaignName || intent.entities.campaignId) {
        actions.push({
          type: 'adjust_budget',
          params: {
            campaignId: intent.entities.campaignId as string,
            campaignName: intent.entities.campaignName as string,
            newBudget: intent.entities.budget as number,
            operation: intent.entities.operation as string,
          },
          executed: false,
        });
      }
      break;

    case 'generate_report':
      actions.push({
        type: 'generate_report',
        params: {
          advertiserId: context.currentCampaigns[0]?.campaignId,
          dateRange: intent.entities.dateRange,
        },
        executed: false,
      });
      break;

    case 'recommendations':
      actions.push({
        type: 'recommend',
        params: { context },
        executed: false,
      });
      break;
  }

  return actions;
}

// Get conversation by ID
export async function getConversation(conversationId: string): Promise<ConversationDocument | null> {
  return Conversation.findByConversationId(conversationId);
}

// List conversations for advertiser
export async function listConversations(
  advertiserId: string,
  status?: 'active' | 'archived',
  limit = 20,
  offset = 0
): Promise<{ conversations: ConversationDocument[]; total: number }> {
  const query: Record<string, unknown> = { advertiserId };
  if (status) {
    query.status = status;
  }

  const [conversations, total] = await Promise.all([
    Conversation.find(query)
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit),
    Conversation.countDocuments(query),
  ]);

  return { conversations, total };
}

// Archive conversation
export async function archiveConversation(conversationId: string): Promise<boolean> {
  const conversation = await Conversation.findByConversationId(conversationId);
  if (!conversation) {
    return false;
  }

  await conversation.archive();
  logger.info('Conversation archived', { conversationId });
  return true;
}

// Generate proactive suggestions
export async function getProactiveSuggestions(
  advertiserId: string,
  triggerType: 'idle' | 'performance_drop' | 'budget_alert' | 'opportunity' = 'idle'
): Promise<CopilotSuggestion[]> {
  const context = await buildContext(advertiserId);
  const suggestions: CopilotSuggestion[] = [];

  // Generate AI-based suggestions
  const aiSuggestions = await generateSuggestions(context, triggerType);

  aiSuggestions.forEach((suggestion, index) => {
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let type: 'optimization' | 'alert' | 'opportunity' | 'action' = 'optimization';

    if (triggerType === 'performance_drop') {
      priority = 'high';
      type = 'alert';
    } else if (triggerType === 'budget_alert') {
      priority = 'high';
      type = 'alert';
    } else if (triggerType === 'opportunity') {
      priority = 'medium';
      type = 'opportunity';
    }

    suggestions.push({
      id: uuidv4(),
      type,
      priority,
      title: suggestion.substring(0, 50),
      description: suggestion,
    });

    suggestionsGenerated.inc({ type, priority });
  });

  // Add campaign-specific suggestions
  const lowCtrCampaigns = context.currentCampaigns.filter(c => c.ctr < 1.5);
  if (lowCtrCampaigns.length > 0) {
    suggestions.push({
      id: uuidv4(),
      type: 'optimization',
      priority: 'high',
      title: 'Low CTR campaigns need attention',
      description: `${lowCtrCampaigns.length} campaign(s) have CTR below 1.5%. Consider reviewing ad creative or targeting.`,
      action: {
        type: 'optimize_campaigns',
        params: { campaignIds: lowCtrCampaigns.map(c => c.campaignId) },
      },
    });
 }

  return suggestions;
}