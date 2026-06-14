import { Controller, Get, Query, Param, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import crypto from 'crypto';
import { mockData } from '../mock-data/simple-mock-data';

@Controller('api/community')
export class EnhancedCommunityController {
  private posts = mockData.communityPosts;
  private users = mockData.users;

  @Get('posts')
  async getPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('sortBy', new DefaultValuePipe('recent')) sortBy?: 'recent' | 'popular' | 'trending' | 'engagement',
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('featured') featured?: string
  ) {
    let filteredPosts = [...this.posts];

    // Apply filters
    if (type) {
      filteredPosts = filteredPosts.filter(post => post.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.author.name.toLowerCase().includes(searchLower)
      );
    }

    if (tag) {
      filteredPosts = filteredPosts.filter(post =>
        post.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    if (featured === 'true') {
      filteredPosts = filteredPosts.filter(post => post.isFeatured);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filteredPosts.sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount));
        break;
      case 'trending':
        filteredPosts.sort((a, b) => {
          // Calculate trending score based on recent engagement
          const aScore = a.likeCount * 1 + a.commentCount * 2 + a.shareCount * 3;
          const bScore = b.likeCount * 1 + b.commentCount * 2 + b.shareCount * 3;
          return bScore - aScore;
        });
        break;
      case 'engagement':
        filteredPosts.sort((a, b) => b.engagement - a.engagement);
        break;
      default: // recent
        filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedPosts.map(post => ({
        ...post,
        timeAgo: this.getTimeAgo(post.createdAt),
        isHelpful: post.likeCount > 10 && post.commentCount > 5
      })),
      meta: {
        total: filteredPosts.length,
        page,
        limit,
        totalPages: Math.ceil(filteredPosts.length / limit),
        hasNextPage: endIndex < filteredPosts.length,
        hasPrevPage: page > 1
      },
      filters: {
        availableTypes: ['DISCUSSION', 'TIP', 'RECIPE'],
        popularTags: this.getPopularTags(),
        sortOptions: [
          { value: 'recent', label: 'Most Recent' },
          { value: 'popular', label: 'Most Popular' },
          { value: 'trending', label: 'Trending' },
          { value: 'engagement', label: 'Highest Engagement' }
        ]
      }
    };
  }

  @Get('posts/featured')
  async getFeaturedPosts() {
    const featuredPosts = this.posts
      .filter(post => post.isFeatured)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return {
      success: true,
      data: featuredPosts.map(post => ({
        ...post,
        timeAgo: this.getTimeAgo(post.createdAt)
      }))
    };
  }

  @Get('posts/trending')
  async getTrendingPosts() {
    const trendingPosts = this.posts
      .map(post => ({
        ...post,
        trendingScore: this.calculateTrendingScore(post)
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10);

    return {
      success: true,
      data: trendingPosts.map(post => ({
        ...post,
        timeAgo: this.getTimeAgo(post.createdAt)
      }))
    };
  }

  @Get('posts/:id')
  async getPostById(@Param('id') id: string) {
    const post = this.posts.find(p => p.id === id);

    if (!post) {
      return {
        success: false,
        message: 'Post not found',
        data: null
      };
    }

    // Simulate view increment
    post.viewCount += 1;

    // Generate mock comments
    const comments = this.generateMockComments(post.commentCount);

    // Find related posts
    const relatedPosts = this.posts
      .filter(p => p.id !== id && (
        p.type === post.type ||
        p.tags.some(tag => post.tags.includes(tag))
      ))
      .slice(0, 4);

    return {
      success: true,
      data: {
        ...post,
        timeAgo: this.getTimeAgo(post.createdAt),
        comments,
        relatedPosts: relatedPosts.map(p => ({
          ...p,
          timeAgo: this.getTimeAgo(p.createdAt)
        }))
      }
    };
  }

  @Get('stats')
  async getCommunityStats() {
    const totalPosts = this.posts.length;
    const totalUsers = this.users.length;
    const totalEngagement = this.posts.reduce((sum, post) =>
      sum + post.likeCount + post.commentCount + post.shareCount, 0
    );

    const stats = {
      totalPosts,
      totalUsers,
      activeUsers: this.users.filter(user => {
        const daysSinceActive = Math.floor(
          (Date.now() - new Date(user.lastActive).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceActive <= 7;
      }).length,
      totalEngagement,
      averageEngagementPerPost: Math.round(totalEngagement / totalPosts),
      postsByType: this.getPostsByType(),
      topContributors: this.getTopContributors(),
      recentActivity: {
        postsThisWeek: this.posts.filter(post => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(post.createdAt) > weekAgo;
        }).length,
        newMembersThisWeek: this.users.filter(user => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(user.joinedDate) > weekAgo;
        }).length
      },
      engagementTrends: this.getEngagementTrends(),
      popularTopics: this.getPopularTags().slice(0, 8)
    };

    return {
      success: true,
      data: stats
    };
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('category', new DefaultValuePipe('reputation')) category: 'reputation' | 'posts' | 'helpfulness'
  ) {
    let sortedUsers = [...this.users];

    switch (category) {
      case 'posts':
        sortedUsers.sort((a, b) => b.stats.postsCreated - a.stats.postsCreated);
        break;
      case 'helpfulness':
        sortedUsers.sort((a, b) => b.stats.likesReceived - a.stats.likesReceived);
        break;
      default: // reputation
        sortedUsers.sort((a, b) => b.reputation - a.reputation);
    }

    const leaderboard = sortedUsers.slice(0, 20).map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      role: user.role,
      reputation: user.reputation,
      stats: user.stats,
      badges: user.badges,
      isVerified: user.isVerified,
      score: category === 'posts' ? user.stats.postsCreated :
             category === 'helpfulness' ? user.stats.likesReceived :
             user.reputation
    }));

    return {
      success: true,
      data: leaderboard,
      categories: [
        { value: 'reputation', label: 'Reputation Points' },
        { value: 'posts', label: 'Total Posts' },
        { value: 'helpfulness', label: 'Likes Received' }
      ]
    };
  }

  @Get('users/:userId/profile')
  async getUserProfile(@Param('userId') userId: string) {
    const user = this.users.find(u => u.id === userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        data: null
      };
    }

    const userPosts = this.posts.filter(post => post.author.id === userId);
    const recentActivity = userPosts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      success: true,
      data: {
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        memberSince: this.getTimeAgo(user.joinedDate),
        lastActiveSince: this.getTimeAgo(user.lastActive),
        totalPosts: userPosts.length,
        totalLikes: userPosts.reduce((sum, post) => sum + post.likeCount, 0),
        recentActivity: recentActivity.map(post => ({
          ...post,
          timeAgo: this.getTimeAgo(post.createdAt)
        })),
        achievements: this.getUserAchievements(user),
        activityLevel: user.activityLevel
      }
    };
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  }

  private calculateTrendingScore(post): number {
    const ageInDays = Math.floor((Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const engagementScore = post.likeCount + post.commentCount * 2 + post.shareCount * 3;

    // Trending score decreases with age but rewards recent engagement
    return engagementScore * Math.max(0.1, 1 - (ageInDays / 30));
  }

  private generateMockComments(count: number) {
    return Array.from({ length: Math.min(count, 10) }, (_, i) => ({
      id: `comment-${i + 1}`,
      content: 'This is a helpful comment that adds value to the discussion. Thank you for sharing this insight!',
      author: {
        name: `${this.users[i % this.users.length].firstName} ${this.users[i % this.users.length].lastName}`,
        avatar: this.users[i % this.users.length].avatar,
        role: this.users[i % this.users.length].role
      },
      likeCount: crypto.randomInt(0, 9),
      createdAt: new Date(Date.now() - crypto.randomInt(0, 6) * 24 * 60 * 60 * 1000),
      timeAgo: this.getTimeAgo(new Date(Date.now() - crypto.randomInt(0, 6) * 24 * 60 * 60 * 1000))
    }));
  }

  private getPopularTags() {
    const tagCounts = new Map();
    this.posts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, count }));
  }

  private getPostsByType() {
    const typeCounts = new Map();
    this.posts.forEach(post => {
      typeCounts.set(post.type, (typeCounts.get(post.type) || 0) + 1);
    });

    return Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count }));
  }

  private getTopContributors() {
    return this.users
      .sort((a, b) => b.stats.postsCreated - a.stats.postsCreated)
      .slice(0, 5)
      .map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        role: user.role,
        postsCount: user.stats.postsCreated,
        reputation: user.reputation,
        isVerified: user.isVerified
      }));
  }

  private getEngagementTrends() {
    // Mock engagement trends for the last 7 days
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));

      return {
        date: date.toISOString().split('T')[0],
        posts: crypto.randomInt(0, 9) + 2,
        likes: crypto.randomInt(10, 59),
        comments: crypto.randomInt(5, 34),
        shares: crypto.randomInt(2, 16)
      };
    });
  }

  private getUserAchievements(user) {
    const achievements: string[] = [];

    if (user.stats.postsCreated > 10) achievements.push('Prolific Poster');
    if (user.stats.likesReceived > 50) achievements.push('Community Favorite');
    if (user.reputation > 1000) achievements.push('Trusted Member');
    if (user.isVerified) achievements.push('Verified Professional');
    if (user.badges.length > 0) achievements.push('Badge Collector');

    return achievements;
  }
}
