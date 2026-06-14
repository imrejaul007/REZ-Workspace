'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Leaf,
  Users,
  Trophy,
  Star,
  Gift,
  TreePine,
  Heart,
  GraduationCap,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Building2,
  ChevronRight,
  Plus,
  Award,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

// CorpPerks Karma Types
interface CorpKarmaCampaign {
  id: string;
  name: string;
  description: string;
  category: 'environment' | 'education' | 'health' | 'community' | 'disaster_relief';
  status: 'active' | 'completed' | 'draft';
  impactGoal: { metric: string; target: number; current: number };
  rewards: { karmaPointsPerAction: number; bonusPointsOnCompletion: number };
  participantCount: number;
  myProgress?: { completed: number; karmaEarned: number };
  endDate: string;
}

interface CorpKarmaStats {
  totalKarma: number;
  rank: number;
  campaignsJoined: number;
  campaignsCompleted: number;
  totalImpact: number;
  co2Offset: number;
  treesPlanted: number;
  mealsDonated: number;
  streak: number;
}

// Mock data
const MOCK_CAMPAIGNS: CorpKarmaCampaign[] = [
  {
    id: '1',
    name: 'Plant 1000 Trees',
    description: 'Join us in making the planet greener by planting trees in your community',
    category: 'environment',
    status: 'active',
    impactGoal: { metric: 'Trees', target: 1000, current: 650 },
    rewards: { karmaPointsPerAction: 50, bonusPointsOnCompletion: 500 },
    participantCount: 120,
    myProgress: { completed: 5, karmaEarned: 250 },
    endDate: '2024-06-30',
  },
  {
    id: '2',
    name: 'Teach a Child',
    description: 'Volunteer to teach underprivileged children in your area',
    category: 'education',
    status: 'active',
    impactGoal: { metric: 'Hours', target: 500, current: 320 },
    rewards: { karmaPointsPerAction: 100, bonusPointsOnCompletion: 1000 },
    participantCount: 45,
    myProgress: { completed: 2, karmaEarned: 200 },
    endDate: '2024-09-30',
  },
  {
    id: '3',
    name: 'Beach Cleanup',
    description: 'Help clean up our local beaches and protect marine life',
    category: 'environment',
    status: 'completed',
    impactGoal: { metric: 'Kg', target: 200, current: 250 },
    rewards: { karmaPointsPerAction: 75, bonusPointsOnCompletion: 300 },
    participantCount: 85,
    myProgress: { completed: 3, karmaEarned: 225 },
    endDate: '2024-02-28',
  },
];

const MOCK_STATS: CorpKarmaStats = {
  totalKarma: 675,
  rank: 12,
  campaignsJoined: 3,
  campaignsCompleted: 1,
  totalImpact: 127.5,
  co2Offset: 45,
  treesPlanted: 8,
  mealsDonated: 25,
  streak: 5,
};

const CATEGORY_CONFIG: Record<string, { icon: typeof Leaf; color: string; bg: string; label: string }> = {
  environment: { icon: TreePine, color: '#22C55E', bg: '#DCFCE7', label: 'Environment' },
  education: { icon: GraduationCap, color: '#3B82F6', bg: '#DBEAFE', label: 'Education' },
  health: { icon: Heart, color: '#EF4444', bg: '#FEE2E2', label: 'Health' },
  community: { icon: Users, color: '#F59E0B', bg: '#FEF3C7', label: 'Community' },
  disaster_relief: { icon: AlertTriangle, color: '#8B5CF6', bg: '#EDE9FE', label: 'Relief' },
};

export default function CorpKarmaPage() {
  const { isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<CorpKarmaCampaign[]>([]);
  const [stats, setStats] = useState<CorpKarmaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 500));
    setCampaigns(MOCK_CAMPAIGNS);
    setStats(MOCK_STATS);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoin = async (campaignId: string) => {
    setJoining(campaignId);
    await new Promise((r) => setTimeout(r, 800));
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, myProgress: { completed: 0, karmaEarned: 0 } }
          : c
      )
    );
    setJoining(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-[#8B5CF6] tracking-wider">CORPPERKS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Corporate Karma</h1>
          <p className="text-muted-foreground text-sm">Make an impact with your company</p>
        </div>
        <Link
          href="/karma"
          className="text-sm font-semibold text-[#8B5CF6] hover:underline"
        >
          Back to Karma
        </Link>
      </div>

      {/* Stats Hero */}
      {stats && (
        <Card className="p-5" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
          <div className="text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-medium text-white/70">Your Corp Karma</div>
                <div className="text-4xl font-extrabold">{stats.totalKarma.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-white/70">Company Rank</div>
                <div className="text-2xl font-extrabold">#{stats.rank}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold">{stats.campaignsJoined}</div>
                <div className="text-xs text-white/70">Joined</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{stats.campaignsCompleted}</div>
                <div className="text-xs text-white/70">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{stats.treesPlanted}</div>
                <div className="text-xs text-white/70">Trees</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{stats.streak}</div>
                <div className="text-xs text-white/70">Streak</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Impact Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <TreePine className="w-6 h-6 text-[#22C55E] mx-auto mb-2" />
            <div className="text-xl font-extrabold text-gray-900">{stats.co2Offset} kg</div>
            <div className="text-xs text-muted-foreground">CO₂ Offset</div>
          </Card>
          <Card className="p-4 text-center">
            <Heart className="w-6 h-6 text-[#EF4444] mx-auto mb-2" />
            <div className="text-xl font-extrabold text-gray-900">{stats.mealsDonated}</div>
            <div className="text-xs text-muted-foreground">Meals Donated</div>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
            <div className="text-xl font-extrabold text-gray-900">{stats.totalImpact}h</div>
            <div className="text-xs text-muted-foreground">Impact Hours</div>
          </Card>
        </div>
      )}

      {/* Active Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Active Campaigns</h2>
          <Badge variant="outline" className="border-[#8B5CF6] text-[#8B5CF6]">
            {activeCampaigns.length} Active
          </Badge>
        </div>

        <div className="space-y-4">
          {activeCampaigns.map((campaign) => {
            const cfg = CATEGORY_CONFIG[campaign.category];
            const Icon = cfg.icon;
            const progress = (campaign.impactGoal.current / campaign.impactGoal.target) * 100;
            const isJoined = !!campaign.myProgress;

            return (
              <Card key={campaign.id} className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                        <span
                          className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      {isJoined ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-[#22C55E]">
                          <CheckCircle className="w-4 h-4" />
                          Joined
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-[#8B5CF6] hover:bg-[#7C3AED]"
                          onClick={() => handleJoin(campaign.id)}
                          disabled={joining === campaign.id}
                        >
                          {joining === campaign.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Join
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {campaign.description}
                    </p>
                  </div>
                </div>

                {/* Impact Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-900">{campaign.impactGoal.metric}</span>
                    <span className="text-muted-foreground">
                      {campaign.impactGoal.current} / {campaign.impactGoal.target}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: cfg.color }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{campaign.participantCount} joined</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-[#F59E0B]" />
                      <span className="text-sm font-semibold text-[#F59E0B]">
                        +{campaign.rewards.karmaPointsPerAction} karma
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Ends {new Date(campaign.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* My Progress */}
                {isJoined && campaign.myProgress && (
                  <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: cfg.bg }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5" style={{ color: cfg.color }} />
                        <span className="font-semibold text-sm" style={{ color: cfg.color }}>My Progress</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: cfg.color }}>
                          +{campaign.myProgress.karmaEarned} karma
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {campaign.myProgress.completed} actions completed
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Link */}
                {isJoined && (
                  <Link href={`/karma/corporate/${campaign.id}`}>
                    <Button variant="outline" className="w-full mt-4 border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#F5F3FF]">
                      View Campaign
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Completed Campaigns */}
      {campaigns.filter((c) => c.status === 'completed').length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Completed Campaigns</h2>
          <div className="space-y-3">
            {campaigns
              .filter((c) => c.status === 'completed')
              .map((campaign) => {
                const cfg = CATEGORY_CONFIG[campaign.category];
                const Icon = cfg.icon;

                return (
                  <Card key={campaign.id} className="p-4 opacity-75">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: cfg.bg }}
                      >
                        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{campaign.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {campaign.impactGoal.current} {campaign.impactGoal.metric} achieved
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-[#22C55E]" />
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Leaderboard Teaser */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F59E0B]" />
            <span className="font-bold text-gray-900">Company Leaderboard</span>
          </div>
          <Link href="/karma/corporate/leaderboard">
            <Button variant="ghost" size="sm" className="text-[#8B5CF6]">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="text-center py-4 text-muted-foreground">
          <div className="text-2xl font-extrabold text-gray-900">#{stats?.rank ?? '-'} </div>
          <div className="text-sm">of {stats?.totalKarma ?? 0} karma points</div>
        </div>
      </Card>
    </div>
  );
}
