/**
 * CorpID Identity Service Types
 */

import { Document, Types } from 'mongoose';

export type EntityType = 'INDIVIDUAL' | 'BUSINESS' | 'SUPPLIER' | 'MERCHANT' | 'DRIVER' | 'FRANCHISE';
export type VerificationStatus = 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface IAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IIdentity {
  _id: Types.ObjectId;
  corpId: string;
  entityType: EntityType;
  status: VerificationStatus;
  verificationLevel: number;

  // Individual fields
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  email?: string;
  phone?: string;
  address?: IAddress;

  // Business fields
  businessName?: string;
  businessType?: string;
  registrationNumber?: string;
  gstin?: string;
  pan?: string;
  companyAddress?: IAddress;

  // Timestamps
  lastVerifiedAt?: Date;
  verifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  // Metadata
  metadata: Record<string, unknown>;
}

export interface IdentityDocument extends IIdentity, Document {
  id: string;
}

export interface CreateIdentityResponse {
  success: boolean;
  data?: {
    corpId: string;
    entityType: EntityType;
    status: VerificationStatus;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SearchFilters {
  query?: string;
  entityType?: EntityType;
  status?: VerificationStatus;
  verificationLevelMin?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}
