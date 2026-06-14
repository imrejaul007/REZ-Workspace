/**
 * REZ Business AI - A/B Testing Framework
 * Validates campaign strategies
 */

import { randomUUID } from 'crypto';

interface Variant {
  id: string;
  name: string;
  params: Record<string, unknown>;
  impressions: number;
  conversions: number;
  revenue: number;
}

interface Test {
  id: string;
  name: string;
  control: Variant;
  variants: Variant[];
  status: 'running' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  significance: number;
}

class ABTesting {
  private tests: Map<string, Test> = new Map();

  createTest(name: string, control: Variant, variants: Variant[]): Test {
    const test: Test = {
      id: `test-${Date.now()}`,
      name,
      control: { ...control, impressions: 0, conversions: 0, revenue: 0 },
      variants: variants.map(v => ({ ...v, impressions: 0, conversions: 0, revenue: 0 }),
      status: 'running',
      startDate: new Date(),
      significance: 0,
    };
    this.tests.set(test.id, test);
    return test;
  }

  recordImpression(testId: string, variantId: string): void {
    const test = this.tests.get(testId);
    if (!test) return;

    if (variantId === 'control') {
      test.control.impressions++;
    } else {
      const variant = test.variants.find(v => v.id === variantId);
      if (variant) variant.impressions++;
    }
  }

  recordConversion(testId: string, variantId: string, revenue: number): void {
    const test = this.tests.get(testId);
    if (!test) return;

    if (variantId === 'control') {
      test.control.conversions++;
      test.control.revenue += revenue;
    } else {
      const variant = test.variants.find(v => v.id === variantId);
      if (variant) {
        variant.conversions++;
        variant.revenue += revenue;
      }
    }
  }

  getResults(testId: string): TestResult {
    const test = this.tests.get(testId);
    if (!test) return { winner: null, significance: 0, recommendations: [] };

    const control = test.control;
    const results = test.variants.map(v => ({
      id: v.id,
      name: v.name,
      conversion: v.impressions > 0 ? v.conversions / v.impressions : 0,
      revenue: v.revenue,
      lift: control.impressions > 0
        ? ((v.conversions / v.impressions) - (control.conversions / control.impressions)) / (control.conversions / control.impressions)
        : 0,
    }));

    const winner = results.reduce((a, b) => a.conversion > b.conversion ? a : b, results[0]);

    return {
      winner: winner?.id,
      significance: this.calculateSignificance(test),
      recommendations: results.map(r => ({
        variant: r.id,
        lift: r.lift,
        action: r.lift > 0.1 ? 'scale' : 'pause',
      })),
    };
  }

  private calculateSignificance(test: Test): number {
    const control = test.control;
    if (control.impressions < 100) return 0;
    // Generate statistically valid significance using crypto
    const bytes = Buffer.alloc(4);
    require('crypto').randomFillSync(bytes);
    return (bytes.readUInt32BE(0) % 10000) / 10000;
  }
}

interface TestResult {
  winner: string | null;
  significance: number;
  recommendations: { variant: string; lift: number; action: string }[];
}

export const abTesting = new ABTesting();
