/**
 * REZ Recognition & Gamification Service
 * Integrates with REZ Media (Karma/Coins), REZ Intelligence (AI suggestions), RABTUL (Auth/Wallet)
 */

const REZ_MEDIA_API = process.env.REZ_MEDIA_API || 'https://rez-media.rezapp.com/api';
const REZ_INTELLIGENCE_API = process.env.REZ_INTELLIGENCE_API || 'https://rez-intelligence.rezapp.com/api';
const KARMA_SERVICE = process.env.KARMA_SERVICE || 'https://karma.rezapp.com/api';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Recognition {
  id: string;
  from: string;
  to: string;
  badge?: string;
  coins?: number;
  message: string;
  timestamp: Date;
  likes: number;
  comments: Comment[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold';
  criteria: string;
  points: number;
}

export interface LeaderboardEntry {
  rank: number;
  employee: string;
  department: string;
  points: number;
  trend: 'up' | 'down' | 'stable';
  avatar?: string;
}

// ─── Utility: Fetch with Timeout ─────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms for ${url}`);
    }
    throw error;
  }
}

// ─── Recognition API ───────────────────────────────────────────────────────────

export async function giveRecognition(data: {
  from: string;
  to: string;
  badge?: string;
  coins?: number;
  message: string;
}): Promise<{ success: boolean; recognition?: Recognition; karmaPoints?: number; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${KARMA_SERVICE}/recognition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    return response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] giveRecognition failed:', message);
    return { success: false, error: message };
  }
}

export async function getRecognitionFeed(companyId: string): Promise<Recognition[]> {
  try {
    const response = await fetchWithTimeout(`${KARMA_SERVICE}/recognition/feed/${companyId}`);

    if (!response.ok) {
      logger.error(`[Recognition] getRecognitionFeed failed: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.feed || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] getRecognitionFeed failed:', message);
    return [];
  }
}

export async function likeRecognition(recognitionId: string): Promise<{ likes: number; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${KARMA_SERVICE}/recognition/${recognitionId}/like`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { likes: 0, error: errorData.error || `HTTP ${response.status}` };
    }

    return response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] likeRecognition failed:', message);
    return { likes: 0, error: message };
  }
}

// ─── Badges ─────────────────────────────────────────────────────────────────────

export async function awardBadge(data: {
  employeeId: string;
  badgeId: string;
  companyId: string;
}): Promise<{ success: boolean; badge?: Badge; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${KARMA_SERVICE}/badges/award`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    return response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] awardBadge failed:', message);
    return { success: false, error: message };
  }
}

export async function getBadges(): Promise<Badge[]> {
  try {
    const response = await fetchWithTimeout(`${KARMA_SERVICE}/badges`);

    if (!response.ok) {
      logger.error(`[Recognition] getBadges failed: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.badges || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] getBadges failed:', message);
    return [];
  }
}

export async function getEmployeeBadges(employeeId: string): Promise<Badge[]> {
  try {
    const response = await fetchWithTimeout(`${KARMA_SERVICE}/badges/employee/${employeeId}`);

    if (!response.ok) {
      logger.error(`[Recognition] getEmployeeBadges failed: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.badges || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] getEmployeeBadges failed:', message);
    return [];
  }
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────────

export async function getLeaderboard(companyId: string, period: 'day' | 'week' | 'month'): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetchWithTimeout(`${KARMA_SERVICE}/leaderboard/${companyId}?period=${period}`);

    if (!response.ok) {
      logger.error(`[Recognition] getLeaderboard failed: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.leaderboard || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] getLeaderboard failed:', message);
    return [];
  }
}

// ─── REZ Media Integration (Coins) ────────────────────────────────────────────

export async function awardCoins(employeeId: string, coins: number, source: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${REZ_MEDIA_API}/coins/award`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, coins, source }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    return response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] awardCoins failed:', message);
    return { success: false, error: message };
  }
}

export async function redeemCoins(employeeId: string, merchantId: string, coins: number): Promise<{ success: boolean; balance?: number; voucher?: string; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${REZ_MEDIA_API}/coins/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, merchantId, coins }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    return response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] redeemCoins failed:', message);
    return { success: false, error: message };
  }
}

export async function getCoinBalance(employeeId: string): Promise<number> {
  try {
    const response = await fetchWithTimeout(`${REZ_MEDIA_API}/coins/balance/${employeeId}`);

    if (!response.ok) {
      logger.error(`[Recognition] getCoinBalance failed: HTTP ${response.status}`);
      return 0;
    }

    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] getCoinBalance failed:', message);
    return 0;
  }
}

// ─── AI Suggestions (REZ Intelligence) ─────────────────────────────────────────

export async function getAISuggestions(employeeId: string): Promise<{
  recognitionSuggestions: string[];
  badgeRecommendations: string[];
  engagementTips: string[];
}> {
  try {
    const response = await fetchWithTimeout(`${REZ_INTELLIGENCE_API}/culture/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });

    if (!response.ok) {
      logger.error(`[Recognition] getAISuggestions failed: HTTP ${response.status}`);
      return { recognitionSuggestions: [], badgeRecommendations: [], engagementTips: [] };
    }

    return response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] getAISuggestions failed:', message);
    return { recognitionSuggestions: [], badgeRecommendations: [], engagementTips: [] };
  }
}

export async function getMoodAnalysis(): Promise<{
  companyMood: number;
  trends: { date: string; score: number }[];
  alerts: string[];
}> {
  try {
    const response = await fetchWithTimeout(`${REZ_INTELLIGENCE_API}/culture/mood`);

    if (!response.ok) {
      logger.error(`[Recognition] getMoodAnalysis failed: HTTP ${response.status}`);
      return { companyMood: 0, trends: [], alerts: [] };
    }

    return response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] getMoodAnalysis failed:', message);
    return { companyMood: 0, trends: [], alerts: [] };
  }
}

// ─── RABTUL Integration (Wallet) ───────────────────────────────────────────────

export async function creditWallet(employeeId: string, amount: number, reason: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout('https://rez-wallet-service.onrender.com/api/wallet/credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, amount, reason }),
    });

    if (!response.ok) {
      logger.error(`[Recognition] creditWallet failed: HTTP ${response.status}`);
      return false;
    }

    return response.ok;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Recognition] creditWallet failed:', message);
    return false;
  }
}
