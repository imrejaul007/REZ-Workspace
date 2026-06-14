'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Compass,
  Leaf,
  Wallet,
  Flag,
  Zap,
  Trophy,
  Users,
  MapPin,
  Calendar,
  Star,
  Shield,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import {
  getKarmaProfile,
  getNearbyEvents,
  getLeaderboard,
} from '@/lib/karmaApi';
import type { KarmaProfile, KarmaEvent, LeaderboardResult } from '@/types/karma';

// ---------------------------------------------------------------------------
// Level Config
// ---------------------------------------------------------------------------
const LEVEL_CONFIG: Record<string, { label: string; name: string; color: string; bg: string; next: number | null }> = {
  L1: { label: 'L1', name: 'Seed', color: '#22C55E', bg: '#DCFCE7', next: 500 },
  L2: { label: 'L2', name: 'Sprout', color: '#06B6D4', bg: '#ECFEFF', next: 2000 },
  L3: { label: 'L3', name: 'Bloom', color: '#F43F5E', bg: '#FFF1F2', next: 5000 },
  L4: { label: 'L4', name: 'Tree', color: '#EAB308', bg: '#FEF9C3', next: null },
};

const CONVERSION_RATES: Record<string, number> = {
  L1: 25, L2: 50, L3: 75, L4: 100,
};

const CATEGORY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  environment: { icon: 'leaf', color: '#22C55E', bg: '#DCFCE7' },
  food: { icon: 'utensils', color: '#F97316', bg: '#FFF7ED' },
  health: { icon: 'heart', color: '#EF4444', bg: '#FEF2F2' },
  education: { icon: 'book', color: '#3B82F6', bg: '#EFF6FF' },
  community: { icon: 'users', color: '#8B5CF6', bg: '#F5F3FF' },
};

const quickActions = [
  { id: 'explore', label: 'Explore', icon: Compass, color: '#3B82F6', bg: '#EFF6FF', href: '/karma/explore' },
  { id: 'my-karma', label: 'My Karma', icon: Leaf, color: '#22C55E', bg: '#DCFCE7', href: '/karma/my-karma' },
  { id: 'missions', label: 'Missions', icon: Flag, color: '#EF4444', bg: '#FEF2F2', href: '/karma/missions' },
  { id: 'micro', label: 'Actions', icon: Zap, color: '#F59E0B', bg: '#FFFBEB', href: '/karma/micro-actions' },
  { id: 'leaderboard', label: 'Rankings', icon: Trophy, color: '#8B5CF6', bg: '#F5F3FF', href: '/karma/leaderboard' },
  { id: 'communities', label: 'Communities', icon: Users, color: '#7C3AED', bg: '#F5F3FF', href: '/karma/communities' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, color: '#F59E0B', bg: '#FFFBEB', href: '/karma/wallet' },
  { id: 'qr', label: 'Scan QR', icon: QrCode, color: '#8B5CF6', bg: '#F5F3FF', href: '/karma/explore' },
  { id: 'lost-items', label: 'Lost Items', icon: MapPin, color: '#EF4444', bg: '#FEF2F2', href: '/karma/lost-items' },
];

// ---------------------------------------------------------------------------
// Snapshot Card
// ---------------------------------------------------------------------------
function KarmaSnapshotCard({ profile }: { profile: KarmaProfile }) {
  const levelCfg = LEVEL_CONFIG[profile.level] ?? LEVEL_CONFIG.L1;
  const conversionPct = CONVERSION_RATES[profile.level] ?? 25;
  const progressPercent =
    profile.level !== 'L4' ? Math.min((profile.activeKarma / (levelCfg.next ?? 1)) * 100, 100) : 100;

  return (
    <div className="bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold" style={{ backgroundColor: levelCfg.bg, color: levelCfg.color }}>
            {levelCfg.label}
          </div>
          <div>
            <div className="text-white font-bold text-lg">{levelCfg.name}</div>
            <div className="text-white/60 text-sm">Level {profile.level}</div>
          </div>
        </div>
        <Link
          href="/karma/my-karma"
          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm font-medium text-white transition-colors"
        >
          My Karma
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex justify-around mb-4">
        <div className="text-center">
          <div className="text-3xl font-extrabold">{profile.activeKarma.toLocaleString()}</div>
          <div className="text-white/70 text-sm mt-0.5">Active Karma</div>
        </div>
        <div className="w-px bg-white/20" />
        <div className="text-center">
          <div className="text-3xl font-extrabold">{profile.lifetimeKarma.toLocaleString()}</div>
          <div className="text-white/70 text-sm mt-0.5">Lifetime</div>
        </div>
        <div className="w-px bg-white/20" />
        <div className="text-center">
          <div className="text-3xl font-extrabold" style={{ color: levelCfg.color }}>{conversionPct}%</div>
          <div className="text-white/70 text-sm mt-0.5">Conversion</div>
        </div>
      </div>

      {profile.level !== 'L4' && (
        <div className="mb-4">
          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="text-white/70 text-xs mt-1.5 text-center">
            {profile.activeKarma.toLocaleString()} / {levelCfg.next?.toLocaleString()} to next level
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-sm font-medium text-white">
          <Shield className="w-3.5 h-3.5" />
          Trust {profile.trustScore}%
        </div>
        <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-sm font-medium text-white">
          <CheckCircle className="w-3.5 h-3.5" />
          {profile.eventsCompleted} Events
        </div>
        <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-sm font-medium text-white">
          <Clock className="w-3.5 h-3.5" />
          {profile.totalHours}h Given
        </div>
      </div>

      {profile.decayWarning && (
        <div className="flex items-center gap-2 bg-black/20 mt-3 px-3 py-2 rounded-lg text-sm text-yellow-300">
          <Star className="w-3.5 h-3.5" />
          {profile.decayWarning}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event Card
// ---------------------------------------------------------------------------
function EventCard({ event }: { event: KarmaEvent }) {
  const catCfg = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS.community;
  const progressPercent = event.capacity?.goal
    ? Math.min((event.capacity.enrolled / event.capacity.goal) * 100, 100)
    : 0;

  return (
    <Link
      href={`/karma/event/${event._id}`}
      className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Hero image area */}
      <div className="relative h-32 overflow-hidden">
        {event.image ? (
          <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: catCfg.bg }}>
            <Leaf className="w-12 h-12" style={{ color: catCfg.color }} />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: catCfg.bg, color: catCfg.color }}>
          <Leaf className="w-3 h-3" />
          {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full text-xs font-bold text-yellow-400">
          <Star className="w-3 h-3" />
          +{event.maxKarmaPerEvent}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">{event.name}</h3>
        <p className="text-xs text-muted-foreground mb-2">{event.organizer.name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{event.location.city ?? event.location.address}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <Calendar className="w-3 h-3" />
          <span>{event.date ? new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBD'}</span>
          {event.time && <span> &bull; {event.time.start}</span>}
        </div>

        {event.capacity && (
          <div className="mb-2">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progressPercent}%`, backgroundColor: '#8B5CF6' }} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">{event.capacity.enrolled}/{event.capacity.goal} enrolled</div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-[#F5F3FF] text-[#8B5CF6] text-xs font-semibold px-2 py-1 rounded-full">
            <Leaf className="w-3 h-3" />
            ~{event.maxKarmaPerEvent} Karma
          </span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="w-3 h-3" />
            {event.expectedDurationHours}h
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------
const HOW_STEPS = [
  { step: '1', title: 'Find an Event', desc: 'Browse karma-enabled events near you', color: '#3B82F6', bg: '#EFF6FF' },
  { step: '2', title: 'Join & Check In', desc: 'Scan QR or use GPS at the venue', color: '#8B5CF6', bg: '#F5F3FF' },
  { step: '3', title: 'Earn Karma Points', desc: 'Get verified and earn karma automatically', color: '#F59E0B', bg: '#FFFBEB' },
  { step: '4', title: 'Convert to Coins', desc: 'Convert karma to ReZ Coins weekly', color: '#22C55E', bg: '#DCFCE7' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function KarmaHomePage() {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<KarmaProfile | null>(null);
  const [events, setEvents] = useState<KarmaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setProfileError(false);
    try {
      const [profileRes, eventsRes] = await Promise.all([
        isAuthenticated ? getKarmaProfile('me') : Promise.resolve({ success: false as const }),
        getNearbyEvents({ status: 'published' }),
      ]);

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
      } else if (isAuthenticated) {
        setProfileError(true);
      }

      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data.events?.slice(0, 10) ?? []);
      }
    } catch {
      setProfileError(true);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Karma</h1>
          <p className="text-muted-foreground text-sm">Do Good. Earn More.</p>
        </div>
        <Link
          href="/karma/wallet"
          className="flex items-center gap-2 bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#8B5CF6] px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
        >
          <Wallet className="w-4 h-4" />
          Wallet
        </Link>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Snapshot Card */}
          {profile && <KarmaSnapshotCard profile={profile} />}

          {/* Quick Actions */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow active:scale-95"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: action.bg }}>
                      <Icon className="w-6 h-6" style={{ color: action.color }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-900 text-center">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Nearby Events */}
          {events.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Nearby Events</h2>
                <Link href="/karma/explore" className="text-sm font-semibold text-[#8B5CF6] hover:underline">
                  See All
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* How It Works */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">How Karma Works</h2>
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {HOW_STEPS.map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0" style={{ backgroundColor: item.bg, color: item.color }}>
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Karma Levels */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Karma Levels</h2>
            <Card className="p-6">
              <div className="space-y-3">
                {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => {
                  const rate = CONVERSION_RATES[level];
                  return (
                    <div key={level} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-gray-900">{cfg.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {level === 'L4' ? '5000+ karma' : `Up to ${cfg.next?.toLocaleString()} karma`}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        {rate}% rate
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
