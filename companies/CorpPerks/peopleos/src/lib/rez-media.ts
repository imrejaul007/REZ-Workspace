/**
 * REZ Media Integration
 * PeopleOS → Karma, Gamification, Rewards
 */

const REZ_MEDIA = {
  KARMA: process.env.KARMA_SERVICE || 'https://karma.rezapp.com/api',
  GAMIFICATION: process.env.REZ_GAMIFICATION_URL || 'https://gamification.rezapp.com/api',
  COINS: process.env.REZ_COINS_API || 'https://coins.rezapp.com/api',
  REWARDS: process.env.REZ_REWARDS_URL || 'https://rewards.rezapp.com/api',
};

// ─── Karma Service ────────────────────────────────────────

export async function awardKarma(employeeId: string, points: number, reason: string) {
  const res = await fetch(`${REZ_MEDIA.KARMA}/award`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, points, reason }),
  });
  return res.json();
}

export async function getKarmaBalance(employeeId: string) {
  const res = await fetch(`${REZ_MEDIA.KARMA}/balance/${employeeId}`);
  return res.json();
}

export async function getKarmaHistory(employeeId: string) {
  const res = await fetch(`${REZ_MEDIA.KARMA}/history/${employeeId}`);
  return res.json();
}

// ─── Gamification ──────────────────────────────────────

export async function awardBadge(employeeId: string, badgeId: string) {
  const res = await fetch(`${REZ_MEDIA.GAMIFICATION}/badges/award`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, badgeId }),
  });
  return res.json();
}

export async function getEmployeeBadges(employeeId: string) {
  const res = await fetch(`${REZ_MEDIA.GAMIFICATION}/badges/${employeeId}`);
  return res.json();
}

export async function startChallenge(challengeId: string, employeeIds: string[]) {
  const res = await fetch(`${REZ_MEDIA.GAMIFICATION}/challenges/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, employeeIds }),
  });
  return res.json();
}

// ─── Coins & Rewards ────────────────────────────────────

export async function awardCoins(employeeId: string, amount: number, source: string) {
  const res = await fetch(`${REZ_MEDIA.COINS}/award`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, amount, source }),
  });
  return res.json();
}

export async function redeemRewards(employeeId: string, rewardId: string) {
  const res = await fetch(`${REZ_MEDIA.REWARDS}/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, rewardId }),
  });
  return res.json();
}

export async function getLeaderboard(period: 'day' | 'week' | 'month' = 'week') {
  const res = await fetch(`${REZ_MEDIA.GAMIFICATION}/leaderboard?period=${period}`);
  return res.json();
}

// ─── Recognition Integration ──────────────────────────────

export async function recognizePeer(from: string, to: string, message: string) {
  const res = await fetch(`${REZ_MEDIA.KARMA}/recognize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, message }),
  });
  return res.json();
}

export async function getRecognitionFeed(companyId: string) {
  const res = await fetch(`${REZ_MEDIA.KARMA}/feed/${companyId}`);
  return res.json();
}
