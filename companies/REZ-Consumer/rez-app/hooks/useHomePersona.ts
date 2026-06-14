// @ts-nocheck
/**
 * useHomePersona
 *
 * Derives the home-screen "persona" from the user's statedIdentity +
 * verified segment, then returns a typed PersonaConfig that drives
 * the PersonalizedHeroBanner component.
 *
 * Priority:
 *   1. verified_student  → student
 *   2. statedIdentity === 'student' → student
 *   3. verified_employee → corporate
 *   4. statedIdentity === 'corporate' → corporate
 *   5. everything else   → general
 */

import { useMemo } from 'react';
import { useUserIdentityStore } from '@/stores/userIdentityStore';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PersonaId = 'student' | 'corporate' | 'general';

export interface QuickLink {
  id: string;
  emoji: string;
  label: string;
  sublabel: string;
  route: string;
  color: string;   // background tint for the tile
}

export interface PersonaConfig {
  id: PersonaId;
  /** Greeting shown in the hero (supports {name} placeholder) */
  greeting: string;
  /** Sub-copy under greeting */
  tagline: string;
  /** Primary gradient colors [from, to] */
  gradientColors: readonly [string, string];
  /** Accent colour for chips, badges, etc. */
  accentColor: string;
  /** Section heading above quick links */
  sectionTitle: string;
  /** 4 quick-access tiles */
  quickLinks: [QuickLink, QuickLink, QuickLink, QuickLink];
  /** Optional bottom-strip highlight text */
  highlightText: string;
  /** Icon name (Ionicons) for the highlight strip */
  highlightIcon: string;
  /** Emoji decoration on the right side of the hero */
  heroEmoji: string;
}

// ─── Persona definitions ──────────────────────────────────────────────────────

const STUDENT_PERSONA: PersonaConfig = {
  id: 'student',
  greeting: '🎓 Hey {name}! Your cashback is ready',
  tagline: 'Earn cashback on every campus deal — food, chai, grooming & hangouts',
  gradientColors: ['#F97316', '#FBBF24'] as const,
  accentColor: '#EA580C',
  sectionTitle: 'Built for campus life ✨',
  heroEmoji: '📚',
  quickLinks: [
    {
      id: 'budget-deals',
      emoji: '🏷️',
      label: 'Budget Deals',
      sublabel: 'Under ₹199',
      route: '/near-u/budget',
      color: '#FFF7ED',
    },
    {
      id: 'earn-coins',
      emoji: '🪙',
      label: 'Earn Coins',
      sublabel: 'Tasks & rewards',
      route: '/earn',
      color: '#FFFBEB',
    },
    {
      id: 'try-nearby',
      emoji: '🔍',
      label: 'Try Nearby',
      sublabel: 'Risk-free trials',
      route: '/try',
      color: '#FEF3C7',
    },
    {
      id: 'student-offers',
      emoji: '🎒',
      label: 'Student Offers',
      sublabel: 'ID-verified perks',
      route: '/near-u/student-offers',
      color: '#FFF7ED',
    },
  ],
  highlightText: 'Verified Student — earn cashback on every campus purchase',
  highlightIcon: 'school',
};

const CORPORATE_PERSONA: PersonaConfig = {
  id: 'corporate',
  greeting: '💼 Good to see you, {name}',
  tagline: 'Cashback on lunch, grooming & wellness — every office day',
  gradientColors: ['#1a3a52', '#2A5577'] as const,
  accentColor: '#47779F',
  sectionTitle: 'Made for your workday ⚡',
  heroEmoji: '🏢',
  quickLinks: [
    {
      id: 'lunch-nearby',
      emoji: '🍱',
      label: 'Lunch Nearby',
      sublabel: 'Quick & good',
      route: '/near-u/food',
      color: '#F0F9FF',
    },
    {
      id: 'wellness',
      emoji: '💆',
      label: 'Wellness',
      sublabel: 'Relax & recharge',
      route: '/try',
      color: '#EFF6FF',
    },
    {
      id: 'prive',
      emoji: '💎',
      label: 'Privé',
      sublabel: 'Premium access',
      route: '/prive',
      color: '#F5F3FF',
    },
    {
      id: 'express',
      emoji: '⚡',
      label: 'Express',
      sublabel: '30-min delivery',
      route: '/near-u/express',
      color: '#F0F9FF',
    },
  ],
  highlightText: 'Corporate Member — cashback on every meal, gym & grooming visit',
  highlightIcon: 'briefcase',
};

const GENERAL_PERSONA: PersonaConfig = {
  id: 'general',
  greeting: '👋 Welcome back, {name}',
  tagline: 'Earn cashback on every purchase at stores near you',
  gradientColors: ['#7C3AED', '#A78BFA'] as const,
  accentColor: '#6D28D9',
  sectionTitle: 'Your ReZ picks today ✨',
  heroEmoji: '🌟',
  quickLinks: [
    {
      id: 'near-u',
      emoji: '📍',
      label: 'Near You',
      sublabel: 'Local stores',
      route: '/near-u',
      color: '#F5F3FF',
    },
    {
      id: 'earn-coins',
      emoji: '🪙',
      label: 'Earn Coins',
      sublabel: 'Tasks & rewards',
      route: '/earn',
      color: '#FFFBEB',
    },
    {
      id: 'try',
      emoji: '🔍',
      label: 'Try Feature',
      sublabel: 'Trial experiences',
      route: '/try',
      color: '#EFF6FF',
    },
    {
      id: 'mall',
      emoji: '🛍️',
      label: 'Mall',
      sublabel: 'Online shopping',
      route: '/mall',
      color: '#F0FDF4',
    },
  ],
  highlightText: 'Earn cashback on every deal — food, grooming & more near you',
  highlightIcon: 'sparkles',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHomePersona(): PersonaConfig & { displayName: string } {
  const { statedIdentity, segment } = useUserIdentityStore();
  const authUser = useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.state.user);

  const firstName = useMemo(() => {
    const fullName = (authUser as unknown)?.profile?.firstName
      || (authUser as unknown)?.name
      || (authUser as unknown)?.displayName
      || '';
    return fullName.split(' ')[0] || 'there';
  }, [authUser]);

  const personaId: PersonaId = useMemo(() => {
    if (segment === 'verified_student' || statedIdentity === 'student') return 'student';
    if (segment === 'verified_employee' || statedIdentity === 'corporate') return 'corporate';
    return 'general';
  }, [segment, statedIdentity]);

  const base =
    personaId === 'student'   ? STUDENT_PERSONA :
    personaId === 'corporate' ? CORPORATE_PERSONA :
                                GENERAL_PERSONA;

  return {
    ...base,
    displayName: firstName,
    greeting: base.greeting.replace('{name}', firstName),
  };
}
