import mongoose, { Schema, model, Types } from 'mongoose';
import { randomInt } from 'crypto';

interface ABTest {
  _id: Types.ObjectId;
  name: string;
  variants: {
    id: string;
    name: string;
    weight: number;
    content;
  }[];
  metric: 'click' | 'conversion' | 'revenue' | 'open_rate';
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ABEvent {
  _id: Types.ObjectId;
  testId: Types.ObjectId;
  variantId: string;
  userId?: string;
  event: string;
  value?: number;
  timestamp: Date;
}

interface VariantAssignment {
  _id: Types.ObjectId;
  testId: Types.ObjectId;
  userId: string;
  variantId: string;
  assignedAt: Date;
}

const ABTestSchema = new Schema<ABTest>({
  name: { type: String, required: true },
  variants: [{
    id: String,
    name: String,
    weight: Number,
    content: Schema.Types.Mixed
  }],
  metric: { type: String, enum: ['click', 'conversion', 'revenue', 'open_rate'] },
  status: { type: String, enum: ['draft', 'running', 'paused', 'completed'], default: 'draft' },
  startDate: Date,
  endDate: Date
}, { timestamps: true });

const ABEventSchema = new Schema<ABEvent>({
  testId: { type: Schema.Types.ObjectId, required: true },
  variantId: { type: String, required: true },
  userId: String,
  event: { type: String, required: true },
  value: Number,
  timestamp: { type: Date, default: Date.now }
});

const VariantAssignmentSchema = new Schema<VariantAssignment>({
  testId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: String, required: true },
  variantId: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now }
});

VariantAssignmentSchema.index({ testId: 1, userId: 1 }, { unique: true });
ABEventSchema.index({ testId: 1, variantId: 1 });

export const ABTestModel = mongoose.models.ABTest || model<ABTest>('ABTest', ABTestSchema);
export const ABEventModel = mongoose.models.ABEvent || model<ABEvent>('ABEvent', ABEventSchema);
export const VariantAssignmentModel = mongoose.models.VariantAssignment || model<VariantAssignment>('VariantAssignment', VariantAssignmentSchema);

export class ABTestingService {
  async createTest(test: Partial<ABTest>): Promise<string> {
    const result = await ABTestModel.create(test);
    return result._id.toString();
  }

  async getVariant(testId: string, userId: string): Promise<string | null> {
    const test = await ABTestModel.findById(testId);
    if (!test || test.status !== 'running') return null;

    // Check existing assignment
    const existing = await VariantAssignmentModel.findOne({ testId, userId });
    if (existing) return existing.variantId;

    // Assign new variant based on weights
    const random = randomInt(0, 101);
    let cumulative = 0;
    let selectedVariant = test.variants[0];

    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        selectedVariant = variant;
        break;
      }
    }

    await VariantAssignmentModel.create({
      testId: new Types.ObjectId(testId),
      userId,
      variantId: selectedVariant.id
    });

    return selectedVariant.id;
  }

  async trackEvent(
    testId: string,
    userId: string,
    event: string,
    value?: number
  ): Promise<void> {
    const assignment = await VariantAssignmentModel.findOne({ testId, userId });
    if (!assignment) return;

    await ABEventModel.create({
      testId: new Types.ObjectId(testId),
      variantId: assignment.variantId,
      userId,
      event,
      value
    });
  }

  async getResults(testId: string): Promise<unknown> {
    const events = await ABEventModel.aggregate([
      { $match: { testId: new Types.ObjectId(testId) } },
      { $group: {
        _id: '$variantId',
        totalEvents: { $sum: 1 },
        conversions: {
          $sum: { $cond: [{ $eq: ['$event', 'conversion'] }, 1, 0] }
        },
        revenue: { $sum: { $ifNull: ['$value', 0] } }
      }}
    ]);

    const totalUsers = await VariantAssignmentModel.countDocuments({ testId });

    return {
      variants: events,
      totalUsers,
      confidence: this.calculateConfidence(events)
    };
  }

  private calculateConfidence(events: unknown[]): number {
    if (events.length < 2) return 0;

    const totals = events.map(e => e.conversions);
    const max = Math.max(...totals);
    const min = Math.min(...totals);

    if (max === 0) return 0;
    return Math.min(100, ((max - min) / max) * 100);
  }
}

export const abTestingService = new ABTestingService();
