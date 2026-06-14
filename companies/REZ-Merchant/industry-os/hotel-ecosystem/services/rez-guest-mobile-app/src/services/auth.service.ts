import { v4 as uuidv4 } from 'uuid';

export interface GuestSession {
  sessionId: string;
  guestId: string;
  token: string;
  deviceId?: string;
  deviceType?: 'ios' | 'android' | 'web';
  createdAt: Date;
  expiresAt: Date;
  lastActive: Date;
}

export class GuestAuthService {
  private sessions: Map<string, GuestSession> = new Map();

  async createSession(guestId: string, deviceId?: string, deviceType?: 'ios' | 'android' | 'web'): Promise<{ token: string; sessionId: string }> {
    const sessionId = uuidv4();
    const token = `gz_${uuidv4().replace(/-/g, '')}${Date.now().toString(36)}`;

    const session: GuestSession = {
      sessionId,
      guestId,
      token,
      deviceId,
      deviceType,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      lastActive: new Date(),
    };

    this.sessions.set(token, session);
    return { token, sessionId };
  }

  async validateToken(token: string): Promise<GuestSession | null> {
    const session = this.sessions.get(token);

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    session.lastActive = new Date();
    this.sessions.set(token, session);

    return session;
  }

  async refreshSession(token: string): Promise<GuestSession | null> {
    const session = await this.validateToken(token);

    if (!session) {
      return null;
    }

    // Extend expiration
    session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    session.lastActive = new Date();

    this.sessions.set(token, session);
    return session;
  }

  async logout(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async getSession(token: string): Promise<GuestSession | null> {
    return this.sessions.get(token) || null;
  }

  async getGuestSessions(guestId: string): Promise<GuestSession[]> {
    return Array.from(this.sessions.values()).filter(s => s.guestId === guestId);
  }

  async terminateAllSessions(guestId: string): Promise<number> {
    const sessions = await this.getGuestSessions(guestId);
    sessions.forEach(s => this.sessions.delete(s.token));
    return sessions.length;
  }
}
