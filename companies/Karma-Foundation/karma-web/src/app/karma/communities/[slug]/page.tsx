'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Flag,
  Clock,
  Leaf,
  Heart,
  MessageCircle,
  Pin,
  Building2,
  User as Person,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCommunity, getCommunityFeed, followCommunity, unfollowCommunity } from '@/lib/karmaApi';
import type { Community, CommunityPost } from '@/types/karma';

const CATEGORY_COLORS: Record<string, { gradient: string; icon: string; label: string }> = {
  environment: { gradient: 'from-green-700 to-green-500', icon: '🌍', label: 'Environment' },
  food: { gradient: 'from-amber-700 to-amber-500', icon: '🍽️', label: 'Food' },
  health: { gradient: 'from-purple-700 to-purple-400', icon: '🏥', label: 'Health' },
  education: { gradient: 'from-blue-700 to-blue-400', icon: '📚', label: 'Education' },
  community: { gradient: 'from-pink-700 to-pink-400', icon: '🤝', label: 'Community' },
};

function PostCard({ post }: { post: CommunityPost }) {
  const isNGO = post.authorType === 'ngo';
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className={`p-4 ${isNGO ? 'border-l-4 border-l-amber-500' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
          isNGO ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
        }`}>
          {isNGO ? <Building2 className="w-3 h-3" /> : <Person className="w-3 h-3" />}
          {isNGO ? 'NGO' : 'Volunteer'}
        </span>
        {post.isPinned && (
          <span className="flex items-center gap-1 text-xs font-medium text-[#8B5CF6]">
            <Pin className="w-3 h-3" />
            Pinned
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{formattedDate}</span>
      </div>

      <p className="text-sm text-gray-900 leading-relaxed mb-3">{post.content}</p>

      {post.tags.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs text-[#8B5CF6] font-medium bg-[#F5F3FF] px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3.5 h-3.5 text-yellow-400" />
          +{post.karmaEarned} karma
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="w-3.5 h-3.5" />
          {post.likeCount}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageCircle className="w-3.5 h-3.5" />
          {post.commentCount}
        </div>
      </div>
    </Card>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function CommunityDetailPage() {
  const params = useParams();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const slug = params.slug as string;
    if (!slug) return;
    setLoading(true);
    try {
      const [commRes, feedRes] = await Promise.all([
        getCommunity(slug),
        getCommunityFeed(slug, 1, 20),
      ]);
      if (commRes.success && commRes.data) setCommunity(commRes.data);
      if (feedRes.success && feedRes.data) setPosts(feedRes.data.posts ?? []);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, [params.slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFollowToggle = useCallback(async () => {
    if (!community) return;
    const wasFollowing = community.isFollowing;
    setCommunity((prev) => prev ? { ...prev, isFollowing: !prev.isFollowing, followerCount: prev.isFollowing ? prev.followerCount - 1 : prev.followerCount + 1 } : null);
    setFollowingLoading(true);
    try {
      if (wasFollowing) {
        const res = await unfollowCommunity(community.slug);
        if (!res.success) setCommunity((prev) => prev ? { ...prev, isFollowing: wasFollowing, followerCount: community.followerCount } : null);
      } else {
        const res = await followCommunity(community.slug);
        if (!res.success) setCommunity((prev) => prev ? { ...prev, isFollowing: wasFollowing, followerCount: community.followerCount } : null);
      }
    } catch { setCommunity((prev) => prev ? { ...prev, isFollowing: wasFollowing, followerCount: community.followerCount } : null); }
    finally { setFollowingLoading(false); }
  }, [community]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="flex flex-col items-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Community not found</h2>
          <Link href="/karma/communities">
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">Back to Communities</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const catConfig = CATEGORY_COLORS[community.category] ?? CATEGORY_COLORS.community;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Hero Banner */}
      <div className={`h-40 bg-gradient-to-r ${catConfig.gradient} relative flex flex-col items-center justify-center`}>
        <span className="text-6xl">{catConfig.icon}</span>
        <span className="text-white/90 text-sm font-medium mt-2">{catConfig.label}</span>

        {/* Back button */}
        <Link
          href="/karma/communities"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Community Info */}
      <div className="px-4">
        <Card className="p-4 -mt-6 relative z-10">
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">{community.name}</h1>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{community.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-border mb-4">
            <div className="text-center px-3">
              <div className="text-xl font-extrabold text-gray-900">{community.followerCount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xl font-extrabold text-gray-900">{community.stats.eventsHosted}</div>
              <div className="text-xs text-muted-foreground">Events</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xl font-extrabold text-gray-900">{community.stats.totalVolunteers}</div>
              <div className="text-xs text-muted-foreground">Volunteers</div>
            </div>
          </div>

          <button
            onClick={handleFollowToggle}
            disabled={followingLoading}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              community.isFollowing
                ? 'bg-[#F5F3FF] border border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#EDE9FE]'
                : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white'
            }`}
          >
            {followingLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : community.isFollowing ? 'Following' : '+ Follow'}
          </button>
        </Card>

        {/* Feed */}
        <div className="mt-6">
          <h2 className="font-bold text-gray-900 mb-3">Feed</h2>
          {posts.length === 0 ? (
            <Card className="flex flex-col items-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-3" />
              <div className="font-bold text-gray-900 mb-1">No posts yet</div>
              <p className="text-sm text-muted-foreground text-center">
                {community.isFollowing
                  ? 'Be the first to share something!'
                  : 'Follow this community to see posts'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
