import { Enrollment, IEnrollment, Sequence, StepInstance } from '../models';
import { createChildLogger } from 'utils/logger.js';
import { enrollmentsTotal, activeEnrollmentsGauge } from '../utils/metrics';

const logger = createChildLogger('EnrollmentService');

export interface EnrollContactInput {
  sequenceId: string;
  userId: string;
  contactId: string;
  contactEmail?: string;
  contactName?: string;
  metadata?: Record<string, unknown>;
}

export class EnrollmentService {
  async enroll(input: EnrollContactInput): Promise<IEnrollment> {
    logger.info('Enrolling contact in sequence', {
      sequenceId: input.sequenceId,
      contactId: input.contactId
    });

    const sequence = await Sequence.findById(input.sequenceId);
    if (!sequence) throw new Error('Sequence not found');

    if (sequence.status !== 'active') {
      throw new Error('Sequence is not active');
    }

    // Check enrollment cap
    if (sequence.settings.enrollmentCap && sequence.stats.activeEnrollments >= sequence.settings.enrollmentCap) {
      throw new Error('Enrollment cap reached');
    }

    // Check for existing enrollment
    const existing = await Enrollment.findOne({
      sequenceId: input.sequenceId,
      contactId: input.contactId,
      status: { $in: ['active', 'paused'] }
    });

    if (existing) {
      if (!sequence.settings.allowReEnrollment) {
        throw new Error('Re-enrollment not allowed');
      }
      // Update existing enrollment
      existing.status = 'active';
      existing.currentStep = 0;
      existing.enrolledAt = new Date();
      existing.resumedAt = new Date();
      await existing.save();

      // Create step instances
      await this.createStepInstances(existing._id.toString(), sequence.steps);

      return existing;
    }

    // Create new enrollment
    const enrollment = new Enrollment({
      sequenceId: input.sequenceId,
      userId: input.userId,
      contactId: input.contactId,
      contactEmail: input.contactEmail,
      contactName: input.contactName,
      status: 'active',
      currentStep: 0,
      enrolledAt: new Date(),
      startedAt: new Date(),
      progress: {
        completedSteps: 0,
        totalSteps: sequence.steps.length,
        percentComplete: 0
      },
      stepHistory: [],
      metadata: input.metadata
    });

    await enrollment.save();
    enrollmentsTotal.inc({ status: 'active' });
    activeEnrollmentsGauge.inc();

    // Create step instances
    await this.createStepInstances(enrollment._id.toString(), sequence.steps);

    // Update sequence stats
    await Sequence.findByIdAndUpdate(input.sequenceId, {
      'stats.totalEnrollments': sequence.stats.totalEnrollments + 1,
      'stats.activeEnrollments': sequence.stats.activeEnrollments + 1
    });

    logger.info('Contact enrolled', { enrollmentId: enrollment._id });
    return enrollment;
  }

  async createStepInstances(enrollmentId: string, steps: { order: number; type: string; name: string; config: Record<string, unknown>; isActive: boolean }[]): Promise<void> {
    for (const step of steps) {
      if (!step.isActive) continue;

      const stepInstance = new StepInstance({
        enrollmentId,
        sequenceId: steps[0] ? steps[0].order : undefined, // Will be set from enrollment
        stepOrder: step.order,
        stepType: step.type as 'email' | 'notification' | 'sms' | 'delay' | 'condition' | 'webhook' | 'task',
        stepName: step.name,
        status: 'pending'
      });

      await stepInstance.save();
    }
  }

  async pause(enrollmentId: string): Promise<IEnrollment | null> {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return null;

    const updated = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        status: 'paused',
        pausedAt: new Date()
      },
      { new: true }
    );

    if (updated) {
      activeEnrollmentsGauge.dec();
    }

    return updated;
  }

  async resume(enrollmentId: string): Promise<IEnrollment | null> {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.status !== 'paused') return null;

    const updated = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        status: 'active',
        resumedAt: new Date(),
        lastActivityAt: new Date()
      },
      { new: true }
    );

    if (updated) {
      activeEnrollmentsGauge.inc();
    }

    return updated;
  }

  async complete(enrollmentId: string): Promise<IEnrollment | null> {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return null;

    const sequence = await Sequence.findById(enrollment.sequenceId);
    const completedAt = new Date();

    const updated = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        status: 'completed',
        completedAt,
        lastActivityAt: completedAt
      },
      { new: true }
    );

    if (updated && sequence) {
      activeEnrollmentsGauge.dec();
      enrollmentsTotal.inc({ status: 'completed' });

      // Update sequence stats
      await Sequence.findByIdAndUpdate(enrollment.sequenceId, {
        'stats.activeEnrollments': Math.max(0, sequence.stats.activeEnrollments - 1),
        'stats.completedEnrollments': sequence.stats.completedEnrollments + 1
      });
    }

    return updated;
  }

  async drop(enrollmentId: string, reason?: string): Promise<IEnrollment | null> {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return null;

    const sequence = await Sequence.findById(enrollment.sequenceId);

    const updated = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        status: 'dropped',
        completedAt: new Date(),
        lastActivityAt: new Date(),
        metadata: { ...enrollment.metadata, dropReason: reason }
      },
      { new: true }
    );

    if (updated && sequence) {
      activeEnrollmentsGauge.dec();
      enrollmentsTotal.inc({ status: 'dropped' });

      // Update sequence stats
      await Sequence.findByIdAndUpdate(enrollment.sequenceId, {
        'stats.activeEnrollments': Math.max(0, sequence.stats.activeEnrollments - 1),
        'stats.droppedEnrollments': sequence.stats.droppedEnrollments + 1
      });
    }

    return updated;
  }

  async findById(id: string): Promise<IEnrollment | null> {
    return Enrollment.findById(id).populate('sequenceId');
  }

  async findBySequence(sequenceId: string, options?: { status?: string; limit?: number }): Promise<IEnrollment[]> {
    const query: Record<string, unknown> = { sequenceId };
    if (options?.status) query.status = options.status;

    return Enrollment.find(query)
      .sort({ enrolledAt: -1 })
      .limit(options?.limit || 50);
  }

  async findByUser(userId: string, options?: { status?: string; limit?: number }): Promise<IEnrollment[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.status) query.status = options.status;

    return Enrollment.find(query)
      .populate('sequenceId')
      .sort({ enrolledAt: -1 })
      .limit(options?.limit || 50);
  }

  async advanceStep(enrollmentId: string): Promise<IEnrollment | null> {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return null;

    const sequence = await Sequence.findById(enrollment.sequenceId);
    if (!sequence) return null;

    const nextStep = enrollment.currentStep + 1;
    const isComplete = nextStep >= sequence.steps.length;

    const updateData: Record<string, unknown> = {
      currentStep: nextStep,
      lastActivityAt: new Date()
    };

    if (isComplete) {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    }

    const progress = {
      completedSteps: isComplete ? sequence.steps.length : nextStep,
      totalSteps: sequence.steps.length,
      percentComplete: (isComplete ? sequence.steps.length : nextStep) / sequence.steps.length * 100
    };

    const updated = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      { ...updateData, progress },
      { new: true }
    );

    if (updated && isComplete) {
      activeEnrollmentsGauge.dec();
      enrollmentsTotal.inc({ status: 'completed' });

      if (sequence) {
        await Sequence.findByIdAndUpdate(enrollment.sequenceId, {
          'stats.activeEnrollments': Math.max(0, sequence.stats.activeEnrollments - 1),
          'stats.completedEnrollments': sequence.stats.completedEnrollments + 1
        });
      }
    }

    return updated;
  }
}

export const enrollmentService = new EnrollmentService();