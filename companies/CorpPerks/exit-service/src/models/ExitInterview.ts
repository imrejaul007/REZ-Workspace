import mongoose, { Document, Schema } from 'mongoose';

// Exit interview response
export interface IExitResponse {
  questionId: string;
  question: string;
  answer: string;
  rating?: number; // 1-5 for rating questions
}

// Exit interview document
export interface IExitInterview extends Document {
  interviewId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department?: string;
  role?: string;
  managerId?: string;
  managerName?: string;
  type: 'resignation' | 'termination' | 'retirement' | 'contract_end';
  resignationDate?: Date;
  lastWorkingDay?: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  status: 'scheduled' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  responses: IExitResponse[];
  overallRating?: number; // 1-5
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Exit feedback from employee
export interface IExitFeedback extends Document {
  feedbackId: string;
  interviewId: string;
  employeeId: string;
  category: 'work_environment' | 'management' | 'compensation' | 'growth' | 'work_life_balance' | 'culture' | 'other';
  feedbackType: 'reason' | 'comment' | 'suggestion' | 'compliment';
  content: string;
  isAnonymous: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
  updatedAt: Date;
}

const ExitResponseSchema = new Schema<IExitResponse>({
  questionId: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 }
}, { _id: false });

const ExitInterviewSchema = new Schema<IExitInterview>({
  interviewId: { type: String, required: true, unique: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  department: { type: String, index: true },
  role: { type: String },
  managerId: { type: String },
  managerName: { type: String },
  type: {
    type: String,
    enum: ['resignation', 'termination', 'retirement', 'contract_end'],
    required: true
  },
  resignationDate: { type: Date },
  lastWorkingDay: { type: Date, index: true },
  scheduledDate: { type: Date },
  completedDate: { type: Date },
  status: {
    type: String,
    enum: ['scheduled', 'pending', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  responses: [ExitResponseSchema],
  overallRating: { type: Number, min: 1, max: 5 },
  isAnonymous: { type: Boolean, default: false },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

// Indexes
ExitInterviewSchema.index({ employeeId: 1, status: 1 });
ExitInterviewSchema.index({ managerId: 1 });
ExitInterviewSchema.index({ lastWorkingDay: -1 });
ExitInterviewSchema.index({ type: 1, status: 1 });

export const ExitInterview = mongoose.model<IExitInterview>('ExitInterview', ExitInterviewSchema);
