import { Types } from 'mongoose';

// Salary Band Model
export interface ISalaryBand {
  _id: Types.ObjectId;
  name: string;
  minSalary: number;
  maxSalary: number;
  level: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

// Compensation Package Model
export interface ICompensationPackage {
  _id: Types.ObjectId;
  employeeId: string;
  bandId: Types.ObjectId;
  salary: number;
  equity: {
    shares: number;
    vestingPeriodMonths: number;
    strikePrice: number;
  };
  benefits: {
    healthInsurance: number;
    retirement: number;
    allowances: Record<string, number>;
    otherBenefits: Record<string, number>;
  };
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Increment Plan Model
export interface IIncrementPlan {
  _id: Types.ObjectId;
  name: string;
  fiscalYear: string;
  percentage: number;
  criteria: {
    minPerformanceRating: number;
    maxPerformanceRating: number;
    eligibilityType: 'all' | 'performance_based' | 'tenure_based';
    minTenureMonths?: number;
  };
  status: 'draft' | 'planned' | 'approved' | 'rejected';
  plannedDate: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Increment Request Model
export interface IIncrementRequest {
  _id: Types.ObjectId;
  employeeId: string;
  planId: Types.ObjectId;
  currentSalary: number;
  proposedSalary: number;
  percentage: number;
  effectiveDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Promotion Model
export interface IPromotion {
  _id: Types.ObjectId;
  employeeId: string;
  oldBandId: Types.ObjectId;
  newBandId: Types.ObjectId;
  oldSalary: number;
  newSalary: number;
  effectiveDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  approvedBy?: string;
  approvedAt?: Date;
  processedBy?: string;
  processedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bonus Plan Model
export interface IBonusPlan {
  _id: Types.ObjectId;
  name: string;
  type: 'annual' | 'quarterly' | 'performance' | 'signing' | 'retention';
  criteria: {
    minPerformanceRating?: number;
    eligibilityType: 'all' | 'performance_based' | 'tiered';
    tiers?: Array<{
      minRating: number;
      maxRating: number;
      percentage: number;
    }>;
    minTenureMonths?: number;
  };
  payoutDate: Date;
  budget?: number;
  status: 'active' | 'inactive' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Bonus Eligibility Model
export interface IBonusEligibility {
  _id: Types.ObjectId;
  employeeId: string;
  planId: Types.ObjectId;
  calculatedAmount: number;
  status: 'eligible' | 'pending' | 'paid' | 'not_eligible';
  paidAt?: Date;
  paidBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
