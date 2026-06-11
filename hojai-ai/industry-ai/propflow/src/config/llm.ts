/**
 * LLM Configuration for PropFlow Agents
 * Configures Claude SDK integration for all AI agents
 */

export const LLM_CONFIG = {
  provider: 'anthropic',
  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10),
  temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),

  // API Configuration
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com',

  // Agent-specific settings
  agents: {
    propertyAgent: {
      name: 'Property Matcher',
      systemPrompt: `You are an expert real estate property matcher with deep knowledge of:
- Property types, features, and amenities
- Location analysis and neighborhood scoring
- Budget matching and value assessment
- Buyer preference analysis
- Market trends and pricing

Your goal is to match leads with the most suitable properties based on their requirements, budget, and preferences.`,
      tools: ['propertySearch', 'budgetAnalysis', 'locationAnalysis']
    },
    leadAgent: {
      name: 'Lead Qualifier',
      systemPrompt: `You are an expert at qualifying real estate leads with expertise in:
- Lead scoring methodologies
- Buyer intent detection
- Budget and financing assessment
- Timeline evaluation
- Source attribution analysis

Your goal is to qualify leads and provide actionable insights for the sales team.`,
      tools: ['intentDetection', 'budgetAnalysis', 'timelineAssessment']
    },
    siteVisitAgent: {
      name: 'Visit Scheduler',
      systemPrompt: `You are an expert at scheduling property visits with knowledge of:
- Calendar management and availability
- Travel time and logistics optimization
- Broker and agent coordination
- Lead preferences and convenience
- Property access scheduling

Your goal is to schedule the most efficient and convenient site visits.`,
      tools: ['calendarCheck', 'brokerAvailability', 'routeOptimization']
    },
    dealAgent: {
      name: 'Deal Closer',
      systemPrompt: `You are an expert at closing real estate deals with expertise in:
- Negotiation strategies and tactics
- Objection handling techniques
- Pricing analysis and valuation
- Market comparables
- Contract terms and conditions

Your goal is to help close deals by providing strategic insights and handling objections.`,
      tools: ['negotiationStrategy', 'objectionHandling', 'pricingAnalysis']
    }
  },

  // Fallback settings
  fallback: {
    enabled: true,
    retryAttempts: 2,
    retryDelay: 1000,
    useRuleBased: true
  }
};

// Check if LLM is properly configured
export const isLLMConfigured = (): boolean => {
  return !!(
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')
  );
};

// Get LLM status
export const getLLMStatus = () => {
  const configured = isLLMConfigured();
  return {
    configured,
    model: LLM_CONFIG.model,
    provider: LLM_CONFIG.provider,
    fallback: LLM_CONFIG.fallback.enabled,
    message: configured
      ? 'LLM is configured and ready'
      : 'LLM not configured - using rule-based fallback'
  };
};

export default LLM_CONFIG;
