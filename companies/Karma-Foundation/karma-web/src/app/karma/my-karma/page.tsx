'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Leaf,
  Shield,
  Wallet,
  Clock,
  Trophy,
  Download,
  Lock,
  Calendar,
  Star,
  CheckCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  getKarmaProfile,
  getKarmaHistory,
  getBadges,
  downloadImpactReport,
} from '@/lib/karmaApi';
import type { KarmaProfile, EarnRecord, KarmaBadge } from '@/types/karma';

// ---------------------------------------------------------------------------
// Level Config
// ---------------------------------------------------------------------------
const LEVEL_CONFIG: Record<string, { label: string; name: string; color: string; bg: string; threshold: number; next: number | null }> = {
  L1: { label: 'L1', name: 'Seed', color: '#22C55E', bg: '#DCFCE7', threshold: 0, next: 500 },
  L2: { label: 'L2', name: 'Sprout', color: '#06B6D4', bg: '#ECFEFF', threshold: 500, next: 2000 },
  L3: { label: 'L3', name: 'Bloom', color: '#F43F5E', bg: '#FFF1F2', threshold: 2000, next: 5000 },
  L4: { label: 'L4', name: 'Tree', color: '#EAB308', bg: '#FEF9C3', threshold: 5000, next: null },
};

const CONVERSION_RATES: Record<string, number> = {
  L1: 25, L2: 50, L3: 75, L4: 100,
};

const PASSPORT_BG: Record<string, [string, string]> = {
  L1: ['#1a3a52', '#2A5577'],
  L2: ['#064E3B', '#059669'],
  L3: ['#7C3AED', '#A78BFA'],
  L4: ['#92400E', '#F59E0B'],
};

// ---------------------------------------------------------------------------
// QR Passport Card
// ---------------------------------------------------------------------------
function PassportCard({ profile }: { profile: KarmaProfile }) {
  const { user } = useAuth();
  const userName = user?.firstName ?? user?.phoneNumber ?? 'Volunteer';
  const levelCfg = LEVEL_CONFIG[profile.level] ?? LEVEL_CONFIG.L1;
  const bgGrad = PASSPORT_BG[profile.level] ?? PASSPORT_BG.L1;
  const qrData = JSON.stringify({ u: profile.userId, l: profile.level, k: profile.activeKarma, t: profile.trustScore });

  return (
    <Card className="overflow-hidden" style={{ background: `linear-gradient(135deg, ${bgGrad[0]}, ${bgGrad[1]})` }}>
      <div className="p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-bold text-white/60 tracking-wider mb-1">KARMA PASSPORT</div>
            <div className="text-xl font-extrabold">{userName}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-extrabold" style={{ backgroundColor: levelCfg.bg, color: levelCfg.color }}>
                {profile.level}
              </span>
              <span className="text-sm font-bold" style={{ color: levelCfg.color }}>{levelCfg.name}</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-1">
            {/* QR Code placeholder - render via canvas */}
            <QRCodeCanvas value={qrData} size={80} bgColor="transparent" />
          </div>
        </div>

        <div className="border-t border-white/20 my-4" />

        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-lg font-extrabold">{profile.activeKarma.toLocaleString()}</div>
            <div className="text-xs text-white/60 mt-0.5">Active Karma</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-lg font-extrabold">{CONVERSION_RATES[profile.level]}%</div>
            <div className="text-xs text-white/60 mt-0.5">Conversion</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-lg font-extrabold">{profile.trustScore}%</div>
            <div className="text-xs text-white/60 mt-0.5">Trust</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-lg font-extrabold">{profile.eventsCompleted}</div>
            <div className="text-xs text-white/60 mt-0.5">Events</div>
          </div>
        </div>

        <div className="text-center text-white/40 text-xs mt-4 tracking-wide">
          Doing Good. Build Karma. Unlock More.
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// QR Code Canvas component (client-side only)
// ---------------------------------------------------------------------------
function QRCodeCanvas({ value, size, bgColor }: { value: string; size: number; bgColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    import('qrcode').then(({ toCanvas }) => {
      if (canvasRef.current) {
        toCanvas(canvasRef.current, value, {
          width: size,
          margin: 1,
          color: { dark: '#ffffff', light: bgColor },
        });
      }
    });
  }, [value, size, bgColor]);

  return <canvas ref={canvasRef} />;
}

// ---------------------------------------------------------------------------
// Level Progress Bar
// ---------------------------------------------------------------------------
function LevelProgressBar({ level }: { level: 'L1' | 'L2' | 'L3' | 'L4' }) {
  const levels: ('L1' | 'L2' | 'L3' | 'L4')[] = ['L1', 'L2', 'L3', 'L4'];
  const currentIdx = levels.indexOf(level);

  return (
    <div className="mb-6">
      <div className="relative flex justify-between items-center">
        {/* Connecting lines */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 mx-4">
          <div className="h-full bg-[#8B5CF6] rounded-full" style={{ width: `${(currentIdx / (levels.length - 1)) * 100}%` }} />
        </div>
        {levels.map((lvl, idx) => {
          const cfg = LEVEL_CONFIG[lvl];
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={lvl} className="flex flex-col items-center z-10">
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive ? cfg.color : '#f3f4f6',
                  borderColor: isActive ? cfg.color : '#e5e7eb',
                }}
              >
                {isCurrent ? (
                  <div className="w-2 h-2 bg-white rounded-full" />
                ) : isActive ? (
                  <CheckCircle className="w-3 h-3 text-white" />
                ) : null}
              </div>
              <span className="text-xs font-semibold mt-1.5" style={{ color: isCurrent ? cfg.color : '#9ca3af' }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge Item
// ---------------------------------------------------------------------------
function BadgeItem({ badge, index }: { badge: KarmaBadge; index: number }) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E9'];
  const color = colors[index % colors.length];
  const bgColor = `${color}20`;

  return (
    <div className="flex flex-col items-center w-20">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-1" style={{ backgroundColor: bgColor }}>
        {badge.icon ?? '🏆'}
      </div>
      <span className="text-xs font-semibold text-gray-900 text-center truncate w-full">{badge.name}</span>
      <span className="text-xs text-muted-foreground mt-0.5">
        {new Date(badge.earnedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Earn Record Item
// ---------------------------------------------------------------------------
function EarnRecordItem({ record }: { record: EarnRecord }) {
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    APPROVED_PENDING_CONVERSION: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
    CONVERTED: { label: 'Converted', color: '#22C55E', bg: '#DCFCE7' },
    REJECTED: { label: 'Rejected', color: '#EF4444', bg: '#FEF2F2' },
    ROLLED_BACK: { label: 'Rolled Back', color: '#6B7280', bg: '#F3F4F6' },
  };
  const status = statusConfig[record.status] ?? statusConfig.APPROVED_PENDING_CONVERSION;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: status.bg }}>
          <Leaf className="w-5 h-5" style={{ color: status.color }} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">{record.eventName ?? 'Event'}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(record.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <div className="font-extrabold text-sm text-green-600">+{record.karmaEarned}</div>
        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: status.bg, color: status.color }}>
          {status.label}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MyKarmaPage() {
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState<KarmaProfile | null>(null);
  const [history, setHistory] = useState<EarnRecord[]>([]);
  const [badges, setBadges] = useState<KarmaBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    try {
      const [profileRes, historyRes, badgesRes] = await Promise.all([
        getKarmaProfile('me'),
        getKarmaHistory('me', 1),
        getBadges(),
      ]);
      if (profileRes.success && profileRes.data) setProfile(profileRes.data);
      if (historyRes.success && historyRes.data) setHistory(historyRes.data.records ?? []);
      if (badgesRes.success && badgesRes.data) setBadges(badgesRes.data.badges ?? []);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownloadReport = async () => {
    if (downloading || !profile) return;
    setDownloading(true);
    try {
      const userName = user?.firstName ?? user?.phoneNumber ?? 'Volunteer';
      const { blob, filename } = await downloadImpactReport(userName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // PDF download not available in demo
      alert('Impact Report download is not available in demo mode.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="flex flex-col items-center justify-center py-12 px-6">
          <Lock className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-muted-foreground text-sm mb-6 text-center">Sign in to track your karma journey</p>
          <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">Sign In</Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const levelCfg = profile ? (LEVEL_CONFIG[profile.level] ?? LEVEL_CONFIG.L1) : LEVEL_CONFIG.L1;
  const conversionRate = profile ? CONVERSION_RATES[profile.level] : 25;
  const progressPercent = profile && profile.level !== 'L4'
    ? Math.min((profile.activeKarma / (levelCfg.next ?? 1)) * 100, 100)
    : 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Karma</h1>
          <p className="text-muted-foreground text-sm">Your karma journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadReport}
            disabled={downloading}
            className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#F5F3FF]"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Link
            href="/karma/wallet"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#F5F3FF] transition-colors"
          >
            <Wallet className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="overflow-hidden" style={{ background: 'linear-gradient(135deg, #7C3AED, #8B5CF6, #A78BFA)' }}>
        <div className="p-6 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold" style={{ backgroundColor: levelCfg.bg, color: levelCfg.color }}>
              {profile?.level ?? 'L1'}
            </div>
            <span className="text-2xl font-bold">{levelCfg.name}</span>
          </div>

          <div className="flex justify-around mb-4">
            <div className="text-center">
              <div className="text-3xl font-extrabold">{profile?.activeKarma.toLocaleString() ?? '0'}</div>
              <div className="text-white/70 text-sm mt-0.5">Active Karma</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-extrabold">{profile?.lifetimeKarma.toLocaleString() ?? '0'}</div>
              <div className="text-white/70 text-sm mt-0.5">Lifetime</div>
            </div>
          </div>

          {profile && profile.level !== 'L4' && (
            <div className="mt-4">
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="text-white/80 text-xs mt-1.5 text-center">
                {profile.activeKarma.toLocaleString()} / {levelCfg.next?.toLocaleString()} to next level
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Passport Card */}
      {profile && <PassportCard profile={profile} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: CheckCircle, label: 'Events', value: profile?.eventsCompleted ?? 0 },
          { icon: Clock, label: 'Hours', value: `${profile?.totalHours ?? 0}h` },
          { icon: Trophy, label: 'Rate', value: `${conversionRate}%` },
          { icon: Wallet, label: 'Wallet', value: 'View' },
        ].map((stat, i) => (
          <Card key={i} className="flex flex-col items-center p-3 text-center">
            <stat.icon className="w-5 h-5 text-[#8B5CF6] mb-1" />
            <div className="font-extrabold text-sm text-gray-900">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Impact Report CTA */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
            <Download className="w-6 h-6 text-[#8B5CF6]" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-gray-900">Download Impact Report</div>
            <div className="text-xs text-muted-foreground">Share your volunteer story</div>
          </div>
          <Button
            size="sm"
            className="bg-[#8B5CF6] hover:bg-[#7C3AED]"
            onClick={handleDownloadReport}
            disabled={downloading}
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Trust Score */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-6 h-6 text-[#8B5CF6]" />
          <span className="font-bold text-gray-900">Trust Score</span>
          <span className="ml-auto font-extrabold text-xl text-gray-900">{profile?.trustScore ?? 0}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-[#8B5CF6] rounded-full" style={{ width: `${profile?.trustScore ?? 0}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          Your trust score is based on consistent participation, NGO approvals, and event completion.
        </p>
      </Card>

      {/* Level Progress */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-2">Karma Levels</h3>
        <LevelProgressBar level={profile?.level ?? 'L1'} />
        <div className="space-y-2">
          {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => {
            const rate = CONVERSION_RATES[lvl];
            const isCurrent = lvl === (profile?.level ?? 'L1');
            return (
              <div key={lvl} className={`flex items-center gap-3 p-2 rounded-lg ${isCurrent ? 'bg-[#F5F3FF]' : ''}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{cfg.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {cfg.next ? `From ${cfg.threshold.toLocaleString()} karma` : 'Max level'}
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                  {rate}%
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Badges ({badges.length})</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            {badges.map((badge, idx) => (
              <BadgeItem key={badge.id} badge={badge} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Earn History */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3">Earn History</h3>
        <Card>
          {history.length === 0 ? (
            <div className="flex flex-col items-center py-10 px-6">
              <Leaf className="w-12 h-12 text-muted-foreground mb-3" />
              <div className="font-bold text-gray-900 mb-1">No karma earned yet</div>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Join events and complete check-ins to start earning karma
              </p>
              <Link href="/karma/explore">
                <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">Explore Events</Button>
              </Link>
            </div>
          ) : (
            <div className="px-4">
              {history.map((record) => (
                <EarnRecordItem key={record._id} record={record} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
