/**
 * useAuthPermissions - Extracted permission checking logic for auth context
 * Part of AuthContext.tsx refactoring (Phase 7)
 */

import { useCallback } from 'react';
import type { Permission, MerchantRole } from '@/types/team';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseAuthPermissionsProps {
  permissions: Permission[];
}

// ─── Permission Checking Hook ─────────────────────────────────────────────────

export function useAuthPermissions({ permissions }: UseAuthPermissionsProps) {
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.some((permission) => permissions.includes(permission));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.every((permission) => permissions.includes(permission));
    },
    [permissions]
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
