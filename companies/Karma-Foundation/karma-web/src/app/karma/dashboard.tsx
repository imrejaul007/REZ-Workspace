'use client';

import { useEffect, useState } from 'react';

interface KarmaProfile {
  level: number;
  currentKarma: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  progressToNextLevel: number;
  completedMissions: number;
  redeemedPerks: number;
  earnedBadges: number;
}

interface TierInfo {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

const TIERS: TierInfo[] = [
  { name: 'Bronze', minPoints: 0, maxPoints: 999, color: '#CD7F32' },
  { name: 'Silver', minPoints: 1000, maxPoints: 2499, color: '#C0C0C0' },
  { name: 'Gold', minPoints: 2500, maxPoints: 4999, color: '#FFD700' },
  { name: 'Platinum', minPoints: 5000, maxPoints: Infinity, color: '#E5E4E2' },
];

export default function KarmaDashboard() {
  const [profile, setProfile] = useState<KarmaProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/karma/profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const tierInfo = TIERS.find(t => t.name.toLowerCase() === tier.toLowerCase());
    return tierInfo?.color || '#888';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Karma Level Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6" style={{ borderColor: getTierColor(profile?.tier || 'bronze'), borderWidth: 2 }}>
          <div className="text-center">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Your Karma Level</p>
            <h1 className="text-6xl font-bold mt-2" style={{ color: getTierColor(profile?.tier || 'bronze') }}>
              {profile?.level || 1}
            </h1>
            <p className="text-lg font-medium text-gray-700 capitalize mt-1">{profile?.tier || 'bronze'}</p>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ width: `${profile?.progressToNextLevel || 0}%`, backgroundColor: getTierColor(profile?.tier || 'bronze') }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{profile?.currentKarma || 0} karma points</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">{profile?.completedMissions || 0}</p>
            <p className="text-sm text-gray-500">Missions</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{profile?.redeemedPerks || 0}</p>
            <p className="text-sm text-gray-500">Perks</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">{profile?.earnedBadges || 0}</p>
            <p className="text-sm text-gray-500">Badges</p>
          </div>
        </div>
      </div>
    </div>
  );
}
