import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_KEY = 'app_review_state';
const MIN_ORDERS_BEFORE_PROMPT = 10;
const MIN_DAYS_BETWEEN_PROMPTS = 30;

interface ReviewState {
  lastPrompted: string | null;
  totalOrdersAtLastPrompt: number;
  hasReviewed: boolean;
  promptCount: number;
}

async function getReviewState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastPrompted: null, totalOrdersAtLastPrompt: 0, hasReviewed: false, promptCount: 0 };
}

async function setReviewState(state: ReviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Check if conditions are right to prompt for a review, and show the native
 * review dialog if so. Call this after significant positive events (e.g.
 * completing an order milestone, positive analytics trend).
 *
 * Conditions:
 * - Device supports in-app review
 * - At least MIN_ORDERS_BEFORE_PROMPT orders completed
 * - At least MIN_DAYS_BETWEEN_PROMPTS since last prompt
 * - User hasn't been prompted more than 3 times total
 */
export async function maybeRequestReview(currentOrderCount: number): Promise<void> {
  try {
    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    const state = await getReviewState();
    if (state.hasReviewed) return;
    if (state.promptCount >= 3) return;

    // Not enough orders yet
    if (currentOrderCount < MIN_ORDERS_BEFORE_PROMPT) return;

    // Check if enough new orders since last prompt
    const ordersSinceLastPrompt = currentOrderCount - state.totalOrdersAtLastPrompt;
    if (state.lastPrompted && ordersSinceLastPrompt < MIN_ORDERS_BEFORE_PROMPT) return;

    // Check time since last prompt
    if (state.lastPrompted) {
      const daysSince =
        (Date.now() - new Date(state.lastPrompted).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return;
    }

    // All conditions met — show review prompt
    await StoreReview.requestReview();

    await setReviewState({
      lastPrompted: new Date().toISOString(),
      totalOrdersAtLastPrompt: currentOrderCount,
      hasReviewed: false, // We can't know if they actually reviewed
      promptCount: state.promptCount + 1,
    });
  } catch {
    // Non-critical — silently ignore
  }
}

/**
 * Mark that the user has proactively given feedback (e.g. through an
 * in-app feedback form), so we stop prompting for store reviews.
 */
export async function markAsReviewed(): Promise<void> {
  const state = await getReviewState();
  await setReviewState({ ...state, hasReviewed: true });
}
