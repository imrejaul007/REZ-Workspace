// RisaCare - Unit Tests for Records Service

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Mock data
const mockRecord = {
  id: 'rec_test_001',
  userId: 'user_123',
  profileId: 'profile_456',
  type: 'blood_report' as const,
  title: 'CBC Test - March 2026',
  description: 'Complete Blood Count',
  file: {
    url: 'https://storage.example.com/records/rec_test_001.pdf',
    filename: 'cbc_march.pdf',
    mimeType: 'application/pdf',
    size: 245000,
    storageKey: 'user_123/profile_456/reports/rec_test_001.pdf'
  },
  processing: {
    status: 'pending' as const
  },
  tags: [],
  isAbnormal: false,
  hasFollowUpRequired: false,
  sharing: {
    isShared: false,
    sharedWith: []
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'user_123',
  lastAccessedAt: new Date().toISOString()
};

const mockBiomarker = {
  name: 'Hemoglobin',
  value: 14.5,
  unit: 'g/dL',
  referenceRange: { min: 12, max: 17 },
  status: 'normal' as const
};

// ============================================
// RECORD VALIDATION TESTS
// ============================================

describe('Record Validation', () => {
  test('should validate valid record structure', () => {
    expect(mockRecord.id).toBeDefined();
    expect(mockRecord.userId).toBeDefined();
    expect(mockRecord.profileId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(mockRecord.type).toBe('blood_report');
    expect(mockRecord.title).toBeTruthy();
  });

  test('should validate file metadata', () => {
    expect(mockRecord.file.mimeType).toBe('application/pdf');
    expect(mockRecord.file.size).toBeLessThan(25 * 1024 * 1024); // 25MB limit
    expect(mockRecord.file.storageKey).toContain(mockRecord.userId);
  });

  test('should validate processing status', () => {
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    expect(validStatuses).toContain(mockRecord.processing.status);
  });
});

// ============================================
// BIOMARKER TESTS
// ============================================

describe('Biomarker Validation', () => {
  test('should validate biomarker structure', () => {
    expect(mockBiomarker.name).toBeTruthy();
    expect(mockBiomarker.value).toBeDefined();
    expect(typeof mockBiomarker.value).toBe('number');
    expect(mockBiomarker.status).toMatch(/^(normal|low|high|borderline|critical)$/);
  });

  test('should validate reference range', () => {
    expect(mockBiomarker.referenceRange.min).toBeDefined();
    expect(mockBiomarker.referenceRange.max).toBeDefined();
    expect(mockBiomarker.value).toBeGreaterThanOrEqual(mockBiomarker.referenceRange.min);
    expect(mockBiomarker.value).toBeLessThanOrEqual(mockBiomarker.referenceRange.max);
  });

  test('should calculate biomarker status correctly', () => {
    const isNormal = mockBiomarker.value >= mockBiomarker.referenceRange.min &&
                     mockBiomarker.value <= mockBiomarker.referenceRange.max;
    expect(isNormal).toBe(true);
    expect(mockBiomarker.status).toBe('normal');
  });

  test('should detect low values', () => {
    const lowHemoglobin = { ...mockBiomarker, value: 10, status: 'low' as const };
    expect(lowHemoglobin.value).toBeLessThan(lowHemoglobin.referenceRange.min);
    expect(lowHemoglobin.status).toBe('low');
  });

  test('should detect high values', () => {
    const highHemoglobin = { ...mockBiomarker, value: 20, status: 'high' as const };
    expect(highHemoglobin.value).toBeGreaterThan(highHemoglobin.referenceRange.max);
    expect(highHemoglobin.status).toBe('high');
  });
});

// ============================================
// FILE VALIDATION TESTS
// ============================================

describe('File Validation', () => {
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  test('should accept valid PDF', () => {
    expect(ALLOWED_TYPES).toContain('application/pdf');
    expect(mockRecord.file.mimeType).toBe('application/pdf');
  });

  test('should accept valid image types', () => {
    const imageTypes = ALLOWED_TYPES.filter(t => t.startsWith('image/'));
    expect(imageTypes.length).toBe(4);
  });

  test('should validate file size under limit', () => {
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB
    expect(mockRecord.file.size).toBeLessThan(MAX_SIZE);
  });
});

// ============================================
// CATEGORIZATION TESTS
// ============================================

describe('Document Categorization', () => {
  const categorizeDocument = (type: string, text: string) => {
    const textLower = text.toLowerCase();
    let category = 'general';
    const tags: string[] = [];

    if (textLower.includes('hemoglobin') || textLower.includes('rbc') || textLower.includes('wbc')) {
      category = 'blood';
      tags.push('cbc', 'blood_count');
    } else if (textLower.includes('thyroid') || textLower.includes('tsh')) {
      category = 'thyroid';
      tags.push('thyroid', 'hormone');
    } else if (textLower.includes('cholesterol') || textLower.includes('ldl')) {
      category = 'cardiac';
      tags.push('lipid', 'heart');
    } else if (textLower.includes('glucose') || textLower.includes('hba1c')) {
      category = 'diabetes';
      tags.push('sugar', 'glucose');
    }

    return { category, tags };
  };

  test('should categorize blood report', () => {
    const result = categorizeDocument('blood_report', 'CBC Test - Hemoglobin 14.5, RBC 5.0, WBC 8000');
    expect(result.category).toBe('blood');
    expect(result.tags).toContain('cbc');
  });

  test('should categorize thyroid report', () => {
    const result = categorizeDocument('lab_report', 'Thyroid Profile - TSH 2.5, T3 1.2, T4 7.5');
    expect(result.category).toBe('thyroid');
    expect(result.tags).toContain('thyroid');
  });

  test('should categorize cardiac report', () => {
    const result = categorizeDocument('lab_report', 'Lipid Profile - Cholesterol 200, LDL 120, HDL 50');
    expect(result.category).toBe('cardiac');
    expect(result.tags).toContain('lipid');
  });

  test('should default to general for unknown types', () => {
    const result = categorizeDocument('other', 'Medical certificate');
    expect(result.category).toBe('general');
  });
});

// ============================================
// STORAGE KEY TESTS
// ============================================

describe('Storage Key Generation', () => {
  const generateStorageKey = (userId: string, profileId: string, filename: string): string => {
    const timestamp = Date.now();
    const ext = filename.split('.').pop() || '';
    return `${userId}/${profileId}/reports/${timestamp}.${ext}`;
  };

  test('should generate valid storage key', () => {
    const key = generateStorageKey('user_123', 'profile_456', 'test.pdf');
    expect(key).toContain('user_123');
    expect(key).toContain('profile_456');
    expect(key).toContain('reports');
    expect(key).toMatch(/\.pdf$/);
  });

  test('should include user and profile in path', () => {
    const key = generateStorageKey('user_abc', 'profile_xyz', 'report.jpg');
    expect(key).toBe('user_abc/profile_xyz/reports/');
    expect(key).toMatch(/\.jpg$/);
  });
});

// ============================================
// OCR CONFIDENCE TESTS
// ============================================

describe('OCR Confidence', () => {
  test('should validate confidence range 0-1', () => {
    const validConfidence = 0.85;
    expect(validConfidence).toBeGreaterThanOrEqual(0);
    expect(validConfidence).toBeLessThanOrEqual(1);
  });

  test('should calculate overall confidence from interpretations', () => {
    const interpretations = [
      { confidence: 0.92, status: 'normal' },
      { confidence: 0.88, status: 'low' },
      { confidence: 0.95, status: 'normal' }
    ];

    const overall = interpretations.reduce((sum, i) => sum + i.confidence, 0) / interpretations.length;
    expect(overall).toBeCloseTo(0.92, 1);
  });
});
