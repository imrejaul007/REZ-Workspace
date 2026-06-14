/**
 * RABTUL Auth Service Connector
 * Port: 4002
 */
import axios from 'axios';

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

interface AuthConfig {
  baseUrl?: string;
  apiKey?: string;
}

export class AuthConnector {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: AuthConfig = {}) {
    this.baseUrl = config.baseUrl || AUTH_URL;
    this.apiKey = config.apiKey || TOKEN || '';
  }

  private headers() {
    return {
      'X-Internal-Token': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<any> {
    try {
      const res = await axios.post(
        `${this.baseUrl}/api/auth/verify`,
        { token },
        { headers: this.headers() }
      );
      return res.data;
    } catch (error) {
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Login with OTP
  async sendOTP(phone: string): Promise<any> {
    try {
      const res = await axios.post(
        `${this.baseUrl}/api/auth/send-otp`,
        { phone },
        { headers: this.headers() }
      );
      return res.data;
    } catch (error) {
      throw new Error(`OTP send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Verify OTP
  async verifyOTP(phone: string, otp: string): Promise<any> {
    try {
      const res = await axios.post(
        `${this.baseUrl}/api/auth/verify-otp`,
        { phone, otp },
        { headers: this.headers() }
      );
      return res.data;
    } catch (error) {
      throw new Error(`OTP verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user profile
  async getUser(userId: string): Promise<any> {
    try {
      const res = await axios.get(
        `${this.baseUrl}/api/users/${userId}`,
        { headers: this.headers() }
      );
      return res.data;
    } catch (error) {
      throw new Error(`Get user failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Link accounts
  async linkAccounts(userId: string, provider: string, providerId: string): Promise<any> {
    try {
      const res = await axios.post(
        `${this.baseUrl}/api/users/${userId}/link`,
        { provider, providerId },
        { headers: this.headers() }
      );
      return res.data;
    } catch (error) {
      throw new Error(`Link accounts failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Session management
  async createSession(userId: string): Promise<any> {
    try {
      const res = await axios.post(
        `${this.baseUrl}/api/sessions`,
        { userId },
        { headers: this.headers() }
      );
      return res.data;
    } catch (error) {
      throw new Error(`Create session failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const res = await axios.post(
        `${this.baseUrl}/api/auth/refresh`,
        { refreshToken },
        { headers: this.headers() }
      );
      return res.data;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const authConnector = new AuthConnector();
