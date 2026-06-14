'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, MessageCircle, UserPlus, TrendingUp, Hash, Globe, Lock } from 'lucide-react';

interface Community {
  communityId: string;
  name: string;
  description: string;
  icon: string;
  type: 'public' | 'private' | 'hidden';
  category: string;
  memberCount: number;
  postCount: number;
  tags: string[];
  isMember: boolean;
}

interface CommunityPost {
  postId: string;
  communityId: string;
  communityName: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  type: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedTab, setSelectedTab] = useState<'discover' | 'my-communities'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    setLoading(true);
    // Simulated data - in production, fetch from team-collab-service
    setCommunities([
      {
        communityId: '1',
        name: 'Tech Enthusiasts',
        description: 'Share and discuss the latest in technology',
        icon: '💻',
        type: 'public',
        category: 'interest',
        memberCount: 234,
        postCount: 567,
        tags: ['tech', 'coding', 'ai'],
        isMember: true,
      },
      {
        communityId: '2',
        name: 'Marketing Team',
        description: 'Internal marketing team discussions',
        icon: '📣',
        type: 'private',
        category: 'department',
        memberCount: 45,
        postCount: 123,
        tags: ['marketing', 'branding'],
        isMember: true,
      },
      {
        communityId: '3',
        name: 'Fitness & Wellness',
        description: 'Health tips, workout buddies, and wellness support',
        icon: '💪',
        type: 'public',
        category: 'interest',
        memberCount: 189,
        postCount: 345,
        tags: ['fitness', 'health', 'wellness'],
        isMember: false,
      },
      {
        communityId: '4',
        name: 'Project Alpha',
        description: 'Collaboration space for Project Alpha team',
        icon: '🚀',
        type: 'private',
        category: 'project',
        memberCount: 12,
        postCount: 89,
        tags: ['project', 'alpha'],
        isMember: false,
      },
    ]);

    setPosts([
      {
        postId: '1',
        communityId: '1',
        communityName: 'Tech Enthusiasts',
        authorName: 'Alex Chen',
        content: 'Just discovered this amazing AI tool for code review. Anyone tried it?',
        type: 'text',
        likeCount: 24,
        commentCount: 8,
        createdAt: '2 hours ago',
      },
      {
        postId: '2',
        communityId: '3',
        communityName: 'Fitness & Wellness',
        authorName: 'Sarah Johnson',
        content: 'Anyone up for a morning yoga session tomorrow?',
        type: 'text',
        likeCount: 15,
        commentCount: 12,
        createdAt: '4 hours ago',
      },
    ]);
    setLoading(false);
  };

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === 'my-communities' ? c.isMember : true;
    return matchesSearch && matchesTab;
  });

  const myCommunities = communities.filter((c) => c.isMember);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Communities</h1>
          <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('discover')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTab === 'discover'
                ? 'bg-white text-indigo-600'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setSelectedTab('my-communities')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTab === 'my-communities'
                ? 'bg-white text-indigo-600'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            My Communities ({myCommunities.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* My Communities Feed */}
            {selectedTab === 'my-communities' && myCommunities.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-medium text-gray-500 mb-3">Recent Activity</h2>
                <div className="space-y-4">
                  {posts
                    .filter((p) => myCommunities.some((c) => c.communityId === p.communityId))
                    .map((post) => (
                      <PostCard key={post.postId} post={post} />
                    ))}
                </div>
              </section>
            )}

            {/* Communities Grid */}
            <section>
              <h2 className="text-sm font-medium text-gray-500 mb-3">
                {selectedTab === 'discover' ? 'Suggested Communities' : 'Your Communities'}
              </h2>
              <div className="space-y-3">
                {filteredCommunities.map((community) => (
                  <CommunityCard
                    key={community.communityId}
                    community={community}
                    onJoin={() => {
                      setCommunities((prev) =>
                        prev.map((c) =>
                          c.communityId === community.communityId
                            ? { ...c, isMember: true, memberCount: c.memberCount + 1 }
                            : c
                        )
                      );
                    }}
                  />
                ))}
                {filteredCommunities.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No communities found</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function CommunityCard({
  community,
  onJoin,
}: {
  community: Community;
  onJoin: () => void;
}) {
  const TypeIcon = community.type === 'public' ? Globe : community.type === 'private' ? Lock : Hash;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          {community.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{community.name}</h3>
            <TypeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {community.memberCount} members
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {community.postCount} posts
            </span>
          </div>
          <div className="flex gap-2 mt-3">
            {community.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      {!community.isMember && (
        <button
          onClick={onJoin}
          className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Join Community
        </button>
      )}
    </div>
  );
}

function PostCard({ post }: { post: CommunityPost }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
          {post.authorName.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{post.authorName}</span>
            <span className="text-xs text-gray-500">in {post.communityName}</span>
          </div>
          <span className="text-xs text-gray-400">{post.createdAt}</span>
        </div>
      </div>
      <p className="text-gray-700 mb-3">{post.content}</p>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <button className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
          <TrendingUp className="w-4 h-4" />
          {post.likeCount}
        </button>
        <button className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
          <MessageCircle className="w-4 h-4" />
          {post.commentCount}
        </button>
      </div>
    </div>
  );
}

// Simple signal-like state for React
