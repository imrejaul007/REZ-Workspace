import { v4 as uuidv4 } from 'uuid';
import { CareCircle, ICareCircle, ICareMember, IPermission } from '../models/CareCircle';
import logger from '../utils/logger';

export interface CreateCircleDto {
  patientProfileId: string;
  name: string;
  description?: string;
  ownerName: string;
  ownerEmail: string;
  settings?: Partial<ICareCircle['settings']>;
}

export interface InviteMemberDto {
  email: string;
  name: string;
  phone?: string;
  role: ICareMember['role'];
  permissions?: Partial<IPermission>;
}

export interface UpdateMemberDto {
  memberId: string;
  role?: ICareMember['role'];
  permissions?: Partial<IPermission>;
}

export interface CircleResponse {
  id: string;
  patientProfileId: string;
  name: string;
  description?: string;
  members: ICareMember[];
  settings: ICareCircle['settings'];
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CircleService {
  /**
   * Create a new care circle
   */
  async createCircle(dto: CreateCircleDto): Promise<ICareCircle> {
    try {
      logger.info('Creating care circle', { patientProfileId: dto.patientProfileId });

      const circleId = uuidv4();

      // Default permissions for owner
      const ownerPermissions: IPermission = {
        viewHealthRecords: true,
        viewMedications: true,
        viewAppointments: true,
        receiveAlerts: true,
        manageAppointments: true,
        shareRecords: true
      };

      const circle = new CareCircle({
        id: circleId,
        patientProfileId: dto.patientProfileId,
        name: dto.name,
        description: dto.description,
        members: [{
          id: uuidv4(),
          profileId: dto.patientProfileId,
          name: dto.ownerName,
          email: dto.ownerEmail,
          role: 'owner',
          permissions: ownerPermissions,
          joinedAt: new Date(),
          invitedBy: dto.patientProfileId,
          status: 'active'
        }],
        settings: {
          allowSharing: dto.settings?.allowSharing ?? true,
          notifyOnActivity: dto.settings?.notifyOnActivity ?? true,
          emergencyAccess: dto.settings?.emergencyAccess ?? false
        }
      });

      await circle.save();
      logger.info('Care circle created', { circleId });

      return circle.toJSON() as ICareCircle;
    } catch (error) {
      logger.error('Failed to create care circle', { error, dto });
      throw error;
    }
  }

  /**
   * Get care circle by profile ID
   */
  async getCircleByProfile(profileId: string): Promise<ICareCircle | null> {
    try {
      logger.info('Fetching care circle', { profileId });

      // First try to find by patient profile
      let circle = await CareCircle.findOne({ patientProfileId: profileId });

      // If not found, check if user is a member
      if (!circle) {
        circle = await CareCircle.findOne({
          'members.profileId': profileId,
          'members.status': 'active'
        });
      }

      return circle ? (circle.toJSON() as ICareCircle) : null;
    } catch (error) {
      logger.error('Failed to fetch care circle', { error, profileId });
      throw error;
    }
  }

  /**
   * Get care circle by ID
   */
  async getCircleById(circleId: string): Promise<ICareCircle | null> {
    try {
      logger.info('Fetching care circle by ID', { circleId });
      const circle = await CareCircle.findOne({ id: circleId });
      return circle ? (circle.toJSON() as ICareCircle) : null;
    } catch (error) {
      logger.error('Failed to fetch care circle', { error, circleId });
      throw error;
    }
  }

  /**
   * Invite a member to the circle
   */
  async inviteMember(circleId: string, dto: InviteMemberDto): Promise<{ inviteId: string; inviteCode: string }> {
    try {
      logger.info('Inviting member to circle', { circleId, email: dto.email });

      const circle = await CareCircle.findOne({ id: circleId });
      if (!circle) {
        throw new Error('Care circle not found');
      }

      // Check if member already exists
      const existingMember = circle.members.find(
        m => m.email.toLowerCase() === dto.email.toLowerCase() && m.status !== 'removed'
      );
      if (existingMember) {
        throw new Error('Member already exists in this circle');
      }

      // Generate invite code
      const inviteId = uuidv4();
      const inviteCode = this.generateInviteCode();

      // Default permissions based on role
      const defaultPermissions = this.getDefaultPermissions(dto.role);
      const permissions = { ...defaultPermissions, ...dto.permissions };

      // Add invite code
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      circle.inviteCodes.push({
        id: inviteId,
        code: inviteCode,
        role: dto.role,
        permissions,
        expiresAt
      });

      await circle.save();
      logger.info('Invite created', { circleId, inviteId, inviteCode });

      return { inviteId, inviteCode };
    } catch (error) {
      logger.error('Failed to invite member', { error, circleId });
      throw error;
    }
  }

  /**
   * Accept an invitation
   */
  async acceptInvite(inviteId: string, profileId: string, userInfo: { name: string; email: string; phone?: string }): Promise<ICareCircle | null> {
    try {
      logger.info('Accepting invite', { inviteId, profileId });

      const circle = await CareCircle.findOne({ 'inviteCodes.id': inviteId });
      if (!circle) {
        throw new Error('Invitation not found');
      }

      const invite = circle.inviteCodes.find(ic => ic.id === inviteId);
      if (!invite) {
        throw new Error('Invitation not found');
      }

      if (invite.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      if (invite.usedBy) {
        throw new Error('Invitation has already been used');
      }

      // Check if member already exists
      const existingMember = circle.members.find(
        m => m.email.toLowerCase() === userInfo.email.toLowerCase() && m.status !== 'removed'
      );
      if (existingMember) {
        throw new Error('Email already associated with this circle');
      }

      // Mark invite as used
      invite.usedBy = profileId;
      invite.usedAt = new Date();

      // Add member
      circle.members.push({
        id: uuidv4(),
        profileId,
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        role: invite.role as ICareMember['role'],
        permissions: invite.permissions as IPermission,
        joinedAt: new Date(),
        invitedBy: circle.patientProfileId,
        status: 'active'
      });

      await circle.save();
      logger.info('Invite accepted', { inviteId, profileId });

      return circle.toJSON() as ICareCircle;
    } catch (error) {
      logger.error('Failed to accept invite', { error, inviteId });
      throw error;
    }
  }

  /**
   * Remove a member from the circle
   */
  async removeMember(circleId: string, memberId: string, removedBy: string): Promise<ICareCircle | null> {
    try {
      logger.info('Removing member', { circleId, memberId, removedBy });

      const circle = await CareCircle.findOne({ id: circleId });
      if (!circle) {
        throw new Error('Care circle not found');
      }

      const memberIndex = circle.members.findIndex(m => m.id === memberId);
      if (memberIndex === -1) {
        throw new Error('Member not found');
      }

      const member = circle.members[memberIndex];

      // Cannot remove the owner
      if (member.role === 'owner') {
        throw new Error('Cannot remove the circle owner');
      }

      // Only owner can remove others
      const requester = circle.members.find(m => m.profileId === removedBy);
      if (!requester || requester.role !== 'owner') {
        throw new Error('Only the circle owner can remove members');
      }

      // Soft delete - change status
      circle.members[memberIndex].status = 'removed';

      await circle.save();
      logger.info('Member removed', { circleId, memberId });

      return circle.toJSON() as ICareCircle;
    } catch (error) {
      logger.error('Failed to remove member', { error, circleId, memberId });
      throw error;
    }
  }

  /**
   * Update member permissions
   */
  async updateMember(circleId: string, dto: UpdateMemberDto): Promise<ICareCircle | null> {
    try {
      logger.info('Updating member', { circleId, memberId: dto.memberId });

      const circle = await CareCircle.findOne({ id: circleId });
      if (!circle) {
        throw new Error('Care circle not found');
      }

      const memberIndex = circle.members.findIndex(m => m.id === dto.memberId);
      if (memberIndex === -1) {
        throw new Error('Member not found');
      }

      if (dto.role) {
        circle.members[memberIndex].role = dto.role;
      }

      if (dto.permissions) {
        circle.members[memberIndex].permissions = {
          ...circle.members[memberIndex].permissions,
          ...dto.permissions
        };
      }

      await circle.save();
      logger.info('Member updated', { circleId, memberId: dto.memberId });

      return circle.toJSON() as ICareCircle;
    } catch (error) {
      logger.error('Failed to update member', { error, circleId });
      throw error;
    }
  }

  /**
   * Check if a user has permission in the circle
   */
  async checkPermission(
    circleId: string,
    profileId: string,
    permission: keyof IPermission
  ): Promise<boolean> {
    try {
      const circle = await CareCircle.findOne({ id: circleId });
      if (!circle) return false;

      const member = circle.members.find(
        m => m.profileId === profileId && m.status === 'active'
      );

      if (!member) return false;

      return member.permissions[permission] ?? false;
    } catch (error) {
      logger.error('Failed to check permission', { error, circleId, profileId });
      return false;
    }
  }

  /**
   * Get circle members
   */
  async getMembers(circleId: string): Promise<ICareMember[]> {
    try {
      const circle = await CareCircle.findOne({ id: circleId });
      if (!circle) return [];

      return circle.members.filter(m => m.status === 'active');
    } catch (error) {
      logger.error('Failed to get members', { error, circleId });
      return [];
    }
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private getDefaultPermissions(role: ICareMember['role']): IPermission {
    const rolePermissions: Record<ICareMember['role'], IPermission> = {
      owner: {
        viewHealthRecords: true,
        viewMedications: true,
        viewAppointments: true,
        receiveAlerts: true,
        manageAppointments: true,
        shareRecords: true
      },
      caregiver: {
        viewHealthRecords: true,
        viewMedications: true,
        viewAppointments: true,
        receiveAlerts: true,
        manageAppointments: true,
        shareRecords: false
      },
      family: {
        viewHealthRecords: true,
        viewMedications: true,
        viewAppointments: true,
        receiveAlerts: true,
        manageAppointments: false,
        shareRecords: false
      },
      friend: {
        viewHealthRecords: false,
        viewMedications: true,
        viewAppointments: true,
        receiveAlerts: false,
        manageAppointments: false,
        shareRecords: false
      },
      'medical-professional': {
        viewHealthRecords: true,
        viewMedications: true,
        viewAppointments: true,
        receiveAlerts: false,
        manageAppointments: true,
        shareRecords: true
      }
    };

    return rolePermissions[role];
  }
}

export const circleService = new CircleService();
