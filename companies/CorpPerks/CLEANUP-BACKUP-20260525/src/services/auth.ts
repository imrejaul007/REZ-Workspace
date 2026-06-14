/**
 * REZ Auth Service Client
 * Unified authentication for all CorpPerks apps
 */

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';

export interface AuthUser {
  userId: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  personas?: {
    primary: string;
    secondary: string[];
    active: string;
  };
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

// ─── Auth API ──────────────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    logger.error('Auth verification failed:', error);
    return null;
  }
}

export async function login(phoneOrEmail: string, otp?: string): Promise<AuthResponse> {
  try {
    // Send OTP
    const otpResponse = await fetch(`${AUTH_SERVICE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneOrEmail }),
    });

    if (!otpResponse.ok) {
      return { success: false, error: 'Failed to send OTP' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Service unavailable' };
  }
}

export async function verifyOTP(phoneOrEmail: string, otp: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneOrEmail, otp }),
    });

    const data = await response.json();

    if (data.token && data.user) {
      return {
        success: true,
        token: data.token,
        user: data.user,
      };
    }

    return { success: false, error: data.error || 'Verification failed' };
  } catch (error) {
    return { success: false, error: 'Service unavailable' };
  }
}

export async function getProfile(token: string): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    logger.error('Profile fetch failed:', error);
    return null;
  }
}

// ─── Persona Management ──────────────────────────────────────────────────────

export async function activatePersona(
  token: string,
  persona: string,
  verificationData?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/personas/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ persona, verificationData }),
    });

    const data = await response.json();
    return { success: data.success, error: data.error };
  } catch (error) {
    return { success: false, error: 'Service unavailable' };
  }
}

export async function getPersonas(token: string): Promise<{
  primary: string;
  secondary: string[];
  active: string;
} | null> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/personas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    return null;
  }
}

export async function switchPersona(
  token: string,
  persona: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/personas/switch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ persona }),
    });

    const data = await response.json();
    return { success: data.success, error: data.error };
  } catch (error) {
    return { success: false, error: 'Service unavailable' };
  }
}
