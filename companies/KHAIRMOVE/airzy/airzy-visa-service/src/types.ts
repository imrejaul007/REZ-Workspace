/**
 * Visa Service Types
 * Visa requirements, processing, and AI assistant
 */

export interface Country {
  code: string;  // ISO 3166-1 alpha-2
  name: string;
  region: string;
  indianFriendly: boolean;
}

export interface VisaRequirement {
  destinationCountry: string;
  originCountry: string;
  visaType: 'tourist' | 'business' | 'student' | 'work' | 'transit';
  requirement: {
    visaRequired: boolean;
    visaOnArrival: boolean;
    etaRequired: boolean;
    visaFree: boolean;
  };
  processingTime: string;  // e.g., "3-5 working days"
  processingTimeDays: number;
  cost: {
    amount: number;
    currency: string;
  };
  maxStay: string;  // e.g., "30 days"
  validity: string;  // e.g., "90 days from issue"
  documents: Document[];
  eligibility: string[];
  restrictions: string[];
  applicationUrl?: string;
}

export interface Document {
  name: string;
  required: boolean;
  description: string;
  validity?: string;
}

export interface VisaCheckRequest {
  originCountry: string;
  destinationCountry: string;
  purpose: 'tourist' | 'business' | 'student' | 'work' | 'transit';
  passportExpiry?: string;
  travelDate?: string;
}

export interface VisaCheckResult {
  requirement: VisaRequirement;
  readiness: VisaReadiness;
  missingDocuments: string[];
  recommendations: string[];
}

export interface VisaReadiness {
  score: number;  // 0-100
  level: 'ready' | 'almost-ready' | 'needs-work' | 'not-ready';
  checks: {
    passportValid: boolean;
    passportExpiryOk: boolean;
    documentsComplete: boolean;
    sufficientTime: boolean;
  };
}

export interface VisaApplication {
  id: string;
  userId: string;
  destinationCountry: string;
  visaType: 'tourist' | 'business' | 'student' | 'work' | 'transit';
  status: 'draft' | 'submitted' | 'processing' | 'approved' | 'rejected' | 'interview';
  passport: {
    number: string;
    expiry: string;
    nationality: string;
  };
  documents: UploadedDocument[];
  appointmentDate?: string;
  interviewDate?: string;
  submittedAt?: string;
  processedAt?: string;
  result?: 'approved' | 'rejected';
  notes?: string;
}

export interface UploadedDocument {
  type: string;
  filename: string;
  uploadedAt: string;
  verified: boolean;
  verifiedAt?: string;
}

export interface VisaAssistantRequest {
  userId: string;
  message: string;
  context?: {
    destination?: string;
    travelDate?: string;
    purpose?: string;
  };
}

export interface VisaAssistantResponse {
  intent: 'check_requirement' | 'check_document' | 'check_eligibility' | 'application_help' | 'general';
  response: string;
  suggestions: string[];
  data?: any;
}

// Popular destinations for Indians
export const POPULAR_DESTINATIONS: Country[] = [
  { code: 'TH', name: 'Thailand', region: 'Asia', indianFriendly: true },
  { code: 'AE', name: 'UAE', region: 'Middle East', indianFriendly: true },
  { code: 'SG', name: 'Singapore', region: 'Asia', indianFriendly: true },
  { code: 'MY', name: 'Malaysia', region: 'Asia', indianFriendly: true },
  { code: 'ID', name: 'Indonesia', region: 'Asia', indianFriendly: true },
  { code: 'VN', name: 'Vietnam', region: 'Asia', indianFriendly: true },
  { code: 'LK', name: 'Sri Lanka', region: 'Asia', indianFriendly: true },
  { code: 'NP', name: 'Nepal', region: 'Asia', indianFriendly: true },
  { code: 'BT', name: 'Bhutan', region: 'Asia', indianFriendly: true },
  { code: 'MV', name: 'Maldives', region: 'Asia', indianFriendly: true },
  { code: 'JP', name: 'Japan', region: 'Asia', indianFriendly: false },
  { code: 'KR', name: 'South Korea', region: 'Asia', indianFriendly: true },
  { code: 'AU', name: 'Australia', region: 'Oceania', indianFriendly: false },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania', indianFriendly: false },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', indianFriendly: false },
  { code: 'FR', name: 'France', region: 'Europe', indianFriendly: false },
  { code: 'DE', name: 'Germany', region: 'Europe', indianFriendly: false },
  { code: 'IT', name: 'Italy', region: 'Europe', indianFriendly: false },
  { code: 'ES', name: 'Spain', region: 'Europe', indianFriendly: false },
  { code: 'US', name: 'United States', region: 'North America', indianFriendly: false },
  { code: 'CA', name: 'Canada', region: 'North America', indianFriendly: false },
  { code: 'RU', name: 'Russia', region: 'Europe', indianFriendly: false },
  { code: 'ZA', name: 'South Africa', region: 'Africa', indianFriendly: false },
  { code: 'KE', name: 'Kenya', region: 'Africa', indianFriendly: false },
  { code: 'AE-DXB', name: 'Dubai (UAE)', region: 'Middle East', indianFriendly: true },
];
