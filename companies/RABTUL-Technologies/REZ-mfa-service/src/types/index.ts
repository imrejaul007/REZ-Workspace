import { Types } from 'mongoose';

// TOTP Secret stored encrypted in database
export interface ITOTPSecret {
  encryptedSecret: string;
  algorithm: string;
  digits: number;
  period: number;
  issuer: string;
  createdAt: Date;
  lastVerifiedAt?: Date;
}

// Backup code structure
export interface IBackupCode {
  codeHash: string;
  usedAt?: Date;
  createdAt: Date;
}

// Trusted device structure
export interface ITrustedDevice {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  userAgent: string;
  ipAddress: string;
  lastUsedAt: Date;
  createdAt: Date;
}

// Login attempt for anomaly detection
export interface ILoginAttempt {
  userId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  method: 'totp' | 'backup_code' | 'sms' | 'recovery';
  city?: string;
  country?: string;
  anomalyDetected?: boolean;
}

// Account recovery request
export interface IRecoveryRequest {
  userId: string;
  requestId: string;
  method: 'email' | 'sms' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  completedAt?: Date;
  verifiedBy?: string;
  metadata?: Record<string, unknown>;
}

// MFA status for a user
export interface IMFAStatus {
  enabled: boolean;
  methods: ('totp' | 'sms' | 'backup')[];
  lastEnabledAt?: Date;
  disabledAt?: Date;
  disabledBy?: string;
}

// Request/Response types
export interface SetupMFARequest {
  userId: string;
  email: string;
  method: 'totp';
}

export interface SetupMFAResponse {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export interface VerifyTOTPRequest {
  userId: string;
  token: string;
  trustDevice?: boolean;
  deviceName?: string;
}

export interface VerifyTOTPResponse {
  success: boolean;
  trustedDeviceToken?: string;
  backupCodes?: string[];
  remainingBackupCodes?: number;
}

export interface DisableMFARequest {
  userId: string;
  token: string;
  reason?: string;
  disabledBy?: string;
}

export interface GetBackupCodesRequest {
  userId: string;
  token: string;
}

export interface GetBackupCodesResponse {
  codes: string[];
  remainingCodes: number;
  generatedAt: Date;
}

export interface UseBackupCodeRequest {
  userId: string;
  code: string;
  trustDevice?: boolean;
  deviceName?: string;
}

export interface RecoverAccountRequest {
  userId: string;
  method: 'email' | 'sms' | 'admin_verified';
  verificationCode?: string;
  newTotpSecret?: boolean;
}

export interface TrustedDeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  lastUsedAt: Date;
  createdAt: Date;
}

export interface GetTrustedDevicesResponse {
  devices: TrustedDeviceInfo[];
  total: number;
}

export interface RemoveTrustedDeviceRequest {
  userId: string;
  deviceId: string;
}

export interface AnomalyReport {
  userId: string;
  anomalies: AnomalyDetail[];
  recentAttempts: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnomalyDetail {
  type: 'unusual_location' | 'unusual_time' | 'multiple_failures' | 'new_device' | 'suspicious_ip';
  description: string;
  details: Record<string, unknown>;
}

// API Error response
export interface APIError {
  error: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
