// RisaCare - Unit Tests for Shared Utils

import { describe, test, expect } from '@jest/globals';

// ============================================
// ID GENERATION TESTS
// ============================================

describe('ID Generation', () => {
  const generateId = (prefix: string = ''): string => {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 16; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return prefix ? `${prefix}_${id}` : id;
  };

  test('should generate ID with prefix', () => {
    const id = generateId('rec');
    expect(id).toMatch(/^rec_[a-f0-9]{16}$/);
  });

  test('should generate ID without prefix', () => {
    const id = generateId();
    expect(id).toHaveLength(16);
    expect(id).toMatch(/^[a-f0-9]{16}$/);
  });

  test('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

// ============================================
// DATE UTILITIES TESTS
// ============================================

describe('Date Utilities', () => {
  const now = (): string => new Date().toISOString();

  const toDateString = (date: Date = new Date()): string => {
    return date.toISOString().split('T')[0];
  };

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const diffDays = (date1: Date, date2: Date): number => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  test('should generate ISO timestamp', () => {
    const timestamp = now();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('should format date as YYYY-MM-DD', () => {
    const date = new Date('2026-03-15T10:30:00Z');
    expect(toDateString(date)).toBe('2026-03-15');
  });

  test('should add days correctly', () => {
    const date = new Date('2026-03-15');
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(20);
  });

  test('should subtract days correctly', () => {
    const date = new Date('2026-03-15');
    const result = addDays(date, -5);
    expect(result.getDate()).toBe(10);
  });

  test('should calculate days between dates', () => {
    const date1 = new Date('2026-03-15');
    const date2 = new Date('2026-03-20');
    expect(diffDays(date1, date2)).toBe(5);
  });

  test('should detect same day', () => {
    const date1 = new Date('2026-03-15T10:00:00Z');
    const date2 = new Date('2026-03-15T22:00:00Z');
    expect(isSameDay(date1, date2)).toBe(true);
  });

  test('should detect different day', () => {
    const date1 = new Date('2026-03-15');
    const date2 = new Date('2026-03-16');
    expect(isSameDay(date1, date2)).toBe(false);
  });
});

// ============================================
// VALIDATION UTILITIES TESTS
// ============================================

describe('Validation Utilities', () => {
  const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const regex = /^[+]?[\d\s-]{10,15}$/;
    return regex.test(phone);
  };

  const isValidUUID = (id: string): boolean => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(id);
  };

  const sanitizeString = (str: string): string => {
    return str.trim().replace(/[<>]/g, '');
  };

  const truncate = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  };

  test('should validate correct email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.in')).toBe(true);
  });

  test('should reject invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });

  test('should validate correct phone', () => {
    expect(isValidPhone('9876543210')).toBe(true);
    expect(isValidPhone('+91-9876543210')).toBe(true);
    expect(isValidPhone('91 98765 43210')).toBe(true);
  });

  test('should reject invalid phone', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('abc123')).toBe(false);
  });

  test('should validate correct UUID', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  test('should reject invalid UUID', () => {
    expect(isValidUUID('invalid')).toBe(false);
    expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
  });

  test('should sanitize string', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
  });

  test('should truncate long strings', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
    expect(truncate('Hi', 10)).toBe('Hi');
    expect(truncate('Hello World', 5)).toBe('He...');
  });
});

// ============================================
// ARRAY UTILITIES TESTS
// ============================================

describe('Array Utilities', () => {
  const groupBy = <T extends Record<string, unknown>>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) result[groupKey] = [];
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  };

  const unique = <T>(array: T[]): T[] => [...new Set(array)];

  const chunk = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  test('should group array by key', () => {
    const items = [
      { type: 'a', name: 'item1' },
      { type: 'b', name: 'item2' },
      { type: 'a', name: 'item3' }
    ];
    const grouped = groupBy(items, 'type');
    expect(grouped['a']).toHaveLength(2);
    expect(grouped['b']).toHaveLength(1);
  });

  test('should return unique values', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  test('should chunk array correctly', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    expect(chunk([], 2)).toEqual([]);
  });
});

// ============================================
// NUMBER UTILITIES TESTS
// ============================================

describe('Number Utilities', () => {
  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  const round = (value: number, decimals: number = 2): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const percentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return round((value / total) * 100);
  };

  test('should clamp value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  test('should round to specified decimals', () => {
    expect(round(3.14159, 2)).toBe(3.14);
    expect(round(3.145, 1)).toBe(3.1);
    expect(round(3.5)).toBe(4);
  });

  test('should format currency correctly', () => {
    expect(formatCurrency(1000)).toContain('1,000');
    expect(formatCurrency(1234567.89)).toContain('12,34,567.89');
  });

  test('should calculate percentage', () => {
    expect(percentage(25, 100)).toBe(25);
    expect(percentage(1, 3)).toBeCloseTo(33.33, 1);
    expect(percentage(0, 100)).toBe(0);
  });

  test('should handle zero total in percentage', () => {
    expect(percentage(10, 0)).toBe(0);
  });
});

// ============================================
// HEALTH-SPECIFIC UTILITIES TESTS
// ============================================

describe('Health Utilities', () => {
  const calculateBMI = (weightKg: number, heightCm: number): number => {
    const heightM = heightCm / 100;
    return round(weightKg / (heightM * heightM));
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const predictNextPeriod = (lastPeriodStart: string, cycleLength: number = 28): string => {
    const lastPeriod = new Date(lastPeriodStart);
    lastPeriod.setDate(lastPeriod.getDate() + cycleLength);
    return lastPeriod.toISOString().split('T')[0];
  };

  test('should calculate BMI correctly', () => {
    expect(calculateBMI(70, 175)).toBe(22.86);
    expect(calculateBMI(60, 165)).toBeCloseTo(22.05, 1);
  });

  test('should categorize BMI correctly', () => {
    expect(getBMICategory(17)).toBe('Underweight');
    expect(getBMICategory(22)).toBe('Normal');
    expect(getBMICategory(27)).toBe('Overweight');
    expect(getBMICategory(32)).toBe('Obese');
  });

  test('should calculate age correctly', () => {
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    expect(getAge(birthDate.toISOString())).toBe(30);
  });

  test('should predict next period', () => {
    const result = predictNextPeriod('2026-03-01', 28);
    expect(result).toBe('2026-03-29');
  });
});
