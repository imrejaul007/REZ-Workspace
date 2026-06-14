/**
 * REZ Atlas v2 - Research Agent MongoDB Models
 * Deep Research on Merchants & Companies
 */

import mongoose, { Schema, Document } from 'mongoose';

// ================================================
// ResearchReport Schema
// ================================================
export interface IWebsiteAnalysis {
  score: number;
  issues: string[];
  recommendations: string[];
  technologies: string[];
  hosting: string;
  ssl: boolean;
}

export interface IReviewAnalysis {
  overallRating: number;
  totalReviews: number;
  positiveRatio: number;
  commonPraise: string[];
  commonComplaints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  responseRate: number;
  avgResponseTime: string;
}

export interface ISocialMedia {
  linkedin: { exists: boolean; followers: number; engagement: number };
  twitter: { exists: boolean; followers: number; tweets: number };
  instagram: { exists: boolean; followers: number; posts: number };
  facebook: { exists: boolean; likes: number };
}

export interface ICompetitorAnalysis {
  competitors: Array<{ name: string; rating: number; reviews: number; distance: string }>;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
}

export interface IHiringSignals {
  activeJobPostings: number;
  growthRate: string;
  newRoles: string[];
  lastHiring: string;
  expansion: boolean;
}

export interface IFinancialSignals {
  revenueEstimate: string;
  funding: string | null;
  growthRate: string;
  profitability: string;
}

export interface IOpportunity {
  type: string;
  title: string;
  description: string;
  confidence: number;
  suggestedProduct: string;
  potentialValue: number;
}

export interface IPainPoint {
  category: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  evidence: string[];
}

export interface ISummary {
  overallScore: number;
  keyFinding: string;
  recommendedActions: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface IResearchReport extends Document {
  targetId: string;
  targetType: 'merchant' | 'company' | 'contact';
  status: 'pending' | 'researching' | 'completed' | 'failed';
  createdAt: Date;
  completedAt: Date | null;

  websiteAnalysis: IWebsiteAnalysis;
  reviewAnalysis: IReviewAnalysis;
  socialMedia: ISocialMedia;
  competitorAnalysis: ICompetitorAnalysis;
  hiringSignals: IHiringSignals;
  financialSignals: IFinancialSignals;
  opportunities: IOpportunity[];
  painPoints: IPainPoint[];
  summary: ISummary;
  sources: string[];
}

const WebsiteAnalysisSchema = new Schema<IWebsiteAnalysis>({
  score: { type: Number, default: 0 },
  issues: [{ type: String }],
  recommendations: [{ type: String }],
  technologies: [{ type: String }],
  hosting: { type: String, default: 'Unknown' },
  ssl: { type: Boolean, default: false }
}, { _id: false });

const ReviewAnalysisSchema = new Schema<IReviewAnalysis>({
  overallRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  positiveRatio: { type: Number, default: 0 },
  commonPraise: [{ type: String }],
  commonComplaints: [{ type: String }],
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
  responseRate: { type: Number, default: 0 },
  avgResponseTime: { type: String, default: 'N/A' }
}, { _id: false });

const SocialMediaSchema = new Schema<ISocialMedia>({
  linkedin: { exists: { type: Boolean, default: false }, followers: { type: Number, default: 0 }, engagement: { type: Number, default: 0 } },
  twitter: { exists: { type: Boolean, default: false }, followers: { type: Number, default: 0 }, tweets: { type: Number, default: 0 } },
  instagram: { exists: { type: Boolean, default: false }, followers: { type: Number, default: 0 }, posts: { type: Number, default: 0 } },
  facebook: { exists: { type: Boolean, default: false }, likes: { type: Number, default: 0 } }
}, { _id: false });

const CompetitorAnalysisSchema = new Schema<ICompetitorAnalysis>({
  competitors: [{
    name: String, rating: Number, reviews: Number, distance: String
  }],
  marketShare: { type: Number, default: 0 },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }]
}, { _id: false });

const HiringSignalsSchema = new Schema<IHiringSignals>({
  activeJobPostings: { type: Number, default: 0 },
  growthRate: { type: String, default: 'Unknown' },
  newRoles: [{ type: String }],
  lastHiring: { type: String, default: 'Unknown' },
  expansion: { type: Boolean, default: false }
}, { _id: false });

const FinancialSignalsSchema = new Schema<IFinancialSignals>({
  revenueEstimate: { type: String, default: 'Unknown' },
  funding: { type: String, default: null },
  growthRate: { type: String, default: 'Unknown' },
  profitability: { type: String, default: 'Unknown' }
}, { _id: false });

const OpportunitySchema = new Schema<IOpportunity>({
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  confidence: { type: Number, required: true },
  suggestedProduct: { type: String, required: true },
  potentialValue: { type: Number, required: true }
}, { _id: false });

const PainPointSchema = new Schema<IPainPoint>({
  category: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  evidence: [{ type: String }]
}, { _id: false });

const SummarySchema = new Schema<ISummary>({
  overallScore: { type: Number, default: 0 },
  keyFinding: { type: String, default: '' },
  recommendedActions: [{ type: String }],
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
}, { _id: false });

const ResearchReportSchema = new Schema<IResearchReport>({
  targetId: { type: String, required: true, index: true },
  targetType: { type: String, enum: ['merchant', 'company', 'contact'], required: true, index: true },
  status: { type: String, enum: ['pending', 'researching', 'completed', 'failed'], default: 'pending', index: true },
  completedAt: { type: Date, default: null },
  websiteAnalysis: { type: WebsiteAnalysisSchema, default: () => ({}) },
  reviewAnalysis: { type: ReviewAnalysisSchema, default: () => ({}) },
  socialMedia: { type: SocialMediaSchema, default: () => ({}) },
  competitorAnalysis: { type: CompetitorAnalysisSchema, default: () => ({}) },
  hiringSignals: { type: HiringSignalsSchema, default: () => ({}) },
  financialSignals: { type: FinancialSignalsSchema, default: () => ({}) },
  opportunities: [OpportunitySchema],
  painPoints: [PainPointSchema],
  summary: { type: SummarySchema, default: () => ({}) },
  sources: [{ type: String }]
}, { timestamps: true });

ResearchReportSchema.index({ targetId: 1, targetType: 1 });
ResearchReportSchema.index({ status: 1, createdAt: -1 });

export const ResearchReport = mongoose.model<IResearchReport>('ResearchReport', ResearchReportSchema);