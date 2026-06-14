import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseQuery, buildApiQuery, validateParsedQuery, suggestFollowUps } from '@/lib/queryParser';

describe('Query Parser', () => {
  describe('parseQuery', () => {
    it('should parse analysis intent from "why" question', () => {
      const result = parseQuery('Why are sales down this week?');

      expect(result.intent).toBe('analysis');
      expect(result.metric).toBe('revenue');
      expect(result.rawQuery).toBe('Why are sales down this week?');
    });

    it('should parse recommendation intent from "what should" question', () => {
      const result = parseQuery('What should I do to increase repeat customers?');

      expect(result.intent).toBe('recommendation');
      expect(result.metric).toBe('repeat_customer_rate');
      expect(result.entities).toContain('customers');
    });

    it('should parse comparison intent from "compare" question', () => {
      const result = parseQuery('Compare my performance vs last month');

      expect(result.intent).toBe('comparison');
      expect(result.filters.comparisonPeriod).toBe('last_month');
    });

    it('should parse timeframes correctly', () => {
      const result = parseQuery('How were sales this week?');

      expect(result.timeframe.start).toBeInstanceOf(Date);
      expect(result.timeframe.end).toBeInstanceOf(Date);
    });

    it('should detect "last month" timeframe', () => {
      const result = parseQuery('How many customers did I lose last month?');

      expect(result.filters.comparisonPeriod).toBe('last_month');
    });

    it('should handle campaign-related queries', () => {
      const result = parseQuery('Which campaign generated the most revenue?');

      expect(result.intent).toBe('recommendation');
      expect(result.metric).toBe('revenue');
      expect(result.entities).toContain('campaign');
    });

    it('should detect top N filter', () => {
      const result = parseQuery('Show me the top 10 products by sales');

      expect(result.filters.topN).toBe(10);
    });

    it('should handle summer offer queries', () => {
      const result = parseQuery('What offer should I run for summer?');

      expect(result.intent).toBe('recommendation');
      expect(result.rawQuery).toContain('summer');
    });

    it('should default to general for unrecognized queries', () => {
      const result = parseQuery('Hello there');

      expect(result.intent).toBe('general');
    });
  });

  describe('buildApiQuery', () => {
    it('should build correct API query structure', () => {
      const parsed = parseQuery('Why are sales down this week?');
      const apiQuery = buildApiQuery(parsed);

      expect(apiQuery).toHaveProperty('metric');
      expect(apiQuery).toHaveProperty('intent');
      expect(apiQuery).toHaveProperty('timeframe');
      expect(apiQuery).toHaveProperty('filters');
      expect(apiQuery).toHaveProperty('entities');

      expect(apiQuery.timeframe).toHaveProperty('start');
      expect(apiQuery.timeframe).toHaveProperty('end');
    });

    it('should convert dates to ISO strings', () => {
      const parsed = parseQuery('Analyze last month data');
      const apiQuery = buildApiQuery(parsed);

      expect(typeof apiQuery.timeframe.start).toBe('string');
      expect(typeof apiQuery.timeframe.end).toBe('string');
    });
  });

  describe('validateParsedQuery', () => {
    it('should validate correct query', () => {
      const parsed = parseQuery('Why are sales down?');
      const result = validateParsedQuery(parsed);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing intent', () => {
      const parsed = {
        intent: '' as never,
        metric: 'revenue',
        timeframe: { start: new Date(), end: new Date() },
        filters: {},
        entities: [],
        rawQuery: '',
      };
      const result = validateParsedQuery(parsed);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Intent is required');
    });

    it('should catch missing timeframe', () => {
      const parsed = {
        intent: 'analysis' as const,
        metric: 'revenue',
        timeframe: { start: new Date('invalid'), end: new Date() },
        filters: {},
        entities: [],
        rawQuery: '',
      };
      const result = validateParsedQuery(parsed);

      expect(result.valid).toBe(false);
    });
  });

  describe('suggestFollowUps', () => {
    it('should suggest analysis follow-ups', () => {
      const parsed = parseQuery('Why are sales down?');
      const suggestions = suggestFollowUps(parsed);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('data'))).toBe(true);
    });

    it('should suggest recommendation follow-ups', () => {
      const parsed = parseQuery('What offer should I run for summer?');
      const suggestions = suggestFollowUps(parsed);

      expect(suggestions.some(s => s.toLowerCase().includes('why'))).toBe(true);
    });

    it('should suggest comparison follow-ups', () => {
      const parsed = parseQuery('Compare my performance vs last month');
      const suggestions = suggestFollowUps(parsed);

      expect(suggestions.some(s => s.toLowerCase().includes('difference'))).toBe(true);
    });

    it('should limit to 4 suggestions', () => {
      const parsed = parseQuery('Why are sales down this week?');
      const suggestions = suggestFollowUps(parsed);

      expect(suggestions.length).toBeLessThanOrEqual(4);
    });
  });
});

describe('Answer Generator', () => {
  // Import answer generator functions
  const { formatMetricLabel, formatMetricValue } = await import('@/lib/answerGenerator');

  describe('formatMetricLabel', () => {
    it('should format snake_case to Title Case', () => {
      expect(formatMetricLabel('customer_count')).toBe('Customer Count');
      expect(formatMetricLabel('repeat_customer_rate')).toBe('Repeat Customer Rate');
    });

    it('should handle underscore-separated words', () => {
      expect(formatMetricLabel('avg_order_value')).toBe('Avg Order Value');
    });
  });

  describe('formatMetricValue', () => {
    it('should format currency values', () => {
      const metric = { id: '1', name: 'Revenue', value: 125750, format: 'currency' as const };
      expect(formatMetricValue(metric)).toBe('$125,750');
    });

    it('should format percentage values', () => {
      const metric = { id: '1', name: 'Growth', value: 15.5, format: 'percentage' as const };
      expect(formatMetricValue(metric)).toBe('15.5%');
    });

    it('should format number values with commas', () => {
      const metric = { id: '1', name: 'Customers', value: 1234567, format: 'number' as const };
      expect(formatMetricValue(metric)).toBe('1,234,567');
    });
  });
});

describe('Chart Data Formatter', () => {
  // Import chart formatter functions
  const { formatValue, formatLabel, calculateTrend, validateChartData } = await import('@/lib/chartDataFormatter');

  describe('formatValue', () => {
    it('should format currency values', () => {
      expect(formatValue(125750, 'currency')).toBe('$125,750');
    });

    it('should format percentage values', () => {
      expect(formatValue(15.5, 'percentage')).toBe('15.5%');
    });

    it('should format number values with commas', () => {
      expect(formatValue(1234567, 'number')).toBe('1,234,567');
    });

    it('should handle string input', () => {
      expect(formatValue('1234', 'number')).toBe('1,234');
    });
  });

  describe('formatLabel', () => {
    it('should convert snake_case to Title Case', () => {
      expect(formatLabel('total_revenue')).toBe('Total Revenue');
    });

    it('should handle camelCase', () => {
      expect(formatLabel('customerCount')).toBe('Customer Count');
    });
  });

  describe('calculateTrend', () => {
    it('should calculate upward trend', () => {
      const result = calculateTrend([100, 120, 140]);
      expect(result.direction).toBe('up');
      expect(result.changePercentage).toBeGreaterThan(0);
    });

    it('should calculate downward trend', () => {
      const result = calculateTrend([100, 80, 60]);
      expect(result.direction).toBe('down');
      expect(result.changePercentage).toBeLessThan(0);
    });

    it('should handle neutral trend', () => {
      const result = calculateTrend([100, 102, 101]);
      expect(result.direction).toBe('neutral');
    });

    it('should handle insufficient data', () => {
      const result = calculateTrend([100]);
      expect(result.direction).toBe('neutral');
    });
  });

  describe('validateChartData', () => {
    it('should validate correct data', () => {
      const data = [
        { label: 'Jan', value: 100 },
        { label: 'Feb', value: 200 },
      ];
      const result = validateChartData(data);
      expect(result.valid).toBe(true);
    });

    it('should catch empty data', () => {
      const result = validateChartData([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No data provided');
    });

    it('should catch missing labels', () => {
      const data = [{ value: 100 }, { label: 'Feb', value: 200 }];
      const result = validateChartData(data);
      expect(result.valid).toBe(false);
    });

    it('should catch invalid values', () => {
      const data = [{ label: 'Jan', value: 'invalid' }];
      const result = validateChartData(data);
      expect(result.valid).toBe(false);
    });
  });
});

describe('Copilot Types', () => {
  // Import types for validation
  import type { Message, ParsedQuery, CopilotResponse, Metric, ChartConfig } from '@/types/copilot';

  it('should have valid Message structure', () => {
    const message: Message = {
      id: 'test-1',
      role: 'user',
      content: 'Test query',
      timestamp: new Date(),
    };

    expect(message.id).toBeDefined();
    expect(message.role).toBe('user');
    expect(message.content).toBe('Test query');
  });

  it('should have valid ParsedQuery structure', () => {
    const query: ParsedQuery = {
      intent: 'analysis',
      metric: 'revenue',
      timeframe: { start: new Date(), end: new Date() },
      filters: {},
      entities: ['customers'],
      rawQuery: 'Why are sales down?',
    };

    expect(query.intent).toBe('analysis');
    expect(query.metric).toBe('revenue');
  });

  it('should have valid Metric structure', () => {
    const metric: Metric = {
      id: '1',
      name: 'Revenue',
      value: 125750,
      changePercentage: -11.8,
      trend: 'down',
      format: 'currency',
    };

    expect(metric.trend).toBe('down');
    expect(metric.changePercentage).toBeLessThan(0);
  });
});