import { Controller, Get, Query, Param, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import crypto from 'crypto';
import { mockData } from '../mock-data/simple-mock-data';

@Controller('api/users')
export class EnhancedUsersController {
  private users = mockData.users;
  private posts = mockData.communityPosts;

  @Get()
  async getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('role') role?: string,
    @Query('activityLevel') activityLevel?: string,
    @Query('location') location?: string,
    @Query('search') search?: string,
    @Query('verified') verified?: string,
    @Query('sortBy', new DefaultValuePipe('reputation')) sortBy?: 'reputation' | 'activity' | 'joined' | 'name'
  ) {
    let filteredUsers = [...this.users];

    // Apply filters
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    if (activityLevel) {
      filteredUsers = filteredUsers.filter(user => user.activityLevel === activityLevel);
    }

    if (location) {
      filteredUsers = filteredUsers.filter(user =>
        user.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.bio.toLowerCase().includes(searchLower)
      );
    }

    if (verified === 'true') {
      filteredUsers = filteredUsers.filter(user => user.isVerified);
    }

    // Apply sorting
    switch (sortBy) {
      case 'activity':
        filteredUsers.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
        break;
      case 'joined':
        filteredUsers.sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());
        break;
      case 'name':
        filteredUsers.sort((a, b) => a.firstName.localeCompare(b.firstName));
        break;
      default: // reputation
        filteredUsers.sort((a, b) => b.reputation - a.reputation);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedUsers.map(user => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        memberSince: this.getTimeAgo(user.joinedDate),
        lastActiveSince: this.getTimeAgo(user.lastActive),
        engagementScore: this.calculateEngagementScore(user),
        isTopContributor: user.stats.postsCreated >= 20 || user.stats.reputationPoints >= 1000
      })),
      meta: {
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit),
        hasNextPage: endIndex < filteredUsers.length,
        hasPrevPage: page > 1
      },
      filters: {
        availableRoles: ['RESTAURANT', 'VENDOR', 'EMPLOYEE', 'CUSTOMER'],
        activityLevels: ['HIGH', 'MEDIUM', 'LOW'],
        locations: this.getAvailableLocations(),
        sortOptions: [
          { value: 'reputation', label: 'Highest Reputation' },
          { value: 'activity', label: 'Most Active' },
          { value: 'joined', label: 'Recently Joined' },
          { value: 'name', label: 'Name A-Z' }
        ]
      }
    };
  }

  @Get('active')
  async getActiveUsers() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const activeUsers = this.users
      .filter(user => new Date(user.lastActive) > weekAgo)
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
      .slice(0, 20);

    return {
      success: true,
      data: activeUsers.map(user => ({
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        role: user.role,
        reputation: user.reputation,
        activityLevel: user.activityLevel,
        lastActive: user.lastActive,
        lastActiveSince: this.getTimeAgo(user.lastActive),
        isVerified: user.isVerified,
        badges: user.badges
      }))
    };
  }

  @Get('leaderboard')
  async getUserLeaderboard(
    @Query('category', new DefaultValuePipe('reputation')) category: 'reputation' | 'posts' | 'comments' | 'likes',
    @Query('timeframe', new DefaultValuePipe('all')) timeframe: 'all' | 'month' | 'week'
  ) {
    let sortedUsers = [...this.users];

    // Sort based on category
    switch (category) {
      case 'posts':
        sortedUsers.sort((a, b) => b.stats.postsCreated - a.stats.postsCreated);
        break;
      case 'comments':
        sortedUsers.sort((a, b) => b.stats.commentsPosted - a.stats.commentsPosted);
        break;
      case 'likes':
        sortedUsers.sort((a, b) => b.stats.likesReceived - a.stats.likesReceived);
        break;
      default: // reputation
        sortedUsers.sort((a, b) => b.reputation - a.reputation);
    }

    // Filter by timeframe (simplified simulation)
    if (timeframe !== 'all') {
      // In a real app, this would filter by actual timeframe data
      sortedUsers = sortedUsers.filter(() => crypto.randomInt(0, 9) > 2); // Simulate some users being active
    }

    const leaderboard = sortedUsers.slice(0, 25).map((user, index) => ({
      rank: index + 1,
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      role: user.role,
      reputation: user.reputation,
      stats: user.stats,
      badges: user.badges,
      isVerified: user.isVerified,
      score: this.getScoreForCategory(user, category),
      change: crypto.randomInt(-5, 4), // Simulated rank change
      activityLevel: user.activityLevel
    }));

    return {
      success: true,
      data: leaderboard,
      categories: [
        { value: 'reputation', label: 'Reputation Points', icon: '🏆' },
        { value: 'posts', label: 'Total Posts', icon: '📝' },
        { value: 'comments', label: 'Comments Posted', icon: '💬' },
        { value: 'likes', label: 'Likes Received', icon: '👍' }
      ],
      timeframes: [
        { value: 'all', label: 'All Time' },
        { value: 'month', label: 'This Month' },
        { value: 'week', label: 'This Week' }
      ]
    };
  }

  @Get('stats')
  async getUserStats() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalUsers: this.users.length,
      activeUsers: {
        thisWeek: this.users.filter(user => new Date(user.lastActive) > weekAgo).length,
        thisMonth: this.users.filter(user => new Date(user.lastActive) > monthAgo).length
      },
      newUsers: {
        thisWeek: this.users.filter(user => new Date(user.joinedDate) > weekAgo).length,
        thisMonth: this.users.filter(user => new Date(user.joinedDate) > monthAgo).length
      },
      verifiedUsers: this.users.filter(user => user.isVerified).length,
      usersByRole: this.getUsersByRole(),
      activityDistribution: this.getActivityDistribution(),
      reputationStats: this.getReputationStats(),
      engagementMetrics: this.getEngagementMetrics(),
      topContributors: this.getTopContributors(),
      growthMetrics: this.getGrowthMetrics(),
      geographicDistribution: this.getGeographicDistribution(),
      badgeDistribution: this.getBadgeDistribution()
    };

    return {
      success: true,
      data: stats
    };
  }

  @Get('analytics')
  async getUserAnalytics() {
    const analytics = {
      userGrowth: this.generateUserGrowthData(),
      activityTrends: this.generateActivityTrends(),
      engagementMetrics: {
        averagePostsPerUser: parseFloat((this.users.reduce((sum, u) => sum + u.stats.postsCreated, 0) / this.users.length).toFixed(1)),
        averageCommentsPerUser: parseFloat((this.users.reduce((sum, u) => sum + u.stats.commentsPosted, 0) / this.users.length).toFixed(1)),
        averageLikesPerUser: parseFloat((this.users.reduce((sum, u) => sum + u.stats.likesReceived, 0) / this.users.length).toFixed(1)),
        userRetentionRate: crypto.randomInt(70, 89) // Simulated
      },
      roleDistribution: this.getUsersByRole(),
      topPerformingUsers: this.users
        .sort((a, b) => this.calculateEngagementScore(b) - this.calculateEngagementScore(a))
        .slice(0, 10)
        .map(user => ({
          id: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
          role: user.role,
          engagementScore: this.calculateEngagementScore(user),
          reputation: user.reputation
        }))
    };

    return {
      success: true,
      data: analytics
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = this.users.find(u => u.id === id);

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        data: null
      };
    }

    const userPosts = this.posts.filter(post => post.author.id === id);
    const recentActivity = userPosts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const connections = this.generateUserConnections(user);
    const achievements = this.getUserAchievements(user);

    return {
      success: true,
      data: {
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        memberSince: this.getTimeAgo(user.joinedDate),
        lastActiveSince: this.getTimeAgo(user.lastActive),
        engagementScore: this.calculateEngagementScore(user),
        profileViews: crypto.randomInt(100, 599),
        totalPosts: userPosts.length,
        totalLikes: userPosts.reduce((sum, post) => sum + post.likeCount, 0),
        recentActivity: recentActivity.map(post => ({
          ...post,
          timeAgo: this.getTimeAgo(post.createdAt)
        })),
        connections,
        achievements,
        socialLinks: {
          linkedin: user.firstName.toLowerCase().includes('john') ? 'https://linkedin.com/in/johndoe' : null,
          twitter: user.firstName.toLowerCase().includes('jane') ? 'https://twitter.com/janedoe' : null,
          website: user.activityLevel === 'HIGH' ? 'https://example.com' : null
        },
        preferences: {
          publicProfile: true,
          showEmail: false,
          notifications: true,
          newsletter: crypto.randomInt(0, 1) === 0
        }
      }
    };
  }

  @Get(':id/activity')
  async getUserActivity(@Param('id') id: string) {
    const user = this.users.find(u => u.id === id);

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        data: null
      };
    }

    const userPosts = this.posts.filter(post => post.author.id === id);
    const activityTimeline = this.generateActivityTimeline(user, userPosts);

    return {
      success: true,
      data: {
        userId: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        activitySummary: {
          totalPosts: userPosts.length,
          totalLikes: userPosts.reduce((sum, post) => sum + post.likeCount, 0),
          totalComments: user.stats.commentsPosted,
          totalShares: userPosts.reduce((sum, post) => sum + post.shareCount, 0)
        },
        recentActivity: activityTimeline.slice(0, 20),
        activityByType: this.getActivityByType(userPosts),
        monthlyActivity: this.generateMonthlyActivity()
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

  private calculateEngagementScore(user): number {
    const postsWeight = 0.3;
    const commentsWeight = 0.2;
    const likesWeight = 0.3;
    const reputationWeight = 0.2;

    const normalizedPosts = Math.min(user.stats.postsCreated / 50, 1);
    const normalizedComments = Math.min(user.stats.commentsPosted / 100, 1);
    const normalizedLikes = Math.min(user.stats.likesReceived / 200, 1);
    const normalizedReputation = Math.min(user.reputation / 2000, 1);

    return Math.round(
      (normalizedPosts * postsWeight +
       normalizedComments * commentsWeight +
       normalizedLikes * likesWeight +
       normalizedReputation * reputationWeight) * 100
    );
  }

  private getAvailableLocations(): string[] {
    return [...new Set(this.users.map(user => user.location))].sort();
  }

  private getScoreForCategory(user, category: string): number {
    switch (category) {
      case 'posts': return user.stats.postsCreated;
      case 'comments': return user.stats.commentsPosted;
      case 'likes': return user.stats.likesReceived;
      default: return user.reputation;
    }
  }

  private getUsersByRole() {
    const roleCounts = new Map();
    this.users.forEach(user => {
      roleCounts.set(user.role, (roleCounts.get(user.role) || 0) + 1);
    });

    return Array.from(roleCounts.entries())
      .map(([role, count]) => ({ role, count }));
  }

  private getActivityDistribution() {
    const activityCounts = new Map();
    this.users.forEach(user => {
      activityCounts.set(user.activityLevel, (activityCounts.get(user.activityLevel) || 0) + 1);
    });

    return Array.from(activityCounts.entries())
      .map(([level, count]) => ({ level, count }));
  }

  private getReputationStats() {
    const reputations = this.users.map(user => user.reputation).sort((a, b) => a - b);

    return {
      average: Math.round(reputations.reduce((sum, rep) => sum + rep, 0) / reputations.length),
      median: reputations[Math.floor(reputations.length / 2)],
      highest: Math.max(...reputations),
      lowest: Math.min(...reputations),
      distribution: {
        '0-500': reputations.filter(r => r >= 0 && r <= 500).length,
        '501-1000': reputations.filter(r => r > 500 && r <= 1000).length,
        '1001-2000': reputations.filter(r => r > 1000 && r <= 2000).length,
        '2000+': reputations.filter(r => r > 2000).length
      }
    };
  }

  private getEngagementMetrics() {
    return {
      totalPosts: this.users.reduce((sum, user) => sum + user.stats.postsCreated, 0),
      totalComments: this.users.reduce((sum, user) => sum + user.stats.commentsPosted, 0),
      totalLikes: this.users.reduce((sum, user) => sum + user.stats.likesReceived, 0),
      averageEngagementScore: Math.round(this.users.reduce((sum, user) => sum + this.calculateEngagementScore(user), 0) / this.users.length),
      highEngagementUsers: this.users.filter(user => this.calculateEngagementScore(user) >= 70).length
    };
  }

  private getTopContributors() {
    return this.users
      .sort((a, b) => (b.stats.postsCreated + b.stats.commentsPosted) - (a.stats.postsCreated + a.stats.commentsPosted))
      .slice(0, 5)
      .map(user => ({
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        role: user.role,
        postsCreated: user.stats.postsCreated,
        commentsPosted: user.stats.commentsPosted,
        reputation: user.reputation,
        isVerified: user.isVerified
      }));
  }

  private getGrowthMetrics() {
    // Simulate growth metrics
    return {
      monthOverMonthGrowth: (crypto.randomInt(500, 1999) / 100).toFixed(1),
      quarterOverQuarterGrowth: (crypto.randomInt(1000, 4999) / 100).toFixed(1),
      averageUsersPerDay: Math.floor(this.users.length / 365),
      retentionRate: {
        daily: crypto.randomInt(70, 89),
        weekly: crypto.randomInt(60, 74),
        monthly: crypto.randomInt(50, 59)
      }
    };
  }

  private getGeographicDistribution() {
    const locationCounts = new Map();
    this.users.forEach(user => {
      const location = user.location.split(',')[1]?.trim() || 'Unknown';
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    });

    return Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getBadgeDistribution() {
    const badgeCounts = new Map();
    this.users.forEach(user => {
      user.badges.forEach((badge: string) => {
        badgeCounts.set(badge, (badgeCounts.get(badge) || 0) + 1);
      });
    });

    return Array.from(badgeCounts.entries())
      .map(([badge, count]) => ({ badge, count }))
      .sort((a, b) => b.count - a.count);
  }

  private generateUserGrowthData() {
    return Array.from({ length: 12 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (11 - i));
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newUsers: crypto.randomInt(10, 59),
        totalUsers: crypto.randomInt(50, 149) + i * 20
      };
    });
  }

  private generateActivityTrends() {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        posts: crypto.randomInt(2, 16),
        comments: crypto.randomInt(5, 34),
        likes: crypto.randomInt(10, 69),
        activeUsers: crypto.randomInt(20, 99)
      };
    });
  }

  private generateUserConnections(user) {
    const connectionCount = user.activityLevel === 'HIGH' ?
      crypto.randomInt(10, 29) :
      user.activityLevel === 'MEDIUM' ?
      crypto.randomInt(3, 12) :
      crypto.randomInt(1, 5);

    return Array.from({ length: connectionCount }, (_, i) => {
      const connectedUser = this.users[i % this.users.length];
      return {
        id: connectedUser.id,
        fullName: `${connectedUser.firstName} ${connectedUser.lastName}`,
        avatar: connectedUser.avatar,
        role: connectedUser.role,
        mutualConnections: crypto.randomInt(0, 4),
        connectedSince: this.getTimeAgo(new Date(Date.now() - crypto.randomInt(0, 364) * 24 * 60 * 60 * 1000))
      };
    });
  }

  private getUserAchievements(user) {
    const achievements: Array<{ name: string; description: string; icon: string; earned: string }> = [];

    if (user.stats.postsCreated >= 20) achievements.push({ name: 'Prolific Poster', description: 'Created 20+ posts', icon: '📝', earned: this.getTimeAgo(user.joinedDate) });
    if (user.stats.likesReceived >= 100) achievements.push({ name: 'Community Favorite', description: 'Received 100+ likes', icon: '❤️', earned: this.getTimeAgo(user.joinedDate) });
    if (user.reputation >= 1500) achievements.push({ name: 'Trusted Member', description: 'Earned 1500+ reputation', icon: '⭐', earned: this.getTimeAgo(user.joinedDate) });
    if (user.isVerified) achievements.push({ name: 'Verified Professional', description: 'Verified account', icon: '✅', earned: this.getTimeAgo(user.joinedDate) });
    if (user.badges.length >= 3) achievements.push({ name: 'Badge Collector', description: 'Earned multiple badges', icon: '🏆', earned: this.getTimeAgo(user.joinedDate) });
    if (user.activityLevel === 'HIGH') achievements.push({ name: 'Super Active', description: 'High activity level', icon: '🔥', earned: this.getTimeAgo(user.joinedDate) });

    return achievements;
  }

  private generateActivityTimeline(user, userPosts: unknown[]) {
    const activities: Array<{
      type: string;
      title: string;
      description: string;
      timestamp: Date;
      timeAgo: string;
      data: Record<string, unknown>;
    }> = [];

    // Add posts
    userPosts.forEach(post => {
      activities.push({
        type: 'post',
        title: 'Created a post',
        description: post.title,
        timestamp: post.createdAt,
        timeAgo: this.getTimeAgo(post.createdAt),
        data: { postId: post.id, likes: post.likeCount, comments: post.commentCount }
      });
    });

    // Add simulated comment activities
    for (let i = 0; i < user.stats.commentsPosted; i++) {
      activities.push({
        type: 'comment',
        title: 'Posted a comment',
        description: 'Added a helpful comment to a discussion',
        timestamp: new Date(Date.now() - crypto.randomInt(0, 89) * 24 * 60 * 60 * 1000),
        timeAgo: this.getTimeAgo(new Date(Date.now() - crypto.randomInt(0, 89) * 24 * 60 * 60 * 1000)),
        data: { helpful: crypto.randomInt(0, 9) > 6 }
      });
    }

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private getActivityByType(userPosts: unknown[]) {
    const typeCount = new Map();
    userPosts.forEach(post => {
      typeCount.set(post.type, (typeCount.get(post.type) || 0) + 1);
    });

    return Array.from(typeCount.entries())
      .map(([type, count]) => ({ type, count }));
  }

  private generateMonthlyActivity() {
    return Array.from({ length: 12 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (11 - i));
      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        posts: crypto.randomInt(0, 9),
        comments: crypto.randomInt(0, 19),
        likes: crypto.randomInt(0, 29)
      };
    });
  }
}
