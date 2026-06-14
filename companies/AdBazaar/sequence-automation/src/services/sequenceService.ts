import { Sequence, ISequence, IStep } from '../models';
import { createChildLogger } from 'utils/logger.js';
import { sequencesCreatedTotal, activeSequencesGauge } from '../utils/metrics';

const logger = createChildLogger('SequenceService');

export interface CreateSequenceInput {
  userId: string;
  name: string;
  description?: string;
  steps: IStep[];
  entryCriteria?: { field: string; operator: string; value: unknown }[];
  exitCriteria?: { field: string; operator: string; value: unknown }[];
  settings?: {
    enrollmentCap?: number;
    allowReEnrollment?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    goalTracking?: boolean;
  };
}

export class SequenceService {
  async create(input: CreateSequenceInput): Promise<ISequence> {
    logger.info('Creating sequence', { userId: input.userId, name: input.name });

    const sequence = new Sequence({
      userId: input.userId,
      name: input.name,
      description: input.description,
      steps: input.steps,
      entryCriteria: input.entryCriteria,
      exitCriteria: input.exitCriteria,
      settings: {
        allowReEnrollment: input.settings?.allowReEnrollment ?? true,
        trackOpens: input.settings?.trackOpens ?? true,
        trackClicks: input.settings?.trackClicks ?? true,
        goalTracking: input.settings?.goalTracking ?? false,
        enrollmentCap: input.settings?.enrollmentCap
      },
      status: 'draft',
      isTemplate: false
    });

    await sequence.save();
    sequencesCreatedTotal.inc();

    logger.info('Sequence created', { sequenceId: sequence._id });
    return sequence;
  }

  async findById(id: string): Promise<ISequence | null> {
    return Sequence.findById(id);
  }

  async findByUser(userId: string, options?: { status?: string; isTemplate?: boolean }): Promise<ISequence[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.status) query.status = options.status;
    if (options?.isTemplate !== undefined) query.isTemplate = options.isTemplate;

    return Sequence.find(query).sort({ createdAt: -1 });
  }

  async update(id: string, input: Partial<CreateSequenceInput>): Promise<ISequence | null> {
    return Sequence.findByIdAndUpdate(id, input, { new: true });
  }

  async updateStatus(id: string, status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'): Promise<ISequence | null> {
    const sequence = await Sequence.findById(id);
    if (!sequence) return null;

    const wasActive = sequence.status === 'active';
    const willBeActive = status === 'active';

    const updated = await Sequence.findByIdAndUpdate(id, { status }, { new: true });

    if (updated) {
      if (wasActive && !willBeActive) {
        activeSequencesGauge.dec();
      } else if (!wasActive && willBeActive) {
        activeSequencesGauge.inc();
      }
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const sequence = await Sequence.findById(id);
    if (sequence && sequence.status === 'active') {
      activeSequencesGauge.dec();
    }
    const result = await Sequence.findByIdAndDelete(id);
    return !!result;
  }

  async addStep(id: string, step: IStep): Promise<ISequence | null> {
    const sequence = await Sequence.findById(id);
    if (!sequence) return null;

    sequence.steps.push(step);
    sequence.steps.sort((a, b) => a.order - b.order);

    return Sequence.findByIdAndUpdate(id, { steps: sequence.steps }, { new: true });
  }

  async removeStep(id: string, stepOrder: number): Promise<ISequence | null> {
    const sequence = await Sequence.findById(id);
    if (!sequence) return null;

    sequence.steps = sequence.steps.filter(s => s.order !== stepOrder);
    // Reorder remaining steps
    sequence.steps.forEach((s, i) => {
      s.order = i;
    });

    return Sequence.findByIdAndUpdate(id, { steps: sequence.steps }, { new: true });
  }

  async updateStats(id: string, stats: Partial<ISequence['stats']>): Promise<ISequence | null> {
    return Sequence.findByIdAndUpdate(id, { stats }, { new: true });
  }

  async getSequenceStats(userId: string): Promise<{
    total: number;
    active: number;
    paused: number;
    draft: number;
    totalEnrollments: number;
  }> {
    const sequences = await Sequence.find({ userId });
    return {
      total: sequences.length,
      active: sequences.filter(s => s.status === 'active').length,
      paused: sequences.filter(s => s.status === 'paused').length,
      draft: sequences.filter(s => s.status === 'draft').length,
      totalEnrollments: sequences.reduce((sum, s) => sum + s.stats.totalEnrollments, 0)
    };
  }

  async duplicateSequence(id: string, userId: string): Promise<ISequence> {
    const original = await Sequence.findById(id);
    if (!original) throw new Error('Sequence not found');

    const duplicate = new Sequence({
      userId,
      name: `${original.name} (Copy)`,
      description: original.description,
      steps: original.steps,
      entryCriteria: original.entryCriteria,
      exitCriteria: original.exitCriteria,
      settings: original.settings,
      status: 'draft',
      isTemplate: false
    });

    await duplicate.save();
    return duplicate;
  }
}

export const sequenceService = new SequenceService();