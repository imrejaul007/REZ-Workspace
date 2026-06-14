import type { ParsedQuery, QueryIntent } from '@/types/copilot';

// Time period keywords mapping
const TIME_PATTERNS: Record<string, { multiplier: number; unit: string }> = {
  'today': { multiplier: 1, unit: 'day' },
  'yesterday': { multiplier: -1, unit: 'day' },
  'this week': { multiplier: 7, unit: 'day' },
  'last week': { multiplier: -7, unit: 'day' },
  'this month': { multiplier: 30, unit: 'day' },
  'last month': { multiplier: -30, unit: 'day' },
  'this quarter': { multiplier: 90, unit: 'day' },
  'last quarter': { multiplier: -90, unit: 'day' },
  'this year': { multiplier: 365, unit: 'day' },
  'last year': { multiplier: -365, unit: 'day' },
  'past 7 days': { multiplier: 7, unit: 'day' },
  'past 30 days': { multiplier: 30, unit: 'day' },
  'past 90 days': { multiplier: 90, unit: 'day' },
};

// Metric keywords mapping
const METRIC_PATTERNS: Record<string, string> = {
  'sales': 'revenue',
  'revenue': 'revenue',
  'orders': 'order_count',
  'customers': 'customer_count',
  'transactions': 'transaction_count',
  'average order': 'avg_order_value',
  'avg order': 'avg_order_value',
  'conversion': 'conversion_rate',
  'conversion rate': 'conversion_rate',
  'repeat customers': 'repeat_customer_rate',
  'new customers': 'new_customer_count',
  'lost customers': 'churn_count',
  'customer loss': 'churn_count',
  'churn': 'churn_count',
  'profit': 'profit',
  'margin': 'margin',
  'inventory': 'inventory_level',
  'items sold': 'items_sold',
};

// Intent keywords mapping
const INTENT_PATTERNS: Record<string, QueryIntent> = {
  'why': 'analysis',
  'what happened': 'analysis',
  'explain': 'analysis',
  'analyze': 'analysis',
  'what should': 'recommendation',
  'recommend': 'recommendation',
  'suggest': 'recommendation',
  'offer': 'recommendation',
  'campaign': 'recommendation',
  'compare': 'comparison',
  'versus': 'comparison',
  'vs': 'comparison',
  'difference': 'comparison',
  'predict': 'prediction',
  'forecast': 'prediction',
  'will': 'prediction',
  'expected': 'prediction',
};

// Entity patterns for extraction
const ENTITY_PATTERNS: Record<string, RegExp> = {
  campaign: /campaign\s+(\w+)/i,
  product: /product\s+(\w+)/i,
  category: /(?:in|for)\s+(\w+)\s+category/i,
  location: /location\s+(\w+)/i,
  customer_segment: /(?:from|among)\s+(\w+)\s+customers/i,
};

// Filter patterns
const FILTER_PATTERNS: Record<string, RegExp> = {
  date: /(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
  number: /(\d+)\s+(?:customers|orders|items)/gi,
};

/**
 * Parse natural language query into structured format
 */
export function parseQuery(query: string): ParsedQuery {
  const normalizedQuery = query.toLowerCase().trim();

  // Extract intent
  const intent = extractIntent(normalizedQuery);

  // Extract metric
  const metric = extractMetric(normalizedQuery);

  // Extract timeframe
  const timeframe = extractTimeframe(normalizedQuery);

  // Extract entities
  const entities = extractEntities(normalizedQuery);

  // Extract filters
  const filters = extractFilters(normalizedQuery);

  return {
    intent,
    metric,
    timeframe,
    filters,
    entities,
    rawQuery: query,
  };
}

/**
 * Extract query intent from the query text
 */
function extractIntent(query: string): QueryIntent {
  for (const [pattern, intent] of Object.entries(INTENT_PATTERNS)) {
    if (query.includes(pattern)) {
      return intent;
    }
  }
  return 'general';
}

/**
 * Extract the primary metric from the query
 */
function extractMetric(query: string): string {
  for (const [pattern, metric] of Object.entries(METRIC_PATTERNS)) {
    if (query.includes(pattern)) {
      return metric;
    }
  }
  return 'general';
}

/**
 * Extract timeframe from the query
 */
function extractTimeframe(query: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date();

  // Check for explicit time patterns
  for (const [pattern, config] of Object.entries(TIME_PATTERNS)) {
    if (query.includes(pattern)) {
      const start = new Date();
      if (config.multiplier < 0) {
        // Past period
        start.setDate(start.getDate() + config.multiplier);
      } else {
        start.setDate(start.getDate() - config.multiplier);
      }
      return { start, end };
    }
  }

  // Check for date range patterns like "between X and Y"
  const dateRangeMatch = query.match(/between\s+(.+?)\s+and\s+(.+)/i);
  if (dateRangeMatch) {
    const start = parseDate(dateRangeMatch[1]);
    const end = parseDate(dateRangeMatch[2]);
    if (start && end) {
      return { start, end };
    }
  }

  // Default to last 30 days
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start, end };
}

/**
 * Parse various date formats
 */
function parseDate(dateStr: string): Date | null {
  const now = new Date();

  // Try to parse common formats
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Handle relative dates like "last Monday"
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (dateStr.toLowerCase().includes(dayNames[i])) {
      const targetDay = now.getDay();
      const diff = i - targetDay;
      const result = new Date(now);
      result.setDate(result.getDate() + diff);
      return result;
    }
  }

  return null;
}

/**
 * Extract entities from the query
 */
function extractEntities(query: string): string[] {
  const entities: string[] = [];

  for (const [entityType, pattern] of Object.entries(ENTITY_PATTERNS)) {
    const match = query.match(pattern);
    if (match && match[1]) {
      entities.push(match[1]);
    }
  }

  return entities;
}

/**
 * Extract filters from the query
 */
function extractFilters(query: string): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  // Extract numeric filters
  const numberMatches = query.matchAll(FILTER_PATTERNS.number);
  for (const match of numberMatches) {
    if (match[1]) {
      filters.limit = parseInt(match[1], 10);
    }
  }

  // Extract comparison target
  if (query.includes('last month')) {
    filters.comparisonPeriod = 'last_month';
  } else if (query.includes('last week')) {
    filters.comparisonPeriod = 'last_week';
  } else if (query.includes('last year')) {
    filters.comparisonPeriod = 'last_year';
  }

  // Extract sorting preference
  if (query.includes('most') || query.includes('highest')) {
    filters.sortOrder = 'desc';
  } else if (query.includes('least') || query.includes('lowest')) {
    filters.sortOrder = 'asc';
  }

  // Extract limit for top/bottom queries
  const topMatch = query.match(/(?:top|highest|best|bottom|lowest|worst)\s*(\d*)/i);
  if (topMatch) {
    filters.topN = topMatch[1] ? parseInt(topMatch[1], 10) : 5;
  }

  return filters;
}

/**
 * Build API query from parsed query
 */
export function buildApiQuery(parsed: ParsedQuery): Record<string, unknown> {
  return {
    metric: parsed.metric,
    intent: parsed.intent,
    timeframe: {
      start: parsed.timeframe.start.toISOString(),
      end: parsed.timeframe.end.toISOString(),
    },
    filters: parsed.filters,
    entities: parsed.entities,
  };
}

/**
 * Validate parsed query
 */
export function validateParsedQuery(parsed: ParsedQuery): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!parsed.intent) {
    errors.push('Intent is required');
  }

  if (!parsed.metric && parsed.intent !== 'general') {
    errors.push('Metric is required for this query type');
  }

  if (!parsed.timeframe.start || !parsed.timeframe.end) {
    errors.push('Timeframe is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get suggested follow-up questions based on the parsed query
 */
export function suggestFollowUps(parsed: ParsedQuery): string[] {
  const followUps: string[] = [];

  switch (parsed.intent) {
    case 'analysis':
      followUps.push('Show me the data behind this');
      followUps.push('What caused this change?');
      followUps.push('Compare to the previous period');
      break;
    case 'recommendation':
      followUps.push('Why do you recommend this?');
      followUps.push('What\'s the expected impact?');
      followUps.push('Show alternatives');
      break;
    case 'comparison':
      followUps.push('What drove the difference?');
      followUps.push('Show year-over-year comparison');
      followUps.push('Break down by category');
      break;
    case 'prediction':
      followUps.push('What\'s the confidence level?');
      followUps.push('What factors affect this?');
      followUps.push('Show historical accuracy');
      break;
  }

  // Add metric-specific follow-ups
  if (parsed.metric === 'revenue' || parsed.metric === 'sales') {
    followUps.push('Break down by product category');
    followUps.push('Show sales by location');
  } else if (parsed.metric === 'churn_count' || parsed.metric === 'customer_count') {
    followUps.push('Show customer segments affected');
    followUps.push('What\'s the retention trend?');
  }

  return followUps.slice(0, 4);
}