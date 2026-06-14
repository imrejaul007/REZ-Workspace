// Karma Points Configuration
export const karmaConfig = {
 // Points for earning karma
 earned: {
   // Someone receives your helpful message
   receiveHelpMessage: 5,
   // Item found because of your help
   itemFoundWithHelp: 25,
   // Reported suspicious activity
   reportSuspicious: 10,
   // Emergency assistance confirmed
   emergencyAssist: 50,
   // First time helping in a category
   firstTimeCategory: 15,
   // Posted lost item to karma feed
   shareLostItem: 5,
   // Joined as helper on feed post
   helperJoined: 2,
   // Confirmed sighting
   confirmedSighting: 10,
 },

 // Penalties
 penalties: {
   abusiveMessage: -20,
   spamReport: -30,
   falseEmergency: -100,
   blockedByUser: -5,
 },

 // Karma levels
 levels: [
   { name: 'Newbie', minPoints: 0, badge: '🟢' },
   { name: 'Active', minPoints: 10, badge: '🟢' },
   { name: 'Contributor', minPoints: 50, badge: '🔵' },
   { name: 'Helper', minPoints: 200, badge: '🔵' },
   { name: 'Guardian', minPoints: 500, badge: '🟣' },
   { name: 'Hero', minPoints: 1000, badge: '🟠' },
   { name: 'Legend', minPoints: 5000, badge: '🔴' },
 ],

 // Feed settings
 feed: {
   postRadius: 5000, // meters - notify users within 5km
   maxFeedAge: 7 * 24 * 60 * 60 * 1000, // 7 days
   maxPhotos: 5,
   maxDescriptionLength: 500,
 },

 // Trust score thresholds
 trustScore: {
   max: 100,
   min: 0,
   default: 50,
   // Thresholds for different behavior
   strictBlock: 25,
   moderateLimit: 50,
   normal: 80,
 },
} as const;

// Karma event types
export const karmaEventTypes = {
 // Earning events
 SAFE_QR_HELP_SENT: 'SAFE_QR_HELP_SENT',
 SAFE_QR_ITEM_FOUND: 'SAFE_QR_ITEM_FOUND',
 SAFE_QR_SUSPICIOUS_REPORT: 'SAFE_QR_SUSPICIOUS_REPORT',
 SAFE_QR_EMERGENCY_ASSIST: 'SAFE_QR_EMERGENCY_ASSIST',
 SAFE_QR_FIRST_TIME_HELP: 'SAFE_QR_FIRST_TIME_HELP',
 SAFE_QR_LOST_POSTED: 'SAFE_QR_LOST_POSTED',
 SAFE_QR_HELPER_JOINED: 'SAFE_QR_HELPER_JOINED',
 SAFE_QR_SIGHTING_CONFIRMED: 'SAFE_QR_SIGHTING_CONFIRMED',

 // Penalty events
 SAFE_QR_ABUSE: 'SAFE_QR_ABUSE',
 SAFE_QR_SPAM: 'SAFE_QR_SPAM',
 SAFE_QR_FALSE_EMERGENCY: 'SAFE_QR_FALSE_EMERGENCY',
 SAFE_QR_BLOCKED: 'SAFE_QR_BLOCKED',
} as const;

export type KarmaEventType = typeof karmaEventTypes[keyof typeof karmaEventTypes];

/**
 * Get karma level for a given point total
 */
export function getKarmaLevel(points: number): { name: string; badge: string } {
 for (let i = karmaConfig.levels.length - 1; i >= 0; i--) {
   if (points >= karmaConfig.levels[i].minPoints) {
     return {
       name: karmaConfig.levels[i].name,
       badge: karmaConfig.levels[i].badge,
     };
   }
 }
 return { name: 'Newbie', badge: '🟢' };
}

/**
 * Calculate points for item found (split among helpers)
 */
export function calculateFoundPoints(
 totalHelpers: number,
 contributionWeight: Record<string, number>
): Record<string, number> {
 const basePoints = karmaConfig.earned.itemFoundWithHelp;
 const result: Record<string, number> = {};

 for (const [helperId, weight] of Object.entries(contributionWeight)) {
   result[helperId] = Math.round(basePoints * (weight / 100));
 }

 return result;
}
