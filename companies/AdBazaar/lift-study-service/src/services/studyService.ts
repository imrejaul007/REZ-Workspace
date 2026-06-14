import { LiftStudy, ILiftStudy } from '../models';
import { CreateLiftStudyInput, UpdateLiftStudyInput } from '../utils/validation';
import { logger } from '../utils/logger';
import { studiesCreatedTotal, activeStudiesGauge } from '../utils/metrics';
import mongoose from 'mongoose';

export interface StudyFilters {
  status?: string;
  type?: string;
  campaignId?: string;
  platform?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  page?: number;
  limit?: number;
}

export class StudyService {
  async createStudy(input: CreateLiftStudyInput, createdBy: string): Promise<ILiftStudy> {
    logger.info('Creating new lift study', { name: input.name, type: input.type });

    const study = new LiftStudy({
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      status: 'draft',
      tags: input.tags || [],
      metadata: input.metadata || {},
      createdBy
    });

    await study.save();

    studiesCreatedTotal.inc({ type: input.type });
    logger.info('Lift study created successfully', { studyId: study._id });

    return study;
  }

  async getStudy(studyId: string): Promise<ILiftStudy | null> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const study = await LiftStudy.findById(studyId);
    if (!study) {
      logger.warn('Study not found', { studyId });
      return null;
    }

    return study;
  }

  async listStudies(filters: StudyFilters): Promise<{ studies: ILiftStudy[]; total: number }> {
    const query: Record<string, any> = {};

    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.platform) query.platform = filters.platform;
    if (filters.campaignId) query.campaignIds = filters.campaignId;
    if (filters.tags?.length) query.tags = { $in: filters.tags };

    if (filters.startDate || filters.endDate) {
      query.startDate = {};
      if (filters.startDate) query.startDate.$gte = filters.startDate;
      if (filters.endDate) query.startDate.$lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [studies, total] = await Promise.all([
      LiftStudy.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LiftStudy.countDocuments(query)
    ]);

    return { studies: studies as ILiftStudy[], total };
  }

  async updateStudy(studyId: string, input: UpdateLiftStudyInput): Promise<ILiftStudy | null> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const study = await LiftStudy.findById(studyId);
    if (!study) {
      logger.warn('Study not found for update', { studyId });
      return null;
    }

    if (study.status === 'completed' || study.status === 'cancelled') {
      throw new Error(`Cannot update study in ${study.status} status`);
    }

    const updateData: Record<string, any> = { ...input };
    if (input.startDate) updateData.startDate = new Date(input.startDate);
    if (input.endDate) updateData.endDate = new Date(input.endDate);

    const updatedStudy = await LiftStudy.findByIdAndUpdate(
      studyId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    logger.info('Study updated successfully', { studyId });
    return updatedStudy;
  }

  async startStudy(studyId: string, startDate?: string, endDate?: string): Promise<ILiftStudy | null> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const study = await LiftStudy.findById(studyId);
    if (!study) {
      logger.warn('Study not found for start', { studyId });
      return null;
    }

    if (study.status !== 'draft' && study.status !== 'paused') {
      throw new Error(`Cannot start study in ${study.status} status`);
    }

    const updatedStudy = await LiftStudy.findByIdAndUpdate(
      studyId,
      {
        $set: {
          status: 'active',
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : study.endDate
        }
      },
      { new: true, runValidators: true }
    );

    activeStudiesGauge.inc({ type: study.type });
    logger.info('Study started successfully', { studyId, startDate: updatedStudy?.startDate });

    return updatedStudy;
  }

  async pauseStudy(studyId: string): Promise<ILiftStudy | null> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const study = await LiftStudy.findById(studyId);
    if (!study) {
      return null;
    }

    if (study.status !== 'active') {
      throw new Error('Can only pause active studies');
    }

    const updatedStudy = await LiftStudy.findByIdAndUpdate(
      studyId,
      { $set: { status: 'paused' } },
      { new: true }
    );

    activeStudiesGauge.dec({ type: study.type });
    logger.info('Study paused', { studyId });

    return updatedStudy;
  }

  async completeStudy(studyId: string): Promise<ILiftStudy | null> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const study = await LiftStudy.findById(studyId);
    if (!study) {
      return null;
    }

    if (study.status !== 'active' && study.status !== 'paused') {
      throw new Error('Can only complete active or paused studies');
    }

    const updatedStudy = await LiftStudy.findByIdAndUpdate(
      studyId,
      {
        $set: {
          status: 'completed',
          endDate: new Date()
        }
      },
      { new: true }
    );

    activeStudiesGauge.dec({ type: study.type });
    logger.info('Study completed', { studyId });

    return updatedStudy;
  }

  async deleteStudy(studyId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      throw new Error('Invalid study ID format');
    }

    const study = await LiftStudy.findById(studyId);
    if (!study) {
      return false;
    }

    if (study.status === 'active') {
      activeStudiesGauge.dec({ type: study.type });
    }

    await LiftStudy.findByIdAndDelete(studyId);
    logger.info('Study deleted', { studyId });

    return true;
  }

  async getStudyStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    activeCount: number;
  }> {
    const [total, byStatus, byType, activeCount] = await Promise.all([
      LiftStudy.countDocuments(),
      LiftStudy.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      LiftStudy.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      LiftStudy.countDocuments({ status: 'active' })
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((s: any) => { statusMap[s._id] = s.count; });

    const typeMap: Record<string, number> = {};
    byType.forEach((t: any) => { typeMap[t._id] = t.count; });

    return { total, byStatus: statusMap, byType: typeMap, activeCount };
  }
}

export const studyService = new StudyService();