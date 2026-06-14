import axios from 'axios';
import { SSOConfigurationDocument } from '../models/SSOConfiguration';
import { SSOUserDocument } from '../models/SSOUser';
import {
  MicrosoftSSOConfig,
} from '../types';

export interface MicrosoftTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface MicrosoftUser {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  userPrincipalName: string;
  mail?: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
}

export class MicrosoftSSOProvider {
  /**
   * Generate OAuth authorization URL
   */
  static getAuthUrl(config: MicrosoftSSOConfig, state: string): string {
    const authority = `https://login.microsoftonline.com/${config.tenantId}`;
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      response_mode: 'query',
      scope: [
        'openid',
        'profile',
        'email',
        'User.Read',
      ].join(' '),
      state,
    });

    return `${authority}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(
    code: string,
    config: MicrosoftSSOConfig
  ): Promise<MicrosoftTokens> {
    const authority = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0`;

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
      scope: 'openid profile email User.Read',
    });

    const response = await axios.post(`${authority}/token`, params.toString(), {
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
      tokenType: data.token_type,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(
    refreshToken: string,
    config: MicrosoftSSOConfig
  ): Promise<MicrosoftTokens> {
    const authority = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0`;

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'openid profile email User.Read',
    });

    const response = await axios.post(`${authority}/token`, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  /**
   * Get user information from Microsoft Graph
   */
  static async getUserInfo(accessToken: string): Promise<MicrosoftUser> {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  /**
   * Get user groups from Microsoft Graph
   */
  static async getUserGroups(accessToken: string): Promise<string[]> {
    try {
      const response = await axios.get(
        'https://graph.microsoft.com/v1.0/me/memberOf?$select=displayName',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return (response.data.value || []).map(
        (group: { displayName: string }) => group.displayName
      );
    } catch (error) {
      logger.error('Failed to get user groups:', error);
      return [];
    }
  }

  /**
   * Create user from Microsoft profile
   */
  static createUserFromProfile(
    profile: MicrosoftUser,
    companyId: string
  ): {
    externalId: string;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string;
    department?: string;
    jobTitle?: string;
  } {
    return {
      externalId: profile.id,
      email: (profile.mail || profile.userPrincipalName).toLowerCase(),
      displayName: profile.displayName,
      firstName: profile.givenName || '',
      lastName: profile.surname || '',
      department: profile.department,
      jobTitle: profile.jobTitle,
    };
  }

  /**
   * Validate tokens and get user
   */
  static async validateAndGetUser(
    code: string,
    config: MicrosoftSSOConfig
  ): Promise<{
    tokens: MicrosoftTokens;
    user: MicrosoftUser;
    groups: string[];
  }> {
    const tokens = await this.exchangeCodeForTokens(code, config);
    const user = await this.getUserInfo(tokens.accessToken);
    const groups = await this.getUserGroups(tokens.accessToken);

    return { tokens, user, groups };
  }
}
