/**
 * ReZ Merchant - Common Auth Module
 * Shared authentication across all industries
 */

export interface User {
  id: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'staff' | 'customer';
  businessId: string;
  permissions: string[];
}

export class CommonAuth {
  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<User | null> {
    // In production: verify JWT
    return null;
  }

  /**
   * Check permissions
   */
  async hasPermission(user: User, permission: string): Promise<boolean> {
    return user.permissions.includes(permission) || user.permissions.includes('*');
  }

  /**
   * Generate JWT
   */
  generateToken(user: User): string {
    // In production: sign JWT
    return 'jwt-token';
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return { accessToken: 'new-token', refreshToken: 'new-refresh' };
  }
}

export const commonAuth = new CommonAuth();
