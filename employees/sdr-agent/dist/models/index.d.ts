import mongoose, { Document, Model } from 'mongoose';
import { LeadStage, LeadSource, LeadScore, OutreachChannel, OutreachStatus, FollowupStatus, QualificationStatus } from '../types';
export interface IContactDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    title?: string;
    company?: string;
    companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
    industry?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    companyId?: mongoose.Types.ObjectId;
}
export interface ICompanyDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    name: string;
    domain?: string;
    industry?: string;
    size?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
    revenue?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
    linkedinUrl?: string;
    crunchbaseUrl?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface ILeadDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    contactId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    stage: LeadStage;
    source: LeadSource;
    score: LeadScore;
    scoreValue: number;
    ownerId: string;
    assignedTo?: string;
    lastContactedAt?: Date;
    nextFollowupAt?: Date;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface IQualificationDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    leadId: mongoose.Types.ObjectId;
    status: QualificationStatus;
    bant: {
        budget: {
            hasBudget: boolean;
            amount?: number;
            currency: string;
            comments?: string;
        };
        authority: {
            level: 'individual' | 'manager' | 'director' | 'vp' | 'cxo' | 'unknown';
            isDecisionMaker: boolean;
            involvesOthers?: boolean;
            comments?: string;
        };
        need: {
            painPoints: string[];
            priority: 'low' | 'medium' | 'high' | 'critical';
            businessImpact?: string;
        };
        timeline: {
            targetClose?: Date;
            buyingStage: 'awareness' | 'consideration' | 'decision' | 'none';
            urgency: 'low' | 'medium' | 'high';
        };
    };
    notes: string;
    disqualifyReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IOutreachDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    leadId: mongoose.Types.ObjectId;
    channel: OutreachChannel;
    status: OutreachStatus;
    subject?: string;
    body: string;
    templateId?: string;
    personalization?: Record<string, string>;
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    repliedAt?: Date;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface IFollowupDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    leadId: mongoose.Types.ObjectId;
    outreachId?: mongoose.Types.ObjectId;
    channel: OutreachChannel;
    status: FollowupStatus;
    scheduledFor: Date;
    message?: string;
    sentAt?: Date;
    completedAt?: Date;
    skippedReason?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface IActivityDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    leadId: mongoose.Types.ObjectId;
    type: 'stage_change' | 'outreach' | 'followup' | 'note' | 'email_opened' | 'email_clicked' | 'email_replied' | 'call' | 'meeting';
    description: string;
    metadata?: Record<string, unknown>;
    createdBy: string;
    createdAt: Date;
}
export declare const Contact: mongoose.Model<IContactDocument, {}, {}, {}, mongoose.Document<unknown, {}, IContactDocument, {}, {}> & IContactDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const Company: mongoose.Model<ICompanyDocument, {}, {}, {}, mongoose.Document<unknown, {}, ICompanyDocument, {}, {}> & ICompanyDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const Lead: mongoose.Model<ILeadDocument, {}, {}, {}, mongoose.Document<unknown, {}, ILeadDocument, {}, {}> & ILeadDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const Qualification: mongoose.Model<IQualificationDocument, {}, {}, {}, mongoose.Document<unknown, {}, IQualificationDocument, {}, {}> & IQualificationDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const Outreach: mongoose.Model<IOutreachDocument, {}, {}, {}, mongoose.Document<unknown, {}, IOutreachDocument, {}, {}> & IOutreachDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const Followup: mongoose.Model<IFollowupDocument, {}, {}, {}, mongoose.Document<unknown, {}, IFollowupDocument, {}, {}> & IFollowupDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const Activity: mongoose.Model<IActivityDocument, {}, {}, {}, mongoose.Document<unknown, {}, IActivityDocument, {}, {}> & IActivityDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export type ContactModel = Model<IContactDocument>;
export type CompanyModel = Model<ICompanyDocument>;
export type LeadModel = Model<ILeadDocument>;
export type QualificationModel = Model<IQualificationDocument>;
export type OutreachModel = Model<IOutreachDocument>;
export type FollowupModel = Model<IFollowupDocument>;
export type ActivityModel = Model<IActivityDocument>;
//# sourceMappingURL=index.d.ts.map