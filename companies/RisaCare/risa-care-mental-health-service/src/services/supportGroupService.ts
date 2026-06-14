import { v4 as uuidv4 } from 'uuid';
import {
  SupportGroup,
  SupportGroupSchema,
  SupportGroupSession,
  MentalHealthCondition,
  SupportGroupType,
  ApiResponse,
  PaginatedResponse
} from '../models/mentalHealth.js';

// In-memory storage
const supportGroups: Map<string, SupportGroup> = new Map();
const groupSessions: Map<string, SupportGroupSession[]> = new Map();
const userGroups: Map<string, string[]> = new Map();

// Seed sample support groups
const seedSupportGroups = () => {
  const sampleGroups: Omit<SupportGroup, 'id'>[] = [
    {
      groupId: 'group-1',
      name: 'Anxiety Warriors',
      description: 'A safe space to share experiences and learn coping strategies for anxiety management.',
      type: 'anxiety',
      focusArea: ['anxiety', 'panic_disorder', 'social_anxiety'],
      schedule: {
        dayOfWeek: 1, // Monday
        time: '19:00',
        frequency: 'weekly',
        isOnline: true
      },
      members: [],
      maxMembers: 20,
      facilitators: ['counselor-4'],
      isPrivate: false
    },
    {
      groupId: 'group-2',
      name: 'Depression Support Circle',
      description: 'Connect with others who understand your journey. Share, heal, and grow together.',
      type: 'depression',
      focusArea: ['depression', 'bipolar'],
      schedule: {
        dayOfWeek: 3, // Wednesday
        time: '18:30',
        frequency: 'weekly',
        isOnline: true
      },
      members: [],
      maxMembers: 25,
      facilitators: ['counselor-1'],
      isPrivate: false
    },
    {
      groupId: 'group-3',
      name: 'Grief & Healing',
      description: 'Support for those dealing with loss. A compassionate space to process and honor your grief.',
      type: 'grief',
      focusArea: ['grief', 'trauma'],
      schedule: {
        dayOfWeek: 5, // Friday
        time: '17:00',
        frequency: 'weekly',
        isOnline: true
      },
      members: [],
      maxMembers: 15,
      facilitators: ['counselor-3'],
      isPrivate: false
    },
    {
      groupId: 'group-4',
      name: 'Recovery & Renewal',
      description: 'A supportive community for addiction recovery. Together we build stronger foundations.',
      type: 'addiction',
      focusArea: ['substance_abuse', 'general'],
      schedule: {
        dayOfWeek: 2, // Tuesday
        time: '20:00',
        frequency: 'weekly',
        isOnline: true
      },
      members: [],
      maxMembers: 18,
      facilitators: ['counselor-2'],
      isPrivate: true
    },
    {
      groupId: 'group-5',
      name: 'General Wellness',
      description: 'Open group for mental wellness discussion. All topics welcome.',
      type: 'general',
      focusArea: ['general', 'stress', 'insomnia'],
      schedule: {
        dayOfWeek: 6, // Saturday
        time: '11:00',
        frequency: 'weekly',
        isOnline: true
      },
      members: [],
      maxMembers: 30,
      facilitators: ['counselor-3', 'counselor-1'],
      isPrivate: false
    },
    {
      groupId: 'group-6',
      name: 'PTSD Recovery',
      description: 'Specialized support for trauma survivors. Safe, confidential, and trauma-informed.',
      type: 'trauma',
      focusArea: ['ptsd', 'trauma'],
      schedule: {
        dayOfWeek: 4, // Thursday
        time: '18:00',
        frequency: 'weekly',
        isOnline: true
      },
      members: [],
      maxMembers: 12,
      facilitators: ['counselor-1'],
      isPrivate: true
    },
    {
      groupId: 'group-7',
      name: 'Family Support Network',
      description: 'Supporting families of those with mental health conditions.',
      type: 'family_support',
      focusArea: ['general'],
      schedule: {
        dayOfWeek: 0, // Sunday
        time: '12:00',
        frequency: 'biweekly',
        isOnline: true
      },
      members: [],
      maxMembers: 20,
      facilitators: ['counselor-5'],
      isPrivate: false
    }
  ];

  sampleGroups.forEach((group, index) => {
    const id = `sg-${index + 1}`;
    const fullGroup: SupportGroup = {
      ...group,
      id,
      members: []
    };
    supportGroups.set(id, fullGroup);
  });
};

seedSupportGroups();

/**
 * Support Group Service
 * Handles support group management, membership, and sessions
 */
export class SupportGroupService {
  /**
   * Find support groups based on criteria
   */
  async findGroups(filters: {
    type?: SupportGroupType;
    focusArea?: MentalHealthCondition[];
    isPrivate?: boolean;
    hasSpace?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<SupportGroup>> {
    try {
      let results = Array.from(supportGroups.values());

      // Filter out private groups unless specified
      if (filters.isPrivate === undefined) {
        results = results.filter(g => !g.isPrivate);
      } else if (!filters.isPrivate) {
        results = results.filter(g => !g.isPrivate);
      }

      if (filters.type) {
        results = results.filter(g => g.type === filters.type);
      }

      if (filters.focusArea && filters.focusArea.length > 0) {
        results = results.filter(g =>
          filters.focusArea!.some(area => g.focusArea.includes(area))
        );
      }

      if (filters.hasSpace) {
        results = results.filter(g => g.members.filter(m => m.isActive).length < g.maxMembers);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(g =>
          g.name.toLowerCase().includes(searchLower) ||
          g.description?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by active member count
      results.sort((a, b) => {
        const aActive = a.members.filter(m => m.isActive).length;
        const bActive = b.members.filter(m => m.isActive).length;
        return bActive - aActive;
      });

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const total = results.length;
      const start = (page - 1) * limit;
      const paginated = results.slice(start, start + limit);

      return {
        success: true,
        data: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      } as unknown as PaginatedResponse<SupportGroup>;
    }
  }

  /**
   * Get group details
   */
  async getGroup(groupId: string): Promise<ApiResponse<SupportGroup>> {
    try {
      const group = supportGroups.get(groupId);

      if (!group) {
        return {
          success: false,
          error: 'Support group not found'
        };
      }

      return {
        success: true,
        data: group
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get group'
      };
    }
  }

  /**
   * Join a support group
   */
  async joinGroup(groupId: string, userId: string): Promise<ApiResponse<SupportGroup>> {
    try {
      const group = supportGroups.get(groupId);

      if (!group) {
        return {
          success: false,
          error: 'Support group not found'
        };
      }

      // Check if already a member
      const existingMember = group.members.find(m => m.userId === userId);
      if (existingMember) {
        if (existingMember.isActive) {
          return {
            success: false,
            error: 'Already a member of this group'
          };
        } else {
          // Reactivate membership
          existingMember.isActive = true;
          existingMember.joinedAt = new Date();
        }
      } else {
        // Check capacity
        const activeMembers = group.members.filter(m => m.isActive).length;
        if (activeMembers >= group.maxMembers) {
          return {
            success: false,
            error: 'Group is at maximum capacity'
          };
        }

        // Add new member
        group.members.push({
          userId,
          joinedAt: new Date(),
          isActive: true
        });
      }

      supportGroups.set(groupId, group);

      // Update user's groups
      const userGroupList = userGroups.get(userId) || [];
      if (!userGroupList.includes(groupId)) {
        userGroupList.push(groupId);
        userGroups.set(userId, userGroupList);
      }

      return {
        success: true,
        data: group,
        message: 'Successfully joined the group'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join group'
      };
    }
  }

  /**
   * Leave a support group
   */
  async leaveGroup(groupId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      const group = supportGroups.get(groupId);

      if (!group) {
        return {
          success: false,
          error: 'Support group not found'
        };
      }

      const memberIndex = group.members.findIndex(m => m.userId === userId && m.isActive);
      if (memberIndex === -1) {
        return {
          success: false,
          error: 'Not a member of this group'
        };
      }

      // Soft delete - mark as inactive
      group.members[memberIndex].isActive = false;
      supportGroups.set(groupId, group);

      // Update user's groups
      const userGroupList = userGroups.get(userId) || [];
      const filtered = userGroupList.filter(id => id !== groupId);
      userGroups.set(userId, filtered);

      return {
        success: true,
        data: true,
        message: 'Successfully left the group'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to leave group'
      };
    }
  }

  /**
   * Get upcoming sessions for a group
   */
  async getUpcomingSessions(groupId: string): Promise<ApiResponse<SupportGroupSession[]>> {
    try {
      const group = supportGroups.get(groupId);

      if (!group) {
        return {
          success: false,
          error: 'Support group not found'
        };
      }

      const sessions = groupSessions.get(groupId) || [];
      const now = new Date();

      const upcoming = sessions
        .filter(s => new Date(s.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Generate next session based on schedule if none exists
      if (upcoming.length === 0 && group.schedule) {
        const nextDate = this.getNextSessionDate(group.schedule.dayOfWeek, group.schedule.time);
        const generatedSession: SupportGroupSession = {
          id: uuidv4(),
          groupId,
          date: nextDate,
          duration: 90,
          topic: 'Open Discussion',
          hostId: group.facilitators[0] || 'system',
          maxAttendees: group.maxMembers,
          currentAttendees: group.members.filter(m => m.isActive).length,
          isOnline: group.schedule.isOnline
        };
        return {
          success: true,
          data: [generatedSession]
        };
      }

      return {
        success: true,
        data: upcoming
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sessions'
      };
    }
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: string, includeInactive = false): Promise<ApiResponse<{ userId: string; joinedAt: Date; isActive: boolean }[]>> {
    try {
      const group = supportGroups.get(groupId);

      if (!group) {
        return {
          success: false,
          error: 'Support group not found'
        };
      }

      const members = includeInactive
        ? group.members
        : group.members.filter(m => m.isActive);

      return {
        success: true,
        data: members.map(m => ({
          userId: m.userId,
          joinedAt: m.joinedAt,
          isActive: m.isActive
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get members'
      };
    }
  }

  /**
   * Get user's groups
   */
  async getUserGroups(userId: string): Promise<ApiResponse<SupportGroup[]>> {
    try {
      const userGroupIds = userGroups.get(userId) || [];

      const groups = userGroupIds
        .map(id => supportGroups.get(id))
        .filter((g): g is SupportGroup => g !== undefined && g.members.some(m => m.userId === userId && m.isActive));

      return {
        success: true,
        data: groups
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user groups'
      };
    }
  }

  /**
   * Schedule a group session
   */
  async scheduleSession(
    groupId: string,
    session: Omit<SupportGroupSession, 'id'>
  ): Promise<ApiResponse<SupportGroupSession>> {
    try {
      const group = supportGroups.get(groupId);

      if (!group) {
        return {
          success: false,
          error: 'Support group not found'
        };
      }

      const newSession: SupportGroupSession = {
        ...session,
        id: uuidv4()
      };

      const sessions = groupSessions.get(groupId) || [];
      sessions.push(newSession);
      groupSessions.set(groupId, sessions);

      return {
        success: true,
        data: newSession,
        message: 'Session scheduled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule session'
      };
    }
  }

  /**
   * Register attendance for a session
   */
  async registerAttendance(
    groupId: string,
    sessionId: string,
    userId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const sessions = groupSessions.get(groupId) || [];
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      if (session.currentAttendees >= session.maxAttendees) {
        return {
          success: false,
          error: 'Session is at maximum capacity'
        };
      }

      session.currentAttendees++;

      return {
        success: true,
        data: true,
        message: 'Attendance registered'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register attendance'
      };
    }
  }

  /**
   * Helper to get next session date
   */
  private getNextSessionDate(dayOfWeek: number, time: string): Date {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    const nextDate = new Date(now);
    nextDate.setHours(hours, minutes, 0, 0);

    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;

    if (daysUntil <= 0) {
      daysUntil += 7;
    }

    nextDate.setDate(nextDate.getDate() + daysUntil);
    return nextDate;
  }

  /**
   * Get all groups
   */
  async getAllGroups(): Promise<ApiResponse<SupportGroup[]>> {
    try {
      return {
        success: true,
        data: Array.from(supportGroups.values())
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get groups'
      };
    }
  }

  /**
   * Check if user is member of group
   */
  async isMember(groupId: string, userId: string): Promise<boolean> {
    const group = supportGroups.get(groupId);
    if (!group) return false;
    return group.members.some(m => m.userId === userId && m.isActive);
  }
}

export const supportGroupService = new SupportGroupService();
