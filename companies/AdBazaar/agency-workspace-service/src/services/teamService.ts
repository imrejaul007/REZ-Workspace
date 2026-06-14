import { TeamMember, ITeamMember } from '../models';
import { logger } from '../utils/logger';
import { teamMemberCreateSchema, teamMemberUpdateSchema, TeamMemberCreate, TeamMemberUpdate } from '../utils/helpers';

export class TeamService {
  /**
   * Add team member to agency
   */
  async addTeamMember(agencyId: string, data: TeamMemberCreate): Promise<ITeamMember> {
    try {
      const validatedData = teamMemberCreateSchema.parse(data);

      const member = new TeamMember({
        ...validatedData,
        agencyId,
        status: 'active',
        activityLog: [{
          action: 'member_added',
          timestamp: new Date(),
          details: 'Team member added to agency'
        }]
      });

      await member.save();

      logger.info(`Team member added: ${agencyId}`, {
        agencyId,
        memberId: member._id,
        memberName: member.name,
        role: member.role
      });

      return member;
    } catch (error) {
      logger.error('Failed to add team member', { agencyId, error });
      throw error;
    }
  }

  /**
   * Get team member by ID
   */
  async getTeamMemberById(memberId: string): Promise<ITeamMember | null> {
    try {
      return await TeamMember.findById(memberId);
    } catch (error) {
      logger.error('Failed to get team member', { memberId, error });
      throw error;
    }
  }

  /**
   * List team members for agency
   */
  async listTeamMembers(agencyId: string, options: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    department?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ members: ITeamMember[]; total: number; page: number; limit: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        status,
        department,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const query: any = { agencyId };
      if (role) query.role = role;
      if (status) query.status = status;
      if (department) query.department = department;

      const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [members, total] = await Promise.all([
        TeamMember.find(query)
          .select('-activityLog')
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        TeamMember.countDocuments(query)
      ]);

      return { members: members as ITeamMember[], total, page, limit };
    } catch (error) {
      logger.error('Failed to list team members', { agencyId, error });
      throw error;
    }
  }

  /**
   * Update team member
   */
  async updateTeamMember(memberId: string, data: TeamMemberUpdate): Promise<ITeamMember | null> {
    try {
      const validatedData = teamMemberUpdateSchema.parse(data);

      const member = await TeamMember.findByIdAndUpdate(
        memberId,
        { $set: validatedData },
        { new: true, runValidators: true }
      );

      if (member) {
        // Log activity
        await this.logActivity(memberId, 'profile_updated', 'Profile information updated');
        logger.info(`Team member updated: ${memberId}`);
      }

      return member;
    } catch (error) {
      logger.error('Failed to update team member', { memberId, error });
      throw error;
    }
  }

  /**
   * Remove team member
   */
  async removeTeamMember(agencyId: string, memberId: string): Promise<boolean> {
    try {
      const member = await TeamMember.findOneAndDelete({ _id: memberId, agencyId });

      if (member) {
        logger.info(`Team member removed: ${memberId}`, { agencyId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to remove team member', { agencyId, memberId, error });
      throw error;
    }
  }

  /**
   * Update member permissions
   */
  async updatePermissions(memberId: string, permissions: string[]): Promise<ITeamMember | null> {
    try {
      const member = await TeamMember.findByIdAndUpdate(
        memberId,
        { $set: { permissions } },
        { new: true }
      );

      if (member) {
        await this.logActivity(memberId, 'permissions_updated', 'Permissions updated');
        logger.info(`Team member permissions updated: ${memberId}`);
      }

      return member;
    } catch (error) {
      logger.error('Failed to update permissions', { memberId, error });
      throw error;
    }
  }

  /**
   * Log activity for team member
   */
  async logActivity(memberId: string, action: string, details?: string): Promise<void> {
    try {
      await TeamMember.findByIdAndUpdate(memberId, {
        $push: {
          activityLog: {
            action,
            timestamp: new Date(),
            details
          }
        }
      });
    } catch (error) {
      logger.error('Failed to log activity', { memberId, error });
    }
  }

  /**
   * Update last login
   */
  async updateLastLogin(memberId: string): Promise<void> {
    try {
      await TeamMember.findByIdAndUpdate(memberId, {
        $set: { lastLogin: new Date() }
      });
    } catch (error) {
      logger.error('Failed to update last login', { memberId, error });
    }
  }

  /**
   * Get member activity log
   */
  async getActivityLog(memberId: string, limit: number = 50): Promise<any[]> {
    try {
      const member = await TeamMember.findById(memberId)
        .select('activityLog')
        .lean();

      if (!member) {
        return [];
      }

      return member.activityLog
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get activity log', { memberId, error });
      throw error;
    }
  }

  /**
   * Check if member has permission
   */
  async hasPermission(memberId: string, permission: string): Promise<boolean> {
    try {
      const member = await TeamMember.findById(memberId).select('permissions role');

      if (!member) {
        return false;
      }

      // Admins have all permissions
      if (member.role === 'admin') {
        return true;
      }

      return member.permissions.includes(permission);
    } catch (error) {
      logger.error('Failed to check permission', { memberId, permission, error });
      return false;
    }
  }
}

export const teamService = new TeamService();