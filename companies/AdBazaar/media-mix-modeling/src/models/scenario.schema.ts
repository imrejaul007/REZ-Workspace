import mongoose, { Document, Schema } from 'mongoose';

export interface IScenarioConstraints {
  minSpendPerChannel?: number;
  maxSpendPerChannel?: number;
  maintainMix?: boolean;
}

export interface IScenario {
  scenarioId: string;
  name: string;
  totalBudget: number;
  allocation: Record<string, number>;
  projected: {
    revenue: number;
    roas: number;
    conversions: number;
    incrementalRevenue: number;
  };
  constraints?: IScenarioConstraints;
  status: 'DRAFT' | 'SIMULATED' | 'APPLIED';
  comparison?: {
    vsBaseline: Record<string, number>;
    vsCurrent: Record<string, number>;
  };
}

export interface IScenarioDocument extends IScenario, Document {
  modelId: mongoose.Types.ObjectId;
}

const ScenarioSchema = new Schema<IScenarioDocument>(
  {
    scenarioId: { type: String, required: true },
    name: { type: String, required: true, maxlength: 100 },
    modelId: { type: Schema.Types.ObjectId, ref: 'MMMModel', required: true },
    totalBudget: { type: Number, required: true, min: 0 },
    allocation: { type: Map, of: Number, required: true },
    projected: {
      revenue: { type: Number, required: true },
      roas: { type: Number, required: true },
      conversions: { type: Number, required: true },
      incrementalRevenue: { type: Number, required: true }
    },
    constraints: {
      minSpendPerChannel: Number,
      maxSpendPerChannel: Number,
      maintainMix: Boolean
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SIMULATED', 'APPLIED'],
      default: 'DRAFT'
    },
    comparison: {
      vsBaseline: { type: Map, of: Number },
      vsCurrent: { type: Map, of: Number }
    }
  },
  { timestamps: true }
);

ScenarioSchema.index({ modelId: 1 });
ScenarioSchema.index({ scenarioId: 1 });

export const Scenario = mongoose.model<IScenarioDocument>('Scenario', ScenarioSchema);