import { Controller, Get } from '@nestjs/common';
import crypto from 'crypto';
import { mockData } from '../mock-data/simple-mock-data';

@Controller('api/dashboard')
export class DashboardController {
  private jobs = mockData.jobs;
  private posts = mockData.communityPosts;
  private restaurants = mockData.restaurants;
  private vendors = mockData.vendors;
  private users = mockData.users;

  @Get('overview')
  async getDashboardOverview() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Job statistics
    const jobStats = {
      total: this.jobs.length,
      open: this.jobs.filter(job => job.status === 'OPEN').length,
      filled: this.jobs.filter(job => job.status === 'FILLED').length,
      newThisWeek: this.jobs.filter(job => new Date(job.postedDate) > weekAgo).length,
      totalApplications: this.jobs.reduce((sum, job) => sum + job.applicationCount, 0),
      avgSalary: Math.round(this.jobs.reduce((sum, job) => sum + (job.salaryMin + job.salaryMax) / 2, 0) / this.jobs.length)
    };

    // Community statistics
    const communityStats = {
      totalPosts: this.posts.length,
      totalEngagement: this.posts.reduce((sum, post) => sum + post.likeCount + post.commentCount + post.shareCount, 0),
      newPostsThisWeek: this.posts.filter(post => new Date(post.createdAt) > weekAgo).length,
      activeUsers: this.users.filter(user => new Date(user.lastActive) > weekAgo).length,
      topContributors: this.users
        .sort((a, b) => b.stats.postsCreated - a.stats.postsCreated)
        .slice(0, 5)
        .map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar,
          postsCount: user.stats.postsCreated,
          reputation: user.reputation
        }))
    };

    // Restaurant statistics
    const restaurantStats = {
      total: this.restaurants.length,
      verified: this.restaurants.filter(r => r.verificationStatus === 'VERIFIED').length,
      avgRating: parseFloat((this.restaurants.reduce((sum, r) => sum + r.rating, 0) / this.restaurants.length).toFixed(1)),
      totalOrders: this.restaurants.reduce((sum, r) => sum + r.stats.totalOrders, 0),
      totalRevenue: this.restaurants.reduce((sum, r) => sum + r.stats.monthlyRevenue, 0),
      newThisMonth: this.restaurants.filter(restaurant => new Date(restaurant.joinedDate) > monthAgo).length
    };

    // Vendor statistics
    const vendorStats = {
      total: this.vendors.length,
      verified: this.vendors.filter(v => v.verificationStatus === 'VERIFIED').length,
      avgRating: parseFloat((this.vendors.reduce((sum, v) => sum + v.rating, 0) / this.vendors.length).toFixed(1)),
      totalOrders: this.vendors.reduce((sum, v) => sum + v.stats.totalOrders, 0),
      avgDeliveryTime: parseFloat((this.vendors.reduce((sum, v) => sum + v.stats.onTimeDelivery, 0) / this.vendors.length).toFixed(1)),
      newThisMonth: this.vendors.filter(() => crypto.randomInt(0, 9) > 7).length // Simulated
    };

    // User statistics
    const userStats = {
      total: this.users.length,
      verified: this.users.filter(u => u.isVerified).length,
      activeThisWeek: this.users.filter(user => new Date(user.lastActive) > weekAgo).length,
      newThisWeek: this.users.filter(user => new Date(user.joinedDate) > weekAgo).length,
      avgReputation: Math.round(this.users.reduce((sum, u) => sum + u.reputation, 0) / this.users.length),
      byRole: this.getUsersByRole()
    };

    return {
      success: true,
      data: {
        overview: {
          totalJobs: jobStats.total,
          totalPosts: communityStats.totalPosts,
          totalRestaurants: restaurantStats.total,
          totalVendors: vendorStats.total,
          totalUsers: userStats.total,
          totalEngagement: communityStats.totalEngagement,
          totalRevenue: restaurantStats.totalRevenue
        },
        jobs: jobStats,
        community: communityStats,
        restaurants: restaurantStats,
        vendors: vendorStats,
        users: userStats,
        recentActivity: this.getRecentActivity(),
        trends: this.getTrends(),
        quickStats: this.getQuickStats()
      }
    };
  }

  @Get('featured-content')
  async getFeaturedContent() {
    // Get featured jobs
    const featuredJobs = this.jobs
      .filter(job => job.featured && job.status === 'OPEN')
      .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
      .slice(0, 6);

    // Get trending posts
    const trendingPosts = this.posts
      .map(post => ({
        ...post,
        trendingScore: post.likeCount + post.commentCount * 2 + post.shareCount * 3
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 6);

    // Get top-rated restaurants
    const topRestaurants = this.restaurants
      .filter(restaurant => restaurant.totalReviews >= 20)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    // Get featured vendors
    const featuredVendors = this.vendors
      .filter(vendor => vendor.rating >= 4.5 && vendor.totalReviews >= 15)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    return {
      success: true,
      data: {
        featuredJobs: featuredJobs.map(job => ({
          ...job,
          timeAgo: this.getTimeAgo(job.postedDate)
        })),
        trendingPosts: trendingPosts.map(post => ({
          ...post,
          timeAgo: this.getTimeAgo(post.createdAt)
        })),
        topRestaurants: topRestaurants.map(restaurant => ({
          ...restaurant,
          memberSince: this.getTimeAgo(restaurant.joinedDate)
        })),
        featuredVendors: featuredVendors.map(vendor => ({
          ...vendor,
          memberSince: this.getTimeAgo(new Date(Date.now() - vendor.yearsInBusiness * 365 * 24 * 60 * 60 * 1000))
        }))
      }
    };
  }

  @Get('search')
  async globalSearch() {
    // This endpoint would typically accept search parameters
    // For demo purposes, we'll return sample search results across all categories

    const sampleResults = {
      jobs: this.jobs.slice(0, 5).map(job => ({
        id: job.id,
        title: job.title,
        type: 'job',
        description: job.description.substring(0, 100) + '...',
        location: job.location,
        company: job.restaurantName
      })),
      posts: this.posts.slice(0, 5).map(post => ({
        id: post.id,
        title: post.title,
        type: 'post',
        description: post.content.substring(0, 100) + '...',
        author: post.author.name,
        engagement: post.likeCount + post.commentCount
      })),
      restaurants: this.restaurants.slice(0, 5).map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        type: 'restaurant',
        description: restaurant.description.substring(0, 100) + '...',
        rating: restaurant.rating,
        cuisine: restaurant.cuisineType.join(', ')
      })),
      vendors: this.vendors.slice(0, 5).map(vendor => ({
        id: vendor.id,
        name: vendor.companyName,
        type: 'vendor',
        description: vendor.description.substring(0, 100) + '...',
        rating: vendor.rating,
        businessType: vendor.businessType
      })),
      users: this.users.slice(0, 5).map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        type: 'user',
        role: user.role,
        reputation: user.reputation,
        location: user.location
      }))
    };

    return {
      success: true,
      data: sampleResults,
      meta: {
        totalResults: Object.values(sampleResults).flat().length,
        searchTime: crypto.randomInt(10, 60) + 'ms'
      }
    };
  }

  @Get('notifications')
  async getNotifications() {
    // Generate sample notifications based on our data
    const notifications = [
      {
        id: 'notif-1',
        type: 'job',
        title: 'New job application',
        message: `You have a new application for ${this.jobs[0].title}`,
        timestamp: new Date(),
        isRead: false,
        priority: 'medium'
      },
      {
        id: 'notif-2',
        type: 'community',
        title: 'Post liked',
        message: 'Your post received 10 new likes',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: false,
        priority: 'low'
      },
      {
        id: 'notif-3',
        type: 'vendor',
        title: 'Order delivered',
        message: 'Your order from Premium Food Ingredients Co. has been delivered',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isRead: true,
        priority: 'medium'
      },
      {
        id: 'notif-4',
        type: 'system',
        title: 'Profile verification',
        message: 'Your restaurant profile has been verified',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isRead: true,
        priority: 'high'
      }
    ];

    return {
      success: true,
      data: notifications.map(notif => ({
        ...notif,
        timeAgo: this.getTimeAgo(notif.timestamp)
      })),
      meta: {
        total: notifications.length,
        unread: notifications.filter(n => !n.isRead).length
      }
    };
  }

  private getUsersByRole() {
    const roleCounts = new Map();
    this.users.forEach(user => {
      roleCounts.set(user.role, (roleCounts.get(user.role) || 0) + 1);
    });

    return Array.from(roleCounts.entries())
      .map(([role, count]) => ({ role, count }));
  }

  private getRecentActivity() {
    const activities: Array<{
      type: string;
      title: string;
      timestamp: Date;
      data: Record<string, unknown>;
    }> = [];

    // Recent jobs
    this.jobs
      .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
      .slice(0, 3)
      .forEach(job => {
        activities.push({
          type: 'job',
          title: `New job posted: ${job.title}`,
          timestamp: job.postedDate,
          data: { id: job.id, company: job.restaurantName }
        });
      });

    // Recent posts
    this.posts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .forEach(post => {
        activities.push({
          type: 'post',
          title: `New post: ${post.title}`,
          timestamp: post.createdAt,
          data: { id: post.id, author: post.author.name }
        });
      });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(activity => ({
        ...activity,
        timeAgo: this.getTimeAgo(activity.timestamp)
      }));
  }

  private getTrends() {
    return {
      jobsGrowth: '+12.5%',
      communityEngagement: '+8.3%',
      restaurantSignups: '+15.2%',
      vendorActivity: '+6.7%',
      userRetention: '87.3%',
      platformUsage: '+22.1%'
    };
  }

  private getQuickStats() {
    return {
      todayStats: {
        newJobs: crypto.randomInt(2, 12),
        newPosts: crypto.randomInt(5, 20),
        newUsers: crypto.randomInt(1, 9),
        totalViews: crypto.randomInt(500, 1500)
      },
      thisWeekStats: {
        jobApplications: crypto.randomInt(50, 150),
        communityEngagement: crypto.randomInt(200, 700),
        restaurantOrders: crypto.randomInt(150, 450),
        vendorDeliveries: crypto.randomInt(100, 300)
      },
      topPerformers: {
        mostActiveUser: this.users
          .sort((a, b) => b.stats.postsCreated - a.stats.postsCreated)[0],
        topRatedRestaurant: this.restaurants
          .sort((a, b) => b.rating - a.rating)[0],
        bestVendor: this.vendors
          .sort((a, b) => b.rating - a.rating)[0]
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
}
