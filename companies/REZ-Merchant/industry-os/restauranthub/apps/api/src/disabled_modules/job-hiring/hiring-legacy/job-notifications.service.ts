import logger from './utils/logger';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

export interface JobNotification {
  id: string;
  type: JobNotificationType;
  title: string;
  message: string;
  data;
  recipients: string[];
  priority: NotificationPriority;
  createdAt: Date;
  readBy: string[];
  actionRequired?: boolean;
  actionUrl?: string;
  expiresAt?: Date;
}

export enum JobNotificationType {
  // Job-related
  JOB_POSTED = 'JOB_POSTED',
  JOB_UPDATED = 'JOB_UPDATED',
  JOB_EXPIRED = 'JOB_EXPIRED',
  JOB_FILLED = 'JOB_FILLED',
  JOB_CLOSED = 'JOB_CLOSED',
  
  // Application-related
  APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
  APPLICATION_STATUS_CHANGED = 'APPLICATION_STATUS_CHANGED',
  APPLICATION_REVIEWED = 'APPLICATION_REVIEWED',
  APPLICATION_SHORTLISTED = 'APPLICATION_SHORTLISTED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  APPLICATION_ACCEPTED = 'APPLICATION_ACCEPTED',
  
  // Interview-related
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_REMINDER = 'INTERVIEW_REMINDER',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  
  // Employment-related
  EMPLOYMENT_OFFER = 'EMPLOYMENT_OFFER',
  EMPLOYMENT_STARTED = 'EMPLOYMENT_STARTED',
  EMPLOYMENT_TERMINATED = 'EMPLOYMENT_TERMINATED',
  
  // Matching and recommendations
  JOB_MATCH_FOUND = 'JOB_MATCH_FOUND',
  EMPLOYEE_MATCH_FOUND = 'EMPLOYEE_MATCH_FOUND',
  AVAILABILITY_UPDATED = 'AVAILABILITY_UPDATED',
  
  // Moderation
  JOB_MODERATION_DECISION = 'JOB_MODERATION_DECISION',
  JOB_FLAGGED = 'JOB_FLAGGED',
  JOB_APPROVED = 'JOB_APPROVED',
  
  // System alerts
  URGENT_ALERT = 'URGENT_ALERT',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

@Injectable()
export class JobNotificationsService implements OnModuleInit {
  private notifications = new Map<string, JobNotification[]>(); // User notifications cache
  private globalNotifications: JobNotification[] = []; // System-wide notifications

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async onModuleInit() {
    // Subscribe to Redis channels for job events
    await this.subscribeToJobEvents();
  }

  private async subscribeToJobEvents() {
    // Subscribe to various job-related Redis channels
    const channels = [
      'job:created',
      'job:updated',
      'job:application',
      'job:moderation',
      'employee:availability',
      'application:status',
      'interview:scheduled',
      'employment:hired'
    ];

    for (const channel of channels) {
      // In a real implementation, you would subscribe to Redis pub/sub
      // For now, we'll handle events through direct method calls
      logger.info(`Subscribed to ${channel} notifications`);
    }
  }

  // Job posting notifications
  async notifyJobPosted(job, restaurantId: string) {
    const notification: JobNotification = {
      id: `job_posted_${job.id}_${Date.now()}`,
      type: JobNotificationType.JOB_POSTED,
      title: 'New Job Posted',
      message: `Your job "${job.title}" has been posted successfully`,
      data: { jobId: job.id, jobTitle: job.title },
      recipients: [restaurantId],
      priority: NotificationPriority.MEDIUM,
      createdAt: new Date(),
      readBy: [],
      actionUrl: `/jobs/${job.id}`,
    };

    await this.sendNotification(notification);

    // Also notify matched employees
    await this.notifyMatchedEmployees(job);
  }

  async notifyJobUpdated(job, restaurantId: string) {
    const notification: JobNotification = {
      id: `job_updated_${job.id}_${Date.now()}`,
      type: JobNotificationType.JOB_UPDATED,
      title: 'Job Updated',
      message: `Your job "${job.title}" has been updated`,
      data: { jobId: job.id, jobTitle: job.title },
      recipients: [restaurantId],
      priority: NotificationPriority.LOW,
      createdAt: new Date(),
      readBy: [],
      actionUrl: `/jobs/${job.id}`,
    };

    await this.sendNotification(notification);
  }

  // Application notifications
  async notifyApplicationReceived(application) {
    const notification: JobNotification = {
      id: `app_received_${application.id}_${Date.now()}`,
      type: JobNotificationType.APPLICATION_RECEIVED,
      title: 'New Job Application',
      message: `New application received for "${application.job.title}" from ${application.employee.user.profile?.firstName || 'Employee'}`,
      data: { 
        applicationId: application.id, 
        jobId: application.jobId,
        jobTitle: application.job.title,
        employeeName: application.employee.user.profile?.firstName || 'Employee'
      },
      recipients: [application.job.restaurant.userId],
      priority: NotificationPriority.HIGH,
      createdAt: new Date(),
      readBy: [],
      actionRequired: true,
      actionUrl: `/applications/${application.id}`,
    };

    await this.sendNotification(notification);
  }

  async notifyApplicationStatusChanged(application, newStatus: string) {
    const employeeNotification: JobNotification = {
      id: `app_status_${application.id}_${Date.now()}`,
      type: JobNotificationType.APPLICATION_STATUS_CHANGED,
      title: 'Application Status Updated',
      message: `Your application for "${application.job.title}" has been ${newStatus.toLowerCase()}`,
      data: { 
        applicationId: application.id, 
        jobId: application.jobId,
        status: newStatus,
        jobTitle: application.job.title 
      },
      recipients: [application.employee.userId],
      priority: newStatus === 'ACCEPTED' ? NotificationPriority.URGENT : NotificationPriority.HIGH,
      createdAt: new Date(),
      readBy: [],
      actionUrl: `/my-applications/${application.id}`,
    };

    await this.sendNotification(employeeNotification);
  }

  // Interview notifications
  async notifyInterviewScheduled(application, interviewDetails) {
    // Notify employee
    const employeeNotification: JobNotification = {
      id: `interview_scheduled_${application.id}_${Date.now()}`,
      type: JobNotificationType.INTERVIEW_SCHEDULED,
      title: 'Interview Scheduled',
      message: `Interview scheduled for "${application.job.title}" on ${interviewDetails.scheduledFor}`,
      data: { 
        applicationId: application.id, 
        jobId: application.jobId,
        interviewDetails,
        jobTitle: application.job.title 
      },
      recipients: [application.employee.userId],
      priority: NotificationPriority.URGENT,
      createdAt: new Date(),
      readBy: [],
      actionRequired: true,
      actionUrl: `/interviews/${application.id}`,
    };

    await this.sendNotification(employeeNotification);

    // Notify restaurant
    const restaurantNotification: JobNotification = {
      id: `interview_confirmed_${application.id}_${Date.now()}`,
      type: JobNotificationType.INTERVIEW_SCHEDULED,
      title: 'Interview Scheduled',
      message: `Interview scheduled with ${application.employee.user.profile?.firstName || 'candidate'} for "${application.job.title}"`,
      data: { 
        applicationId: application.id, 
        jobId: application.jobId,
        interviewDetails,
        candidateName: application.employee.user.profile?.firstName 
      },
      recipients: [application.job.restaurant.userId],
      priority: NotificationPriority.HIGH,
      createdAt: new Date(),
      readBy: [],
      actionUrl: `/interviews/${application.id}`,
    };

    await this.sendNotification(restaurantNotification);
  }

  // Employment notifications
  async notifyEmploymentOffer(application, contractDetails) {
    const notification: JobNotification = {
      id: `employment_offer_${application.id}_${Date.now()}`,
      type: JobNotificationType.EMPLOYMENT_OFFER,
      title: 'Job Offer Received!',
      message: `Congratulations! You have received a job offer for "${application.job.title}"`,
      data: { 
        applicationId: application.id, 
        jobId: application.jobId,
        contractDetails,
        jobTitle: application.job.title,
        restaurantName: application.job.restaurant.name 
      },
      recipients: [application.employee.userId],
      priority: NotificationPriority.URGENT,
      createdAt: new Date(),
      readBy: [],
      actionRequired: true,
      actionUrl: `/job-offers/${application.id}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    await this.sendNotification(notification);
  }

  // Job matching notifications
  async notifyJobMatches(employeeId: string, matches: unknown[]) {
    if (matches.length === 0) return;

    const notification: JobNotification = {
      id: `job_matches_${employeeId}_${Date.now()}`,
      type: JobNotificationType.JOB_MATCH_FOUND,
      title: `${matches.length} New Job Match${matches.length > 1 ? 'es' : ''} Found!`,
      message: `We found ${matches.length} job${matches.length > 1 ? 's' : ''} that match your preferences`,
      data: { 
        employeeId,
        matchCount: matches.length,
        topMatches: matches.slice(0, 3).map(match => ({
          jobId: match.id,
          title: match.title,
          restaurant: match.restaurant.name,
          matchScore: match.matchScore
        }))
      },
      recipients: [employeeId],
      priority: NotificationPriority.MEDIUM,
      createdAt: new Date(),
      readBy: [],
      actionUrl: `/job-matches`,
    };

    await this.sendNotification(notification);
  }

  async notifyEmployeeMatches(restaurantId: string, availableEmployees: unknown[]) {
    if (availableEmployees.length === 0) return;

    const notification: JobNotification = {
      id: `employee_matches_${restaurantId}_${Date.now()}`,
      type: JobNotificationType.EMPLOYEE_MATCH_FOUND,
      title: `${availableEmployees.length} Available Employee${availableEmployees.length > 1 ? 's' : ''} Found`,
      message: `${availableEmployees.length} employee${availableEmployees.length > 1 ? 's are' : ' is'} available for your job postings`,
      data: { 
        restaurantId,
        employeeCount: availableEmployees.length,
        topEmployees: availableEmployees.slice(0, 3).map(emp => ({
          employeeId: emp.id,
          name: emp.user.profile?.firstName,
          skills: emp.availability?.preferredRoles || []
        }))
      },
      recipients: [restaurantId],
      priority: NotificationPriority.MEDIUM,
      createdAt: new Date(),
      readBy: [],
      actionUrl: `/available-employees`,
    };

    await this.sendNotification(notification);
  }

  // Moderation notifications
  async notifyModerationDecision(job, decision: string, moderatorNotes: string, feedback?: string) {
    const notification: JobNotification = {
      id: `moderation_${job.id}_${Date.now()}`,
      type: decision === 'approved' ? JobNotificationType.JOB_APPROVED : 
            decision === 'flagged' ? JobNotificationType.JOB_FLAGGED : 
            JobNotificationType.JOB_MODERATION_DECISION,
      title: `Job ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
      message: decision === 'approved' ? 
        `Your job "${job.title}" has been approved and is now live` :
        `Your job "${job.title}" needs attention: ${feedback || moderatorNotes}`,
      data: { 
        jobId: job.id,
        jobTitle: job.title,
        decision,
        moderatorNotes,
        feedback 
      },
      recipients: [job.restaurant.userId],
      priority: decision === 'approved' ? NotificationPriority.MEDIUM : NotificationPriority.HIGH,
      createdAt: new Date(),
      readBy: [],
      actionRequired: decision !== 'approved',
      actionUrl: `/jobs/${job.id}`,
    };

    await this.sendNotification(notification);
  }

  // Reminder notifications
  async sendJobExpiryReminders() {
    // Get jobs expiring in 24 hours
    const expiringJobs = await this.prisma.job.findMany({
      where: {
        status: 'OPEN',
        validTill: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next 24 hours
        },
      },
      include: {
        restaurant: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const job of expiringJobs) {
      const notification: JobNotification = {
        id: `job_expiry_${job.id}_${Date.now()}`,
        type: JobNotificationType.JOB_EXPIRED,
        title: 'Job Expiring Soon',
        message: `Your job "${job.title}" expires in 24 hours`,
        data: { 
          jobId: job.id,
          jobTitle: job.title,
          validTill: job.validTill 
        },
        recipients: [job.restaurant.userId],
        priority: NotificationPriority.HIGH,
        createdAt: new Date(),
        readBy: [],
        actionRequired: true,
        actionUrl: `/jobs/${job.id}/extend`,
      };

      await this.sendNotification(notification);
    }
  }

  // Core notification methods
  private async sendNotification(notification: JobNotification) {
    // Store notification for each recipient
    for (const recipientId of notification.recipients) {
      const userNotifications = this.notifications.get(recipientId) || [];
      userNotifications.unshift(notification);
      
      // Keep only last 100 notifications per user
      if (userNotifications.length > 100) {
        userNotifications.splice(100);
      }
      
      this.notifications.set(recipientId, userNotifications);

      // Send via WebSocket
      try {
        this.websocketGateway.server?.to(recipientId).emit('job_notification', {
          notification,
          unreadCount: this.getUnreadCount(recipientId),
        });
      } catch (error) {
        logger.info(Failed to send WebSocket notification to user ${recipientId}:`, (error as Error).message);
      }
    }

    // Publish to Redis for other services
    await this.redisService.publish(
      'job_notifications',
      JSON.stringify({
        type: 'notification_sent',
        notification,
        timestamp: new Date(),
      }),
    );

    logger.info(`📨 Sent ${notification.type} notification to ${notification.recipients.length} user(s): ${notification.title}`);
  }

  // User notification management
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const userNotifications = this.notifications.get(userId) || [];
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      notifications: userNotifications.slice(start, end),
      total: userNotifications.length,
      unread: this.getUnreadCount(userId),
      page,
      limit,
      totalPages: Math.ceil(userNotifications.length / limit),
    };
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification && !notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
    }

    return { success: true, unreadCount: this.getUnreadCount(userId) };
  }

  async markAllNotificationsRead(userId: string) {
    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.forEach(notification => {
      if (!notification.readBy.includes(userId)) {
        notification.readBy.push(userId);
      }
    });

    return { success: true, unreadCount: 0 };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const userNotifications = this.notifications.get(userId) || [];
    const index = userNotifications.findIndex(n => n.id === notificationId);
    
    if (index > -1) {
      userNotifications.splice(index, 1);
    }

    return { success: true };
  }

  private getUnreadCount(userId: string): number {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter(n => !n.readBy.includes(userId)).length;
  }

  // Notification preferences
  async updateNotificationPreferences(userId: string, preferences) {
    // In a real implementation, this would be stored in database
    const cacheKey = `notification_prefs_${userId}`;
    // Store preferences logic here
    
    return { success: true, preferences };
  }

  async getNotificationStats(userId?: string) {
    if (userId) {
      const userNotifications = this.notifications.get(userId) || [];
      return {
        total: userNotifications.length,
        unread: this.getUnreadCount(userId),
        byType: this.groupNotificationsByType(userNotifications),
      };
    }

    // Global stats
    let totalNotifications = 0;
    const typeStats: Record<string, number> = {};

    for (const [uid, notifications] of this.notifications.entries()) {
      totalNotifications += notifications.length;
      notifications.forEach(n => {
        typeStats[n.type] = (typeStats[n.type] || 0) + 1;
      });
    }

    return {
      totalUsers: this.notifications.size,
      totalNotifications,
      averagePerUser: this.notifications.size > 0 ? (totalNotifications / this.notifications.size).toFixed(1) : 0,
      byType: typeStats,
    };
  }

  private groupNotificationsByType(notifications: JobNotification[]) {
    return notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Notify matched employees about a job
  private async notifyMatchedEmployees(job) {
    try {
      logger.info(`🔍 Looking for matched employees for job: ${job.title}`);

      // Employee matching logic based on skills, location, availability
      const allEmployees = await this.prisma.employee.findMany({
        where: {
          status: 'active',
          AND: [
            { preferredLocations: { hasSome: job.location ? [job.location] : [] } },
          ],
        },
      });

      // Score employees by skill match
      const matchedEmployees = allEmployees
        .filter(emp => {
          // Check skill overlap
          const requiredSkills = new Set(job.requiredSkills || []);
          const empSkills = new Set(emp.skills || []);
          const skillMatch = job.requiredSkills
            ? [...requiredSkills].filter(s => empSkills.has(s)).length / requiredSkills.size
            : 1;
          return skillMatch >= 0.5; // At least 50% skill match
        })
        .map(emp => emp.id);
      
      for (const employeeId of matchedEmployees) {
        const notification: JobNotification = {
          id: `job_match_${job.id}_${employeeId}_${Date.now()}`,
          type: JobNotificationType.JOB_MATCH_FOUND,
          title: 'New Job Match Available',
          message: `A job matching your skills is available: ${job.title}`,
          data: {
            jobId: job.id,
            jobTitle: job.title,
            restaurant: job.restaurant?.name,
            matchScore: 0.85, // Would be calculated based on matching algorithm
          },
          recipients: [employeeId],
          priority: NotificationPriority.HIGH,
          readBy: [],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('Error notifying matched employees:', error);
    }
  }

  // Cleanup expired notifications
  async cleanupExpiredNotifications() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [userId, notifications] of this.notifications.entries()) {
      const validNotifications = notifications.filter(n => 
        !n.expiresAt || n.expiresAt > now
      );
      
      cleanedCount += notifications.length - validNotifications.length;
      
      if (validNotifications.length !== notifications.length) {
        this.notifications.set(userId, validNotifications);
      }
    }

    logger.info(`🧹 Cleaned up ${cleanedCount} expired notifications`);
    return { cleanedCount };
  }
}