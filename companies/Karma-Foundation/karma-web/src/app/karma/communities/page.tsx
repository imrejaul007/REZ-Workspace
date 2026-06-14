'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Flag,
  Leaf,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCommunities, followCommunity, unfollowCommunity } from '@/lib/karmaApi';
import type { Community } from '@/types/karma';

const CATEGORY_COLORS: Record<string, { gradient: string; icon: string; label: string }> = {
  environment: { gradient: 'from-green-700 to-green-500', icon: '🌍', label: 'Environment' },
  food: { gradient: 'from-amber-700 to-amber-500', icon: '🍽️', label: 'Food' },
  health: { gradient: 'from-purple-700 to-purple-400', icon: '🏥', label: 'Health' },
  education: { gradient: 'from-blue-700 to-blue-400', icon: '📚', label: 'Education' },
  community: { gradient: 'from-pink-700 to-pink-400', icon: '🤝', label: 'Community' },
};

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'environment', label: 'Environment' },
  { id: 'food', label: 'Food' },
  { id: 'health', label: 'Health' },
  { id: 'education', label: 'Education' },
  { id: 'community', label: 'Community' },
];

function CommunityCard({
  community,
  onFollowToggle,
}: {
  community: Community;
  onFollowToggle: (c: Community) => void;
}) {
  const catConfig = CATEGORY_COLORS[community.category] ?? CATEGORY_COLORS.community;
  const [followingLoading, setFollowingLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFollowingLoading(true);
    try {
      if (community.isFollowing) {
        await unfollowCommunity(community.slug);
      } else {
        await followCommunity(community.slug);
      }
      onFollowToggle(community);
    } catch { /* revert handled by parent */ }
    finally { setFollowingLoading(false); }
  };

  return (
    <Link href={`/karma/communities/${community.slug}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Banner */}
        <div className={`h-24 bg-gradient-to-r ${catConfig.gradient} relative flex items-center justify-center`}>
          <span className="text-5xl">{catConfig.icon}</span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-base text-gray-900 mb-1">{community.name}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{community.description}</p>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {community.followerCount.toLocaleString()} followers
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flag className="w-3.5 h-3.5" />
              {community.stats.eventsHosted} events
            </div>
          </div>

          <button
            onClick={handleFollow}
            disabled={followingLoading}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              community.isFollowing
                ? 'bg-[#F5F3FF] border border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#EDE9FE]'
                : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white'
            }`}
          >
            {followingLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : community.isFollowing ? (
              <>
                <Leaf className="w-4 h-4" />
                Following
              </>
            ) : (
              '+ Follow'
            )}
          </button>
        </div>
      </Card>
    </Link>
  );
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCommunities();
      if (res.success && res.data) {
        setCommunities(res.data);
      }
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  const handleFollowToggle = useCallback((community: Community) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.slug === community.slug
          ? {
              ...c,
              isFollowing: !c.isFollowing,
              followerCount: c.isFollowing ? c.followerCount - 1 : c.followerCount + 1,
            }
          : c,
      ),
    );
  }, []);

  const filteredCommunities =
    selectedCategory === 'all'
      ? communities
      : communities.filter((c) => c.category === selectedCategory);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
        <p className="text-muted-foreground text-sm">Join a cause</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedCategory(filter.id)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border"
            style={{
              backgroundColor: selectedCategory === filter.id ? '#8B5CF6' : '#fff',
              borderColor: selectedCategory === filter.id ? '#8B5CF6' : '#e5e7eb',
              color: selectedCategory === filter.id ? '#fff' : '#6b7280',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Communities list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCommunities.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-bold text-lg text-gray-900 mb-2">No communities found</h3>
          <p className="text-sm text-muted-foreground text-center">
            {selectedCategory !== 'all' ? `No ${selectedCategory} communities right now` : 'Check back soon for new communities'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCommunities.map((community) => (
            <CommunityCard
              key={community._id}
              community={community}
              onFollowToggle={handleFollowToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
