import { Permission, IPermission, PermissionResource, PermissionAction } from '../models/permission.model';
import { Seat, SeatRole } from '../models/seat.model';
import mongoose from 'mongoose';
import { logger } from 'utils/logger.js';

export interface SetPermissionInput {
  seatId: string;
  organizationId: string;
  resource: PermissionResource;
  actions: PermissionAction[];
  constraints?: Record<string, unknown>;
  grantedBy: string;
  expiresAt?: Date;
}

export interface UpdatePermissionInput {
  actions?: PermissionAction[];
  constraints?: Record<string, unknown>;
  expiresAt?: Date;
  isActive?: boolean;
}

class PermissionService {
  /**
   * Set permissions for a seat
   */
  async setPermissions(input: SetPermissionInput): Promise<IPermission> {
    try {
      // Verify seat exists
      const seat = await Seat.findById(input.seatId);
      if (!seat) {
        throw new Error('Seat not found');
      }

      // Verify granting seat has permission (only owner/admin can grant)
      if (seat.role !== SeatRole.OWNER && seat.role !== SeatRole.ADMIN) {
        throw new Error('Only owner or admin can set permissions');
      }

      // Check if permission already exists
      let permission = await Permission.findOne({
        seatId: new mongoose.Types.ObjectId(input.seatId),
        resource: input.resource
      });

      if (permission) {
        // Update existing permission
        permission = await Permission.findByIdAndUpdate(
          permission._id,
          {
            $set: {
              actions: input.actions,
              constraints: input.constraints,
              grantedBy: new mongoose.Types.ObjectId(input.grantedBy),
              grantedAt: new Date(),
              expiresAt: input.expiresAt
            }
          },
          { new: true, runValidators: true }
        );
      } else {
        // Create new permission
        permission = new Permission({
          seatId: new mongoose.Types.ObjectId(input.seatId),
          organizationId: new mongoose.Types.ObjectId(input.organizationId),
          resource: input.resource,
          actions: input.actions,
          constraints: input.constraints,
          grantedBy: new mongoose.Types.ObjectId(input.grantedBy),
          expiresAt: input.expiresAt
        });
        await permission.save();
      }

      // Update seat's permissions array
      await Seat.findByIdAndUpdate(input.seatId, {
        $addToSet: { permissions: permission!._id }
      });

      logger.info(`Permissions set for seat ${input.seatId} on resource ${input.resource}`);

      return permission!;
    } catch (error) {
      logger.error('Error setting permissions:', error);
      throw error;
    }
  }

  /**
   * Get permissions for a seat
   */
  async getPermissions(seatId: string): Promise<IPermission[]> {
    try {
      return await Permission.find({
        seatId: new mongoose.Types.ObjectId(seatId),
        isActive: true
      });
    } catch (error) {
      logger.error(`Error getting permissions for seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Get permission for a seat and resource
   */
  async getPermission(seatId: string, resource: PermissionResource): Promise<IPermission | null> {
    try {
      return await Permission.findOne({
        seatId: new mongoose.Types.ObjectId(seatId),
        resource,
        isActive: true
      });
    } catch (error) {
      logger.error(`Error getting permission for seat ${seatId} on resource ${resource}:`, error);
      throw error;
    }
  }

  /**
   * Check if seat has permission for an action on a resource
   */
  async hasPermission(
    seatId: string,
    resource: PermissionResource,
    action: PermissionAction
  ): Promise<boolean> {
    try {
      const seat = await Seat.findById(seatId);
      if (!seat) {
        return false;
      }

      // Owner and admin have all permissions
      if (seat.role === SeatRole.OWNER || seat.role === SeatRole.ADMIN) {
        return true;
      }

      const permission = await Permission.findOne({
        seatId: new mongoose.Types.ObjectId(seatId),
        resource,
        isActive: true
      });

      if (!permission) {
        return false;
      }

      // Check if permission is valid (not expired)
      if (permission.expiresAt && permission.expiresAt < new Date()) {
        return false;
      }

      return permission.actions.includes(action);
    } catch (error) {
      logger.error(`Error checking permission for seat ${seatId}:`, error);
      return false;
    }
  }

  /**
   * Update permission
   */
  async updatePermission(permissionId: string, input: UpdatePermissionInput): Promise<IPermission | null> {
    try {
      const permission = await Permission.findByIdAndUpdate(
        permissionId,
        { $set: input },
        { new: true, runValidators: true }
      );

      if (permission) {
        logger.info(`Permission updated: ${permissionId}`);
      }

      return permission;
    } catch (error) {
      logger.error(`Error updating permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * Revoke permission
   */
  async revokePermission(permissionId: string): Promise<boolean> {
    try {
      const permission = await Permission.findById(permissionId);
      if (!permission) {
        throw new Error('Permission not found');
      }

      // Remove from seat's permissions array
      await Seat.findByIdAndUpdate(permission.seatId, {
        $pull: { permissions: permissionId }
      });

      // Soft delete - mark as inactive
      await Permission.findByIdAndUpdate(permissionId, {
        $set: { isActive: false }
      });

      logger.info(`Permission revoked: ${permissionId}`);
      return true;
    } catch (error) {
      logger.error(`Error revoking permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk set permissions for a seat
   */
  async bulkSetPermissions(
    seatId: string,
    organizationId: string,
    permissions: Omit<SetPermissionInput, 'seatId' | 'organizationId'>[],
    grantedBy: string
  ): Promise<IPermission[]> {
    try {
      const results: IPermission[] = [];

      for (const perm of permissions) {
        const result = await this.setPermissions({
          seatId,
          organizationId,
          resource: perm.resource,
          actions: perm.actions,
          constraints: perm.constraints,
          grantedBy,
          expiresAt: perm.expiresAt
        });
        results.push(result);
      }

      logger.info(`Bulk permissions set for seat ${seatId}: ${results.length} permissions`);
      return results;
    } catch (error) {
      logger.error(`Error bulk setting permissions for seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Copy permissions from one seat to another
   */
  async copyPermissions(sourceSeatId: string, targetSeatId: string, grantedBy: string): Promise<IPermission[]> {
    try {
      // Get source seat permissions
      const sourcePermissions = await Permission.find({
        seatId: new mongoose.Types.ObjectId(sourceSeatId),
        isActive: true
      });

      const targetSeat = await Seat.findById(targetSeatId);
      if (!targetSeat) {
        throw new Error('Target seat not found');
      }

      const results: IPermission[] = [];

      for (const sourcePerm of sourcePermissions) {
        const result = await this.setPermissions({
          seatId: targetSeatId,
          organizationId: targetSeat.organizationId.toString(),
          resource: sourcePerm.resource,
          actions: sourcePerm.actions,
          constraints: sourcePerm.constraints,
          grantedBy
        });
        results.push(result);
      }

      logger.info(`Permissions copied from seat ${sourceSeatId} to ${targetSeatId}`);
      return results;
    } catch (error) {
      logger.error(`Error copying permissions:`, error);
      throw error;
    }
  }

  /**
   * Get all permissions for an organization by resource
   */
  async getOrganizationPermissionsByResource(
    organizationId: string,
    resource: PermissionResource
  ): Promise<IPermission[]> {
    try {
      return await Permission.find({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        resource,
        isActive: true
      }).populate('seatId', 'firstName lastName email role');
    } catch (error) {
      logger.error(`Error getting organization permissions for resource ${resource}:`, error);
      throw error;
    }
  }

  /**
   * Get default permissions for a role
   */
  getDefaultPermissionsForRole(role: SeatRole): Partial<SetPermissionInput>[] {
    const defaults: Record<SeatRole, Partial<SetPermissionInput>[]> = {
      [SeatRole.OWNER]: Object.values(PermissionResource).map(resource => ({
        resource,
        actions: Object.values(PermissionAction)
      })),
      [SeatRole.ADMIN]: [
        { resource: PermissionResource.DASHBOARD, actions: [PermissionAction.READ, PermissionAction.MANAGE] },
        { resource: PermissionResource.CAMPAIGNS, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE] },
        { resource: PermissionResource.ANALYTICS, actions: [PermissionAction.READ, PermissionAction.EXPORT] },
        { resource: PermissionResource.AUDIENCES, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE] },
        { resource: PermissionResource.CREATIVES, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE] },
        { resource: PermissionResource.REPORTS, actions: [PermissionAction.READ, PermissionAction.EXPORT] },
        { resource: PermissionResource.TEAMS, actions: [PermissionAction.READ, PermissionAction.MANAGE] },
        { resource: PermissionResource.SETTINGS, actions: [PermissionAction.READ, PermissionAction.UPDATE] }
      ],
      [SeatRole.MANAGER]: [
        { resource: PermissionResource.DASHBOARD, actions: [PermissionAction.READ] },
        { resource: PermissionResource.CAMPAIGNS, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE] },
        { resource: PermissionResource.ANALYTICS, actions: [PermissionAction.READ, PermissionAction.EXPORT] },
        { resource: PermissionResource.AUDIENCES, actions: [PermissionAction.READ] },
        { resource: PermissionResource.CREATIVES, actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE] },
        { resource: PermissionResource.REPORTS, actions: [PermissionAction.READ] }
      ],
      [SeatRole.MEMBER]: [
        { resource: PermissionResource.DASHBOARD, actions: [PermissionAction.READ] },
        { resource: PermissionResource.CAMPAIGNS, actions: [PermissionAction.READ] },
        { resource: PermissionResource.ANALYTICS, actions: [PermissionAction.READ] },
        { resource: PermissionResource.CREATIVES, actions: [PermissionAction.READ] },
        { resource: PermissionResource.REPORTS, actions: [PermissionAction.READ] }
      ],
      [SeatRole.VIEWER]: [
        { resource: PermissionResource.DASHBOARD, actions: [PermissionAction.READ] },
        { resource: PermissionResource.CAMPAIGNS, actions: [PermissionAction.READ] },
        { resource: PermissionResource.ANALYTICS, actions: [PermissionAction.READ] },
        { resource: PermissionResource.REPORTS, actions: [PermissionAction.READ] }
      ],
      [SeatRole.GUEST]: [
        { resource: PermissionResource.DASHBOARD, actions: [PermissionAction.READ] },
        { resource: PermissionResource.CAMPAIGNS, actions: [PermissionAction.READ] }
      ]
    };

    return defaults[role] || [];
  }
}

export const permissionService = new PermissionService();