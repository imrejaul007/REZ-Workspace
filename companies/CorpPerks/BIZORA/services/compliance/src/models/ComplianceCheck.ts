import mongoose, { Document, Schema } from 'mongoose';

// Compliance check types
export type ComplianceType = 'gst' | 'tds' | 'pf' | 'esi' | 'professional_tax' | 'annual' | 'custom';
export type ComplianceStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'flagged';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

// Compliance issue interface
export interface IComplianceIssue {
  code: string;
  description: string;
  severity: SeverityLevel;
  field?: string;
  suggestion?: string;
}

// GST compliance details
export interface IGSTCompliance {
  registrationStatus: boolean;
  gstin?: string;
  turnover: number;
  thresholdExceeded: boolean;
  applicableRate: number;
  inputTaxCredit: number;
  outputTax: number;
  netLiability: number;
  filingStatus: 'filed' | 'pending' | 'overdue' | 'not_required';
  lastFilingDate?: Date;
}

// TDS compliance details
export interface ITDSCompliance {
  panVerified: boolean;
  tan?: string;
  sections: {
    section: string;
    rate: number;
    transactions: number;
    amount: number;
    tdsDeducted: number;
  }[];
  thresholdExceeded: boolean;
  annualFilingDue: Date;
  quarterlyFilingDue: Date[];
}

// PF/ESI compliance details
export interface IPFESICompliance {
  registrationNumber?: string;
  employeeCount: number;
  pfContribution: number;
  esiContribution: number;
  complianceRate: number;
  lastFilingDate?: Date;
  nextDueDate?: Date;
}

// Report interface
export interface IComplianceReport {
  reportId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  totalChecks: number;
  passed: number;
  failed: number;
  issues: IComplianceIssue[];
  recommendations: string[];
}

// Main compliance check interface
export interface IComplianceCheck {
  companyId: string;
  type: ComplianceType;
  status: ComplianceStatus;
  period: {
    start: Date;
    end: Date;
  };

  // Detailed results
  gstCompliance?: IGSTCompliance;
  tdsCompliance?: ITDSCompliance;
  pfesiCompliance?: IPFESICompliance;

  // Overall assessment
  score: number; // 0-100
  issues: IComplianceIssue[];
  warnings: string[];
  recommendations: string[];

  // Metadata
  checkedAt: Date;
  checkedBy: string;
  nextDueDate?: Date;
  report?: IComplianceReport;

  // Versioning
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose document interface
export interface IComplianceCheckDocument extends IComplianceCheck, Document {
  _id: mongoose.Types.ObjectId;
}

// Schema definition
const ComplianceIssueSchema = new Schema<IComplianceIssue>(
  {
    code: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    field: { type: String },
    suggestion: { type: String },
  },
  { _id: false }
);

const GSTComplianceSchema = new Schema<IGSTCompliance>(
  {
    registrationStatus: { type: Boolean, default: false },
    gstin: { type: String },
    turnover: { type: Number, required: true },
    thresholdExceeded: { type: Boolean, default: false },
    applicableRate: { type: Number, default: 0 },
    inputTaxCredit: { type: Number, default: 0 },
    outputTax: { type: Number, default: 0 },
    netLiability: { type: Number, default: 0 },
    filingStatus: {
      type: String,
      enum: ['filed', 'pending', 'overdue', 'not_required'],
      default: 'not_required',
    },
    lastFilingDate: { type: Date },
  },
  { _id: false }
);

const TDSComplianceSchema = new Schema<ITDSCompliance>(
  {
    panVerified: { type: Boolean, default: false },
    tan: { type: String },
    sections: [
      {
        section: { type: String, required: true },
        rate: { type: Number, required: true },
        transactions: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
        tdsDeducted: { type: Number, default: 0 },
      },
    ],
    thresholdExceeded: { type: Boolean, default: false },
    annualFilingDue: { type: Date },
    quarterlyFilingDue: [{ type: Date }],
  },
  { _id: false }
);

const PFESIComplianceSchema = new Schema<IPFESICompliance>(
  {
    registrationNumber: { type: String },
    employeeCount: { type: Number, required: true },
    pfContribution: { type: Number, default: 0 },
    esiContribution: { type: Number, default: 0 },
    complianceRate: { type: Number, default: 100 },
    lastFilingDate: { type: Date },
    nextDueDate: { type: Date },
  },
  { _id: false }
);

const ComplianceCheckSchema = new Schema<IComplianceCheckDocument>(
  {
    companyId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['gst', 'tds', 'pf', 'esi', 'professional_tax', 'annual', 'custom'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed', 'flagged'],
      default: 'pending',
      index: true,
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },

    // Compliance details
    gstCompliance: GSTComplianceSchema,
    tdsCompliance: TDSComplianceSchema,
    pfesiCompliance: PFESIComplianceSchema,

    // Assessment
    score: { type: Number, default: 0, min: 0, max: 100 },
    issues: [ComplianceIssueSchema],
    warnings: [{ type: String }],
    recommendations: [{ type: String }],

    // Metadata
    checkedAt: { type: Date, default: Date.now },
    checkedBy: { type: String, default: 'system' },
    nextDueDate: { type: Date },

    // Versioning
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    versionKey: 'version',
  }
);

// Indexes for efficient querying
ComplianceCheckSchema.index({ companyId: 1, type: 1 });
ComplianceCheckSchema.index({ companyId: 1, status: 1 });
ComplianceCheckSchema.index({ period: 1 });
ComplianceCheckSchema.index({ score: 1 });
ComplianceCheckSchema.index({ nextDueDate: 1 });

// Compound index for common queries
ComplianceCheckSchema.index({ companyId: 1, type: 1, 'period.start': 1, 'period.end': 1 });

// Pre-save middleware to update timestamp
ComplianceCheckSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to calculate score
ComplianceCheckSchema.methods.calculateScore = function (): number {
  if (this.issues.length === 0) return 100;

  const weights = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
  };

  let deduction = 0;
  this.issues.forEach((issue) => {
    deduction += weights[issue.severity] || 0;
  });

  return Math.max(0, 100 - deduction);
};

// Static method to find latest check for a company
ComplianceCheckSchema.statics.findLatest = function (
  companyId: string,
  type: ComplianceType
): Promise<IComplianceCheckDocument | null> {
  return this.findOne({ companyId, type })
    .sort({ checkedAt: -1 })
    .exec();
};

// Static method to get overdue checks
ComplianceCheckSchema.statics.findOverdue = function (): Promise<IComplianceCheckDocument[]> {
  return this.find({
    nextDueDate: { $lt: new Date() },
    status: { $ne: 'completed' },
  }).exec();
};

// Export model
export const ComplianceCheck = mongoose.model<IComplianceCheckDocument>(
  'ComplianceCheck',
  ComplianceCheckSchema
);

export default ComplianceCheck;