import { v4 as uuidv4 } from 'uuid';
import { Result, ResultSchema, ResultStatus, Test } from '../models/lab.js';
import { testService } from './testService.js';

class ResultService {
  private results: Map<string, Result> = new Map(); // resultId -> Result

  addResult(data: {
    testId: string;
    parameterName: string;
    value: string | number;
    unit: string;
    referenceRange: { min: number; max: number };
    method?: string;
    instrument?: string;
    notes?: string;
  }): Result {
    const status = this.calculateStatus(data.value, data.referenceRange);

    const result: Result = {
      resultId: `RES-${uuidv4().slice(0, 8).toUpperCase()}`,
      testId: data.testId,
      parameterName: data.parameterName,
      value: data.value,
      unit: data.unit,
      referenceRange: data.referenceRange,
      status,
      method: data.method,
      instrument: data.instrument,
      notes: data.notes,
    };

    const validated = ResultSchema.parse(result);
    this.results.set(validated.resultId, validated);
    return validated;
  }

  updateResult(resultId: string, updates: Partial<Omit<Result, 'resultId' | 'testId'>>): Result | null {
    const existing = this.results.get(resultId);
    if (!existing) return null;

    const updated: Result = {
      ...existing,
      ...updates,
      resultId, // preserve original ID
    };

    // Recalculate status if value or range changed
    if (updates.value !== undefined || updates.referenceRange !== undefined) {
      updated.status = this.calculateStatus(
        updated.value,
        updates.referenceRange ?? existing.referenceRange
      );
    }

    const validated = ResultSchema.parse(updated);
    this.results.set(resultId, validated);
    return validated;
  }

  verifyResult(resultId: string, verifiedBy: string): Result | null {
    const result = this.results.get(resultId);
    if (!result) return null;

    result.verifiedAt = new Date().toISOString();
    result.verifiedBy = verifiedBy;
    return ResultSchema.parse(result);
  }

  validateResults(results: Result[]): {
    valid: boolean;
    criticalCount: number;
    outOfRange: number;
    criticalResults: Result[];
    outOfRangeResults: Result[];
  } {
    const criticalResults = results.filter((r) => r.status === 'critical');
    const outOfRangeResults = results.filter((r) => r.status === 'low' || r.status === 'high');

    return {
      valid: criticalResults.length === 0,
      criticalCount: criticalResults.length,
      outOfRange: outOfRangeResults.length,
      criticalResults,
      outOfRangeResults,
    };
  }

  getCriticalResults(): Result[] {
    return Array.from(this.results.values()).filter((r) => r.status === 'critical');
  }

  getUnverifiedResults(): Result[] {
    return Array.from(this.results.values()).filter((r) => !r.verifiedAt);
  }

  getResultsByTest(testId: string): Result[] {
    return Array.from(this.results.values()).filter((r) => r.testId === testId);
  }

  calculateStatus(
    value: string | number,
    referenceRange: { min: number; max: number }
  ): ResultStatus {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      // Non-numeric values can't be compared to range
      return 'normal';
    }

    // Critical: more than 50% outside range
    const range = referenceRange.max - referenceRange.min;
    const criticalThreshold = range * 0.5;

    if (numValue < referenceRange.min - criticalThreshold || numValue > referenceRange.max + criticalThreshold) {
      return 'critical';
    }

    if (numValue < referenceRange.min) {
      return 'low';
    }

    if (numValue > referenceRange.max) {
      return 'high';
    }

    return 'normal';
  }

  generateInterpretation(test: Test, results: Result[]): string {
    const interpretations: string[] = [];

    for (const result of results) {
      switch (result.status) {
        case 'critical':
          interpretations.push(
            `${result.parameterName}: ${result.value} ${result.unit} (CRITICAL - Immediate medical attention recommended)`
          );
          break;
        case 'high':
          interpretations.push(
            `${result.parameterName}: ${result.value} ${result.unit} (HIGH - Above normal range)`
          );
          break;
        case 'low':
          interpretations.push(
            `${result.parameterName}: ${result.value} ${result.unit} (LOW - Below normal range)`
          );
          break;
        case 'normal':
          interpretations.push(
            `${result.parameterName}: ${result.value} ${result.unit} (Normal)`
          );
          break;
      }
    }

    return interpretations.join('\n');
  }

  getResultsByPatient(resultsMap: Map<string, Result[]>): Result[][] {
    return Array.from(resultsMap.values());
  }
}

export const resultService = new ResultService();
