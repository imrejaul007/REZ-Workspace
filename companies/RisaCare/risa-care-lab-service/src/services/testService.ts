import { v4 as uuidv4 } from 'uuid';
import { Test, TestSchema, TestCategory, Parameter, ParameterSchema } from '../models/lab.js';

class TestService {
  private tests: Map<string, Test> = new Map();

  addTest(data: Omit<Test, 'testId' | 'createdAt' | 'updatedAt'>): Test {
    const now = new Date().toISOString();
    const test: Test = {
      ...data,
      testId: `TEST-${uuidv4().slice(0, 8).toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
    };

    const validated = TestSchema.parse(test);
    this.tests.set(validated.testId, validated);
    return validated;
  }

  getTest(testId: string): Test | undefined {
    return this.tests.get(testId);
  }

  getTests(filters?: { category?: TestCategory; isActive?: boolean }): Test[] {
    let results = Array.from(this.tests.values());

    if (filters?.category) {
      results = results.filter((t) => t.category === filters.category);
    }

    if (filters?.isActive !== undefined) {
      results = results.filter((t) => t.isActive === filters.isActive);
    }

    return results;
  }

  getTestsByCategory(category: TestCategory): Test[] {
    return this.getTests({ category, isActive: true });
  }

  updateTest(testId: string, updates: Partial<Omit<Test, 'testId' | 'createdAt'>>): Test | null {
    const existing = this.tests.get(testId);
    if (!existing) return null;

    const updated: Test = {
      ...existing,
      ...updates,
      testId, // preserve original ID
      updatedAt: new Date().toISOString(),
    };

    const validated = TestSchema.parse(updated);
    this.tests.set(testId, validated);
    return validated;
  }

  addParameter(testId: string, parameter: Parameter): Test | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const validatedParam = ParameterSchema.parse(parameter);
    test.parameters.push(validatedParam);
    test.updatedAt = new Date().toISOString();

    return test;
  }

  removeParameter(testId: string, parameterName: string): Test | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    test.parameters = test.parameters.filter((p) => p.name !== parameterName);
    test.updatedAt = new Date().toISOString();

    return test;
  }

  deactivateTest(testId: string): boolean {
    const test = this.tests.get(testId);
    if (!test) return false;
    test.isActive = false;
    test.updatedAt = new Date().toISOString();
    return true;
  }

  activateTest(testId: string): boolean {
    const test = this.tests.get(testId);
    if (!test) return false;
    test.isActive = true;
    test.updatedAt = new Date().toISOString();
    return true;
  }

  searchTests(query: string): Test[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tests.values()).filter(
      (t) =>
        t.isActive &&
        (t.name.toLowerCase().includes(lowerQuery) ||
          t.category.toLowerCase().includes(lowerQuery) ||
          (t.description?.toLowerCase().includes(lowerQuery) ?? false))
    );
  }

  getCategories(): TestCategory[] {
    return ['hematology', 'biochemistry', 'microbiology', 'pathology', 'imaging'];
  }

  getTestsByEquipment(equipment: string): Test[] {
    return Array.from(this.tests.values()).filter(
      (t) => t.isActive && t.equipment.some((e) => e.toLowerCase().includes(equipment.toLowerCase()))
    );
  }

  getFastingTests(): Test[] {
    return Array.from(this.tests.values()).filter((t) => t.isActive && t.fastingRequired);
  }
}

export const testService = new TestService();
