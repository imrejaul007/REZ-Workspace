import { NextRequest, NextResponse } from 'next/server';
import type { RecommendationRequest, RecommendationResponse, Action } from '@/types/copilot';

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();

    if (!body.merchantId) {
      return NextResponse.json<RecommendationResponse>(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Generate recommendations based on category or general
    const { recommendations, reasoning } = generateRecommendations(body.category);

    return NextResponse.json<RecommendationResponse>({
      success: true,
      data: { recommendations, reasoning },
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json<RecommendationResponse>(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Recommendation API is running',
    endpoints: {
      POST: 'Generate business recommendations',
    },
  });
}

/**
 * Generate recommendations based on category
 */
function generateRecommendations(category?: string): {
  recommendations: Action[];
  reasoning: string;
} {
  const allRecommendations: Record<string, Action[]> = {
    promotion: [
      {
        id: 'rec-prom-1',
        label: 'Launch Summer Special',
        description: 'Create a time-limited summer promotion with 15% discount for first-time customers',
        type: 'execution',
        icon: 'Sun',
      },
      {
        id: 'rec-prom-2',
        label: 'Loyalty Double Points',
        description: 'Double points for loyalty members during the promotion period',
        type: 'execution',
        icon: 'Star',
      },
      {
        id: 'rec-prom-3',
        label: 'Bundle Offer',
        description: 'Create product bundles at 20% savings to increase average order value',
        type: 'execution',
        icon: 'Package',
      },
    ],
    retention: [
      {
        id: 'rec-ret-1',
        label: 'Win-Back Campaign',
        description: 'Target customers who haven\'t ordered in 30+ days with personalized offers',
        type: 'execution',
        icon: 'Users',
      },
      {
        id: 'rec-ret-2',
        label: 'VIP Early Access',
        description: 'Offer top customers early access to new products and exclusive events',
        type: 'execution',
        icon: 'Crown',
      },
      {
        id: 'rec-ret-3',
        label: 'Post-Purchase Follow-up',
        description: 'Implement automated check-in sequence 7 days after purchase',
        type: 'execution',
        icon: 'MessageCircle',
      },
    ],
    operations: [
      {
        id: 'rec-ops-1',
        label: 'Staff Training',
        description: 'Schedule upselling training for front-line staff to increase basket size',
        type: 'execution',
        icon: 'GraduationCap',
      },
      {
        id: 'rec-ops-2',
        label: 'Peak Hour Optimization',
        description: 'Add additional staff during 11 AM - 2 PM to reduce wait times',
        type: 'execution',
        icon: 'Clock',
      },
      {
        id: 'rec-ops-3',
        label: 'Inventory Alert',
        description: 'Set up automated alerts for low-stock items to prevent outages',
        type: 'execution',
        icon: 'AlertTriangle',
      },
    ],
    marketing: [
      {
        id: 'rec-mkt-1',
        label: 'Social Media Campaign',
        description: 'Launch targeted ads on Instagram and Facebook for summer promotions',
        type: 'execution',
        icon: 'Share2',
      },
      {
        id: 'rec-mkt-2',
        label: 'Email Newsletter',
        description: 'Send weekly newsletter with featured products and exclusive offers',
        type: 'execution',
        icon: 'Mail',
      },
      {
        id: 'rec-mkt-3',
        label: 'Referral Program',
        description: 'Create a referral program offering $10 credit for each new customer',
        type: 'execution',
        icon: 'UserPlus',
      },
    ],
  };

  // Default recommendations
  const defaultRecommendations: Action[] = [
    {
      id: 'rec-default-1',
      label: 'Customer Retention Focus',
      description: 'Focus on retaining existing customers - 5x cheaper than acquiring new ones',
      type: 'execution',
      icon: 'Heart',
    },
    {
      id: 'rec-default-2',
      label: 'Average Order Value',
      description: 'Implement upselling and cross-selling strategies to increase basket size',
      type: 'execution',
      icon: 'TrendingUp',
    },
    {
      id: 'rec-default-3',
      label: 'Seasonal Promotion',
      description: 'Launch seasonal promotions aligned with upcoming holidays and events',
      type: 'execution',
      icon: 'Calendar',
    },
    {
      id: 'rec-default-4',
      label: 'Review Management',
      description: 'Encourage satisfied customers to leave reviews on popular platforms',
      type: 'execution',
      icon: 'Star',
    },
    {
      id: 'rec-default-5',
      label: 'Mobile Optimization',
      description: 'Ensure your mobile experience is seamless for on-the-go customers',
      type: 'execution',
      icon: 'Smartphone',
    },
  ];

  const recommendations = category && allRecommendations[category]
    ? allRecommendations[category]
    : defaultRecommendations;

  const reasoning = category
    ? `Based on your focus on ${category}, I've identified the following high-impact actions that typically generate 15-25% improvement in targeted metrics.`
    : 'Based on your business profile and current trends, here are my top recommendations to drive growth and efficiency across your operations.';

  return { recommendations, reasoning };
}