// RisaCare Records Service - OCR Service

import { logger, generateId, now } from '@risa-care/shared/utils';
import { rezIntelligenceClient } from '../../../integrations/rez-intelligence';

interface OCRResult {
  text: string;
  confidence: number;
  pages: number;
  language: string;
  structured?: Record<string, unknown>;
}

interface ExtractionResult {
  date?: string;
  doctorName?: string;
  hospitalName?: string;
  labName?: string;
  biomarkers: Array<{
    name: string;
    value: string | number;
    unit?: string;
    referenceRange?: { min?: number; max?: number };
    status: 'normal' | 'low' | 'high' | 'borderline' | 'critical';
  }>;
  diagnosis?: string[];
  medications?: Array<{ name: string; dosage?: string; frequency?: string }>;
  rawText: string;
  confidence: number;
}

// ============================================
// OCR SERVICE
// ============================================

export class OCRService {
  private processingQueue: Map<string, { status: string; progress: number; result?: OCRResult }> = new Map();

  async processDocument(
    recordId: string,
    fileBuffer: Buffer,
    mimeType: string,
    documentType: string
  ): Promise<OCRResult> {
    const jobId = generateId('ocr');

    logger.info(`Starting OCR for record ${recordId}, job ${jobId}`);

    // Update job status
    this.processingQueue.set(jobId, { status: 'processing', progress: 0 });

    try {
      // Step 1: Text extraction
      this.processingQueue.set(jobId, { status: 'processing', progress: 30 });
      const textResult = await this.extractText(fileBuffer, mimeType);

      this.processingQueue.set(jobId, { status: 'processing', progress: 70 });
      const result: OCRResult = {
        text: textResult.text,
        confidence: textResult.confidence,
        pages: textResult.pages,
        language: 'en'
      };

      this.processingQueue.set(jobId, { status: 'completed', progress: 100, result });
      logger.info(`OCR completed for record ${recordId}, confidence: ${result.confidence}`);

      return result;
    } catch (error) {
      this.processingQueue.set(jobId, { status: 'failed', progress: 0 });
      logger.error(`OCR failed for record ${recordId}`, error as Error);
      throw error;
    }
  }

  private async extractText(
    buffer: Buffer,
    mimeType: string
  ): Promise<{ text: string; confidence: number; pages: number }> {
    // In production, this would integrate with:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Or a custom OCR solution

    // For now, simulate OCR processing
    logger.info(`Extracting text from ${mimeType} document`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return simulated result
    // In production, this would return actual OCR results
    return {
      text: '',
      confidence: 0.85,
      pages: 1
    };
  }

  getJobStatus(jobId: string): { status: string; progress: number; result?: OCRResult } | null {
    return this.processingQueue.get(jobId) || null;
  }

  async extractStructuredData(
    recordId: string,
    rawText: string,
    documentType: string,
    userContext?: {
      allergies?: string[];
      chronicConditions?: string[];
      currentMedications?: string[];
    }
  ): Promise<ExtractionResult> {
    logger.info(`Extracting structured data for record ${recordId}`);

    try {
      // Use REZ Intelligence for structured extraction
      const response = await rezIntelligenceClient.health.interpret({
        recordType: documentType,
        reportDate: new Date().toISOString(),
        rawText,
        extractedBiomarkers: [],
        userContext: {
          allergies: userContext?.allergies || [],
          chronicConditions: userContext?.chronicConditions || [],
          currentMedications: userContext?.currentMedications || []
        }
      });

      // Transform response to our format
      if (!response) {
        throw new Error('Interpretation failed');
      }
      const result: ExtractionResult = {
        biomarkers: response.interpretations.map(i => ({
          name: i.biomarker,
          value: i.value,
          unit: (i as any).unit,
          status: i.status,
          referenceRange: { min: 0, max: 100 } // Default, would be extracted
        })),
        rawText,
        confidence: response.confidence
      };

      // Extract additional fields from the interpretation
      // This is simplified - in production, the AI would return structured fields

      logger.info(`Extracted ${result.biomarkers.length} biomarkers from record ${recordId}`);

      return result;
    } catch (error) {
      logger.error(`Structured extraction failed for record ${recordId}`, error as Error);
      throw error;
    }
  }

  categorizeDocument(text: string, documentType: string): {
    category: string;
    tags: string[];
    isAbnormal: boolean;
    abnormalBiomarkers: string[];
  } {
    // Simple categorization based on text analysis
    // In production, this would use ML models or AI

    const textLower = text.toLowerCase();
    const tags: string[] = [];
    let category = 'general';
    let isAbnormal = false;
    const abnormalBiomarkers: string[] = [];

    // Detect category from keywords
    if (textLower.includes('hemoglobin') || textLower.includes('rbc') || textLower.includes('wbc')) {
      category = 'blood';
      tags.push('cbc', 'blood_count');
    } else if (textLower.includes('thyroid') || textLower.includes('tsh') || textLower.includes('t3') || textLower.includes('t4')) {
      category = 'thyroid';
      tags.push('thyroid', 'hormone');
    } else if (textLower.includes('cholesterol') || textLower.includes('triglyceride') || textLower.includes('ldl') || textLower.includes('hdl')) {
      category = 'cardiac';
      tags.push('lipid', 'heart');
    } else if (textLower.includes('glucose') || textLower.includes('hba1c') || textLower.includes('diabetes')) {
      category = 'diabetes';
      tags.push('sugar', 'glucose');
    } else if (textLower.includes('vitamin d') || textLower.includes('vitamin b12') || textLower.includes('folate')) {
      category = 'nutrition';
      tags.push('vitamin', 'deficiency');
    } else if (textLower.includes('liver') || textLower.includes('sgpt') || textLower.includes('sgot') || textLower.includes('bilirubin')) {
      category = 'liver';
      tags.push('liver_function');
    } else if (textLower.includes('kidney') || textLower.includes('creatinine') || textLower.includes('urea')) {
      category = 'kidney';
      tags.push('renal');
    }

    // Detect abnormal values
    if (textLower.includes('high') || textLower.includes('elevated') || textLower.includes('abnormal')) {
      isAbnormal = true;
      tags.push('abnormal');
    }

    // Add document type as tag
    if (documentType.includes('report')) {
      tags.push('report');
    } else if (documentType.includes('prescription')) {
      tags.push('prescription');
    }

    return { category, tags, isAbnormal, abnormalBiomarkers };
  }
}

// Singleton instance
let ocrService: OCRService | null = null;

export function getOCRService(): OCRService {
  if (!ocrService) {
    ocrService = new OCRService();
  }
  return ocrService;
}
