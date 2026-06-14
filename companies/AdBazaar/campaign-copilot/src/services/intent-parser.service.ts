import type { ParsedIntent } from '../types/index.js';
import { logger } from './logger.js';

// Intent patterns for campaign management
const intentPatterns = {
  // Campaign listing/introduction
  listCampaigns: {
    patterns: [
      /list (?:my |all )?campaigns/i,
      /show (?:me )?(?:my |all )?campaigns/i,
      /what (?:campaigns|ads) (?:do I have|are running)/i,
      /get (?:my |all )?campaigns/i,
    ],
    action: 'list_campaigns',
  },
  // Campaign status
  campaignStatus: {
    patterns: [
      /how('s| is) (?:my |the )?(.+?) (?:doing|performing)/i,
      /(?:campaign|ad) (.+?) (?:status|performance)/i,
      /status of (.+?)/i,
    ],
    action: 'campaign_status',
  },
  // Pause campaigns
  pauseCampaign: {
    patterns: [
      /pause (?:my |all )?(?:running )?campaigns?/i,
      /stop (?:my |all )?campaigns?/i,
      /halt (?:my |all )?campaigns?/i,
 ],
    action: 'pause_campaigns',
  },
  // Resume campaigns
  resumeCampaign: {
    patterns: [
      /resume (?:my |all )?campaigns?/i,
      /start (?:my |all )?campaigns?/i,
      /activate (?:my |all )?campaigns?/i,
    ],
    action: 'resume_campaigns',
  },
  // Budget adjustments
  adjustBudget: {
    patterns: [
      /increase (?:budget for |my budget on )?(.+?)(?: by | to |$)/i,
      /decrease (?:budget for |my budget on )?(.+?)(?: by | to |$)/i,
      /set budget (?:for |on )?(.+?)(?: to |$)/i,
      /change (?:the )?budget (?:for |on )?(.+?)(?: to |$)/i,
      /adjust budget (?:for |on )?(.+?)(?: to |$)/i,
    ],
    action: 'adjust_budget',
  },
  // Performance metrics
  performanceMetrics: {
    patterns: [
      /show (?:me )?(?:my )?(?:yesterday|today|this week|this month)?\s*(?:performance|metrics|stats)/i,
      /how('s| is) (?:my )?(?:yesterday|today|this week|this month)?\s*(?:performance|ads doing)/i,
      /(?:yesterday|today|this week|this month)\s*(?:performance|results)/i,
      /get (?:my )?(?:yesterday|today|this week|this month)?\s*(?:performance|metrics)/i,
    ],
    action: 'performance_metrics',
  },
  // Create campaign
  createCampaign: {
    patterns: [
      /create (?:a )?(?:new )?campaign/i,
      /start (?:a )?(?:new )?campaign/i,
      /launch (?:a )?(?:new )?campaign/i,
      /new campaign/i,
    ],
    action: 'create_campaign',
  },
  // Generate report
  generateReport: {
    patterns: [
      /generate (?:a )?(?:report|summary)/i,
      /show (?:me )?(?:a )?report/i,
      /give (?:me )?(?:a )?report/i,
      /report (?:on |for )?/i,
    ],
    action: 'generate_report',
  },
  // Recommendations
  recommendations: {
    patterns: [
      /what do you recommend/i,
      /any suggestions/i,
      /recommend/i,
      /suggestions?/i,
      /how can I improve/i,
    ],
    action: 'recommendations',
  },
  // Help
  help: {
    patterns: [
      /help/i,
      /what can you do/i,
      /how do I use you/i,
      /commands/i,
    ],
    action: 'help',
  },
};

// Extract entities from query
function extractEntities(query: string): ParsedIntent['entities'] {
  const entities: ParsedIntent['entities'] = {};

  // Extract budget amounts
  const budgetMatch = query.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs|inr|₹|dollars?|\$)?/i);
  if (budgetMatch) {
    const amount = parseFloat(budgetMatch[1].replace(/,/g, ''));
    if (amount > 0) {
      entities.budget = amount;
    }
  }

  // Extract percentage changes
  const percentMatch = query.match(/(\d+)%/);
  if (percentMatch) {
    entities.budget = parseInt(percentMatch[1], 10);
  }

  // Extract date ranges
  if (/yesterday/i.test(query)) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    entities.dateRange = {
      start: new Date(yesterday.setHours(0, 0, 0, 0)),
      end: new Date(yesterday.setHours(23, 59, 59, 999)),
    };
  } else if (/this week/i.test(query)) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    entities.dateRange = {
      start: new Date(startOfWeek.setHours(0, 0, 0, 0)),
      end: today,
    };
  } else if (/this month/i.test(query)) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    entities.dateRange = {
      start: startOfMonth,
      end: today,
    };
  }

  // Extract operation type
  if (/increase|add|more/i.test(query)) {
    entities.operation = 'increase';
  } else if (/decrease|reduce|less/i.test(query)) {
    entities.operation = 'decrease';
  } else if (/set|change to/i.test(query)) {
    entities.operation = 'set';
  }

  // Extract campaign name/ID
  const campaignMatch = query.match(/(?:campaign|ad)\s+(?:named|called|id[:\s]+)?(.+?)(?:\s|$)/i);
  if (campaignMatch) {
    entities.campaignName = campaignMatch[1].trim();
  }

  // Extract metrics
  const metrics = ['impressions', 'clicks', 'ctr', 'cpc', 'conversions', 'spend', 'roas'];
  for (const metric of metrics) {
    if (query.toLowerCase().includes(metric)) {
      entities.metric = metric;
      break;
    }
  }

  return entities;
}

// Parse user query to determine intent
export function parseIntent(query: string): ParsedIntent {
  const normalizedQuery = query.toLowerCase().trim();

  for (const [intentName, intentConfig] of Object.entries(intentPatterns)) {
    for (const pattern of intentConfig.patterns) {
      const match = normalizedQuery.match(pattern);
      if (match) {
        const entities = extractEntities(query);

        // Extract campaign name from match groups if available
        if (match[1] && intentName === 'campaignStatus') {
          entities.campaignName = match[1].trim();
        }

        logger.debug('Intent parsed', {
          intent: intentConfig.action,
          entities,
          query: normalizedQuery,
        });

        return {
          action: intentConfig.action,
          entities,
          confidence: 0.85,
          rawQuery: query,
        };
      }
    }
  }

  // Default to general query with low confidence
  logger.debug('No specific intent matched, defaulting to general query', {
    query: normalizedQuery,
  });

  return {
    action: 'general_query',
    entities: extractEntities(query),
    confidence: 0.5,
    rawQuery: query,
  };
}

// Generate response based on intent
export function generateIntentResponse(intent: ParsedIntent, context: {
  campaigns?: unknown[];
  metrics?: unknown;
}): { response: string; actions: ParsedIntent['entities'] } {
  const { action, entities } = intent;

  switch (action) {
    case 'list_campaigns':
      return {
        response: 'Here are your campaigns. I can help you manage them through natural language commands.',
        actions: {},
      };

    case 'campaign_status':
      if (entities.campaignName) {
        return {
          response: `Let me check the status of "${entities.campaignName}" for you.`,
          actions: { campaignName: entities.campaignName },
        };
      }
      return {
        response: 'Which campaign would you like to check the status for?',
        actions: {},
      };

    case 'pause_campaigns':
      return {
        response: 'I\'ll pause your running campaigns. This will stop ad delivery immediately.',
        actions: { operation: 'pause' },
      };

    case 'resume_campaigns':
      return {
        response: 'I\'ll resume your paused campaigns. They\'ll start delivering ads again.',
        actions: { operation: 'resume' },
      };

    case 'adjust_budget':
      if (entities.budget && entities.operation) {
        return {
          response: `I\'ll ${entities.operation} the budget${entities.campaignName ? ` for "${entities.campaignName}"` : ''} to ${entities.budget}.`,
          actions: entities,
        };
      }
      return {
        response: 'How much would you like to adjust the budget? Please specify an amount.',
        actions: {},
      };

    case 'performance_metrics':
      return {
        response: `Let me get your ${entities.dateRange ? 'performance metrics' : 'overall performance metrics'} for you.`,
        actions: entities,
      };

    case 'create_campaign':
      return {
        response: 'I\'ll help you create a new campaign. What\'s the campaign name and objective?',
        actions: {},
      };

    case 'generate_report':
      return {
        response: 'I\'ll generate a performance report for you. What time period would you like to cover?',
        actions: entities,
      };

    case 'recommendations':
      return {
        response: 'Based on your campaign performance, here are my recommendations:',
        actions: {},
      };

    case 'help':
    default:
      return {
        response: `I can help you manage your advertising campaigns. Here are some things you can ask me:

• "Show me my campaigns" - List all your campaigns
• "Pause my running campaigns" - Pause active campaigns
• "How is my campaign performing?" - Check campaign status
• "Increase budget for my campaign by 20%" - Adjust budget
• "Show me yesterday's performance" - View metrics
• "Create a new campaign" - Start a new campaign
• "Generate a report" - Create a performance report
• "What do you recommend?" - Get optimization suggestions

What would you like to do?`,
        actions: {},
      };
  }
}