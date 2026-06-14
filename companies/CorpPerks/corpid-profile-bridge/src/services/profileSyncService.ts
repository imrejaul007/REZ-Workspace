import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import axios from 'axios';
import {
  CorpIdRecord,
  CorpIdProfileBridgeDocument,
  RABTULProfile,
  SyncProfileToCorpIdRequest,
  SyncProfileToCorpIdResponse,
  CIScore,
  VerificationStatus,
  TrustReport,
  AppError,
} from '../types';

// ============================================
// MongoDB Schema
// ============================================

const CIScoreFactorsSchema = new mongoose.Schema({
  attendanceRate: { type: Number, default: 0 },
  punctualityRate: { type: Number, default: 0 },
  projectCompletionRate: { type: Number, default: 0 },
  deadlineAdherence: { type: Number, default: 0 },
  learningHours: { type: Number, default: 0 },
  certificationCount: { type: Number, default: 0 },
  peerRecognitionCount: { type: Number, default: 0 },
  teamContributionScore: { type: Number, default: 0 },
}, { _id: false });

const CIScoreSchema = new mongoose.Schema({
  overall: { type: Number, default: 0, min: 0, max: 1000 },
  reliability: { type: Number, default: 0, min: 0, max: 1000 },
  delivery: { type: Number, default: 0, min: 0, max: 1000 },
  growth: { type: Number, default: 0, min: 0, max: 1000 },
  collaboration: { type: Number, default: 0, min: 0, max: 1000 },
  factors: { type: CIScoreFactorsSchema, default: () => ({}) },
  lastCalculated: { type: Date, default: Date.now },
}, { _id: false });

const VerificationItemSchema = new mongoose.Schema({
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: String, default: null },
  documents: [{
    type: { type: String },
    documentId: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    verifiedAt: { type: Date, default: null },
  }],
}, { _id: false });

const VerificationStatusSchema = new mongoose.Schema({
  identity: { type: VerificationItemSchema, default: () => ({}) },
  employment: { type: VerificationItemSchema, default: () => ({}) },
  skills: { type: VerificationItemSchema, default: () => ({}) },
  education: { type: VerificationItemSchema, default: () => ({}) },
  overall: { type: Boolean, default: false },
  lastVerified: { type: Date, default: null },
}, { _id: false });

const TrustFactorSchema = new mongoose.Schema({
  name: { type: String },
  contribution: { type: Number },
  description: { type: String },
  trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
}, { _id: false });

const TrustReportSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },
  level: { type: String, enum: ['low', 'medium', 'high', 'premium'], default: 'medium' },
  factors: [{ type: TrustFactorSchema }],
  recommendations: [{ type: String }],
  generatedAt: { type: Date, default: Date.now },
}, { _id: false });

const CorpIdProfileBridgeSchema = new mongoose.Schema({
  profileId: { type: String, required: true, unique: true, index: true },
  employeeId: { type: String, required: true, index: true },
  corporateId: { type: String, required: true, index: true },
  ciScore: { type: CIScoreSchema, default: () => ({}) },
  verification: { type: VerificationStatusSchema, default: () => ({}) },
  trustReport: { type: TrustReportSchema, default: () => ({}) },
  linkedAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
  collection: 'corpid_profile_bridges',
});

export const CorpIdProfileBridge = mongoose.model<CorpIdProfileBridgeDocument>(
  'CorpIdProfileBridge',
  CorpIdProfileBridgeSchema
);

// ============================================
// RABTUL Profile Service Client
// ============================================

async function getRABTULProfile(profileId: string): Promise<RABTULProfile> {
  const profileServiceUrl = process.env.RABTUL_PROFILE_SERVICE_URL || 'http://localhost:4002';

  try {
    const response = await axios.get<RABTULProfile>(
      `${profileServiceUrl}/api/profiles/${profileId}`,
      {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
        },
        timeout: 5000,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${profileId} not found in RABTUL Profile service`);
    }
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'RABTUL Profile service is unavailable');
  }
}

// ============================================
// Type Conversion Helpers
// ============================================

/**
 * Convert Mongoose document to CorpIdRecord
 * Handles ObjectId to string conversion
 */
function toCorpIdRecord(doc: mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  profileId: string;
  employeeId: string;
  corporateId: string;
  ciScore: CIScore;
  verification: VerificationStatus;
  trustReport: TrustReport;
  linkedAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}): CorpIdRecord {
  const obj = doc.toObject();
  return {
    ...obj,
    _id: obj._id.toString(),
  };
}

// ============================================
// Profile Sync Service
// ============================================

/**
 * Create a new CorpID record for a RABTUL Profile
 */
export async function createCorpIdForProfile(request: SyncProfileToCorpIdRequest): Promise<CorpIdRecord> {
  // Check if CorpID already exists
  const existing = await CorpIdProfileBridge.findOne({ profileId: request.profileId });
  if (existing) {
    throw new AppError(409, 'CORP_ID_EXISTS', 'CorpID already exists for this profile');
  }

  // Try to fetch RABTUL Profile data if not provided
  let profileData: RABTULProfile | null = null;
  try {
    profileData = await getRABTULProfile(request.profileId);
  } catch {
    // Profile service unavailable, continue with provided data
  }

  // Initialize CI Score with zeros
  const initialCIScore: CIScore = {
    overall: 0,
    reliability: 0,
    delivery: 0,
    growth: 0,
    collaboration: 0,
    factors: {
      attendanceRate: 0,
      punctualityRate: 0,
      projectCompletionRate: 0,
      deadlineAdherence: 0,
      learningHours: 0,
      certificationCount: 0,
      peerRecognitionCount: 0,
      teamContributionScore: 0,
    },
    lastCalculated: new Date(),
  };

  // Initialize Verification Status
  const initialVerification: VerificationStatus = {
    identity: {
      verified: false,
      verifiedAt: null,
      verifiedBy: null,
      documents: [],
    },
    employment: {
      verified: false,
      verifiedAt: null,
      verifiedBy: null,
      documents: [],
    },
    skills: {
      verified: false,
      verifiedAt: null,
      verifiedBy: null,
      documents: [],
    },
    education: {
      verified: false,
      verifiedAt: null,
      verifiedBy: null,
      documents: [],
    },
    overall: false,
    lastVerified: null,
  };

  // Initialize Trust Report
  const initialTrustReport: TrustReport = {
    score: 0,
    level: 'low',
    factors: [],
    recommendations: ['Complete profile verification to increase trust score'],
    generatedAt: new Date(),
  };

  // Create CorpID record
  const corpIdRecord = new CorpIdProfileBridge({
    profileId: request.profileId,
    employeeId: request.employeeId,
    corporateId: request.corporateId,
    ciScore: initialCIScore,
    verification: initialVerification,
    trustReport: initialTrustReport,
    linkedAt: new Date(),
    metadata: {
      source: 'profile_sync',
      syncedAt: new Date().toISOString(),
      profileData,
    },
  });

  await corpIdRecord.save();

  return toCorpIdRecord(corpIdRecord);
}

/**
 * Update CorpID record when RABTUL Profile is updated
 */
export async function updateCorpIdFromProfile(
  profileId: string,
  updates: Partial<{ personalData: RABTULProfile['personal']; workData: RABTULProfile['work'] }>
): Promise<CorpIdRecord> {
  const corpIdRecord = await CorpIdProfileBridge.findOne({ profileId });

  if (!corpIdRecord) {
    throw new AppError(404, 'CORP_ID_NOT_FOUND', `CorpID not found for profile ${profileId}`);
  }

  // Update metadata with sync info
  corpIdRecord.metadata = {
    ...corpIdRecord.metadata,
    lastSyncedAt: new Date().toISOString(),
    syncSource: 'profile_update',
    updatedFields: Object.keys(updates),
  };

  await corpIdRecord.save();

  return toCorpIdRecord(corpIdRecord);
}

/**
 * Get CorpID record by profile ID
 */
export async function getCorpIdByProfileId(profileId: string): Promise<CorpIdRecord | null> {
  const record = await CorpIdProfileBridge.findOne({ profileId });
  return record ? toCorpIdRecord(record) : null;
}

/**
 * Get CorpID record by employee ID
 */
export async function getCorpIdByEmployeeId(employeeId: string): Promise<CorpIdRecord[]> {
  const records = await CorpIdProfileBridge.find({ employeeId });
  return records.map((r) => toCorpIdRecord(r));
}

/**
 * Get all CorpID records for a corporate
 */
export async function getCorpIdsByCorporateId(corporateId: string): Promise<CorpIdRecord[]> {
  const records = await CorpIdProfileBridge.find({ corporateId });
  return records.map((r) => toCorpIdRecord(r));
}

/**
 * Delete CorpID record (typically when employee leaves)
 */
export async function deleteCorpIdByProfileId(profileId: string): Promise<boolean> {
  const result = await CorpIdProfileBridge.deleteOne({ profileId });
  return result.deletedCount > 0;
}

/**
 * Full sync from RABTUL Profile to CorpID
 * This is called during onboarding or bulk sync
 */
export async function fullSyncFromProfile(profileId: string): Promise<SyncProfileToCorpIdResponse> {
  try {
    const profileData = await getRABTULProfile(profileId);

    // Check if CorpID exists
    let corpIdRecord = await getCorpIdByProfileId(profileId);

    if (!corpIdRecord) {
      // Create new CorpID
      corpIdRecord = await createCorpIdForProfile({
        profileId: profileData.id,
        employeeId: profileData.employeeId,
        corporateId: profileData.corporateId,
        personalData: profileData.personal,
        workData: profileData.work,
      });
    } else {
      // Update existing CorpID
      corpIdRecord = await updateCorpIdFromProfile(profileId, {
        personalData: profileData.personal,
        workData: profileData.work,
      });
    }

    return {
      success: true,
      corpIdRecord,
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Unknown error during sync',
    };
  }
}
