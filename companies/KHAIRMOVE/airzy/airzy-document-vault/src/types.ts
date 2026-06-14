/**
 * Document Vault Types
 * Secure document storage for travelers
 */

export interface UserVault {
  userId: string;
  documents: VaultDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface VaultDocument {
  id: string;
  type: DocumentType;
  name: string;
  number?: string;  // Document number (partially masked)
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  country?: string;
  verified: boolean;
  verifiedAt?: string;
  fileUrl?: string;  // Encrypted URL to file storage
  thumbnailUrl?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | 'passport'
  | 'visa'
  | 'drivers_license'
  | 'aadhaar'
  | 'pan'
  | 'voter_id'
  | 'flight_ticket'
  | 'hotel_booking'
  | 'travel_insurance'
  | 'visa_stamp'
  | 'boarding_pass'
  | 'train_ticket'
  | 'bus_ticket'
  | 'visa_approval'
  | 'insurance_policy'
  | 'immunization'
  | 'other';

export interface DocumentUploadRequest {
  type: DocumentType;
  name: string;
  number?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  country?: string;
  file?: string;  // Base64 or file reference
}

export interface ShareLink {
  id: string;
  documentId: string;
  token: string;
  expiresAt: string;
  accessCount: number;
  maxAccess?: number;
  allowedFields?: string[];  // Only share specific fields
  createdAt: string;
}

export interface TravelFolder {
  id: string;
  userId: string;
  name: string;
  description?: string;
  tripType: 'domestic' | 'international' | 'business';
  destination?: string;
  startDate?: string;
  endDate?: string;
  documents: string[];  // Document IDs
  status: 'planning' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface SharingRequest {
  documentId: string;
  shareWith: 'airline' | 'hotel' | 'visa' | 'insurance' | 'employer' | 'custom';
  fields?: string[];
  expiresInDays?: number;
}

export interface DigiLockerLink {
  linked: boolean;
  linkedAt?: string;
  lastSync?: string;
  documents?: {
    type: string;
    lastUpdated: string;
    synced: boolean;
  }[];
}

// Document type labels and icons
export const DOCUMENT_LABELS: Record<DocumentType, { label: string; icon: string }> = {
  passport: { label: 'Passport', icon: '📘' },
  visa: { label: 'Visa', icon: '📋' },
  drivers_license: { label: 'Driver License', icon: '🪪' },
  aadhaar: { label: 'Aadhaar Card', icon: '🪪' },
  pan: { label: 'PAN Card', icon: '💳' },
  voter_id: { label: 'Voter ID', icon: '🗳️' },
  flight_ticket: { label: 'Flight Ticket', icon: '✈️' },
  hotel_booking: { label: 'Hotel Booking', icon: '🏨' },
  travel_insurance: { label: 'Travel Insurance', icon: '🛡️' },
  visa_stamp: { label: 'Visa Stamp', icon: '📮' },
  boarding_pass: { label: 'Boarding Pass', icon: '🎫' },
  train_ticket: { label: 'Train Ticket', icon: '🚂' },
  bus_ticket: { label: 'Bus Ticket', icon: '🚌' },
  visa_approval: { label: 'Visa Approval', icon: '✅' },
  insurance_policy: { label: 'Insurance Policy', icon: '📃' },
  immunization: { label: 'Immunization Record', icon: '💉' },
  other: { label: 'Other', icon: '📄' },
};
