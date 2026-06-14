/**
 * Scam Detection Engine
 *
 * Detects scam calls, SMS phishing, and fraudulent messages.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ScamCallResult,
  SMSAnalysisResult,
  SMSDetection,
  ScamCategory
} from '../types/index.js';

// ============================================
// SCAM PATTERNS
// ============================================

const PHISHING_PATTERNS = {
  // Urgency patterns
  urgency: [
    /urgent(ly)?/gi,
    /immediately/gi,
    /right now/gi,
    /within \d+ hour/gi,
    /expire[ds]/gi,
    /last chance/gi,
    /act now/gi,
    /don'?t miss/gi
  ],

  // Bank impersonation
  bank: [
    /bank of (india|baroda|hdfc|icici|sbi)/gi,
    /(sbi|bank) (account|kYC|kyc) (blocked|suspended|expired)/gi,
    /update (your )?k(?:yc|YC)/gi,
    /(verify|confirm) (your )?(account|details)/gi,
    /account (will be|might be) (blocked|closed|suspended)/gi
  ],

  // Government impersonation
  govt: [
    /(govt|government|income tax|tax|police|court)/gi,
    /aadhaar.*update/gi,
    /pan.*(card)?.*update/gi,
    /(legal|arrest|warrant|jail)/gi,
    /(verify|validate).*(aadhaar|pan|document)/gi
  ],

  // Prize/lottery scams
  prize: [
    /congratulations?/gi,
    /(won|win).*(₹|rs\.?|rupees|lakh|lac|crore|prize|reward|gift)/gi,
    /(lottery|draw|raffle|winner)/gi,
    /claim.*(now|your|prize)/gi,
    /(free|0 cost|no charge)/gi
  ],

  // OTP/Credential scams
  otp: [
    /(otp|one time|security|passcode|password).*(don'?t|never|do not|should not).*(share|give|tell|reveal)/gi,
    /(otp|pin|password).*(will|would|can).*(expire|be|valid)/gi,
    /(share|give|tell).*(otp|pin|password)/gi
  ],

  // Job scams
  job: [
    /(job|work from home|part time|freelance).*(offer|vacancy|opportunity)/gi,
    /(apply|register).*(now|free|₹|rs)/gi,
    /no experience (required|needed)/gi,
    /(earn|make).*(₹|rs\.?|per day|per week)/gi,
    /registration.*fee/gi
  ],

  // Investment scams
  investment: [
    /(invest|investment).*(double|guarantee|high return)/gi,
    /(bitcoin|crypto|cryptocurrency|nifty|fifty|stock|mutual fund).*(tip|pick|recommendation)/gi,
    /(make|safe|guaranteed).*(profit|return|money)/gi,
    /(trading|trader).*(tip|signal|group)/gi
  ]
};

const SUSPICIOUS_URL_PATTERNS = [
  // Lookalike bank domains
  /sbi[_-]?(secure|login|verify|update)[.-]/gi,
  /hdfc[_-]?(bank|login|secure)[.-]/gi,
  /icici[_-]?(bank|login|secure)[.-]/gi,
  /(bank|axis|sbi|hdfc|icici)[-.]xyz/gi,
  /[a-z0-9]+[.-](bank|secure|login|verify)[.-]/gi,

  // Suspicious TLDs
  /\.xyz$/i,
  /\.top$/i,
  /\.work$/i,
  /\.click$/i,
  /\.loan$/i,
  /\.science$/i,
  /\.date$/i,
  /\.win$/i,
  /\.racing$/i
];

// ============================================
// SCAM DETECTOR CLASS
// ============================================

export class ScamDetector {
  // Simulated scam database (in production, would query actual database)
  private scamDatabase: Map<string, { count: number; lastReported: Date; category: ScamCategory }> = new Map();

  constructor() {
    // Initialize with some known scam numbers (simulated)
    this.scamDatabase.set('9876543210', { count: 45, lastReported: new Date(), category: 'bank_impersonation' });
    this.scamDatabase.set('9876543211', { count: 23, lastReported: new Date(), category: 'govt_impersonation' });
    this.scamDatabase.set('9876543212', { count: 89, lastReported: new Date(), category: 'lottery_scam' });
  }

  /**
   * Check if a phone number is a scam
   */
  checkPhone(phoneNumber: string, callerName?: string): ScamCallResult {
    const callId = `call_${uuidv4().slice(0, 8)}`;
    const normalizedPhone = this.normalizePhone(phoneNumber);

    // Check against scam database
    const dbEntry = this.scamDatabase.get(normalizedPhone);

    if (dbEntry) {
      return {
        callId,
        phoneNumber,
        riskLevel: this.getRiskLevel(dbEntry.count),
        riskScore: Math.min(95, 50 + dbEntry.count),
        category: dbEntry.category,
        warnings: this.getCategoryWarnings(dbEntry.category),
        recommendations: this.getCategoryRecommendations(dbEntry.category),
        communityReports: dbEntry.count,
        lastReported: dbEntry.lastReported
      };
    }

    // Check phone number patterns
    const phoneWarnings = this.analyzePhonePatterns(phoneNumber);

    // Check caller name if provided
    const nameWarnings = callerName ? this.analyzeCallerName(callerName) : [];

    const allWarnings = [...phoneWarnings, ...nameWarnings];
    const riskScore = this.calculateRiskScore(0, allWarnings);

    return {
      callId,
      phoneNumber,
      riskLevel: this.getRiskLevel(riskScore),
      riskScore,
      warnings: allWarnings,
      recommendations: this.getRecommendations(riskScore, allWarnings),
      communityReports: 0
    };
  }

  /**
   * Analyze SMS for phishing/scam
   */
  analyzeSMS(message: string, sender?: string): SMSAnalysisResult {
    const messageId = `sms_${uuidv4().slice(0, 8)}`;
    const detections: SMSDetection[] = [];

    // Check for phishing URLs
    const urlMatches = message.match(/https?:\/\/[^\s]+/gi) || [];
    for (const url of urlMatches) {
      for (const pattern of SUSPICIOUS_URL_PATTERNS) {
        if (pattern.test(url)) {
          detections.push({
            type: 'phishing_link',
            confidence: 0.85,
            description: `Suspicious URL detected: ${url.substring(0, 30)}...`,
            matchedPattern: 'lookalike_domain'
          });
        }
      }
    }

    // Check for OTP requests
    if (/otp|password|pin|security code/i.test(message)) {
      const hasWarningPhrase = /don'?t share|never share|do not share/i.test(message);
      detections.push({
        type: 'otp_request',
        confidence: hasWarningPhrase ? 0.6 : 0.3,
        description: hasWarningPhrase
          ? 'Legitimate security message'
          : 'Potential OTP scam - real banks never ask for OTP',
        matchedPattern: hasWarningPhrase ? 'safe_otp' : 'unsafe_otp_request'
      });
    }

    // Check for urgency
    for (const pattern of PHISHING_PATTERNS.urgency) {
      if (pattern.test(message)) {
        detections.push({
          type: 'urgency_language',
          confidence: 0.7,
          description: 'Urgency tactics detected - scammers create pressure',
          matchedPattern: 'urgency'
        });
        break;
      }
    }

    // Check for bank impersonation
    for (const pattern of PHISHING_PATTERNS.bank) {
      if (pattern.test(message)) {
        detections.push({
          type: 'impersonation',
          confidence: 0.8,
          description: 'Potential bank impersonation - verify through official channels',
          matchedPattern: 'bank_keywords'
        });
        break;
      }
    }

    // Check for govt impersonation
    for (const pattern of PHISHING_PATTERNS.govt) {
      if (pattern.test(message)) {
        detections.push({
          type: 'impersonation',
          confidence: 0.75,
          description: 'Potential government impersonation - govt never asks for personal details via SMS',
          matchedPattern: 'govt_keywords'
        });
        break;
      }
    }

    // Check for lottery/prize scams
    for (const pattern of PHISHING_PATTERNS.prize) {
      if (pattern.test(message)) {
        detections.push({
          type: 'lottery_scam',
          confidence: 0.9,
          description: 'Likely lottery/prize scam - you cannot win a lottery you did not enter',
          matchedPattern: 'prize_keywords'
        });
        break;
      }
    }

    // Check for fake offers
    for (const pattern of PHISHING_PATTERNS.job) {
      if (pattern.test(message)) {
        detections.push({
          type: 'fake_offer',
          confidence: 0.75,
          description: 'Potential job/offer scam - verify before applying',
          matchedPattern: 'job_keywords'
        });
        break;
      }
    }

    // Calculate overall risk
    const riskScore = this.calculateRiskScore(0, detections.map(d => d.description));
    const riskLevel = this.getRiskLevel(riskScore);

    // Sanitize content (remove sensitive parts)
    let sanitizedContent = message;
    sanitizedContent = sanitizedContent.replace(/\d{10,}/g, 'XXXXXX####'); // Phone numbers
    sanitizedContent = sanitizedContent.replace(/₹[\d,]+/g, '₹XX,XXX'); // Amounts

    return {
      messageId,
      riskLevel,
      riskScore,
      detections,
      warnings: detections.map(d => d.description),
      sanitizedContent
    };
  }

  /**
   * Report a scam call/SMS
   */
  reportScam(phoneNumber: string, type: 'call' | 'sms', category: ScamCategory): void {
    const normalizedPhone = this.normalizePhone(phoneNumber);
    const existing = this.scamDatabase.get(normalizedPhone);

    if (existing) {
      existing.count++;
      existing.lastReported = new Date();
    } else {
      this.scamDatabase.set(normalizedPhone, {
        count: 1,
        lastReported: new Date(),
        category
      });
    }
  }

  /**
   * Analyze phone number patterns
   */
  private analyzePhonePatterns(phone: string): string[] {
    const warnings: string[] = [];

    // Check for unusual prefixes
    if (phone.startsWith('+91')) {
      // Indian number - check if it's from unusual range
    }

    // Check for international numbers
    if (phone.startsWith('+1') || phone.startsWith('+44')) {
      warnings.push('International call - verify caller identity');
    }

    // Check for common spam prefixes
    const spamPrefixes = ['140', '1800', '1860'];
    for (const prefix of spamPrefixes) {
      if (phone.includes(prefix)) {
        warnings.push('Automated/toll-free number - be cautious');
      }
    }

    return warnings;
  }

  /**
   * Analyze caller name
   */
  private analyzeCallerName(name: string): string[] {
    const warnings: string[] = [];
    const lowerName = name.toLowerCase();

    // Check for bank names
    if (/sbi|hdfc|icici|axis|bank/i.test(lowerName)) {
      warnings.push('Bank caller - verify by calling official number');
    }

    // Check for govt keywords
    if (/govt|government|income tax|police/i.test(lowerName)) {
      warnings.push('Government caller - verify through official channels');
    }

    return warnings;
  }

  /**
   * Normalize phone number
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').slice(-10);
  }

  /**
   * Get risk level from score
   */
  private getRiskLevel(score: number): ScamCallResult['riskLevel'] {
    if (score >= 80) return 'CONFIRMED_SCAM';
    if (score >= 60) return 'LIKELY_SCAM';
    if (score >= 30) return 'SUSPICIOUS';
    return 'SAFE';
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(baseScore: number, warnings: string[]): number {
    let score = baseScore;
    for (const warning of warnings) {
      if (warning.includes('phishing') || warning.includes('impersonation')) {
        score += 25;
      } else if (warning.includes('suspicious')) {
        score += 15;
      } else if (warning.includes('verify')) {
        score += 10;
      }
    }
    return Math.min(100, score);
  }

  /**
   * Get category-specific warnings
   */
  private getCategoryWarnings(category: ScamCategory): string[] {
    const warnings: Record<ScamCategory, string[]> = {
      bank_impersonation: [
        'Bank impersonation detected',
        'Never share OTP or password with callers',
        'Verify through official bank app or branch'
      ],
      govt_impersonation: [
        'Government impersonation detected',
        'Govt never asks for personal details via phone',
        'Police/govt never threatens over phone'
      ],
      tech_support_scam: [
        'Tech support scam detected',
        'Microsoft/Google never calls first',
        'Never give remote access to strangers'
      ],
      lottery_scam: [
        'Lottery scam detected',
        'You cannot win a lottery without entering',
        'No fees required for prize claims'
      ],
      job_scam: [
        'Job scam detected',
        'Verify company before applying',
        'Never pay registration fees upfront'
      ],
      investment_scam: [
        'Investment scam detected',
        'Guaranteed returns are always scams',
        'SEBI registered advisors only'
      ],
      romance_scam: [
        'Romance scam detected',
        'Never send money to online acquaintances',
        'Verify identity through video call'
      ],
      delivery_scam: [
        'Delivery scam detected',
        'Verify tracking through official app',
        'Never pay for failed delivery attempts'
      ],
      kyc_scam: [
        'KYC scam detected',
        'Banks never ask for KYC via phone/SMS',
        'Update KYC at bank branch only'
      ],
      unknown: [
        'Unknown caller - be cautious',
        'Verify caller identity before sharing any information'
      ]
    };

    return warnings[category] || warnings.unknown;
  }

  /**
   * Get category-specific recommendations
   */
  private getCategoryRecommendations(category: ScamCategory): string[] {
    const recommendations: Record<ScamCategory, string[]> = {
      bank_impersonation: [
        'Hang up and call the number on your card',
        'Do not share any personal information',
        'Report to your bank immediately'
      ],
      govt_impersonation: [
        'Hang up immediately',
        'Report to cyber crime helpline: 1930',
        'Block this number'
      ],
      tech_support_scam: [
        'Hang up immediately',
        'Microsoft support never initiates calls',
        'Report as spam'
      ],
      lottery_scam: [
        'This is a scam - delete the message',
        'Block and report the number',
        'Remember: you cannot win lotteries you did not enter'
      ],
      job_scam: [
        'Verify company on official website',
        'Never pay any registration fees',
        'Check reviews and complaints online'
      ],
      investment_scam: [
        'Do not invest without verification',
        'Check SEBI website for registered advisors',
        'Report to SEBI helpline'
      ],
      romance_scam: [
        'Never send money to online acquaintances',
        'Verify through video call',
        'Be cautious of overseas relationships'
      ],
      delivery_scam: [
        'Track package only through official app',
        'Do not click unknown links',
        'Verify with delivery company directly'
      ],
      kyc_scam: [
        'KYC updates done only at bank',
        'Do not share documents via link',
        'Report immediately to bank'
      ],
      unknown: [
        'Verify caller identity through official channels',
        'Do not share personal information',
        'When in doubt, hang up'
      ]
    };

    return recommendations[category] || recommendations.unknown;
  }

  /**
   * Get general recommendations
   */
  private getRecommendations(riskScore: number, warnings: string[]): string[] {
    if (riskScore >= 60) {
      return [
        'Do not share any personal information',
        'Do not follow any instructions from this caller',
        'Hang up and block this number',
        'Report to cyber crime helpline: 1930'
      ];
    }

    if (riskScore >= 30) {
      return [
        'Verify caller identity through official channels',
        'Do not share sensitive information',
        'When in doubt, hang up'
      ];
    }

    return [
      'Caller appears legitimate',
      'Still verify sensitive requests',
      'Do not share OTP with anyone'
    ];
  }
}

// Export singleton
export const scamDetector = new ScamDetector();
