import axios from 'axios';
import { meetingService } from './meetingService.js';
import { CreateActionItemDTO } from '../types/index.js';

const REZ_INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';
const REZ_INTELLIGENCE_API_KEY = process.env.REZ_INTELLIGENCE_API_KEY || '';

export interface GeneratedNotes {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: Array<{
    task: string;
    assigneeHint?: string;
    dueDateHint?: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  nextSteps: string[];
  sentiment: 'positive' | 'neutral' | 'needs_followup';
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number;
}

export class AINoteService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = REZ_INTELLIGENCE_URL;
    this.apiKey = REZ_INTELLIGENCE_API_KEY;
  }

  /**
   * Generate AI meeting notes from transcript or meeting data
   */
  async generateNotes(
    meetingId: string,
    userId: string,
    transcript?: TranscriptSegment[]
  ): Promise<GeneratedNotes> {
    // Get meeting details
    const meeting = await meetingService.getMeeting(meetingId);

    // Build context from meeting
    const context = {
      title: meeting.title,
      description: meeting.description,
      hostName: meeting.hostName,
      attendees: meeting.attendees,
      duration: meeting.duration,
      actionItems: meeting.actionItems,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      transcript: transcript || [],
    };

    // Try to use REZ Intelligence for advanced processing
    try {
      const aiNotes = await this.callIntelligenceAPI(context);
      return aiNotes;
    } catch (error) {
      logger.warn('REZ Intelligence unavailable, using fallback:', error);
      return this.generateFallbackNotes(context);
    }
  }

  /**
   * Call REZ Intelligence API for meeting analysis
   */
  private async callIntelligenceAPI(context: Record<string, unknown>): Promise<GeneratedNotes> {
    const response = await axios.post<GeneratedNotes>(
      `${this.apiUrl}/api/meetings/analyze`,
      { context },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        timeout: 30000,
      }
    );

    return response.data;
  }

  /**
   * Generate notes from a transcript with timestamps
   */
  async generateNotesFromTranscript(
    meetingId: string,
    userId: string,
    transcript: TranscriptSegment[]
  ): Promise<GeneratedNotes> {
    return this.generateNotes(meetingId, userId, transcript);
  }

  /**
   * Extract action items from transcript using AI
   */
  async extractActionItems(
    transcript: TranscriptSegment[]
  ): Promise<Array<{ task: string; assigneeHint?: string; priority: 'low' | 'medium' | 'high' }>> {
    const fullText = transcript.map((s) => `${s.speaker}: ${s.text}`).join('\n');

    try {
      const response = await axios.post<{ actionItems: Array<{ task: string; assigneeHint?: string; priority: string }> }>(
        `${this.apiUrl}/api/meetings/extract-action-items`,
        { text: fullText },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          timeout: 15000,
        }
      );

      return response.data.actionItems.map((item) => ({
        task: item.task,
        assigneeHint: item.assigneeHint,
        priority: item.priority as 'low' | 'medium' | 'high',
      }));
    } catch (error) {
      // Fallback: simple regex-based extraction
      return this.extractActionItemsFallback(fullText);
    }
  }

  /**
   * Summarize meeting discussion points
   */
  async summarizeDiscussion(transcript: TranscriptSegment[]): Promise<string> {
    const fullText = transcript.map((s) => `${s.speaker}: ${s.text}`).join('\n');

    try {
      const response = await axios.post<{ summary: string }>(
        `${this.apiUrl}/api/meetings/summarize`,
        { text: fullText },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          timeout: 15000,
        }
      );

      return response.data.summary;
    } catch (error) {
      // Fallback: take first few segments
      return transcript.slice(0, 3).map((s) => s.text).join(' ');
    }
  }

  /**
   * Detect decisions made in meeting
   */
  async detectDecisions(transcript: TranscriptSegment[]): Promise<string[]> {
    const fullText = transcript.map((s) => `${s.speaker}: ${s.text}`).join('\n');

    try {
      const response = await axios.post<{ decisions: string[] }>(
        `${this.apiUrl}/api/meetings/detect-decisions`,
        { text: fullText },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          timeout: 15000,
        }
      );

      return response.data.decisions;
    } catch (error) {
      // Fallback: look for decision keywords
      return this.detectDecisionsFallback(fullText);
    }
  }

  /**
   * Save AI-generated notes to a meeting
   */
  async saveGeneratedNotes(
    meetingId: string,
    userId: string,
    notes: GeneratedNotes
  ): Promise<void> {
    const actionItems: CreateActionItemDTO[] = notes.actionItems.map((item) => ({
      task: item.task,
      assigneeId: '', // Will need to be assigned by user
      assigneeName: item.assigneeHint || '',
      dueDate: item.dueDateHint ? new Date(item.dueDateHint) : undefined,
    }));

    await meetingService.saveNotes(meetingId, userId, {
      content: notes.keyPoints.join('\n'),
      summary: notes.summary,
      decisions: notes.decisions,
      actionItems,
    });
  }

  /**
   * Fallback note generation when AI is unavailable
   */
  private generateFallbackNotes(context: Record<string, unknown>): GeneratedNotes {
    const actionItems = context.actionItems as Array<{
      task: string;
      assigneeName: string;
      completed: boolean;
    }>;

    const pendingItems = actionItems.filter((i) => !i.completed);

    return {
      summary: `Meeting: ${context.title || 'Untitled'}`,
      keyPoints: [
        `Duration: ${context.duration} minutes`,
        `Host: ${context.hostName || 'Unknown'}`,
        `Attendees: ${(context.attendees as string[])?.length || 0} participants`,
      ],
      decisions: [],
      actionItems: pendingItems.map((item) => ({
        task: item.task,
        assigneeHint: item.assigneeName,
        priority: 'medium' as const,
      })),
      nextSteps: pendingItems.map((item) => item.task),
      sentiment: pendingItems.length > 0 ? 'needs_followup' : 'neutral',
    };
  }

  /**
   * Fallback action item extraction
   */
  private extractActionItemsFallback(text: string): Array<{
    task: string;
    assigneeHint?: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const actionPatterns = [
      /([A-Z][a-z]+)\s+will\s+(.+?)(?:\.|$)/gi,
      /([A-Z][a-z]+)\s+should\s+(.+?)(?:\.|$)/gi,
      /([A-Z][a-z]+)\s+needs?\s+to\s+(.+?)(?:\.|$)/gi,
      /action:\s*(.+?)(?:\.|$)/gi,
      /todo:\s*(.+?)(?:\.|$)/gi,
    ];

    const items: Array<{ task: string; assigneeHint?: string; priority: 'low' | 'medium' | 'high' }> = [];

    actionPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        items.push({
          task: match[2] || match[1],
          assigneeHint: pattern.source.includes('[A-Z][a-z]+') ? match[1] : undefined,
          priority: 'medium',
        });
      }
    });

    return items.slice(0, 10); // Limit to 10 items
  }

  /**
   * Fallback decision detection
   */
  private detectDecisionsFallback(text: string): string[] {
    const decisionKeywords = [
      'decided',
      'agreed',
      'approved',
      'confirmed',
      'finalized',
      'resolved',
      'concluded',
      'will proceed',
      'going ahead',
      'approved',
    ];

    const sentences = text.split(/[.!?]+/);
    const decisions: string[] = [];

    sentences.forEach((sentence) => {
      const lowerSentence = sentence.toLowerCase();
      if (decisionKeywords.some((keyword) => lowerSentence.includes(keyword))) {
        decisions.push(sentence.trim());
      }
    });

    return decisions.slice(0, 5); // Limit to 5 decisions
  }

  /**
   * Analyze meeting sentiment from transcript
   */
  async analyzeSentiment(transcript: TranscriptSegment[]): Promise<{
    overall: 'positive' | 'neutral' | 'needs_followup';
    scores: Record<string, number>;
  }> {
    const fullText = transcript.map((s) => s.text).join(' ');

    try {
      const response = await axios.post<{
        sentiment: 'positive' | 'neutral' | 'needs_followup';
        scores: Record<string, number>;
      }>(
        `${this.apiUrl}/api/meetings/sentiment`,
        { text: fullText },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      // Simple fallback based on action items
      const hasActionItems = transcript.some((s) =>
        s.text.toLowerCase().includes('action') ||
        s.text.toLowerCase().includes('todo') ||
        s.text.toLowerCase().includes('follow up')
      );

      return {
        overall: hasActionItems ? 'needs_followup' : 'neutral',
        scores: { positive: 0.3, neutral: 0.5, negative: 0.2 },
      };
    }
  }
}

export const aiNoteService = new AINoteService();
