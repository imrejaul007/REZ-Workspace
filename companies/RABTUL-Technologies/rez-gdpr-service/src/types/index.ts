export enum DataRequestType {
  ACCESS = 'access',
  ERASURE = 'erasure',
  RECTIFICATION = 'rectification',
  PORTABILITY = 'portability',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection'
}

export enum DataRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum ConsentType {
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  PERSONALIZATION = 'personalization',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  COOKIES = 'cookies',
  TERMS = 'terms',
  PRIVACY = 'privacy'
}

export enum ConsentStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired'
}

export interface UserConsent {
  id: string;
  userId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  grantedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  source: 'banner' | 'form' | 'api' | 'settings';
  metadata?: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  userId?: string;
  requestId?: string;
  consentId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  errorMessage?: string;
}

export interface PrivacyPolicy {
  id: string;
  version: string;
  title: string;
  content: string;
  effectiveDate: Date;
  publishedAt?: Date;
  isActive: boolean;
  changelog?: string;
  acceptedByUsers: string[];
}

export interface ConsentBanner {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  rejectButtonText?: string;
  preferencesButtonText?: string;
  privacyPolicyLink?: string;
  isActive: boolean;
  theme: 'light' | 'dark';
  position: 'bottom' | 'top' | 'center' | 'bottom-left' | 'bottom-right';
  requiredConsents: ConsentType[];
  optionalConsents: ConsentType[];
}

export interface DataExport {
  id: string;
  userId: string;
  requestId: string;
  format: 'json' | 'csv' | 'xml';
  data: Record<string, unknown>;
  generatedAt: Date;
  expiresAt: Date;
  downloadUrl?: string;
}

export interface ErasureRequest {
  id: string;
  userId: string;
  requestType: DataRequestType.ERASURE;
  status: DataRequestStatus;
  dataCategories: string[];
  requestedAt: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  erasureMethod?: 'full' | 'anonymized' | 'pseudonymized';
  backupDeletedAt?: Date;
  notes?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
