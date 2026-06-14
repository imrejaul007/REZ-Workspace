import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { SSOConfigurationDocument } from '../models/SSOConfiguration';
import { SSOUserDocument } from '../models/SSOUser';
import {
  SSOProvider,
  GoogleSSOConfig,
  SAMLAssertion,
} from '../types';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn: number;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale?: string;
}

export class GoogleSSOProvider {
  private static readonly AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private static readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private static readonly USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

  /**
   * Generate OAuth authorization URL
   */
  static getAuthUrl(config: GoogleSSOConfig, state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'openid',
        'email',
        'profile',
      ].join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    if (config.hostedDomain) {
      params.append('hd', config.hostedDomain);
    }

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(
    code: string,
    config: GoogleSSOConfig,
    redirectUri: string
  ): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const response = await axios.post(this.TOKEN_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(
    refreshToken: string,
    config: GoogleSSOConfig
  ): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await axios.post(this.TOKEN_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get user information
   */
  static async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await axios.get(this.USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  /**
   * Create OAuth user from profile
   */
  static createUserFromProfile(
    profile: OAuthUserInfo,
    companyId: string
  ): {
    externalId: string;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string;
  } {
    return {
      externalId: profile.id,
      email: profile.email.toLowerCase(),
      displayName: profile.name,
      firstName: profile.given_name || '',
      lastName: profile.family_name || '',
    };
  }

  /**
   * Validate tokens and verify user
   */
  static async validateAndGetUser(
    code: string,
    config: GoogleSSOConfig,
    redirectUri: string
  ): Promise<{
    tokens: OAuthTokens;
    user: OAuthUserInfo;
  }> {
    const tokens = await this.exchangeCodeForTokens(code, config, redirectUri);
    const user = await this.getUserInfo(tokens.accessToken);

    if (!user.verified_email) {
      throw new Error('Google email not verified');
    }

    return { tokens, user };
  }
}
