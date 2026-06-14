import { Seat, ISeat, SeatStatus, SeatRole } from '../models/seat.model';
import { Organization } from '../models/organization.model';
import { permissionService } from './permission.service';
import mongoose from 'mongoose';
import { logger } from 'utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export interface InviteInput {
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: SeatRole;
  invitedBy: string;
  sendEmail?: boolean;
  customMessage?: string;
}

export interface InviteResult {
  seat: ISeat;
  inviteToken: string;
  inviteUrl: string;
}

class InviteService {
  /**
   * Invite a user to join an organization
   */
  async inviteUser(input: InviteInput): Promise<InviteResult> {
    try {
      // Verify organization exists
      const organization = await Organization.findById(input.organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Check if organization can add more seats
      if (!organization.canAddSeat()) {
        throw new Error('Organization has reached its seat limit');
      }

      // Check if user already has a seat
      const existingSeat = await Seat.findOne({
        email: input.email.toLowerCase(),
        organizationId: input.organizationId
      });

      if (existingSeat) {
        throw new Error('User already has a seat in this organization');
      }

      // Generate invite token
      const inviteToken = uuidv4();

      // Create seat with pending status
      const seat = new Seat({
        userId: inviteToken, // Temporary user ID until they accept
        organizationId: new mongoose.Types.ObjectId(input.organizationId),
        email: input.email.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role || SeatRole.MEMBER,
        status: SeatStatus.PENDING,
        invitedBy: new mongoose.Types.ObjectId(input.invitedBy),
        invitedAt: new Date(),
        metadata: {
          inviteToken,
          customMessage: input.customMessage,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      await seat.save();

      // Add seat to organization
      await Organization.findByIdAndUpdate(input.organizationId, {
        $push: { seats: seat._id }
      });

      // Generate invite URL
      const inviteUrl = this.generateInviteUrl(organization.slug, inviteToken);

      // In production, send email here
      if (input.sendEmail !== false) {
        await this.sendInviteEmail(input.email, inviteUrl, organization.name, input.customMessage);
      }

      logger.info(`Invitation sent to ${input.email} for organization ${organization.name}`);

      return {
        seat,
        inviteToken,
        inviteUrl
      };
    } catch (error) {
      logger.error('Error inviting user:', error);
      throw error;
    }
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(inviteToken: string, userId: string): Promise<ISeat> {
    try {
      const seat = await Seat.findOne({
        'metadata.inviteToken': inviteToken,
        status: SeatStatus.PENDING
      });

      if (!seat) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invitation has expired
      const expiresAt = seat.metadata?.expiresAt as Date | undefined;
      if (expiresAt && new Date() > expiresAt) {
        throw new Error('Invitation has expired');
      }

      // Update seat with actual user ID
      seat.userId = userId;
      seat.status = SeatStatus.ACTIVE;
      seat.activatedAt = new Date();
      seat.metadata = {
        ...seat.metadata,
        inviteToken: null,
        acceptedAt: new Date()
      };

      await seat.save();

      // Apply default permissions based on role
      const defaultPermissions = permissionService.getDefaultPermissionsForRole(seat.role);
      if (defaultPermissions.length > 0) {
        await permissionService.bulkSetPermissions(
          seat._id.toString(),
          seat.organizationId.toString(),
          defaultPermissions,
          seat._id.toString()
        );
      }

      // Update organization active seat count
      await Organization.findByIdAndUpdate(seat.organizationId, {
        $inc: { activeSeats: 1 }
      });

      logger.info(`Invitation accepted for seat ${seat._id}`);

      return seat;
    } catch (error) {
      logger.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Resend invitation
   */
  async resendInvitation(seatId: string): Promise<{ inviteUrl: string }> {
    try {
      const seat = await Seat.findById(seatId);

      if (!seat) {
        throw new Error('Seat not found');
      }

      if (seat.status !== SeatStatus.PENDING) {
        throw new Error('Can only resend invitation for pending seats');
      }

      // Generate new invite token
      const inviteToken = uuidv4();

      // Update seat with new token
      seat.metadata = {
        ...seat.metadata,
        inviteToken,
        inviteResendCount: (seat.metadata?.inviteResendCount as number || 0) + 1,
        lastResentAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      await seat.save();

      // Get organization name
      const organization = await Organization.findById(seat.organizationId);

      // Generate invite URL
      const inviteUrl = this.generateInviteUrl(organization?.slug || '', inviteToken);

      // Send email
      await this.sendInviteEmail(
        seat.email,
        inviteUrl,
        organization?.name || 'the organization',
        undefined
      );

      logger.info(`Invitation resent to ${seat.email}`);

      return { inviteUrl };
    } catch (error) {
      logger.error('Error resending invitation:', error);
      throw error;
    }
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(seatId: string): Promise<boolean> {
    try {
      const seat = await Seat.findById(seatId);

      if (!seat) {
        throw new Error('Seat not found');
      }

      if (seat.status !== SeatStatus.PENDING) {
        throw new Error('Can only cancel pending invitations');
      }

      // Remove seat
      await Organization.findByIdAndUpdate(seat.organizationId, {
        $pull: { seats: seatId }
      });

      await Seat.findByIdAndDelete(seatId);

      logger.info(`Invitation cancelled for seat ${seatId}`);

      return true;
    } catch (error) {
      logger.error('Error cancelling invitation:', error);
      throw error;
    }
  }

  /**
   * Bulk invite users
   */
  async bulkInviteUsers(
    invites: InviteInput[]
  ): Promise<{ successful: InviteResult[]; failed: Array<{ email: string; error: string }> }> {
    const successful: InviteResult[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const invite of invites) {
      try {
        const result = await this.inviteUser(invite);
        successful.push(result);
      } catch (error) {
        failed.push({
          email: invite.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info(`Bulk invite completed: ${successful.length} successful, ${failed.length} failed`);

    return { successful, failed };
  }

  /**
   * Get pending invitations
   */
  async getPendingInvitations(organizationId: string): Promise<ISeat[]> {
    try {
      return await Seat.find({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: SeatStatus.PENDING
      })
        .populate('invitedBy', 'firstName lastName email')
        .sort({ invitedAt: -1 });
    } catch (error) {
      logger.error(`Error getting pending invitations for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Generate invite URL
   */
  private generateInviteUrl(slug: string, token: string): string {
    return `https://app.adbazaar.com/invite/${slug}?token=${token}`;
  }

  /**
   * Send invite email (placeholder - would integrate with email service)
   */
  private async sendInviteEmail(
    email: string,
    inviteUrl: string,
    organizationName: string,
    customMessage?: string
  ): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    logger.info(`Invite email would be sent to ${email} with URL: ${inviteUrl}`);

    // Example email content:
    // Subject: You've been invited to join ${organizationName} on AdBazaar
    // Body: Click the link to accept: ${inviteUrl}
    // ${customMessage ? `\n\n${customMessage}` : ''}
  }
}

export const inviteService = new InviteService();