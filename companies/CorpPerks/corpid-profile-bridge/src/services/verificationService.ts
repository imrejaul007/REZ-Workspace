import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import {
  VerificationStatus,
  VerificationItem,
  VerificationDocument,
  RABTULProfile,
  AppError,
} from '../types';
import { CorpIdProfileBridge, getCorpIdByProfileId } from './profileSyncService';

/**
 * Verification Service
 *
 * Links CorpID verification status to RABTUL Profile:
 * - Identity verified → Profile marked verified
 * - Employment verified → Work history linked
 * - Skills verified → Certifications added
 */

// ============================================
// External Service Clients
// ============================================

async function callCorpIdIdentityService(
  action: 'verify-identity' | 'verify-employment' | 'verify-skills' | 'verify-education',
  data: {
    profileId: string;
    employeeId: string;
    corporateId: string;
    documents?: VerificationDocument[];
  }
): Promise<{ success: boolean; verified: boolean; error?: string }> {
  const identityServiceUrl = process.env.CORPID_IDENTITY_SERVICE_URL || 'http://localhost:4702';

  try {
    const response = await axios.post<{ success: boolean; verified: boolean; error?: string }>(
      `${identityServiceUrl}/api/identity/${action}`,
      data,
      {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        return error.response.data;
      }
      return { success: false, verified: false, error: 'Identity service unavailable' };
    }
    return { success: false, verified: false, error: 'Unknown error' };
  }
}

async function fetchRABTULProfile(profileId: string): Promise<RABTULProfile> {
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
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'RABTUL Profile service unavailable');
  }
}

// ============================================
// Verification Service Functions
// ============================================

/**
 * Verify identity for a profile
 */
export async function verifyIdentity(
  profileId: string,
  documents: VerificationDocument[]
): Promise<VerificationItem> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  // Call external CorpID Identity service
  const result = await callCorpIdIdentityService('verify-identity', {
    profileId,
    employeeId: corpIdRecord.employeeId,
    corporateId: corpIdRecord.corporateId,
    documents,
  });

  const verificationItem: VerificationItem = {
    verified: result.verified,
    verifiedAt: result.verified ? new Date() : null,
    verifiedBy: 'CorpID-Identity-Service',
    documents: documents.map((doc) => ({
      ...doc,
      status: result.verified ? 'approved' as const : 'pending' as const,
      verifiedAt: result.verified ? new Date() : null,
    })),
  };

  // Update CorpID record
  await CorpIdProfileBridge.updateOne(
    { profileId },
    {
      $set: {
        'verification.identity': verificationItem,
        updatedAt: new Date(),
      },
    }
  );

  return verificationItem;
}

/**
 * Verify employment for a profile
 */
export async function verifyEmployment(profileId: string): Promise<VerificationItem> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  // Fetch profile to get work data
  const profile = await fetchRABTULProfile(profileId);

  // Call external CorpID Identity service
  const result = await callCorpIdIdentityService('verify-employment', {
    profileId,
    employeeId: profile.employeeId,
    corporateId: profile.corporateId,
  });

  const verificationItem: VerificationItem = {
    verified: result.verified,
    verifiedAt: result.verified ? new Date() : null,
    verifiedBy: 'CorpID-Identity-Service',
    documents: [
      {
        type: 'employment_letter',
        documentId: uuidv4(),
        uploadedAt: new Date(),
        status: result.verified ? 'approved' : 'pending',
        verifiedAt: result.verified ? new Date() : null,
      },
    ],
  };

  // Update CorpID record
  await CorpIdProfileBridge.updateOne(
    { profileId },
    {
      $set: {
        'verification.employment': verificationItem,
        updatedAt: new Date(),
      },
    }
  );

  return verificationItem;
}

/**
 * Verify skills for a profile
 */
export async function verifySkills(profileId: string): Promise<VerificationItem> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  // Call external CorpID Identity service
  const result = await callCorpIdIdentityService('verify-skills', {
    profileId,
    employeeId: corpIdRecord.employeeId,
    corporateId: corpIdRecord.corporateId,
  });

  const verificationItem: VerificationItem = {
    verified: result.verified,
    verifiedAt: result.verified ? new Date() : null,
    verifiedBy: 'CorpID-Identity-Service',
    documents: [],
  };

  // Update CorpID record
  await CorpIdProfileBridge.updateOne(
    { profileId },
    {
      $set: {
        'verification.skills': verificationItem,
        updatedAt: new Date(),
      },
    }
  );

  return verificationItem;
}

/**
 * Verify education for a profile
 */
export async function verifyEducation(profileId: string): Promise<VerificationItem> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  // Call external CorpID Identity service
  const result = await callCorpIdIdentityService('verify-education', {
    profileId,
    employeeId: corpIdRecord.employeeId,
    corporateId: corpIdRecord.corporateId,
  });

  const verificationItem: VerificationItem = {
    verified: result.verified,
    verifiedAt: result.verified ? new Date() : null,
    verifiedBy: 'CorpID-Identity-Service',
    documents: [],
  };

  // Update CorpID record
  await CorpIdProfileBridge.updateOne(
    { profileId },
    {
      $set: {
        'verification.education': verificationItem,
        updatedAt: new Date(),
      },
    }
  );

  return verificationItem;
}

/**
 * Run all verifications for a profile
 */
export async function verifyAll(profileId: string): Promise<VerificationStatus> {
  const results = await Promise.allSettled([
    verifyEmployment(profileId),
    verifySkills(profileId),
    verifyEducation(profileId),
  ]);

  const verification: VerificationStatus = {
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
    lastVerified: new Date(),
  };

  // Process identity verification separately (requires documents)
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (corpIdRecord?.verification.identity.documents.length) {
    try {
      const identityResult = await verifyIdentity(profileId, corpIdRecord.verification.identity.documents);
      verification.identity = identityResult;
    } catch {
      // Continue with other verifications
    }
  }

  // Collect results from other verifications
  const employmentResult = results[0];
  if (employmentResult.status === 'fulfilled') {
    verification.employment = employmentResult.value;
  }

  const skillsResult = results[1];
  if (skillsResult.status === 'fulfilled') {
    verification.skills = skillsResult.value;
  }

  const educationResult = results[2];
  if (educationResult.status === 'fulfilled') {
    verification.education = educationResult.value;
  }

  // Calculate overall verification status
  verification.overall =
    verification.identity.verified &&
    verification.employment.verified &&
    verification.skills.verified &&
    verification.education.verified;

  // Update CorpID record with final verification status
  await CorpIdProfileBridge.updateOne(
    { profileId },
    {
      $set: {
        verification,
        updatedAt: new Date(),
      },
    }
  );

  return verification;
}

/**
 * Get verification status for a profile
 */
export async function getVerificationStatus(profileId: string): Promise<VerificationStatus> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  return corpIdRecord.verification;
}

/**
 * Add verification document to a profile
 */
export async function addVerificationDocument(
  profileId: string,
  verificationType: 'identity' | 'employment' | 'skills' | 'education',
  document: Omit<VerificationDocument, 'status' | 'verifiedAt'>
): Promise<VerificationStatus> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  const newDocument: VerificationDocument = {
    ...document,
    status: 'pending',
    verifiedAt: null,
  };

  const path = `verification.${verificationType}.documents`;
  await CorpIdProfileBridge.updateOne(
    { profileId },
    {
      $push: {
        [path]: newDocument,
      },
      $set: {
        updatedAt: new Date(),
      },
    }
  );

  // Return updated verification status
  return getVerificationStatus(profileId);
}

/**
 * Get verification summary for a profile
 */
export async function getVerificationSummary(profileId: string): Promise<{
  profileId: string;
  overall: boolean;
  verifiedCount: number;
  totalCount: number;
  items: Array<{
    type: string;
    verified: boolean;
    documentsCount: number;
    lastUpdated: Date | null;
  }>;
}> {
  const verification = await getVerificationStatus(profileId);

  const items = [
    {
      type: 'identity',
      verified: verification.identity.verified,
      documentsCount: verification.identity.documents.length,
      lastUpdated: verification.identity.verifiedAt,
    },
    {
      type: 'employment',
      verified: verification.employment.verified,
      documentsCount: verification.employment.documents.length,
      lastUpdated: verification.employment.verifiedAt,
    },
    {
      type: 'skills',
      verified: verification.skills.verified,
      documentsCount: verification.skills.documents.length,
      lastUpdated: verification.skills.verifiedAt,
    },
    {
      type: 'education',
      verified: verification.education.verified,
      documentsCount: verification.education.documents.length,
      lastUpdated: verification.education.verifiedAt,
    },
  ];

  const verifiedCount = items.filter((item) => item.verified).length;

  return {
    profileId,
    overall: verification.overall,
    verifiedCount,
    totalCount: items.length,
    items,
  };
}
