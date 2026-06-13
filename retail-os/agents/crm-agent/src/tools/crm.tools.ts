import { CRMActions, CustomerSegment, LoyaltyInfo, Campaign, CustomerInsight } from '../actions/crm.actions';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
}

export const crmTools: ToolDefinition[] = [
  {
    name: 'get_customer_profile',
    description: 'Get detailed customer profile information',
    parameters: [
      { name: 'shopperId', type: 'string', description: 'Shopper/Customer ID', required: true },
    ],
  },
  {
    name: 'get_customer_insights',
    description: 'Get customer insights including lifetime value and churn risk',
    parameters: [
      { name: 'shopperId', type: 'string', description: 'Shopper/Customer ID', required: true },
    ],
  },
  {
    name: 'identify_customer_segments',
    description: 'Identify and analyze customer segments',
    parameters: [],
  },
  {
    name: 'get_loyalty_status',
    description: 'Get customer loyalty program status',
    parameters: [
      { name: 'shopperId', type: 'string', description: 'Shopper/Customer ID', required: true },
    ],
  },
  {
    name: 'award_loyalty_points',
    description: 'Award loyalty points to a customer',
    parameters: [
      { name: 'shopperId', type: 'string', description: 'Shopper/Customer ID', required: true },
      { name: 'points', type: 'number', description: 'Number of points to award', required: true },
      { name: 'reason', type: 'string', description: 'Reason for awarding points (optional)', required: false },
    ],
  },
  {
    name: 'identify_abandoned_carts',
    description: 'Identify customers with abandoned shopping carts',
    parameters: [],
  },
  {
    name: 'send_abandoned_cart_recovery',
    description: 'Send abandoned cart recovery message to customer',
    parameters: [
      { name: 'shopperId', type: 'string', description: 'Shopper/Customer ID', required: true },
      { name: 'basketId', type: 'string', description: 'Basket ID', required: true },
    ],
  },
  {
    name: 'create_campaign',
    description: 'Create a new marketing campaign',
    parameters: [
      { name: 'name', type: 'string', description: 'Campaign name', required: true },
      { name: 'type', type: 'string', description: 'Campaign type: email, sms, push, multi_channel', required: true },
      { name: 'content', type: 'string', description: 'Campaign content/message', required: true },
      { name: 'targetSegment', type: 'string', description: 'Target segment ID (optional)', required: false },
      { name: 'scheduledDate', type: 'string', description: 'Scheduled send date ISO string (optional)', required: false },
    ],
  },
  {
    name: 'get_campaigns',
    description: 'Get list of all campaigns',
    parameters: [],
  },
  {
    name: 'analyze_campaign_performance',
    description: 'Analyze performance of a specific campaign',
    parameters: [
      { name: 'campaignId', type: 'string', description: 'Campaign ID', required: true },
    ],
  },
  {
    name: 'send_personalized_email',
    description: 'Send a personalized email to a customer',
    parameters: [
      { name: 'shopperId', type: 'string', description: 'Shopper/Customer ID', required: true },
      { name: 'subject', type: 'string', description: 'Email subject', required: true },
      { name: 'content', type: 'string', description: 'Email content', required: true },
    ],
  },
  {
    name: 'predict_churn_risk',
    description: 'Predict customer churn risk',
    parameters: [
      { name: 'shopperId', type: 'string', description: 'Shopper/Customer ID', required: true },
    ],
  },
  {
    name: 'get_crm_metrics',
    description: 'Get overall CRM metrics and KPIs',
    parameters: [],
  },
];

export class CRMTools {
  private actions: CRMActions;

  constructor() {
    this.actions = new CRMActions();
  }

  async executeTool(toolName: string, params: Record<string, any>): Promise<any> {
    switch (toolName) {
      case 'get_customer_profile':
        return this.actions.getShopperProfile(params.shopperId);

      case 'get_customer_insights':
        return this.actions.getShopperInsights(params.shopperId);

      case 'identify_customer_segments':
        return this.actions.identifyCustomerSegments();

      case 'get_loyalty_status':
        return this.actions.getLoyaltyStatus(params.shopperId);

      case 'award_loyalty_points':
        return this.actions.awardLoyaltyPoints(params.shopperId, params.points, params.reason);

      case 'identify_abandoned_carts':
        return this.actions.identifyAbandonedCarts();

      case 'send_abandoned_cart_recovery':
        return this.actions.sendAbandonedCartRecovery(params.shopperId, params.basketId);

      case 'create_campaign':
        return this.actions.createCampaign(params);

      case 'get_campaigns':
        return this.actions.getCampaigns();

      case 'analyze_campaign_performance':
        return this.actions.analyzeCampaignPerformance(params.campaignId);

      case 'send_personalized_email':
        return this.actions.sendPersonalizedEmail(params.shopperId, params.subject, params.content);

      case 'predict_churn_risk':
        return this.actions.predictChurnRisk(params.shopperId);

      case 'get_crm_metrics':
        return this.actions.getCRMMetrics();

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  getToolDefinitions(): ToolDefinition[] {
    return crmTools;
  }
}
