/**
 * Memory Continuity Hook
 *
 * Creates longitudinal intelligence by referencing prior interactions naturally.
 *
 * Philosophy: REZ should remember so users don't have to.
 *
 * Examples:
 * - "You liked Korean food last week"
 * - "You usually shop on Fridays"
 * - "Last month you saved ₹420 on cafés"
 * - "You've been exploring fitness options recently"
 *
 * This creates emotional attachment through:
 * - Recognition ("REZ remembers me")
 * - Consistency ("REZ is paying attention")
 * - Anticipation ("REZ knows what I want next")
 *
 * Analytics Tracking:
 * - memory_view: When a memory is displayed
 * - memory_interaction: When user taps/interacts with memory
 * - memory_reference_view: When contextual memory reference is shown
 * - memory_reference_action: When user acts on memory reference
 * - memory_recall_accuracy: Ratio of accurate vs inaccurate memories
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { intelligenceAnalytics, IntelligenceEvents } from '@/services/intelligenceAnalytics';

// ============================================================================
// TYPES
// ============================================================================

export interface MemoryEntry {
  id: string;
  category: 'dining' | 'shopping' | 'travel' | 'wellness' | 'social' | 'finance' | 'general';
  type: 'preference' | 'behavior' | 'savings' | 'milestone' | 'pattern';
  statement: string;
  evidence: string;
  confidence: number; // 0-1
  firstSeen: number;
  lastSeen: number;
  count: number;
  expiresAt?: number;
}

export interface MemoryReference {
  id: string;
  memory: MemoryEntry;
  context: string;
  value: string;
  action?: string;
  actionRoute?: string;
}

export interface UserMemoryProfile {
  userId: string;
  establishedAt: number;
  memories: MemoryEntry[];
  preferences: {
    topCategories: string[];
    diningPreferences: string[];
    shoppingPatterns: string[];
    timePatterns: Record<string, string>;
    locationPatterns: string[];
  };
  insights: {
    totalSavings: number;
    topSavingsCategory: string;
    avgSessionValue: number;
    streakCount: number;
  };
}

// ============================================================================
// MOCK MEMORY GENERATOR
// ============================================================================

const generateInitialMemories = (): MemoryEntry[] => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return [
    // Dining Memories
    {
      id: 'mem-1',
      category: 'dining',
      type: 'preference',
      statement: 'You prefer casual dining over fine dining',
      evidence: '8 of 10 restaurant visits were casual',
      confidence: 0.85,
      firstSeen: now - 30 * day,
      lastSeen: now - 2 * day,
      count: 8,
    },
    {
      id: 'mem-2',
      category: 'dining',
      type: 'behavior',
      statement: 'You usually order lunch around 1pm',
      evidence: 'Average order time: 12:45pm - 1:15pm',
      confidence: 0.92,
      firstSeen: now - 14 * day,
      lastSeen: now - 1 * day,
      count: 12,
    },
    {
      id: 'mem-3',
      category: 'dining',
      type: 'savings',
      statement: 'You saved ₹840 on food delivery this month',
      evidence: '18% avg cashback across 15 orders',
      confidence: 1.0,
      firstSeen: now - 30 * day,
      lastSeen: now,
      count: 15,
    },
    {
      id: 'mem-4',
      category: 'dining',
      type: 'preference',
      statement: 'You enjoy Korean and Japanese cuisine',
      evidence: 'Visited 4 times, highest rating',
      confidence: 0.78,
      firstSeen: now - 45 * day,
      lastSeen: now - 7 * day,
      count: 4,
    },

    // Shopping Memories
    {
      id: 'mem-5',
      category: 'shopping',
      type: 'pattern',
      statement: 'You usually shop on Friday evenings',
      evidence: '6 of 8 purchases were Friday 6-9pm',
      confidence: 0.88,
      firstSeen: now - 60 * day,
      lastSeen: now - 3 * day,
      count: 8,
    },
    {
      id: 'mem-6',
      category: 'shopping',
      type: 'preference',
      statement: 'You value quality over price',
      evidence: 'Purchased premium options 70% of time',
      confidence: 0.75,
      firstSeen: now - 30 * day,
      lastSeen: now - 5 * day,
      count: 10,
    },

    // Travel Memories
    {
      id: 'mem-7',
      category: 'travel',
      type: 'behavior',
      statement: 'You use cabs for airport trips',
      evidence: '3 airport trips in 60 days',
      confidence: 0.95,
      firstSeen: now - 60 * day,
      lastSeen: now - 10 * day,
      count: 3,
    },

    // Wellness Memories
    {
      id: 'mem-8',
      category: 'wellness',
      type: 'pattern',
      statement: "You've been exploring fitness options recently",
      evidence: 'Viewed 8 wellness stores',
      confidence: 0.72,
      firstSeen: now - 7 * day,
      lastSeen: now - 1 * day,
      count: 8,
    },
    {
      id: 'mem-9',
      category: 'wellness',
      type: 'preference',
      statement: 'You prefer gyms with flexible timings',
      evidence: 'Chose 24/7 gyms 3 times',
      confidence: 0.82,
      firstSeen: now - 30 * day,
      lastSeen: now - 15 * day,
      count: 3,
    },

    // Social Memories
    {
      id: 'mem-10',
      category: 'social',
      type: 'behavior',
      statement: 'You often shop with friends',
      evidence: '3 group purchases in 30 days',
      confidence: 0.68,
      firstSeen: now - 30 * day,
      lastSeen: now - 5 * day,
      count: 3,
    },

    // Finance Memories
    {
      id: 'mem-11',
      category: 'finance',
      type: 'savings',
      statement: 'You saved ₹2,340 total this month',
      evidence: '₹2,340 across 25 transactions',
      confidence: 1.0,
      firstSeen: now - 30 * day,
      lastSeen: now,
      count: 25,
    },
    {
      id: 'mem-12',
      category: 'finance',
      type: 'milestone',
      statement: "You've checked your savings 12 times this month",
      evidence: 'Most engaged with savings features',
      confidence: 0.95,
      firstSeen: now - 30 * day,
      lastSeen: now,
      count: 12,
    },

    // General Memories
    {
      id: 'mem-13',
      category: 'general',
      type: 'pattern',
      statement: 'You\'re most active on REZ between 7-9pm',
      evidence: 'Peak usage: 7-9pm daily',
      confidence: 0.91,
      firstSeen: now - 21 * day,
      lastSeen: now,
      count: 21,
    },
  ];
};

// ============================================================================
// MEMORY REFERENCE TEMPLATES
// ============================================================================

const generateMemoryReferences = (memories: MemoryEntry[]): MemoryReference[] => {
  const references: MemoryReference[] = [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  for (const memory of memories) {
    const daysSince = Math.floor((now - memory.lastSeen) / day);
    const freshness = memory.confidence * (1 - daysSince / 30); // Decay over time

    if (freshness < 0.2) continue; // Skip stale memories

    let reference: MemoryReference | null = null;

    switch (memory.type) {
      case 'preference':
        reference = {
          id: `ref-pref-${memory.id}`,
          memory,
          context: 'preference',
          value: memory.statement,
        };
        break;

      case 'behavior':
        if (memory.category === 'dining') {
          reference = {
            id: `ref-dining-${memory.id}`,
            memory,
            context: 'dining',
            value: memory.statement,
            action: 'Order similar',
            actionRoute: '/restaurant',
          };
        } else if (memory.category === 'shopping') {
          reference = {
            id: `ref-shop-${memory.id}`,
            memory,
            context: 'shopping',
            value: memory.statement,
            action: 'Browse options',
            actionRoute: '/search',
          };
        }
        break;

      case 'savings':
        reference = {
          id: `ref-savings-${memory.id}`,
          memory,
          context: 'savings',
          value: memory.statement,
          action: 'View details',
          actionRoute: '/wallet',
        };
        break;

      case 'pattern':
        if (memory.count >= 3 && daysSince <= 7) {
          reference = {
            id: `ref-pattern-${memory.id}`,
            memory,
            context: 'pattern',
            value: `Based on your ${memory.category} habits`,
          };
        }
        break;

      case 'milestone':
        reference = {
          id: `ref-milestone-${memory.id}`,
          memory,
          context: 'milestone',
          value: memory.statement,
          action: 'Learn more',
          actionRoute: '/achievements',
        };
        break;
    }

    if (reference) {
      references.push(reference);
    }
  }

  return references;
};

// ============================================================================
// CONTEXTUAL MEMORY STATEMENTS
// ============================================================================

export interface ContextualMemory {
  trigger: 'time' | 'location' | 'behavior' | 'social' | 'savings' | 'category';
  statement: string;
  icon: string;
  memoryType: 'recall' | 'anticipation' | 'recommendation';
}

export function getContextualMemories(
  memories: MemoryEntry[],
  context: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek?: string;
    location?: string;
    category?: string;
  }
): ContextualMemory[] {
  const contextual: ContextualMemory[] = [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Time-based memories
  if (context.timeOfDay === 'afternoon') {
    const lunchMemory = memories.find(
      (m) => m.statement.includes('lunch') && m.category === 'dining'
    );
    if (lunchMemory) {
      contextual.push({
        trigger: 'time',
        statement: lunchMemory.statement,
        icon: '🍽️',
        memoryType: 'recall',
      });
    }
  }

  if (context.timeOfDay === 'evening') {
    const shoppingMemory = memories.find(
      (m) => m.statement.includes('Friday') && m.category === 'shopping'
    );
    if (shoppingMemory) {
      contextual.push({
        trigger: 'time',
        statement: `You usually shop on ${context.dayOfWeek}s`,
        icon: '🛍️',
        memoryType: 'anticipation',
      });
    }
  }

  // Savings memories
  const savingsMemory = memories.find(
    (m) => m.type === 'savings' && m.category === 'finance'
  );
  if (savingsMemory && now - savingsMemory.lastSeen < 7 * day) {
    contextual.push({
      trigger: 'savings',
      statement: savingsMemory.statement,
      icon: '💰',
      memoryType: 'recall',
    });
  }

  // Category memories
  if (context.category) {
    const categoryMemories = memories.filter(
      (m) => m.category === context.category
    );
    if (categoryMemories.length > 0) {
      const topMemory = categoryMemories.sort((a, b) => b.confidence - a.confidence)[0];
      contextual.push({
        trigger: 'category',
        statement: topMemory.statement,
        icon: '✨',
        memoryType: 'recommendation',
      });
    }
  }

  // Preference memories
  const preferenceMemories = memories.filter((m) => m.type === 'preference');
  if (preferenceMemories.length > 0) {
    const recentPreference = preferenceMemories.find(
      (m) => now - m.lastSeen < 14 * day
    );
    if (recentPreference) {
      contextual.push({
        trigger: 'behavior',
        statement: recentPreference.statement,
        icon: '🎯',
        memoryType: 'recommendation',
      });
    }
  }

  return contextual;
}

// ============================================================================
// HOOK
// ============================================================================

export function useMemoryContinuity() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [references, setReferences] = useState<MemoryReference[]>([]);
  const [profile, setProfile] = useState<UserMemoryProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    views: 0,
    interactions: 0,
    referenceViews: 0,
    referenceActions: 0,
  });
  const viewedMemoriesRef = useRef<Set<string>>(new Set());

  // Track memory view
  const trackMemoryView = useCallback((memoryId: string, memoryType: MemoryEntry['type']) => {
    if (viewedMemoriesRef.current.has(memoryId)) return;
    viewedMemoriesRef.current.add(memoryId);

    setMetrics(prev => ({ ...prev, views: prev.views + 1 }));
    intelligenceAnalytics.trackMemoryView(memoryId, memoryType, 1);
  }, []);

  // Track memory interaction
  const trackMemoryInteraction = useCallback((
    memoryId: string,
    memoryType: MemoryEntry['type'],
    action: 'tap' | 'dismiss' | 'explore'
  ) => {
    setMetrics(prev => ({ ...prev, interactions: prev.interactions + 1 }));
    intelligenceAnalytics.trackMemoryInteraction(memoryId, action);
  }, []);

  // Track memory reference view
  const trackReferenceView = useCallback((referenceId: string, context: string) => {
    setMetrics(prev => ({ ...prev, referenceViews: prev.referenceViews + 1 }));
    intelligenceAnalytics.track(IntelligenceEvents.Memory.REFERENCE_VIEW, {
      referenceId,
      context,
    });
  }, []);

  // Track memory reference action
  const trackReferenceAction = useCallback((referenceId: string, actionRoute?: string) => {
    setMetrics(prev => ({ ...prev, referenceActions: prev.referenceActions + 1 }));
    intelligenceAnalytics.track(IntelligenceEvents.Memory.REFERENCE_ACTION, {
      referenceId,
      actionRoute,
    });
  }, []);

  // Get memory interaction rate
  const getInteractionRate = useCallback((): number => {
    if (metrics.views === 0) return 0;
    return Math.round((metrics.interactions / metrics.views) * 100);
  }, [metrics]);

  // Get memory reference action rate
  const getReferenceActionRate = useCallback((): number => {
    if (metrics.referenceViews === 0) return 0;
    return Math.round((metrics.referenceActions / metrics.referenceViews) * 100);
  }, [metrics]);

  // Initialize memories (in production, this would load from storage/API)
  useEffect(() => {
    const loadMemories = async () => {
      setIsLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const initialMemories = generateInitialMemories();
      const userProfile: UserMemoryProfile = {
        userId: 'user-123',
        establishedAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
        memories: initialMemories,
        preferences: {
          topCategories: ['dining', 'shopping', 'wellness'],
          diningPreferences: ['casual', 'Korean', 'Japanese'],
          shoppingPatterns: ['Friday evenings', 'quality-focused'],
          timePatterns: {
            lunch: '12:45pm - 1:15pm',
            peakActivity: '7-9pm',
            shopping: 'Friday 6-9pm',
          },
          locationPatterns: ['home area', 'office area'],
        },
        insights: {
          totalSavings: 2340,
          topSavingsCategory: 'food delivery',
          avgSessionValue: 45,
          streakCount: 7,
        },
      };

      setMemories(initialMemories);
      setProfile(userProfile);
      setReferences(generateMemoryReferences(initialMemories));
      setIsLoading(false);
    };

    loadMemories();
  }, []);

  // Add a new memory
  const addMemory = useCallback((memory: Omit<MemoryEntry, 'id' | 'firstSeen' | 'lastSeen' | 'count'>) => {
    const newMemory: MemoryEntry = {
      ...memory,
      id: `mem-${Date.now()}`,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      count: 1,
    };

    setMemories((prev) => {
      // Check if similar memory exists
      const existing = prev.find(
        (m) => m.statement.toLowerCase() === memory.statement.toLowerCase()
      );

      if (existing) {
        // Update existing memory
        return prev.map((m) =>
          m.id === existing.id
            ? { ...m, lastSeen: Date.now(), count: m.count + 1, confidence: Math.min(1, m.confidence + 0.05) }
            : m
        );
      }

      return [...prev, newMemory];
    });
  }, []);

  // Update memory confidence
  const reinforceMemory = useCallback((memoryId: string) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === memoryId
          ? { ...m, lastSeen: Date.now(), count: m.count + 1, confidence: Math.min(1, m.confidence + 0.02) }
          : m
      )
    );
  }, []);

  // Get relevant memories for context
  const getMemoriesForContext = useCallback(
    (context: Parameters<typeof getContextualMemories>[1]) => {
      return getContextualMemories(memories, context);
    },
    [memories]
  );

  // Generate natural language summary
  const generateMemorySummary = useCallback((): string => {
    if (memories.length === 0) return '';

    const diningSavings = memories.find(
      (m) => m.category === 'dining' && m.type === 'savings'
    );
    const topPreference = memories
      .filter((m) => m.type === 'preference')
      .sort((a, b) => b.confidence - a.confidence)[0];
    const recentPattern = memories
      .filter((m) => m.type === 'pattern')
      .sort((a, b) => b.lastSeen - a.lastSeen)[0];

    const parts: string[] = [];

    if (diningSavings) {
      parts.push(`You've saved ₹${diningSavings.evidence.match(/\d+/)?.[0] || 0} on food this month`);
    }

    if (topPreference) {
      parts.push(`You prefer ${topPreference.evidence.split(' ').slice(0, 5).join(' ')}`);
    }

    if (recentPattern) {
      parts.push(`You're active on ${recentPattern.statement.split(' ')[2]?.toLowerCase() || 'REZ'}`);
    }

    return parts.length > 0
      ? `Based on your habits: ${parts.join('. ')}.`
      : '';
  }, [memories]);

  // Get memory for specific category
  const getCategoryMemory = useCallback(
    (category: MemoryEntry['category']): MemoryEntry | null => {
      const categoryMemories = memories.filter((m) => m.category === category);
      if (categoryMemories.length === 0) return null;
      return categoryMemories.sort((a, b) => b.confidence - a.confidence)[0];
    },
    [memories]
  );

  return {
    memories,
    references,
    profile,
    isLoading,
    addMemory,
    reinforceMemory,
    getMemoriesForContext,
    generateMemorySummary,
    getCategoryMemory,

    // Analytics tracking
    trackMemoryView,
    trackMemoryInteraction,
    trackReferenceView,
    trackReferenceAction,

    // Metrics
    metrics,
    getInteractionRate,
    getReferenceActionRate,
  };
}
