/**
 * Campaign Utilities
 *
 * Helper functions for campaign visibility logic, progress tracking,
 * and display formatting.
 */

import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  type: 'MISSION_SPRINT' | 'FESTIVAL' | 'CATEGORY_PUSH';
  goal: string;
  reward: string;
  endsAt: string;
  image?: string;
  isJoined: boolean;
  isCompleted: boolean;
  progress?: {
    completed: number;
    target: number;
  };
}

export interface CampaignVisibility {
  shouldShow: boolean;
  activeCampaigns: Campaign[];
  priority: 'high' | 'medium' | 'low';
}

export interface CampaignProgress {
  completed: number;
  target: number;
  percentage: number;
  remaining: number;
}

export type CampaignStatus = 'upcoming' | 'active' | 'expiring_soon' | 'completed';

// =============================================================================
// TYPE BADGES & LABELS
// =============================================================================

export const TYPE_BADGES: Record<Campaign['type'], string> = {
  MISSION_SPRINT: '🏃',
  FESTIVAL: '🎉',
  CATEGORY_PUSH: '📈',
};

export const TYPE_LABELS: Record<Campaign['type'], string> = {
  MISSION_SPRINT: 'Mission Sprint',
  FESTIVAL: 'Festival',
  CATEGORY_PUSH: 'Category Push',
};

export const TYPE_COLORS: Record<Campaign['type'], string> = {
  MISSION_SPRINT: colors.brand.orange,
  FESTIVAL: colors.brand.purple,
  CATEGORY_PUSH: colors.brand.green,
};

// =============================================================================
// VISIBILITY LOGIC
// =============================================================================

/**
 * Gets visible campaigns for display.
 *
 * Rules:
 * - Only show campaigns user has joined
 * - Only show campaigns that are not completed
 * - Priority is medium by default
 */
export function getVisibleCampaigns(campaigns: Campaign[] | null | undefined): CampaignVisibility {
  if (!campaigns || campaigns.length === 0) {
    return {
      shouldShow: false,
      activeCampaigns: [],
      priority: 'low',
    };
  }

  const active = campaigns.filter((c) => c.isJoined && !c.isCompleted);

  // Determine priority based on campaign types
  let priority: CampaignVisibility['priority'] = 'medium';
  if (active.some((c) => c.type === 'FESTIVAL')) {
    priority = 'high';
  } else if (active.some((c) => c.type === 'MISSION_SPRINT')) {
    priority = 'high';
  }

  return {
    shouldShow: active.length > 0,
    activeCampaigns: active,
    priority,
  };
}

/**
 * Gets the most important campaign to show at the top.
 */
export function getTopCampaign(campaigns: Campaign[] | null | undefined): Campaign | null {
  if (!campaigns || campaigns.length === 0) return null;

  const visible = getVisibleCampaigns(campaigns);
  if (visible.activeCampaigns.length === 0) return null;

  // Priority: FESTIVAL > MISSION_SPRINT > CATEGORY_PUSH
  const priority: Record<Campaign['type'], number> = {
    FESTIVAL: 1,
    MISSION_SPRINT: 2,
    CATEGORY_PUSH: 3,
  };

  const sorted = [...visible.activeCampaigns].sort((a, b) => {
    return priority[a.type] - priority[b.type];
  });

  return sorted[0];
}

/**
 * Checks if user should see the campaign banner.
 */
export function shouldShowCampaignBanner(
  campaigns: Campaign[] | null | undefined,
  userCoins: number
): boolean {
  // Don't show if user has enough coins
  if (userCoins >= 200) return false;

  const visible = getVisibleCampaigns(campaigns);
  return visible.shouldShow;
}

// =============================================================================
// PROGRESS TRACKING
// =============================================================================

/**
 * Calculates campaign progress details.
 */
export function getCampaignProgress(campaign: Campaign): CampaignProgress {
  const completed = campaign.progress?.completed ?? 0;
  const target = campaign.progress?.target ?? 1;
  const percentage = target > 0 ? Math.round((completed / target) * 100) : 0;
  const remaining = Math.max(0, target - completed);

  return {
    completed,
    target,
    percentage: Math.min(100, Math.max(0, percentage)),
    remaining,
  };
}

/**
 * Gets a formatted progress string.
 */
export function formatCampaignProgress(campaign: Campaign): string {
  const progress = getCampaignProgress(campaign);
  return `${progress.completed}/${progress.target}`;
}

/**
 * Checks if campaign is almost complete (>= 80%).
 */
export function isAlmostComplete(campaign: Campaign): boolean {
  const progress = getCampaignProgress(campaign);
  return progress.percentage >= 80;
}

/**
 * Gets the urgency level based on time remaining.
 */
export function getCampaignUrgency(campaign: Campaign): 'high' | 'medium' | 'low' {
  const now = Date.now();
  const endsAt = new Date(campaign.endsAt).getTime();
  const hoursLeft = (endsAt - now) / (1000 * 60 * 60);

  if (hoursLeft < 0) return 'low';
  if (hoursLeft < 24) return 'high';
  if (hoursLeft < 72) return 'medium';
  return 'low';
}

// =============================================================================
// STATUS MANAGEMENT
// =============================================================================

/**
 * Determines the status of a campaign.
 */
export function getCampaignStatus(campaign: Campaign): CampaignStatus {
  const now = Date.now();
  const endsAt = new Date(campaign.endsAt).getTime();
  const hoursLeft = (endsAt - now) / (1000 * 60 * 60);
  const progress = getCampaignProgress(campaign);

  if (campaign.isCompleted) return 'completed';
  if (hoursLeft < 0) return 'completed';
  if (progress.percentage >= 100) return 'completed';
  if (hoursLeft < 24) return 'expiring_soon';

  const daysUntilStart = getDaysUntilStart(campaign);
  if (daysUntilStart > 0) return 'upcoming';

  return 'active';
}

/**
 * Gets the number of days until a campaign starts.
 * Returns 0 if already started.
 */
export function getDaysUntilStart(campaign: Campaign): number {
  // Campaigns don't have a start date, so assume they're always active
  return 0;
}

/**
 * Gets the number of days remaining until campaign ends.
 */
export function getCampaignDaysRemaining(campaign: Campaign): number {
  const now = Date.now();
  const endsAt = new Date(campaign.endsAt).getTime();
  const hoursLeft = (endsAt - now) / (1000 * 60 * 60);

  if (hoursLeft < 0) return 0;
  return Math.ceil(hoursLeft / 24);
}

/**
 * Formats the end date for display.
 */
export function formatEndDate(campaign: Campaign): string {
  const endsAt = new Date(campaign.endsAt);
  const daysLeft = getCampaignDaysRemaining(campaign);

  if (daysLeft === 0) {
    const hoursLeft = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60));
    if (hoursLeft <= 0) return 'Ending soon';
    return `Ends in ${hoursLeft}h`;
  }

  if (daysLeft === 1) return 'Ends tomorrow';
  if (daysLeft < 7) return `Ends in ${daysLeft} days`;

  return `Ends ${endsAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })}`;
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Gets the campaign type badge with emoji.
 */
export function getCampaignBadge(campaign: Campaign): string {
  return TYPE_BADGES[campaign.type] || '';
}

/**
 * Gets the campaign type label.
 */
export function getCampaignTypeLabel(campaign: Campaign): string {
  return TYPE_LABELS[campaign.type] || campaign.type;
}

/**
 * Gets the campaign type color.
 */
export function getCampaignTypeColor(campaign: Campaign): string {
  return TYPE_COLORS[campaign.type] || colors.nileBlue;
}

/**
 * Generates the campaign display title.
 */
export function getCampaignDisplayTitle(campaign: Campaign): string {
  return campaign.title;
}

/**
 * Generates a short description for the campaign.
 */
export function getCampaignShortDescription(campaign: Campaign): string {
  const progress = getCampaignProgress(campaign);
  return `${progress.percentage}% complete - ${campaign.reward}`;
}

/**
 * Gets urgency color based on time remaining.
 */
export function getUrgencyColor(campaign: Campaign): string {
  const urgency = getCampaignUrgency(campaign);
  switch (urgency) {
    case 'high':
      return colors.error;
    case 'medium':
      return colors.warning;
    default:
      return colors.success;
  }
}

// =============================================================================
// FILTERING & SORTING
// =============================================================================

/**
 * Filters campaigns by type.
 */
export function filterByType(
  campaigns: Campaign[],
  type: Campaign['type']
): Campaign[] {
  return campaigns.filter((c) => c.type === type);
}

/**
 * Sorts campaigns by priority (urgency + progress).
 */
export function sortByPriority(campaigns: Campaign[]): Campaign[] {
  return [...campaigns].sort((a, b) => {
    // First by urgency
    const urgencyA = getCampaignUrgency(a);
    const urgencyB = getCampaignUrgency(b);
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    if (urgencyOrder[urgencyA] !== urgencyOrder[urgencyB]) {
      return urgencyOrder[urgencyA] - urgencyOrder[urgencyB];
    }

    // Then by progress (closer to completion first)
    const progressA = getCampaignProgress(a).percentage;
    const progressB = getCampaignProgress(b).percentage;
    return progressB - progressA;
  });
}

/**
 * Gets active campaigns sorted by priority.
 */
export function getActiveCampaignsSorted(campaigns: Campaign[]): Campaign[] {
  const visible = getVisibleCampaigns(campaigns);
  return sortByPriority(visible.activeCampaigns);
}
