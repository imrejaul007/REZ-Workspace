import type {
  CopilotResponse,
  Metric,
  ChartConfig,
  Insight,
  Action,
  ParsedQuery
} from '@/types/copilot';

/**
 * Generate a natural language response from query results
 */
export function generateResponse(
  parsedQuery: ParsedQuery,
  data: {
    metrics?: Metric[];
    charts?: ChartConfig[];
    insights?: Insight[];
  }
): CopilotResponse {
  const { intent, metric } = parsedQuery;

  // Generate the main answer
  const answer = generateAnswer(parsedQuery, data);

  // Generate summary if multiple data points
  const summary = generateSummary(parsedQuery, data);

  // Generate follow-up suggestions
  const followUpSuggestions = generateFollowUpSuggestions(parsedQuery, intent, metric);

  // Generate actions based on intent
  const actions = generateActions(parsedQuery, intent, data);

  return {
    answer,
    summary,
    metrics: data.metrics,
    charts: data.charts,
    insights: data.insights,
    actions,
    followUpSuggestions,
  };
}

/**
 * Generate the main answer text
 */
function generateAnswer(
  parsedQuery: ParsedQuery,
  data: { metrics?: Metric[]; insights?: Insight[] }
): string {
  const { intent, metric, timeframe } = parsedQuery;
  const startDate = timeframe.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endDate = timeframe.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  switch (intent) {
    case 'analysis':
      return generateAnalysisAnswer(metric, data, startDate, endDate);
    case 'recommendation':
      return generateRecommendationAnswer(metric, data);
    case 'comparison':
      return generateComparisonAnswer(metric, data, startDate, endDate);
    case 'prediction':
      return generatePredictionAnswer(metric, data);
    default:
      return generateGeneralAnswer(metric, data, startDate, endDate);
  }
}

/**
 * Generate analysis-type answers
 */
function generateAnalysisAnswer(
  metric: string,
  data: { metrics?: Metric[]; insights?: Insight[] },
  startDate: string,
  endDate: string
): string {
  const primaryMetric = data.metrics?.[0];

  if (!primaryMetric) {
    return `I couldn't find specific data for ${metric} in the selected period. Try broadening your timeframe or checking if you have data for this metric.`;
  }

  const changeText = primaryMetric.changePercentage !== undefined
    ? formatChangeText(primaryMetric.change, primaryMetric.changePercentage)
    : '';

  const metricLabel = formatMetricLabel(metric);

  switch (metric) {
    case 'revenue':
    case 'sales':
      if (primaryMetric.trend === 'down' && primaryMetric.changePercentage && primaryMetric.changePercentage < -10) {
        return `Your sales have declined${changeText} during ${startDate} to ${endDate}. This could be due to several factors including seasonal trends, marketing effectiveness, or customer behavior changes. Let me break down the key drivers...`;
      }
      return `Your ${metricLabel} for ${startDate} to ${endDate} is ${formatMetricValue(primaryMetric)}. ${changeText ? `This represents ${changeText} compared to the previous period.` : ''}`;

    case 'churn_count':
    case 'lost customers':
      return `You lost ${primaryMetric.value} customers during this period. ${changeText ? `That's ${changeText} compared to the previous period.` : ''} The main reasons typically include customer satisfaction issues, competitive pressure, or pricing concerns.`;

    case 'customer_count':
      return `You currently have ${primaryMetric.value} customers in the period from ${startDate} to ${endDate}. ${changeText ? `This is ${changeText} from the previous period.` : ''}`;

    default:
      return `Based on your ${metricLabel} data from ${startDate} to ${endDate}: ${formatMetricValue(primaryMetric)}. ${changeText ? `This shows ${changeText} compared to the previous period.` : ''}`;
  }
}

/**
 * Generate recommendation-type answers
 */
function generateRecommendationAnswer(
  metric: string,
  data: { insights?: Insight[] }
): string {
  const opportunities = data.insights?.filter(i => i.type === 'opportunity') || [];

  if (metric === 'general' || metric.includes('offer') || metric.includes('summer')) {
    if (opportunities.length > 0) {
      return `Based on your business data and market trends, here are my top recommendations for your next campaign:

1. **Seasonal Promotion**: Launch a summer-specific offer targeting your top customer segments. Data shows customers respond well to limited-time deals during seasonal transitions.

2. **Loyalty Program**: Your repeat customer rate shows opportunity for improvement. A tiered loyalty program could increase retention by 15-20%.

3. **Bundle Offers**: Consider bundling complementary products/services to increase average order value. This strategy typically performs well for your business type.

Would you like me to dive deeper into any of these recommendations?`;
    }
    return `I recommend focusing on these high-impact strategies:

• **Re-engagement Campaign**: Target customers who haven't ordered in 30+ days with personalized offers
• **Upselling Initiative**: Train staff on suggestive selling techniques to increase basket size
• **Referral Program**: Launch a referral incentive to acquire new customers through your existing customer base

Shall I create an implementation plan for any of these?`;
  }

  if (metric.includes('repeat') || metric.includes('customer')) {
    return `To increase repeat customers, I recommend implementing:

1. **Post-Purchase Follow-up**: Automated email/SMS sequence 7 days after purchase
2. **Loyalty Points**: Double points for repeat visits within 30 days
3. **Personalized Offers**: Based on purchase history and preferences
4. **VIP Treatment**: Early access to new products for repeat customers

These strategies typically increase repeat purchase rate by 20-30%.`;
  }

  return `Based on your business profile, I recommend:

• Focus on customer retention over acquisition
• Implement targeted promotions based on purchase patterns
• Optimize your product/service offerings based on demand trends

Would you like specific recommendations for any of these areas?`;
}

/**
 * Generate comparison-type answers
 */
function generateComparisonAnswer(
  metric: string,
  data: { metrics?: Metric[] },
  startDate: string,
  endDate: string
): string {
  const metricData = data.metrics?.[0];

  if (!metricData) {
    return `I couldn't find comparable data for ${metric} between the periods.`;
  }

  const change = metricData.changePercentage || 0;
  const direction = change >= 0 ? 'increased' : 'decreased';
  const absChange = Math.abs(change);

  const metricLabel = formatMetricLabel(metric);

  return `Comparing your performance between periods:

**${metricLabel}**: ${metricData.value}${metricData.unit || ''}
- Change: ${change >= 0 ? '+' : ''}${change.toFixed(1)}%
- Status: ${direction} by ${absChange.toFixed(1)}% compared to the previous period

${generatePerformanceContext(change, metric)}`;
}

/**
 * Generate performance context text
 */
function generatePerformanceContext(change: number, metric: string): string {
  if (change >= 20) {
    return '🚀 Excellent performance! You\'re significantly outperforming the previous period.';
  } else if (change >= 5) {
    return '📈 Positive trend. Keep up the momentum with your current strategies.';
  } else if (change >= -5) {
    return '➡️ Stable performance. Consider if there are quick wins to improve further.';
  } else if (change >= -15) {
    return '⚠️ Minor decline. Investigate the causes and consider corrective actions.';
  } else {
    return '🔴 Significant decline detected. Immediate attention recommended to understand and address the causes.';
  }
}

/**
 * Generate prediction-type answers
 */
function generatePredictionAnswer(
  metric: string,
  data: { metrics?: Metric[]; insights?: Insight[] }
): string {
  const trend = data.metrics?.[0]?.trend || 'neutral';
  const change = data.metrics?.[0]?.changePercentage || 0;

  const metricLabel = formatMetricLabel(metric);
  const projectedChange = trend === 'up' ? `+${(change * 1.1).toFixed(1)}%` : `${(change * 0.9).toFixed(1)}%`;

  return `Based on historical trends and patterns, here's the prediction for your ${metricLabel}:

**Projected Change**: ${projectedChange} over the next period

**Key Factors**:
• Current momentum suggests ${trend === 'up' ? 'continued growth' : trend === 'down' ? 'continued decline' : 'stable performance'}
• Seasonal patterns indicate potential for acceleration
• Customer behavior trends support this projection

**Confidence Level**: 75-85%

For more accurate predictions, ensure you have at least 90 days of historical data. Would you like me to generate a detailed forecast report?`;
}

/**
 * Generate general answers
 */
function generateGeneralAnswer(
  metric: string,
  data: { metrics?: Metric[] },
  startDate: string,
  endDate: string
): string {
  return `Based on your data from ${startDate} to ${endDate}, here's what I found:

${data.metrics?.map(m => `• **${m.name}**: ${formatMetricValue(m)}`).join('\n') || 'No specific metrics found for your query.'}

Is there a specific aspect you'd like me to analyze in more detail?`;
}

/**
 * Generate summary text
 */
function generateSummary(
  parsedQuery: ParsedQuery,
  data: { metrics?: Metric[]; charts?: ChartConfig[]; insights?: Insight[] }
): string | undefined {
  const { intent, metric } = parsedQuery;
  const parts: string[] = [];

  // Summary of key metrics
  if (data.metrics && data.metrics.length > 0) {
    const keyMetric = data.metrics[0];
    parts.push(`${formatMetricLabel(metric)} is ${formatMetricValue(keyMetric)}`);
  }

  // Summary of insights
  if (data.insights && data.insights.length > 0) {
    const highImpact = data.insights.filter(i => i.impact === 'high');
    if (highImpact.length > 0) {
      parts.push(`${highImpact.length} high-impact insights identified`);
    }
  }

  // Summary of charts
  if (data.charts && data.charts.length > 0) {
    parts.push(`${data.charts.length} visualization(s) available`);
  }

  return parts.length > 0 ? parts.join(' | ') : undefined;
}

/**
 * Generate follow-up suggestions
 */
function generateFollowUpSuggestions(
  parsedQuery: ParsedQuery,
  intent: string,
  metric: string
): string[] {
  const suggestions: string[] = [];

  // Intent-specific follow-ups
  switch (intent) {
    case 'analysis':
      suggestions.push('Show me the data behind this');
      suggestions.push('What caused this change?');
      suggestions.push('Break down by category');
      break;
    case 'recommendation':
      suggestions.push('Why do you recommend this?');
      suggestions.push('What\'s the expected ROI?');
      suggestions.push('Show alternative options');
      break;
    case 'comparison':
      suggestions.push('What drove the difference?');
      suggestions.push('Compare year-over-year');
      suggestions.push('Show by location');
      break;
    case 'prediction':
      suggestions.push('What\'s the confidence level?');
      suggestions.push('What factors affect this?');
      suggestions.push('Show historical accuracy');
      break;
    default:
      suggestions.push('Tell me more about this');
      suggestions.push('Show the underlying data');
      suggestions.push('What actions do you recommend?');
  }

  // Metric-specific follow-ups
  if (metric === 'revenue' || metric === 'sales') {
    suggestions.push('Break down by product');
    suggestions.push('Show by time period');
  }

  return suggestions.slice(0, 4);
}

/**
 * Generate actionable buttons
 */
function generateActions(
  parsedQuery: ParsedQuery,
  intent: string,
  data: { insights?: Insight[] }
): Action[] {
  const actions: Action[] = [];
  const { metric } = parsedQuery;

  // Common actions
  actions.push({
    id: 'view-analytics',
    label: 'View in Analytics',
    description: 'Open detailed analytics dashboard',
    type: 'navigation',
    icon: 'BarChart3',
  });

  // Intent-specific actions
  switch (intent) {
    case 'recommendation':
      actions.push({
        id: 'implement-action',
        label: 'Implement Recommendation',
        description: 'Start executing this recommendation',
        type: 'execution',
        icon: 'Play',
      });
      actions.push({
        id: 'save-insight',
        label: 'Save to Insights',
        description: 'Save this recommendation for later',
        type: 'navigation',
        icon: 'Bookmark',
      });
      break;
    case 'analysis':
      actions.push({
        id: 'export-data',
        label: 'Export Data',
        description: 'Download the analysis as CSV',
        type: 'export',
        icon: 'Download',
      });
      actions.push({
        id: 'schedule-report',
        label: 'Schedule Report',
        description: 'Set up automated reports',
        type: 'execution',
        icon: 'Calendar',
      });
      break;
  }

  // Metric-specific actions
  if (metric === 'revenue' || metric === 'sales') {
    actions.push({
      id: 'view-transactions',
      label: 'View Transactions',
      description: 'See individual transactions',
      type: 'navigation',
      icon: 'List',
    });
  }

  return actions;
}

/**
 * Format metric label for display
 */
export function formatMetricLabel(metric: string): string {
  return metric
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format metric value for display
 */
export function formatMetricValue(metric: Metric): string {
  const { value, format, unit } = metric;

  let formattedValue: string;
  switch (format) {
    case 'currency':
      formattedValue = `$${Number(value).toLocaleString()}`;
      break;
    case 'percentage':
      formattedValue = `${Number(value).toFixed(1)}%`;
      break;
    case 'number':
    default:
      formattedValue = Number(value).toLocaleString();
  }

  return unit ? `${formattedValue}${unit}` : formattedValue;
}

/**
 * Format change text
 */
function formatChangeText(change: number | undefined, changePercentage: number | undefined): string {
  if (changePercentage === undefined) return '';

  const direction = changePercentage >= 0 ? 'up' : 'down';
  return `${direction} ${Math.abs(changePercentage).toFixed(1)}%`;
}