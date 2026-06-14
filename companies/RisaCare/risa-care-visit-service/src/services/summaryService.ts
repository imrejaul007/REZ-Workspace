import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { IVisit } from '../models/Visit';
import logger from '../utils/logger';

export interface SummaryResponse {
  summary: string;
  keyPoints: Array<{
    category: 'diagnosis' | 'treatment' | 'warning' | 'instruction';
    point: string;
    importance: 'critical' | 'important' | 'informational';
  }>;
  actionItems: Array<{
    id: string;
    type: 'medication' | 'lifestyle' | 'follow-up' | 'test' | 'procedure' | 'referral';
    description: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: Date;
    completed: boolean;
  }>;
  generatedAt: Date;
  modelVersion: string;
  rawResponse?: string;
}

interface HojaiAIResponse {
  success: boolean;
  data?: {
    summary?: string;
    keyPoints?: Array<{ category: string; point: string; importance: string }>;
    actionItems?: Array<{ type: string; description: string; priority: string; dueDate?: string }>;
  };
  error?: string;
}

class SummaryService {
  private hojaiClient: AxiosInstance;
  private modelVersion: string;
  private useMockData: boolean;

  constructor() {
    const hojaiBaseUrl = process.env.HOJAI_API_URL || 'http://localhost:4590';

    this.hojaiClient = axios.create({
      baseURL: hojaiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'risa-care-visit-service'
      }
    });

    this.modelVersion = process.env.AI_MODEL_VERSION || 'hojai-voice-v2';
    this.useMockData = process.env.USE_MOCK_AI === 'true' || false;
  }

  /**
   * Generate AI summary for a visit
   */
  async generateVisitSummary(visit: IVisit): Promise<SummaryResponse> {
    logger.info('Generating visit summary', { visitId: visit.id });

    try {
      if (this.useMockData) {
        return this.generateMockSummary(visit);
      }

      const response = await this.hojaiClient.post<HojaiAIResponse>('/api/summarize', {
        type: 'healthcare-visit',
        visitData: this.formatVisitForAI(visit)
      });

      if (response.data.success && response.data.data) {
        return this.transformAIResponse(response.data.data, visit.profileId);
      }

      throw new Error(response.data.error || 'AI summary generation failed');
    } catch (error) {
      logger.warn('AI service unavailable, using mock data', { error });

      // Fallback to mock data
      return this.generateMockSummary(visit);
    }
  }

  /**
   * Format visit data for AI service
   */
  private formatVisitForAI(visit: IVisit): object {
    return {
      visitId: visit.id,
      profileId: visit.profileId,
      date: visit.date,
      type: visit.type,
      provider: visit.provider,
      chiefComplaint: visit.chiefComplaint,
      diagnoses: visit.diagnoses,
      medications: visit.medications,
      instructions: visit.instructions,
      followUps: visit.followUps,
      vitals: visit.vitals,
      notes: visit.notes,
      hasRecording: !!visit.recording,
      recordingTranscription: visit.recording?.transcription
    };
  }

  /**
   * Transform AI response to our format
   */
  private transformAIResponse(
    aiData: HojaiAIResponse['data'],
    profileId: string
  ): SummaryResponse {
    const actionItems = (aiData.actionItems || []).map(item => ({
      id: uuidv4(),
      type: item.type as SummaryResponse['actionItems'][0]['type'],
      description: item.description,
      priority: item.priority as SummaryResponse['actionItems'][0]['priority'],
      dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
      completed: false
    }));

    return {
      summary: aiData.summary || 'Summary not available',
      keyPoints: (aiData.keyPoints || []).map(kp => ({
        category: kp.category as SummaryResponse['keyPoints'][0]['category'],
        point: kp.point,
        importance: kp.importance as SummaryResponse['keyPoints'][0]['importance']
      })),
      actionItems,
      generatedAt: new Date(),
      modelVersion: this.modelVersion
    };
  }

  /**
   * Generate mock summary data for fallback/demo
   */
  private generateMockSummary(visit: IVisit): SummaryResponse {
    logger.info('Generating mock summary', { visitId: visit.id });

    const primaryDiagnosis = visit.diagnoses.find(d => d.isPrimary) || visit.diagnoses[0];
    const keyPoints: SummaryResponse['keyPoints'] = [];
    const actionItems: SummaryResponse['actionItems'] = [];

    // Add primary diagnosis key point
    if (primaryDiagnosis) {
      keyPoints.push({
        category: 'diagnosis',
        point: `Primary diagnosis: ${primaryDiagnosis.description}`,
        importance: 'critical'
      });
    }

    // Add medication key points
    if (visit.medications.length > 0) {
      keyPoints.push({
        category: 'treatment',
        point: `${visit.medications.length} medication(s) prescribed`,
        importance: 'important'
      });

      for (const med of visit.medications.slice(0, 2)) {
        actionItems.push({
          id: uuidv4(),
          type: 'medication',
          description: `Take ${med.name} ${med.dosage} ${med.frequency} for ${med.duration}`,
          priority: 'high',
          completed: false
        });
      }
    }

    // Add follow-up key points
    if (visit.followUps.length > 0) {
      keyPoints.push({
        category: 'instruction',
        point: `${visit.followUps.length} follow-up appointment(s) scheduled`,
        importance: 'important'
      });

      for (const fu of visit.followUps) {
        actionItems.push({
          id: uuidv4(),
          type: 'follow-up',
          description: fu.reason,
          priority: 'medium',
          dueDate: fu.scheduledDate,
          completed: false
        });
      }
    }

    // Add instruction key points
    for (const instruction of visit.instructions.slice(0, 2)) {
      keyPoints.push({
        category: 'instruction',
        point: instruction,
        importance: 'informational'
      });

      actionItems.push({
        id: uuidv4(),
        type: 'lifestyle',
        description: instruction,
        priority: 'medium',
        completed: false
      });
    }

    // Generate summary text
    const summary = this.generateSummaryText(visit, primaryDiagnosis);

    return {
      summary,
      keyPoints,
      actionItems,
      generatedAt: new Date(),
      modelVersion: this.modelVersion,
      rawResponse: JSON.stringify({ mock: true, visitId: visit.id })
    };
  }

  /**
   * Generate human-readable summary text
   */
  private generateSummaryText(visit: IVisit, primaryDiagnosis?: { code: string; description: string }): string {
    const parts: string[] = [];

    parts.push(
      `Patient visited ${visit.provider.name} (${visit.provider.specialty}) on ${new Date(visit.date).toLocaleDateString()}.`
    );

    parts.push(`Chief complaint: ${visit.chiefComplaint}.`);

    if (primaryDiagnosis) {
      parts.push(`Primary diagnosis: ${primaryDiagnosis.description} (${primaryDiagnosis.code}).`);
    }

    if (visit.medications.length > 0) {
      const medList = visit.medications.map(m => `${m.name} ${m.dosage}`).join(', ');
      parts.push(`Medications prescribed: ${medList}.`);
    }

    if (visit.followUps.length > 0) {
      const nextFollowUp = visit.followUps.sort(
        (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      )[0];
      parts.push(`Follow-up scheduled for ${new Date(nextFollowUp.scheduledDate).toLocaleDateString()}.`);
    }

    if (visit.instructions.length > 0) {
      parts.push(`Patient instructed to: ${visit.instructions.join(' ')}`);
    }

    return parts.join(' ');
  }

  /**
   * Extract action items from transcription
   */
  async extractActionItemsFromTranscription(
    transcription: string
  ): Promise<Array<{ type: string; description: string; priority: string }>> {
    try {
      if (this.useMockData) {
        return this.mockExtractActionItems(transcription);
      }

      const response = await this.hojaiClient.post('/api/extract-action-items', {
        transcription,
        context: 'healthcare-visit'
      });

      if (response.data.success) {
        return response.data.actionItems || [];
      }

      return this.mockExtractActionItems(transcription);
    } catch (error) {
      logger.warn('Failed to extract action items from transcription', { error });
      return this.mockExtractActionItems(transcription);
    }
  }

  private mockExtractActionItems(transcription: string): Array<{ type: string; description: string; priority: string }> {
    const items: Array<{ type: string; description: string; priority: string }> = [];

    // Simple mock extraction based on common patterns
    const patterns = [
      { regex: /take (\w+)/gi, type: 'medication', priority: 'high' },
      { regex: /schedule (?:a )?(?:follow-up|appointment)/gi, type: 'follow-up', priority: 'medium' },
      { regex: /blood test|x-ray|scan|lab work/gi, type: 'test', priority: 'medium' }
    ];

    for (const pattern of patterns) {
      const matches = transcription.match(pattern.regex);
      if (matches) {
        for (const match of matches.slice(0, 3)) {
          items.push({
            type: pattern.type,
            description: match,
            priority: pattern.priority
          });
        }
      }
    }

    return items;
  }
}

export const summaryService = new SummaryService();
