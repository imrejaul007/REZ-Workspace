import { IntentSignal, UserProfile, SignalHistory, UserAffinities, EnrichmentContext } from '../types';
import { findRecentSignals } from '../models/IntentSignal';
import { logger } from '../config/logger';
import { metrics } from './metrics';

export class SignalEnrichmentService {
  /**
   * Enrich a signal with additional context
   */
  async enrich(signal: IntentSignal): Promise<IntentSignal & { enrichmentData?: {
    userProfile?: UserProfile;
    relatedSignals?: string[];
    intentClusters?: string[];
    predictedNextActions?: string[];
  } }> {
    const startTime = Date.now();

    try {
      // Build enrichment context
      const context = await this.buildEnrichmentContext(signal);

      // Get user profile (simulated - in production would call user service)
      const userProfile = await this.getUserProfile(signal.userId);

      // Get signal history
      const history = await this.getSignalHistory(signal.userId);

      // Calculate affinities
      const affinities = this.calculateAffinities(history);

      // Find related signals
      const relatedSignals = this.findRelatedSignals(signal, history);

      // Determine intent clusters
      const intentClusters = this.determineIntentClusters(signal, history);

      // Predict next actions
      const predictedNextActions = this.predictNextActions(signal, history, affinities);

      // Build enrichment data
      const enrichmentData = {
        userProfile,
        relatedSignals,
        intentClusters,
        predictedNextActions,
      };

      const enrichedSignal: IntentSignal & { enrichmentData?: typeof enrichmentData } = {
        ...signal,
        enriched: true,
        enrichmentData,
      };

      metrics.enrichmentDuration.observe((Date.now() - startTime) / 1000);

      logger.debug('Signal enriched', {
        signalId: signal.signalId,
        userId: signal.userId,
        relatedSignals: relatedSignals.length,
        predictedActions: predictedNextActions.length,
      });

      return enrichedSignal;
    } catch (error) {
      logger.error('Failed to enrich signal', {
        error: (error as Error).message,
        signalId: signal.signalId,
      });
      // Return original signal without enrichment
      return signal;
    }
  }

  /**
   * Build enrichment context from various sources
   */
  private async buildEnrichmentContext(signal: IntentSignal): Promise<EnrichmentContext> {
    return {
      userId: signal.userId,
    };
  }

  /**
   * Get user profile from user service (simulated)
   */
  private async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    // In production, this would call the REZ user service
    // For now, return a placeholder
    return {
      userId,
      preferences: [],
      segments: [],
    };
  }

  /**
   * Get signal history for a user
   */
  private async getSignalHistory(userId: string): Promise<SignalHistory> {
    try {
      const recentSignals = await findRecentSignals(userId, 50);
      return {
        recentSignals,
        totalCount: recentSignals.length,
        lastSignalTime: recentSignals[0]?.timestamp,
      };
    } catch (error) {
      logger.warn('Failed to get signal history', { userId, error });
      return {
        recentSignals: [],
        totalCount: 0,
      };
    }
  }

  /**
   * Calculate user affinities based on history
   */
  private calculateAffinities(history: SignalHistory): UserAffinities {
    const affinities: UserAffinities = {
      categories: { DINING: 0, TRAVEL: 0, RETAIL: 0, HEALTHCARE: 0, GENERAL: 0 },
      brands: {},
      priceRange: { min: 0, max: 10000 },
    };

    const categoryCounts: Record<string, number> = {};
    const brandCounts: Record<string, number> = [];

    for (const signal of history.recentSignals) {
      // Count category occurrences
      affinities.categories[signal.category] = (affinities.categories[signal.category] || 0) + 1;

      // Extract brand from metadata if present
      if (signal.metadata?.brand) {
        const brand = String(signal.metadata.brand);
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      }

      // Track price range
      if (signal.metadata?.price) {
        const price = Number(signal.metadata.price);
        if (price > 0) {
          affinities.priceRange.min = Math.min(affinities.priceRange.min, price);
          affinities.priceRange.max = Math.max(affinities.priceRange.max, price);
        }
      }
    }

    // Normalize category scores to 0-1
    const totalSignals = history.recentSignals.length;
    if (totalSignals > 0) {
      for (const category of Object.keys(affinities.categories)) {
        affinities.categories[category as keyof typeof affinities.categories] =
          affinities.categories[category as keyof typeof affinities.categories] / totalSignals;
      }
    }

    // Top brands
    affinities.brands = Object.fromEntries(
      Object.entries(brandCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    );

    return affinities;
  }

  /**
   * Find signals related to the current one
   */
  private findRelatedSignals(signal: IntentSignal, history: SignalHistory): string[] {
    const related: string[] = [];

    for (const pastSignal of history.recentSignals) {
      // Same category
      if (pastSignal.category === signal.category && pastSignal.signalId !== signal.signalId) {
        related.push(pastSignal.signalId);
      }

      // Same intent key
      if (pastSignal.intentKey === signal.intentKey && !related.includes(pastSignal.signalId)) {
        related.push(pastSignal.signalId);
      }

      // Same user session context
      if (
        pastSignal.metadata?.sessionId === signal.metadata?.sessionId &&
        !related.includes(pastSignal.signalId)
      ) {
        related.push(pastSignal.signalId);
      }
    }

    // Limit to 10 related signals
    return related.slice(0, 10);
  }

  /**
   * Determine intent clusters for the signal
   */
  private determineIntentClusters(signal: IntentSignal, history: SignalHistory): string[] {
    const clusters: string[] = [];

    // Category cluster
    clusters.push(`category:${signal.category.toLowerCase()}`);

    // Intent pattern clusters
    const similarSignals = history.recentSignals.filter(
      (s) => s.category === signal.category
    );

    if (similarSignals.length >= 3) {
      clusters.push('high_intent_user');
    }

    // Event type patterns
    switch (signal.eventType) {
      case 'search':
        clusters.push('discovery_phase');
        break;
      case 'view':
        clusters.push('consideration_phase');
        break;
      case 'cart_add':
        clusters.push('intent_phase');
        break;
      case 'checkout_start':
        clusters.push('conversion_phase');
        break;
      case 'fulfilled':
        clusters.push('completion_phase');
        break;
    }

    // Time-based clusters
    const hour = new Date(signal.timestamp).getHours();
    if (hour >= 6 && hour < 12) {
      clusters.push('morning_activity');
    } else if (hour >= 12 && hour < 18) {
      clusters.push('afternoon_activity');
    } else if (hour >= 18 && hour < 22) {
      clusters.push('evening_activity');
    } else {
      clusters.push('late_night_activity');
    }

    return clusters;
  }

  /**
   * Predict next actions based on signal and history
   */
  private predictNextActions(
    signal: IntentSignal,
    history: SignalHistory,
    affinities: UserAffinities
  ): string[] {
    const predictions: string[] = [];

    // Based on current event type
    switch (signal.eventType) {
      case 'search':
        predictions.push('view', 'wishlist');
        break;
      case 'view':
        predictions.push('cart_add', 'wishlist', 'view');
        break;
      case 'wishlist':
        predictions.push('cart_add', 'checkout_start');
        break;
      case 'cart_add':
        predictions.push('checkout_start', 'view', 'cart_add');
        break;
      case 'checkout_start':
        predictions.push('fulfilled', 'cart_add');
        break;
    }

    // Based on category affinities
    const topCategory = Object.entries(affinities.categories)
      .sort(([, a], [, b]) => b - a)[0];

    if (topCategory && topCategory[1] > 0.3) {
      predictions.push(`explore_${topCategory[0].toLowerCase()}`);
    }

    // Based on recent history patterns
    const recentEvents = history.recentSignals.slice(0, 5).map((s) => s.eventType);
    if (recentEvents.includes('search') && !recentEvents.includes('view')) {
      predictions.push('view');
    }
    if (recentEvents.includes('view') && !recentEvents.includes('cart_add')) {
      predictions.push('cart_add');
    }
    if (recentEvents.includes('cart_add') && !recentEvents.includes('checkout_start')) {
      predictions.push('checkout_start');
    }

    // Return unique predictions (max 5)
    return [...new Set(predictions)].slice(0, 5);
  }

  /**
   * Batch enrich multiple signals
   */
  async enrichBatch(signals: IntentSignal[]): Promise<(IntentSignal & { enrichmentData?: {
    userProfile?: UserProfile;
    relatedSignals?: string[];
    intentClusters?: string[];
    predictedNextActions?: string[];
  } })[]> {
    const results = [];

    for (const signal of signals) {
      const enriched = await this.enrich(signal);
      results.push(enriched);
    }

    return results;
  }
}

export const signalEnrichmentService = new SignalEnrichmentService();