/**
 * shareAchievement
 *
 * Utility for sharing REZ achievement badges via the native Share sheet.
 * Uses React Native's built-in Share API — no external dependencies required.
 */

import { Share } from 'react-native';

/**
 * Builds the share message for an earned achievement.
 *
 * @param achievementName - The display name of the achievement badge
 * @param rezScore - The user's current REZ Score
 * @returns A formatted share string
 */
export function buildShareMessage(achievementName: string, rezScore: number): string {
  return (
    `I just earned the '${achievementName}' badge on REZ! ` +
    `My REZ Score is ${rezScore}. ` +
    `Join me and start earning coins at local stores. #REZCoins #REZApp`
  );
}

/**
 * Opens the native share sheet for an earned achievement.
 *
 * @param achievementName - The display name of the achievement badge
 * @param rezScore - The user's current REZ Score
 * @returns Promise that resolves when the share sheet is dismissed
 */
export async function shareAchievement(achievementName: string, rezScore: number): Promise<void> {
  try {
    const message = buildShareMessage(achievementName, rezScore);
    await Share.share(
      { message, title: 'REZ Achievement Unlocked!' },
      { dialogTitle: 'REZ Achievement Unlocked!' },
    );
  } catch {
    // User dismissed or share failed — non-fatal
  }
}
