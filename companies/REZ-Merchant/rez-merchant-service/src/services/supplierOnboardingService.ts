/**
 * Supplier Onboarding Service
 *
 * Handles supplier KYC and onboarding workflow:
 * - Multi-step onboarding process
 * - Document collection
 * - Verification workflow
 * - Approval workflow
 */

import { Types } from 'mongoose';
import { Supplier } from '../models/Supplier';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OnboardingStep =
  | 'basic_info'
  | 'kyc_documents'
  | 'bank_details'
  | 'credit_verification'
  | 'approval';

export type OnboardingStatus = 'pending' | 'in_progress' | 'documents_pending' | 'under_review' | 'approved' | 'rejected';

export interface SupplierOnboarding {
  _id: Types.ObjectId;
  merchantId: Types.ObjectId;
  supplierId: Types.ObjectId;
  currentStep: OnboardingStep;
  status: OnboardingStatus;
  steps: {
    basicInfo: {
      completed: boolean;
      completedAt?: Date;
      data?: Record<string, unknown>;
    };
    kycDocuments: {
      completed: boolean;
      completedAt?: Date;
      documents: KycDocument[];
    };
    bankDetails: {
      completed: boolean;
      completedAt?: Date;
      data?: BankDetails;
    };
    creditVerification: {
      completed: boolean;
      completedAt?: Date;
      verified: boolean;
      creditLimit?: number;
    };
    approval: {
      completed: boolean;
      completedAt?: Date;
      approvedBy?: Types.ObjectId;
      approvedAt?: Date;
      notes?: string;
    };
  };
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KycDocument {
  type: 'gst_certificate' | 'pan_card' | 'address_proof' | 'bank_statement' | 'cancelled_cheque' | 'udyam_aadhar' | 'other';
  documentUrl: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  rejectionReason?: string;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  accountType: 'savings' | 'current' | 'od';
  cancelledChequeUrl?: string;
  verified: boolean;
}

// ── KYC Document Validation ───────────────────────────────────────────────────

const KYC_REQUIREMENTS: Record<string, {
  required: boolean;
  label: string;
  fileTypes: string[];
  maxSizeMB: number;
}> = {
  gst_certificate: {
    required: true,
    label: 'GST Registration Certificate',
    fileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
  },
  pan_card: {
    required: true,
    label: 'PAN Card',
    fileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 2,
  },
  address_proof: {
    required: true,
    label: 'Address Proof (Utility Bill/Rent Agreement)',
    fileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
  },
  bank_statement: {
    required: true,
    label: 'Bank Statement (Last 6 months)',
    fileTypes: ['pdf'],
    maxSizeMB: 10,
  },
  cancelled_cheque: {
    required: true,
    label: 'Cancelled Cheque / Passbook First Page',
    fileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 2,
  },
  udyam_aadhar: {
    required: false,
    label: 'Udyam Aadhar (MSME Certificate)',
    fileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
  },
};

// ── Onboarding Functions ─────────────────────────────────────────────────────

export async function startOnboarding(
  merchantId: string,
  supplierData: {
    name: string;
    email?: string;
    phone?: string;
    gstNumber?: string;
  }
): Promise<SupplierOnboarding> {
  // Create supplier in pending state
  const supplier = await Supplier.create({
    merchantId: new Types.ObjectId(merchantId),
    name: supplierData.name,
    email: supplierData.email,
    phone: supplierData.phone,
    gstNumber: supplierData.gstNumber,
    status: 'pending',
    isActive: false, // Not active until onboarding complete
  });

  // Create onboarding record
  const onboarding = {
    _id: new Types.ObjectId(),
    merchantId: new Types.ObjectId(merchantId),
    supplierId: supplier._id,
    currentStep: 'basic_info' as OnboardingStep,
    status: 'pending' as OnboardingStatus,
    steps: {
      basicInfo: { completed: false },
      kycDocuments: { completed: false, documents: [] },
      bankDetails: { completed: false },
      creditVerification: { completed: false, verified: false },
      approval: { completed: false },
    },
  };

  // Store in Redis for quick access (in production, use a proper model)
  await saveOnboardingState(merchantId, supplier._id.toString(), onboarding);

  logger.info(`[Onboarding] Started for supplier ${supplier._id}`);

  return onboarding as unknown as SupplierOnboarding;
}

export async function completeBasicInfo(
  merchantId: string,
  supplierId: string,
  data: {
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  }
): Promise<void> {
  const onboarding = await getOnboardingState(merchantId, supplierId);
  if (!onboarding) throw new Error('Onboarding not found');

  // Update supplier
  await Supplier.findByIdAndUpdate(supplierId, {
    name: data.name,
    contactPerson: data.contactPerson,
    email: data.email,
    phone: data.phone,
    address: data.address,
  });

  // Update onboarding
  onboarding.steps.basicInfo = {
    completed: true,
    completedAt: new Date(),
    data,
  };
  onboarding.currentStep = 'kyc_documents';
  await saveOnboardingState(merchantId, supplierId, onboarding);

  logger.info(`[Onboarding] Basic info completed for supplier ${supplierId}`);
}

export async function uploadKycDocument(
  merchantId: string,
  supplierId: string,
  document: KycDocument
): Promise<void> {
  const onboarding = await getOnboardingState(merchantId, supplierId);
  if (!onboarding) throw new Error('Onboarding not found');

  // Validate document type
  const requirement = KYC_REQUIREMENTS[document.type];
  if (!requirement) throw new Error('Invalid document type');

  // Add document
  const existingIndex = onboarding.steps.kycDocuments.documents.findIndex(
    (d) => d.type === document.type
  );

  if (existingIndex >= 0) {
    onboarding.steps.kycDocuments.documents[existingIndex] = document;
  } else {
    onboarding.steps.kycDocuments.documents.push(document);
  }

  // Check if all required documents uploaded
  const requiredTypes = Object.entries(KYC_REQUIREMENTS)
    .filter(([, req]) => req.required)
    .map(([type]) => type);

  const uploadedTypes = onboarding.steps.kycDocuments.documents
    .filter((d) => d.documentUrl)
    .map((d) => d.type);

  const allUploaded = requiredTypes.every((type) => uploadedTypes.includes(type));

  if (allUploaded) {
    onboarding.steps.kycDocuments.completed = true;
    onboarding.steps.kycDocuments.completedAt = new Date();
    onboarding.currentStep = 'bank_details';
    onboarding.status = 'documents_pending';
  }

  await saveOnboardingState(merchantId, supplierId, onboarding);

  logger.info(`[Onboarding] Document uploaded: ${document.type} for supplier ${supplierId}`);
}

export async function completeBankDetails(
  merchantId: string,
  supplierId: string,
  bankDetails: BankDetails
): Promise<void> {
  const onboarding = await getOnboardingState(merchantId, supplierId);
  if (!onboarding) throw new Error('Onboarding not found');

  // Validate IFSC
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode)) {
    throw new Error('Invalid IFSC code format');
  }

  // Update supplier with bank details
  await Supplier.findByIdAndUpdate(supplierId, {
    bankDetails: {
      accountNumber: bankDetails.accountNumber,
      bankName: bankDetails.bankName,
      branchName: bankDetails.branchName,
      ifscCode: bankDetails.ifscCode,
      accountHolderName: bankDetails.accountHolderName,
    },
  });

  onboarding.steps.bankDetails = {
    completed: true,
    completedAt: new Date(),
    data: bankDetails,
  };
  onboarding.currentStep = 'credit_verification';
  await saveOnboardingState(merchantId, supplierId, onboarding);

  logger.info(`[Onboarding] Bank details completed for supplier ${supplierId}`);
}

export async function completeCreditVerification(
  merchantId: string,
  supplierId: string,
  result: {
    verified: boolean;
    creditLimit?: number;
    riskScore?: number;
  }
): Promise<void> {
  const onboarding = await getOnboardingState(merchantId, supplierId);
  if (!onboarding) throw new Error('Onboarding not found');

  // Update supplier credit
  if (result.creditLimit) {
    await Supplier.findByIdAndUpdate(supplierId, {
      creditLimit: result.creditLimit,
    });
  }

  onboarding.steps.creditVerification = {
    completed: true,
    completedAt: new Date(),
    verified: result.verified,
    creditLimit: result.creditLimit,
  };
  onboarding.currentStep = 'approval';
  onboarding.status = 'under_review';

  await saveOnboardingState(merchantId, supplierId, onboarding);

  logger.info(`[Onboarding] Credit verified for supplier ${supplierId}: ${result.creditLimit}`);
}

export async function approveSupplier(
  merchantId: string,
  supplierId: string,
  approverId: string,
  notes?: string
): Promise<void> {
  const onboarding = await getOnboardingState(merchantId, supplierId);
  if (!onboarding) throw new Error('Onboarding not found');

  // Update supplier to approved
  await Supplier.findByIdAndUpdate(supplierId, {
    status: 'approved',
    isActive: true,
  });

  onboarding.steps.approval = {
    completed: true,
    completedAt: new Date(),
    approvedBy: new Types.ObjectId(approverId),
    approvedAt: new Date(),
    notes,
  };
  onboarding.status = 'approved';
  onboarding.currentStep = 'approval';

  await saveOnboardingState(merchantId, supplierId, onboarding);

  logger.info(`[Onboarding] Supplier approved: ${supplierId}`);
}

export async function rejectSupplier(
  merchantId: string,
  supplierId: string,
  rejectedBy: string,
  reason: string
): Promise<void> {
  const onboarding = await getOnboardingState(merchantId, supplierId);
  if (!onboarding) throw new Error('Onboarding not found');

  // Update supplier to rejected
  await Supplier.findByIdAndUpdate(supplierId, {
    status: 'rejected',
  });

  onboarding.status = 'rejected';
  onboarding.rejectionReason = reason;

  await saveOnboardingState(merchantId, supplierId, onboarding);

  logger.info(`[Onboarding] Supplier rejected: ${supplierId}, reason: ${reason}`);
}

// ── State Management (Redis-based) ────────────────────────────────────────────

const REDIS_KEY_PREFIX = 'onboarding:';

async function saveOnboardingState(
  merchantId: string,
  supplierId: string,
  state: unknown
): Promise<void> {
  const { redis } = await import('../config/redis');
  const key = `${REDIS_KEY_PREFIX}${merchantId}:${supplierId}`;
  await redis.set(key, JSON.stringify(state), 'EX', 30 * 24 * 60 * 60); // 30 days
}

async function getOnboardingState(
  merchantId: string,
  supplierId: string
): Promise<unknown> {
  const { redis } = await import('../config/redis');
  const key = `${REDIS_KEY_PREFIX}${merchantId}:${supplierId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

// ── Getters ───────────────────────────────────────────────────────────────────

export async function getOnboardingProgress(
  merchantId: string,
  supplierId: string
): Promise<{
  currentStep: OnboardingStep;
  status: OnboardingStatus;
  progress: number;
  steps: Record<string, { completed: boolean; data?: unknown }>;
}> {
  const onboarding = await getOnboardingState(merchantId, supplierId);
  if (!onboarding) {
    return {
      currentStep: 'basic_info',
      status: 'pending',
      progress: 0,
      steps: {},
    };
  }

  const stepOrder: OnboardingStep[] = [
    'basic_info',
    'kyc_documents',
    'bank_details',
    'credit_verification',
    'approval',
  ];
  const currentIndex = stepOrder.indexOf(onboarding.currentStep);
  const progress = ((currentIndex + 1) / stepOrder.length) * 100;

  return {
    currentStep: onboarding.currentStep,
    status: onboarding.status,
    progress,
    steps: onboarding.steps,
  };
}

export function getKycRequirements(): typeof KYC_REQUIREMENTS {
  return KYC_REQUIREMENTS;
}
