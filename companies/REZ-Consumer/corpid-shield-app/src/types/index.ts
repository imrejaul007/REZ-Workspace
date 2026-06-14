/**
 * CorpID Shield Types
 *
 * Consumer-facing fraud protection service.
 * Features:
 * - Scam call detection
 * - SMS phishing protection
 * - QR code safety
 * - UPI transaction verification
 * - Dark web breach monitoring
 * - AI Guardian chatbot
 */

// ============================================
// USER TYPES
// ============================================

export interface ShieldUser {
  userId: string;
  phone: string;
  email?: string;
  trustScore: number;
  trustLevel: TrustLevel;
  registeredAt: Date;
  lastActive: Date;
  plan: SubscriptionPlan;
  verified: {
    phone: boolean;
    email: boolean;
    aadhaar?: boolean;
    pan?: boolean;
  };
}

export type TrustLevel = 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'LOW' | 'UNVERIFIED';

export type SubscriptionPlan = 'free' | 'shield' | 'shield_plus';

// ============================================
// SCAM DETECTION TYPES
// ============================================

export interface ScamCallResult {
  callId: string;
  phoneNumber: string;
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'LIKELY_SCAM' | 'CONFIRMED_SCAM';
  riskScore: number;
  category?: ScamCategory;
  warnings: string[];
  recommendations: string[];
  communityReports?: number;
  lastReported?: Date;
}

export type ScamCategory =
  | 'bank_impersonation'
  | 'govt_impersonation'
  | 'tech_support_scam'
  | 'lottery_scam'
  | 'job_scam'
  | 'investment_scam'
  | 'romance_scam'
  | 'delivery_scam'
  | 'kyc_scam'
  | 'unknown';

export interface SMSAnalysisResult {
  messageId: string;
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'LIKELY_SCAM' | 'CONFIRMED_SCAM';
  riskScore: number;
  detections: SMSDetection[];
  warnings: string[];
  sanitizedContent?: string;
}

export interface SMSDetection {
  type: 'phishing_link' | 'otp_request' | 'urgency_language' | 'impersonation' | 'lottery_scam' | 'fake_offer';
  confidence: number;
  description: string;
  matchedPattern: string;
}

// ============================================
// UPI SAFETY TYPES
// ============================================

export interface UPIVerification {
  upiId: string;
  recipientName?: string;
  merchantName?: string;
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'LIKELY_FRAUD' | 'CONFIRMED_FRAUD';
  riskScore: number;
  trustScore?: number;
  verifications: {
    merchantVerified: boolean;
    kycVerified: boolean;
    complaintsCount: number;
    transactionCount: number;
    avgRating?: number;
  };
  warnings: string[];
  recommendation: 'pay' | 'review' | 'avoid';
}

export interface QRCodeAnalysis {
  qrId: string;
  data: string;
  type: 'upi' | 'url' | 'text' | 'vcard' | 'unknown';
  parsedData?: {
    upiId?: string;
    merchantName?: string;
    amount?: number;
    url?: string;
  };
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'LIKELY_FRAUD' | 'CONFIRMED_FRAUD';
  riskScore: number;
  warnings: string[];
  recommendation: 'scan' | 'review' | 'avoid';
}

// ============================================
// BREACH MONITORING TYPES
// ============================================

export interface BreachAlert {
  alertId: string;
  userId: string;
  breachType: 'email' | 'phone' | 'pan' | 'aadhaar' | 'password' | 'credit_card';
  source: string;
  dataLeaked: string[];
  detectedAt: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'new' | 'viewed' | 'resolved';
  recommendations: string[];
}

export interface BreachCheck {
  type: 'email' | 'phone' | 'pan' | 'aadhaar';
  value: string;
  foundInBreaches: number;
  breaches: {
    source: string;
    date: Date;
    dataTypes: string[];
  }[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ============================================
// TRUST SCORE TYPES
// ============================================

export interface TrustScoreDetails {
  userId: string;
  score: number;
  level: TrustLevel;
  factors: TrustFactor[];
  badges: TrustBadge[];
  improvements: string[];
  history: {
    date: Date;
    score: number;
  }[];
}

export interface TrustFactor {
  factor: string;
  contribution: number;
  description: string;
}

export interface TrustBadge {
  badge: string;
  description: string;
  awardedAt: Date;
  icon: string;
}

// ============================================
// AI GUARDIAN TYPES
// ============================================

export interface GuardianQuery {
  queryId: string;
  userId: string;
  question: string;
  category?: GuardianCategory;
  context?: string;
}

export type GuardianCategory =
  | 'scam_check'
  | 'upi_safety'
  | 'password_security'
  | 'phishing'
  | 'investment_fraud'
  | 'general';

export interface GuardianResponse {
  queryId: string;
  answer: string;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  sources?: string[];
  recommendations: string[];
  relatedQuestions?: string[];
}

// ============================================
// ALERT TYPES
// ============================================

export interface ShieldAlert {
  alertId: string;
  userId: string;
  type: 'scam_call' | 'scam_sms' | 'upi_fraud' | 'breach' | 'suspicious_activity';
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
  status: 'new' | 'viewed' | 'dismissed' | 'action_taken';
  actionTaken?: string;
  metadata?: Record<string, any>;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface RegisterRequest {
  phone: string;
  email?: string;
  name?: string;
}

export interface RegisterResponse {
  userId: string;
  phone: string;
  trustScore: number;
  verificationRequired: boolean;
}

export interface CheckScamRequest {
  phoneNumber: string;
  callerName?: string;
}

export interface AnalyzeSMSRequest {
  message: string;
  sender?: string;
}

export interface VerifyUPIRequest {
  upiId: string;
  amount?: number;
}

export interface AnalyzeQRRequest {
  qrData: string;
}

export interface CheckBreachRequest {
  type: 'email' | 'phone' | 'pan' | 'aadhaar';
  value: string;
}

export interface GuardianChatRequest {
  question: string;
  category?: GuardianCategory;
  context?: string;
}
