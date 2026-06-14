import { FitnessClass, IClass, ClassStatus, ClassType } from '../models/Class';
import mongoose from 'mongoose';
import { z } from 'zod';

const CreateClassSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  classType: z.enum(['yoga', 'pilates', 'hiit', 'spinning', 'strength', 'crossfit', 'zumba', 'boxing', 'swimming', 'personal', 'other']),
  trainerId: z.string(),
  duration: z.number().min(15),
  maxCapacity: z.number().min(1),
  startTime: z.string(),
  room: z.string(),
  equipment: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).default('all_levels'),
  price: z.number().min(0).default(0),
  prerequisites: z.array(z.string()).optional()
});

export class ClassService {
  async createClass(data: z.infer<typeof CreateClassSchema>): Promise<IClass> {
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + data.duration * 60 * 1000);

    const fitnessClass = new FitnessClass({
      ...data,
      startTime,
      endTime,
      currentEnrollment: 0,
      status: ClassStatus.SCHEDULED
    });

    return fitnessClass.save();
  }

  async getClassById(id: string): Promise<IClass | null> {
    return FitnessClass.findById(id).populate('trainerId');
  }

  async getClasses(options: {
    page?: number;
    limit?: number;
    trainerId?: string;
    classType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{ classes: IClass[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, trainerId, classType, status, startDate, endDate } = options;
    const query: unknown = {};

    if (trainerId) {
      query.trainerId = trainerId;
    }

    if (classType) {
      query.classType = classType;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }

    const total = await FitnessClass.countDocuments(query);
    const classes = await FitnessClass.find(query)
      .populate('trainerId')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ startTime: 1 });

    return {
      classes,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateClass(id: string, data: Partial<z.infer<typeof CreateClassSchema>>): Promise<IClass | null> {
    const updateData: unknown = { ...data };

    if (data.startTime && data.duration) {
      const start = new Date(data.startTime);
      updateData.startTime = start;
      updateData.endTime = new Date(start.getTime() + data.duration * 60 * 1000);
    }

    return FitnessClass.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('trainerId');
  }

  async cancelClass(id: string): Promise<IClass | null> {
    return FitnessClass.findByIdAndUpdate(
      id,
      { $set: { status: ClassStatus.CANCELLED } },
      { new: true }
    );
  }

  async enrollMember(classId: string): Promise<IClass | null> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fitnessClass = await FitnessClass.findById(classId).session(session);

      if (!fitnessClass) {
        throw new Error('Class not found');
      }

      if (fitnessClass.currentEnrollment >= fitnessClass.maxCapacity) {
        throw new Error('Class is at full capacity');
      }

      if (fitnessClass.status !== ClassStatus.SCHEDULED) {
        throw new Error('Cannot enroll in a class that is not scheduled');
      }

      fitnessClass.currentEnrollment += 1;
      await fitnessClass.save({ session });

      await session.commitTransaction();
      return fitnessClass;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async unenrollMember(classId: string): Promise<IClass | null> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fitnessClass = await FitnessClass.findById(classId).session(session);

      if (!fitnessClass) {
        throw new Error('Class not found');
      }

      if (fitnessClass.currentEnrollment > 0) {
        fitnessClass.currentEnrollment -= 1;
        await fitnessClass.save({ session });
      }

      await session.commitTransaction();
      return fitnessClass;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async startClass(id: string): Promise<IClass | null> {
    return FitnessClass.findByIdAndUpdate(
      id,
      { $set: { status: ClassStatus.IN_PROGRESS } },
      { new: true }
    );
  }

  async completeClass(id: string): Promise<IClass | null> {
    return FitnessClass.findByIdAndUpdate(
      id,
      { $set: { status: ClassStatus.COMPLETED } },
      { new: true }
    );
  }

  async getClassesByTrainer(trainerId: string, options: { startDate?: string; endDate?: string } = {}): Promise<IClass[]> {
    const query: unknown = { trainerId };

    if (options.startDate || options.endDate) {
      query.startTime = {};
      if (options.startDate) {
        query.startTime.$gte = new Date(options.startDate);
      }
      if (options.endDate) {
        query.startTime.$lte = new Date(options.endDate);
      }
    }

    return FitnessClass.find(query).sort({ startTime: 1 });
  }

  async getUpcomingClasses(options: { limit?: number; classType?: string } = {}): Promise<IClass[]> {
    const query: unknown = {
      startTime: { $gte: new Date() },
      status: ClassStatus.SCHEDULED
    };

    if (options.classType) {
      query.classType = options.classType;
    }

    return FitnessClass.find(query)
      .populate('trainerId')
      .sort({ startTime: 1 })
      .limit(options.limit || 10);
  }
}

export const classService = new ClassService();
