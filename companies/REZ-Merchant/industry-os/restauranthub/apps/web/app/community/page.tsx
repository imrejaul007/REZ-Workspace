'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  User,
  Building2,
  Package,
  Users,
  Camera,
  Link as LinkIcon,
  MapPin,
  Clock,
  Award,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { communityApi } from '@/lib/api/community';
import CreatePostModal from '@/components/community/create-post-modal';
import CommentsSection from '@/components/community/comments-section';

interface CommunityPost {
  id: string;
  author: {
    id: string;
    name: string;
    role: 'admin' | 'restaurant' | 'employee' | 'vendor';
    avatar?: string;
    verified: boolean;
    location?: string;
  };
  content: {
    text: string;
    images?: string[];
    links?: { url: string; title: string; description: string }[];
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    isLiked: boolean;
    isBookmarked: boolean;
  };
  tags: string[];
  category: 'discussion' | 'tip' | 'recipe' | 'job' | 'news' | 'review';
  createdAt: string;
  trending: boolean;
  featured: boolean;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const filters = {
          ...(categoryFilter !== 'all' ? { category: [categoryFilter] } : {}),
        };
        const result = await communityApi.getPosts(filters);
        const raw = (result as unknown).data ?? result;
        setPosts(Array.isArray(raw) ? raw : []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [searchTerm, categoryFilter]);

  const handleLikePost = async (postId: string) => {
    // Optimistic update
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              engagement: {
                ...post.engagement,
                likes: post.engagement.isLiked ? post.engagement.likes - 1 : post.engagement.likes + 1,
                isLiked: !post.engagement.isLiked,
              },
            }
          : post
      )
    );

    try {
      await communityApi.likePost(postId);
    } catch {
      // Revert on failure
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                engagement: {
                  ...post.engagement,
                  likes: post.engagement.isLiked ? post.engagement.likes - 1 : post.engagement.likes + 1,
                  isLiked: !post.engagement.isLiked,
                },
              }
            : post
        )
      );
    }
  };

  const handleBookmarkPost = (postId: string) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, engagement: { ...post.engagement, isBookmarked: !post.engagement.isBookmarked } }
          : post
      )
    );
  };

  const handleCreatePost = async (postData: {
    content: string;
    category: string;
    visibility: 'public' | 'private' | 'followers';
    images?: string[];
    tags?: string[];
    location?: string;
  }) => {
    try {
      const response = await communityApi.createPost({
        title: postData.content.slice(0, 80),
        content: postData.content,
        category: postData.category,
        tags: postData.tags ?? [],
      });
      const created = (response as unknown).data ?? response;
      setPosts(prev => [created, ...prev]);
      return;
    } catch {
      // fall through to optimistic create
    }

    // Optimistic fallback
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      author: {
        id: user?.id || 'current-user',
        name: user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'You',
        role: (user?.role as unknown) || 'employee',
        verified: true,
        location: postData.location,
      },
      content: { text: postData.content, images: postData.images },
      engagement: { likes: 0, comments: 0, shares: 0, views: 0, isLiked: false, isBookmarked: false },
      tags: postData.tags || [],
      category: postData.category as unknown,
      createdAt: new Date().toISOString(),
      trending: false,
      featured: false,
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const handleToggleComments = (postId: string) => {
    setShowComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleAddComment = async (postId: string, content: string, parentId?: string) => {
    try {
      await communityApi.createComment(postId, content, parentId);
    } catch {
      // silently fail
    }
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, engagement: { ...post.engagement, comments: post.engagement.comments + 1 } }
          : post
      )
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'restaurant': return <Building2 className="h-4 w-4" />;
      case 'employee': return <Users className="h-4 w-4" />;
      case 'vendor': return <Package className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'restaurant': return 'text-green-600';
      case 'employee': return 'text-purple-600';
      case 'vendor': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      tip: 'bg-blue-100 text-blue-800',
      discussion: 'bg-purple-100 text-purple-800',
      recipe: 'bg-green-100 text-green-800',
      job: 'bg-yellow-100 text-yellow-800',
      news: 'bg-red-100 text-red-800',
      review: 'bg-orange-100 text-orange-800',
    };
    return map[category] || 'bg-gray-100 text-gray-800';
  };

  const categories = [
    { value: 'all', label: 'All Posts' },
    { value: 'discussion', label: 'Discussions' },
    { value: 'tip', label: 'Tips & Advice' },
    { value: 'recipe', label: 'Recipes' },
    { value: 'job', label: 'Job Related' },
    { value: 'news', label: 'Industry News' },
    { value: 'review', label: 'Reviews' },
  ];

  // Local filter for client-side search after fetch
  const displayedPosts = posts.filter(post => {
    if (!searchTerm) return true;
    return (
      post.content.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Community</h1>
            <p className="text-muted-foreground mt-1">
              Connect with fellow restaurant professionals, share knowledge, and grow together
            </p>
          </div>
          <Button onClick={() => setShowCreatePost(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search posts, people, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading community posts...</p>
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Be the first to share something with the community!'}
            </p>
            <Button onClick={() => setShowCreatePost(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          {getRoleIcon(post.author.role)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-foreground">{post.author.name}</h3>
                            {post.author.verified && <Award className="h-4 w-4 text-primary" />}
                            {post.trending && (
                              <Badge variant="secondary" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {post.author.location && (
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{post.author.location}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(post.createdAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(post.category)}`}>
                          {post.category}
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-foreground leading-relaxed">{post.content.text}</p>
                      {post.content.images && post.content.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                          {post.content.images.map((_, imgIndex) => (
                            <div key={imgIndex} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                              <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      )}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">#{tag.replace(/\s+/g, '')}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.engagement.views}</span>
                        </div>
                        <span>•</span>
                        <span>{post.engagement.likes} likes</span>
                        <span>•</span>
                        <span>{post.engagement.comments} comments</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikePost(post.id)}
                          className={cn('hover:bg-red-50 hover:text-red-600', post.engagement.isLiked ? 'text-red-600' : '')}
                        >
                          <Heart className={cn('h-4 w-4 mr-2', post.engagement.isLiked ? 'fill-red-600' : '')} />
                          {post.engagement.likes}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleComments(post.id)}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {post.engagement.comments}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          {post.engagement.shares}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmarkPost(post.id)}
                        className={cn(post.engagement.isBookmarked ? 'text-yellow-600' : '')}
                      >
                        <Bookmark className={cn('h-4 w-4', post.engagement.isBookmarked ? 'fill-yellow-600' : '')} />
                      </Button>
                    </div>
                    {showComments.has(post.id) && (
                      <div className="pt-4 border-t border-border mt-4">
                        <CommentsSection
                          postId={post.id}
                          comments={[]}
                          totalComments={post.engagement.comments}
                          currentUserId={user?.id || 'current-user'}
                          currentUserRole={(user?.role as unknown) || 'employee'}
                          onAddComment={handleAddComment}
                          onUpdateComment={async () => {}}
                          onDeleteComment={async () => {}}
                          onLikeComment={() => {}}
                          onReportComment={() => {}}
                          onPinComment={() => {}}
                          isPostAuthor={post.author.id === user?.id}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onCreatePost={handleCreatePost}
        userRole={(user?.role as unknown) || 'employee'}
      />
    </DashboardLayout>
  );
}
