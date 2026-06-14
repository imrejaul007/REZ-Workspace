import { v4 as uuidv4 } from 'uuid';
import { Visit, IVisit } from '../models/Visit';
import { VisitSummary } from '../models/VisitSummary';
import logger from '../utils/logger';
import { summaryService } from './summaryService';

// Import intelligence hooks (graceful degradation if not initialized)
let intelligenceHooks: any = null;
try {
  // Dynamic import to avoid breaking if intelligence isn't set up yet
  import('../intelligence').then(module => {
    intelligenceHooks = module;
    logger.info('RisaCare intelligence hooks loaded');
  }).catch(() => {
    logger.warn('Intelligence hooks not available');
  });
} catch (e) {
  logger.warn('Could not load intelligence hooks');
}

export interface CreateVisitDto {
  profileId: string;
  date: Date;
  type: 'in-person' | 'telehealth' | 'home-visit' | 'emergency';
  provider: {
    id: string;
    name: string;
    specialty: string;
    facility?: string;
  };
  chiefComplaint: string;
  diagnoses?: Array<{
    code: string;
    description: string;
    isPrimary?: boolean;
  }>;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  instructions?: string[];
  followUps?: Array<{
    scheduledDate: Date;
    reason: string;
    provider?: string;
  }>;
  vitals?: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
  };
  notes?: string;
}

export interface AttachRecordingDto {
  url: string;
  duration: number;
  type: 'audio' | 'video';
  recordedAt: Date;
  transcription?: string;
}

export class VisitService {
  /**
   * Create a new visit record
   */
  async createVisit(dto: CreateVisitDto): Promise<IVisit> {
    try {
      logger.info('Creating new visit', { profileId: dto.profileId, type: dto.type });

      const visitId = uuidv4();

      const visit = new Visit({
        id: visitId,
        ...dto,
        status: 'scheduled',
        summaryGenerated: false,
        actionItemsExtracted: false,
        preparationReady: false
      });

      await visit.save();
      logger.info('Visit created successfully', { visitId });

      // Emit intelligence signal
      if (intelligenceHooks?.onVisitScheduled) {
        intelligenceHooks.onVisitScheduled({
          visitId,
          profileId: dto.profileId,
          type: dto.type,
          providerId: dto.provider.id,
          scheduledDate: dto.date,
          chiefComplaint: dto.chiefComplaint,
        }).catch((e: Error) => logger.warn('Intelligence signal failed', { error: e.message }));
      }

      return visit.toJSON() as IVisit;
    } catch (error) {
      logger.error('Failed to create visit', { error, dto });
      throw error;
    }
  }

  /**
   * Get visit by ID
   */
  async getVisitById(visitId: string): Promise<IVisit | null> {
    try {
      logger.info('Fetching visit', { visitId });
      const visit = await Visit.findOne({ id: visitId });
      return visit ? (visit.toJSON() as IVisit) : null;
    } catch (error) {
      logger.error('Failed to fetch visit', { error, visitId });
      throw error;
    }
  }

  /**
   * Get visits by profile ID with pagination
   */
  async getVisitsByProfile(
    profileId: string,
    options: { limit?: number; offset?: number; status?: string } = {}
  ): Promise<{ visits: IVisit[]; total: number }> {
    try {
      const { limit = 20, offset = 0, status } = options;
      logger.info('Fetching visits for profile', { profileId, limit, offset, status });

      const query: Record<string, unknown> = { profileId };
      if (status) {
        query.status = status;
      }

      const [visits, total] = await Promise.all([
        Visit.find(query)
          .sort({ date: -1 })
          .skip(offset)
          .limit(limit)
          .lean(),
        Visit.countDocuments(query)
      ]);

      return {
        visits: visits as IVisit[],
        total
      };
    } catch (error) {
      logger.error('Failed to fetch visits', { error, profileId });
      throw error;
    }
  }

  /**
   * Update visit status
   */
  async updateVisitStatus(
    visitId: string,
    status: IVisit['status']
  ): Promise<IVisit | null> {
    try {
      logger.info('Updating visit status', { visitId, status });
      const visit = await Visit.findOneAndUpdate(
        { id: visitId },
        { status },
        { new: true }
      );
      return visit ? (visit.toJSON() as IVisit) : null;
    } catch (error) {
      logger.error('Failed to update visit status', { error, visitId });
      throw error;
    }
  }

  /**
   * Attach recording to visit
   */
  async attachRecording(
    visitId: string,
    recording: AttachRecordingDto
  ): Promise<IVisit | null> {
    try {
      logger.info('Attaching recording to visit', { visitId });

      const recordingId = uuidv4();
      const visit = await Visit.findOneAndUpdate(
        { id: visitId },
        {
          recording: {
            id: recordingId,
            ...recording
          }
        },
        { new: true }
      );

      if (!visit) {
        logger.warn('Visit not found for recording attachment', { visitId });
        return null;
      }

      logger.info('Recording attached successfully', { visitId, recordingId });
      return visit.toJSON() as IVisit;
    } catch (error) {
      logger.error('Failed to attach recording', { error, visitId });
      throw error;
    }
  }

  /**
   * Generate AI summary for visit
   */
  async generateSummary(visitId: string): Promise<IVisitSummary | null> {
    try {
      logger.info('Generating summary for visit', { visitId });

      const visit = await Visit.findOne({ id: visitId });
      if (!visit) {
        logger.warn('Visit not found for summary generation', { visitId });
        return null;
      }

      // Check if summary already exists
      const existingSummary = await VisitSummary.findOne({ visitId });
      if (existingSummary) {
        logger.info('Summary already exists, returning existing', { visitId });
        return existingSummary.toJSON() as IVisitSummary;
      }

      // Generate summary using AI service
      const summaryData = await summaryService.generateVisitSummary(visit.toJSON() as IVisit);

      // Create summary record
      const summary = new VisitSummary({
        id: uuidv4(),
        visitId,
        profileId: visit.profileId,
        ...summaryData
      });

      await summary.save();

      // Mark visit as summary generated
      await Visit.findOneAndUpdate(
        { id: visitId },
        { summaryGenerated: true }
      );

      // Update visit status to completed
      await Visit.findOneAndUpdate(
        { id: visitId },
        { status: 'completed' }
      );

      // Emit intelligence signal for completed visit
      if (intelligenceHooks?.onVisitCompleted) {
        intelligenceHooks.onVisitCompleted({
          visitId,
          profileId: visit.profileId,
          type: visit.type,
          providerId: visit.provider.id,
          diagnoses: visit.diagnoses,
          medications: visit.medications,
          completedAt: new Date(),
        }).catch((e: Error) => logger.warn('Intelligence signal failed', { error: e.message }));
      }

      logger.info('Summary generated successfully', { visitId, summaryId: summary.id });
      return summary.toJSON() as IVisitSummary;
    } catch (error) {
      logger.error('Failed to generate summary', { error, visitId });
      throw error;
    }
  }

  /**
   * Extract action items from visit
   */
  async extractActionItems(visitId: string): Promise<IActionItem[]> {
    try {
      logger.info('Extracting action items', { visitId });

      const visit = await Visit.findOne({ id: visitId });
      if (!visit) {
        logger.warn('Visit not found for action items extraction', { visitId });
        return [];
      }

      const actionItems: IActionItem[] = [];

      // Extract medication action items
      for (const med of visit.medications) {
        actionItems.push({
          id: uuidv4(),
          type: 'medication',
          description: `Take ${med.name} ${med.dosage} ${med.frequency} for ${med.duration}`,
          priority: 'high',
          completed: false
        });
      }

      // Extract follow-up action items
      for (const followUp of visit.followUps) {
        actionItems.push({
          id: uuidv4(),
          type: 'follow-up',
          description: followUp.reason,
          priority: 'medium',
          dueDate: followUp.scheduledDate,
          completed: false
        });
      }

      // Add lifestyle instructions as action items
      for (const instruction of visit.instructions) {
        actionItems.push({
          id: uuidv4(),
          type: 'lifestyle',
          description: instruction,
          priority: 'medium',
          completed: false
        });
      }

      // Mark visit as action items extracted
      await Visit.findOneAndUpdate(
        { id: visitId },
        { actionItemsExtracted: true }
      );

      logger.info('Action items extracted', { visitId, count: actionItems.length });
      return actionItems;
    } catch (error) {
      logger.error('Failed to extract action items', { error, visitId });
      throw error;
    }
  }

  /**
   * Prepare visit preparation data for upcoming appointment
   */
  async prepareVisit(visitId: string): Promise<IPreparationData | null> {
    try {
      logger.info('Preparing visit preparation data', { visitId });

      const visit = await Visit.findOne({ id: visitId });
      if (!visit) {
        logger.warn('Visit not found for preparation', { visitId });
        return null;
      }

      // Get previous visits for context
      const previousVisits = await Visit.find({
        profileId: visit.profileId,
        date: { $lt: visit.date },
        status: 'completed'
      })
        .sort({ date: -1 })
        .limit(5)
        .lean();

      const preparation: IPreparationData = {
        visitId: visit.id,
        appointmentDetails: {
          date: visit.date,
          type: visit.type,
          provider: visit.provider,
          chiefComplaint: visit.chiefComplaint
        },
        patientContext: {
          previousVisitCount: previousVisits.length,
          recentDiagnoses: previousVisits.flatMap(v => v.diagnoses).slice(0, 5),
          recentMedications: previousVisits.flatMap(v => v.medications).slice(0, 5)
        },
        checklist: this.generateChecklist(visit, previousVisits as IVisit[]),
        reminders: this.generateReminders(visit)
      };

      // Mark preparation as ready
      await Visit.findOneAndUpdate(
        { id: visitId },
        { preparationReady: true }
      );

      // Emit intelligence signal for vitals recorded
      if (intelligenceHooks?.onVitalsRecorded && visit.vitals) {
        intelligenceHooks.onVitalsRecorded({
          visitId,
          profileId: visit.profileId,
          vitals: visit.vitals,
          recordedAt: new Date(),
        }).catch((e: Error) => logger.warn('Intelligence signal failed', { error: e.message }));
      }

      // Emit intelligence signal for prescriptions created
      if (intelligenceHooks?.onPrescriptionCreated && visit.medications.length > 0) {
        intelligenceHooks.onPrescriptionCreated({
          visitId,
          profileId: visit.profileId,
          providerId: visit.provider.id,
          medications: visit.medications,
          createdAt: new Date(),
        }).catch((e: Error) => logger.warn('Intelligence signal failed', { error: e.message }));
      }

      logger.info('Visit preparation complete', { visitId });
      return preparation;
    } catch (error) {
      logger.error('Failed to prepare visit', { error, visitId });
      throw error;
    }
  }

  private generateChecklist(visit: IVisit, previousVisits: IVisit[]): IChecklistItem[] {
    const items: IChecklistItem[] = [];

    // Previous visit related checks
    if (previousVisits.length > 0) {
      const lastVisit = previousVisits[0];
      items.push({
        id: uuidv4(),
        category: 'history',
        item: 'Review previous visit notes',
        priority: 'high',
        completed: false
      });

      if (lastVisit.followUps.length > 0) {
        items.push({
          id: uuidv4(),
          category: 'follow-up',
          item: 'Follow up on previous recommendations',
          priority: 'high',
          completed: false
        });
      }
    }

    // Medication related checks
    if (visit.medications.length > 0) {
      items.push({
        id: uuidv4(),
        category: 'medication',
        item: 'Review prescribed medications',
        priority: 'high',
        completed: false
      });
    }

    // Vitals preparation
    items.push({
      id: uuidv4(),
      category: 'preparation',
      item: 'Prepare for vitals check',
      priority: 'medium',
      completed: false
    });

    // Questions preparation
    items.push({
      id: uuidv4(),
      category: 'questions',
      item: 'Prepare questions for provider',
      priority: 'medium',
      completed: false
    });

    return items;
  }

  private generateReminders(visit: IVisit): IReminder[] {
    const reminders: IReminder[] = [];

    // Pre-appointment reminder
    reminders.push({
      id: uuidv4(),
      type: 'appointment',
      message: `Upcoming appointment with ${visit.provider.name} (${visit.provider.specialty})`,
      timing: '24h-before',
      sent: false
    });

    // Bring documents reminder
    reminders.push({
      id: uuidv4(),
      type: 'preparation',
      message: 'Bring ID, insurance card, and list of current medications',
      timing: '4h-before',
      sent: false
    });

    // Location/connection reminder
    if (visit.type === 'telehealth') {
      reminders.push({
        id: uuidv4(),
        type: 'connection',
        message: 'Test your internet connection and device camera/microphone',
        timing: '30min-before',
        sent: false
      });
    }

    return reminders;
  }

  /**
   * Update visit details
   */
  async updateVisit(visitId: string, updates: Partial<IVisit>): Promise<IVisit | null> {
    try {
      logger.info('Updating visit', { visitId });
      const visit = await Visit.findOneAndUpdate(
        { id: visitId },
        { $set: updates },
        { new: true }
      );
      return visit ? (visit.toJSON() as IVisit) : null;
    } catch (error) {
      logger.error('Failed to update visit', { error, visitId });
      throw error;
    }
  }

  /**
   * Delete visit (soft delete by changing status)
   */
  async cancelVisit(visitId: string, reason?: string): Promise<IVisit | null> {
    try {
      logger.info('Cancelling visit', { visitId, reason });
      return this.updateVisitStatus(visitId, 'cancelled');
    } catch (error) {
      logger.error('Failed to cancel visit', { error, visitId });
      throw error;
    }
  }
}

export interface IActionItem {
  id: string;
  type: 'medication' | 'lifestyle' | 'follow-up' | 'test' | 'procedure' | 'referral';
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface IPreparationData {
  visitId: string;
  appointmentDetails: {
    date: Date;
    type: string;
    provider: IVisit['provider'];
    chiefComplaint: string;
  };
  patientContext: {
    previousVisitCount: number;
    recentDiagnoses: Array<{ code: string; description: string; isPrimary: boolean }>;
    recentMedications: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
  };
  checklist: IChecklistItem[];
  reminders: IReminder[];
}

export interface IChecklistItem {
  id: string;
  category: string;
  item: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface IReminder {
  id: string;
  type: string;
  message: string;
  timing: string;
  sent: boolean;
}

export interface IVisitSummary {
  id: string;
  visitId: string;
  profileId: string;
  summary: string;
  keyPoints: Array<{
    category: 'diagnosis' | 'treatment' | 'warning' | 'instruction';
    point: string;
    importance: 'critical' | 'important' | 'informational';
  }>;
  actionItems: IActionItem[];
  generatedAt: Date;
  modelVersion: string;
}

export const visitService = new VisitService();
