/**
 * engagementGuide.ts — Merchant engagement task helper
 *
 * Maps plain-English merchant goals to the features / routes they
 * should explore. Powers an in-app "What do you want to achieve?"
 * recommendation card.
 */

interface RecommendedFeature {
  feature: string;
  route: string;
  description: string;
}

interface GoalMapping {
  /** Keywords / phrases that match this goal (lowercase). */
  keywords: string[];
  recommendations: RecommendedFeature[];
}

const GOAL_MAPPINGS: GoalMapping[] = [
  {
    keywords: ['bring back inactive customers', 'win back', 're-engage', 'inactive', 'lapsed'],
    recommendations: [
      {
        feature: 'campaigns',
        route: '/(dashboard)/campaigns',
        description: "Create targeted campaigns to reach customers who haven't ordered recently.",
      },
      {
        feature: 'broadcast',
        route: '/(dashboard)/broadcast',
        description: 'Send bulk push notifications or SMS to inactive customer segments.',
      },
    ],
  },
  {
    keywords: ['increase order value', 'aov', 'bigger orders', 'upsell', 'cross-sell'],
    recommendations: [
      {
        feature: 'aov-rewards',
        route: '/(dashboard)/aov-rewards',
        description: 'Set spend-threshold rewards to encourage larger baskets.',
      },
      {
        feature: 'upsell-rules',
        route: '/(dashboard)/upsell-rules',
        description: 'Configure automatic upsell / cross-sell suggestions at checkout.',
      },
      {
        feature: 'bundles',
        route: '/(dashboard)/bundles',
        description: 'Create product bundles that offer value and boost ticket size.',
      },
    ],
  },
  {
    keywords: ['new customers', 'acquire', 'acquisition', 'grow customer base', 'more customers'],
    recommendations: [
      {
        feature: 'ads',
        route: '/(dashboard)/promote',
        description: 'Run in-app or social ads to attract first-time buyers.',
      },
      {
        feature: 'referral',
        route: '/(dashboard)/growth',
        description: 'Launch a referral program so existing customers bring their friends.',
      },
      {
        feature: 'deals',
        route: '/(dashboard)/deals',
        description: 'Publish limited-time deals visible to nearby customers.',
      },
    ],
  },
  {
    keywords: ['reward loyal customers', 'loyalty', 'retain', 'retention', 'repeat customers'],
    recommendations: [
      {
        feature: 'loyalty',
        route: '/(dashboard)/loyalty',
        description: 'Build a points-based loyalty program to reward repeat visits.',
      },
      {
        feature: 'coins',
        route: '/(dashboard)/coins',
        description: 'Issue branded coins customers can earn and redeem.',
      },
      {
        feature: 'cashback',
        route: '/(dashboard)/cashback',
        description: 'Offer automatic cashback on qualifying purchases.',
      },
      {
        feature: 'stamp-cards',
        route: '/(dashboard)/stamp-cards',
        description: 'Create digital stamp cards for buy-X-get-1-free rewards.',
      },
    ],
  },
  {
    keywords: [
      'promote a product',
      'boost product',
      'highlight item',
      'product promotion',
      'feature a product',
    ],
    recommendations: [
      {
        feature: 'discounts',
        route: '/(dashboard)/discounts',
        description: 'Create a discount or coupon for the product you want to push.',
      },
      {
        feature: 'offers',
        route: '/(dashboard)/create-offer',
        description: 'Build a time-limited offer featuring the product front-and-centre.',
      },
      {
        feature: 'dynamic-pricing',
        route: '/(dashboard)/dynamic-pricing',
        description: 'Use dynamic pricing to temporarily lower price and drive volume.',
      },
    ],
  },
];

/**
 * Given a merchant's goal description, return recommended features
 * sorted by relevance (best match first).
 *
 * Matching is keyword-based: the goal string is compared against each
 * mapping's keyword list. All matching groups are returned.
 */
export function getRecommendedFeatures(goal: string): RecommendedFeature[] {
  const lower = (goal ?? '').toLowerCase().trim();
  if (!lower) return [];

  const results: RecommendedFeature[] = [];

  for (const mapping of GOAL_MAPPINGS) {
    const matches = mapping.keywords.some((kw) => lower.includes(kw));
    if (matches) {
      results.push(...mapping.recommendations);
    }
  }

  // Deduplicate by feature name
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.feature)) return false;
    seen.add(r.feature);
    return true;
  });
}

/**
 * Return all available goal descriptions for display in a picker UI.
 */
export function getAvailableGoals(): string[] {
  return [
    'I want to bring back inactive customers',
    'I want to increase order value',
    'I want new customers',
    'I want to reward loyal customers',
    'I want to promote a product',
  ];
}
