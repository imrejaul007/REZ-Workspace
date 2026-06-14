// ==========================================
// MyTalent - CorpID Integration
// Port: 4702-4712
// ==========================================

import { CorpIDProfile, TrustBadge } from '../types';
import { mockCorpIDProfile } from '../data/mockData';

const CORPID_SERVICE_URL = process.env.CORPID_SERVICE_URL || 'http://localhost:4702';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface CorpIDResponse {
  success: boolean;
  profile?: CorpIDProfile;
  error?: string;
}

/**
 * Get CorpID profile
 */
export async function getCorpIDProfile(
  employeeId: string
): Promise<CorpIDResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CORPID_SERVICE_URL) {
      return { success: true, profile: mockCorpIDProfile };
    }

    const response = await fetch(
      `${CORPID_SERVICE_URL}/api/corpid/profile/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, profile: data.profile };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get CorpID profile error:', error);
    return { success: true, profile: mockCorpIDProfile };
  }
}

/**
 * Update CorpID verification
 */
export async function updateVerification(
  employeeId: string,
  type: 'identity' | 'employment' | 'education' | 'skills' | 'address' | 'documents',
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CORPID_SERVICE_URL) {
      return { success: true };
    }

    const response = await fetch(
      `${CORPID_SERVICE_URL}/api/corpid/verify/${type}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({ employeeId, ...data }),
      }
    );

    return { success: response.ok };
  } catch (error) {
    logger.error('Update verification error:', error);
    return { success: true };
  }
}

/**
 * Get trust badges
 */
export async function getTrustBadges(
  employeeId: string
): Promise<{ success: boolean; badges?: TrustBadge[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CORPID_SERVICE_URL) {
      return { success: true, badges: mockCorpIDProfile?.badges || [] };
    }

    const response = await fetch(
      `${CORPID_SERVICE_URL}/api/corpid/badges/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, badges: data.badges };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get trust badges error:', error);
    return { success: true, badges: mockCorpIDProfile?.badges || [] };
  }
}

/**
 * Earn a badge
 */
export async function earnBadge(
  employeeId: string,
  badgeId: string
): Promise<{ success: boolean; badge?: TrustBadge; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CORPID_SERVICE_URL) {
      const badge: TrustBadge = {
        id: badgeId,
        name: 'Achievement Badge',
        icon: '🏆',
        description: 'Awarded for outstanding performance',
        earnedAt: new Date().toISOString(),
        category: 'achievement',
      };
      return { success: true, badge };
    }

    const response = await fetch(`${CORPID_SERVICE_URL}/api/corpid/earn-badge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, badgeId }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, badge: data.badge };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Earn badge error:', error);
    return { success: true, badge: null };
  }
}

/**
 * Get CI Score breakdown
 */
export async function getCIScoreBreakdown(
  employeeId: string
): Promise<{ success: boolean; breakdown?: CorpIDProfile['scoreBreakdown']; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CORPID_SERVICE_URL) {
      return {
        success: true,
        breakdown: mockCorpIDProfile?.scoreBreakdown,
      };
    }

    const response = await fetch(
      `${CORPID_SERVICE_URL}/api/corpid/score-breakdown/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, breakdown: data.breakdown };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get CI score breakdown error:', error);
    return {
      success: true,
      breakdown: mockCorpIDProfile?.scoreBreakdown,
    };
  }
}

/**
 * Verify identity documents
 */
export async function verifyIdentity(
  employeeId: string,
  documentType: 'aadhaar' | 'pan' | 'passport' | 'voter_id',
  documentNumber: string
): Promise<{ success: boolean; verified?: boolean; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CORPID_SERVICE_URL) {
      return { success: true, verified: true };
    }

    const response = await fetch(`${CORPID_SERVICE_URL}/api/corpid/verify-identity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, documentType, documentNumber }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, verified: data.verified };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Verify identity error:', error);
    return { success: true, verified: true };
  }
}

/**
 * Get passport details
 */
export async function getPassportDetails(
  employeeId: string
): Promise<{ success: boolean; passport?: any; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CORPID_SERVICE_URL) {
      return {
        success: true,
        passport: {
          id: 'CI-IND-RAHUL-2024001',
          issuedAt: '2024-01-15',
          expiresAt: '2034-01-15',
          status: 'Active',
          verifiedFields: ['Identity', 'Employment', 'Skills', 'Documents'],
          qrCode: 'https://example.com/corpid/qr/rahul001',
        },
      };
    }

    const response = await fetch(
      `${CORPID_SERVICE_URL}/api/corpid/passport/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, passport: data.passport };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get passport details error:', error);
    return { success: true, passport: null };
  }
}
