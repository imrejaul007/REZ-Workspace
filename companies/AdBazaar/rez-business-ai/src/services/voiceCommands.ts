/**
 * REZ Business AI - Voice Commands
 * Natural language processing for merchant commands
 */

// Command patterns
const COMMANDS = {
  // Campaign commands
  'launch.*weekend': { action: 'launch_campaign', campaign: 'weekend_rush' },
  'launch.*campaign': { action: 'launch_campaign' },
  'start.*offer': { action: 'create_offer' },

  // Status commands
  'show.*sales': { action: 'show_metrics', metric: 'revenue' },
  'show.*customers': { action: 'show_metrics', metric: 'customers' },
  'show.*orders': { action: 'show_metrics', metric: 'orders' },
  'how.*business': { action: 'show_health' },
  'check.*status': { action: 'show_status' },

  // Action commands
  'send.*notification': { action: 'send_notification' },
  'create.*discount': { action: 'create_discount' },
  'update.*price': { action: 'update_pricing' },
  'check.*inventory': { action: 'check_inventory' },
  'show.*report': { action: 'show_report' },

  // Campaign types
  'happy.*hour': { action: 'launch_campaign', campaign: 'happy_hour' },
  'rainy.*day': { action: 'launch_campaign', campaign: 'rainy_day' },
  'win.*back': { action: 'launch_campaign', campaign: 'win_back' },
  'festival.*deal': { action: 'launch_campaign', campaign: 'festival_boost' },
};

/**
 * Parse voice command
 */
function parseCommand(text) {
  const lower = text.toLowerCase();

  for (const [pattern, result] of Object.entries(COMMANDS)) {
    if (lower.match(new RegExp(pattern))) {
      return {
        intent: result.action,
        entities: result,
        confidence: 0.9,
        raw: text,
      };
    }
  }

  return {
    intent: 'unknown',
    entities: {},
    confidence: 0,
    raw: text,
  };
}

/**
 * Execute command
 */
function executeCommand(command) {
  switch (command.intent) {
    case 'show_health':
      return {
        message: 'Your business health score is 87 out of 100. Revenue is up 15% this week.',
        actions: ['View dashboard'],
      };

    case 'show_metrics':
      return {
        message: `Your ${command.entities.metric || 'revenue'} is at target. Up 12% this week.`,
        actions: ['View detailed report'],
      };

    case 'launch_campaign':
      return {
        message: `Ready to launch ${command.entities.campaign || 'campaign'}. Estimated impact: ₹8,000.`,
        actions: ['Launch', 'Modify', 'Cancel'],
      };

    case 'send_notification':
      return {
        message: 'Send notification to customers. Who should I send to?',
        actions: ['All customers', 'Inactive customers', 'VIP customers'],
      };

    case 'create_offer':
      return {
        message: 'Create a new offer. What discount would you like?',
        actions: ['10% off', '20% off', 'Free delivery'],
      };

    case 'check_inventory':
      return {
        message: 'Inventory looks good. 3 items are running low.',
        actions: ['View low stock', 'Reorder now'],
      };

    default:
      return {
        message: "I didn't understand that. Try: 'show sales', 'launch weekend campaign', or 'check inventory'",
        actions: [],
      };
  }
}

// Export for use
module.exports = {
  parseCommand,
  executeCommand,
  COMMANDS,
};
