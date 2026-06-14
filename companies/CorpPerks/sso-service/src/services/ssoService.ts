import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { SSOConfiguration, SSOSession, SSOUser, SSOLog } from '../models';
import { SSOConfigurationDocument } from '../models/SSOConfiguration';
import { SSOUserDocument } from '../models/SSOUser';
import {
  SSOProvider,
  ConfigureSSORequest,
  TokenPayload,
  GoogleSSOConfig,
  MicrosoftSSOConfig,
  SAMLSSOConfig,
  LDAPSSOConfig,
} from '../types';
import {
  GoogleSSOProvider,
  MicrosoftSSOProvider,
  SAMLSSOProvider,
  LDAPSSOProvider,
  OAuthTokens,
} from '../providers';

export class SSOService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
  }

  /**
   * Configure SSO for a company
   */
  async configureSSO(
    request: ConfigureSSORequest,
    createdBy: string
  ): Promise<SSOConfigurationDocument> {
    const existingConfig = await SSOConfiguration.findByCompanyAndProvider(
      request.companyId,
      request.provider
    );

    if (existingConfig) {
      // Update existing config
      existingConfig.config = request.config;
      existingConfig.securitySettings = {
        ...existingConfig.securitySettings,
        ...request.securitySettings,
      };
      existingConfig.syncSettings = {
        ...existingConfig.syncSettings,
        ...request.syncSettings,
      };
      existingConfig.status = 'pending_verification';
      await existingConfig.save();
      return existingConfig;
    }

    // Create new config
    const config = new SSOConfiguration({
      configId: uuidv4(),
      companyId: request.companyId,
      provider: request.provider,
      config: request.config,
      securitySettings: {
        enforceSSO: false,
        allowPasswordLogin: true,
        sessionTimeout: 480,
        maxSessionDuration: 24,
        requireMFA: false,
        ...request.securitySettings,
      },
      syncSettings: {
        autoProvisionUsers: true,
        autoUpdateUsers: true,
        syncGroups: true,
        syncFrequency: 24,
        ...request.syncSettings,
      },
      status: 'pending_verification',
      isDefault: false,
      isPrimary: false,
      createdBy,
    });

    await config.save();

    // Log configuration creation
    await this.logAction(
      request.companyId,
      undefined,
      request.provider,
      'config_updated',
      'success',
      { configId: config.configId }
    );

    return config;
  }

  /**
   * Get SSO configuration for a company
   */
  async getConfiguration(companyId: string): Promise<SSOConfigurationDocument[]> {
    return SSOConfiguration.findByCompany(companyId);
  }

  /**
   * Verify SSO configuration with test authentication
   */
  async verifyConfiguration(
    companyId: string,
    provider: SSOProvider,
    testUserId?: string,
    testUserPassword?: string
  ): Promise<{ success: boolean; error?: string }> {
    const config = await SSOConfiguration.findByCompanyAndProvider(companyId, provider);

    if (!config) {
      return { success: false, error: 'Configuration not found' };
    }

    try {
      // For LDAP, verify connection with test credentials
      if (provider === 'ldap' && testUserId && testUserPassword) {
        const ldapConfig = config.config as LDAPSSOConfig;
        const ldapProvider = new LDAPSSOProvider(ldapConfig);
        const user = await ldapProvider.bindAndSearch(testUserId, testUserPassword);

        if (!user) {
          return { success: false, error: 'Invalid test credentials' };
        }
      }

      // Update config status
      config.status = 'active';
      config.lastVerifiedAt = new Date();
      config.verifiedBy = 'system';
      await config.save();

      // Log verification
      await this.logAction(
        companyId,
        undefined,
        provider,
        'config_verified',
        'success'
      );

      return { success: true };
    } catch (error) {
      config.status = 'error';
      await config.save();

      await this.logAction(
        companyId,
        undefined,
        provider,
        'config_verified',
        'failure',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Initiate OAuth flow for Google
   */
  getGoogleAuthUrl(companyId: string, redirectUri: string): string {
    const state = Buffer.from(JSON.stringify({ companyId, provider: 'google' })).toString('base64');

    const config: GoogleSSOConfig = {
      provider: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || redirectUri,
    };

    return GoogleSSOProvider.getAuthUrl(config, state, redirectUri);
  }

  /**
   * Initiate OAuth flow for Microsoft
   */
  getMicrosoftAuthUrl(companyId: string): string {
    const state = Buffer.from(JSON.stringify({ companyId, provider: 'microsoft' })).toString('base64');

    const config: MicrosoftSSOConfig = {
      provider: 'microsoft',
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || '',
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    };

    return MicrosoftSSOProvider.getAuthUrl(config, state);
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(
    code: string,
    companyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: SSOUserDocument;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    const config: GoogleSSOConfig = {
      provider: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    };

    const { tokens, user: profile } = await GoogleSSOProvider.validateAndGetUser(
      code,
      config,
      config.redirectUri
    );

    // Log login attempt
    await this.logAction(
      companyId,
      undefined,
      'google',
      'login_attempt',
      'pending'
    );

    // Create or update user
    const userData = GoogleSSOProvider.createUserFromProfile(profile, companyId);
    const user = await this.provisionUser(companyId, 'google', userData);

    // Create session
    const sessionTokens = await this.createSession(
      user,
      'google',
      tokens,
      ipAddress,
      userAgent
    );

    // Log success
    await this.logAction(
      companyId,
      user.userId,
      'google',
      'login_success',
      'success',
      {},
      ipAddress,
      userAgent
    );

    return { user, tokens: sessionTokens };
  }

  /**
   * Handle Microsoft OAuth callback
   */
  async handleMicrosoftCallback(
    code: string,
    companyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: SSOUserDocument;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    const config: MicrosoftSSOConfig = {
      provider: 'microsoft',
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || '',
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    };

    const { tokens, user: profile, groups } = await MicrosoftSSOProvider.validateAndGetUser(
      code,
      config
    );

    // Log login attempt
    await this.logAction(
      companyId,
      undefined,
      'microsoft',
      'login_attempt',
      'pending'
    );

    // Create or update user with groups
    const userData = MicrosoftSSOProvider.createUserFromProfile(profile, companyId);
    const user = await this.provisionUser(companyId, 'microsoft', {
      ...userData,
      groups,
    });

    // Create session
    const sessionTokens = await this.createSession(
      user,
      'microsoft',
      tokens,
      ipAddress,
      userAgent
    );

    // Log success
    await this.logAction(
      companyId,
      user.userId,
      'microsoft',
      'login_success',
      'success',
      {},
      ipAddress,
      userAgent
    );

    return { user, tokens: sessionTokens };
  }

  /**
   * Handle SAML assertion
   */
  async handleSAMLAssertion(
    samlResponse: string,
    companyId: string,
    relayState?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: SSOUserDocument;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    const config = await SSOConfiguration.findByCompanyAndProvider(companyId, 'saml');
    if (!config) {
      throw new Error('SAML configuration not found');
    }

    const samlConfig = config.config as SAMLSSOConfig;

    // Validate SAML response
    const assertion = await SAMLSSOProvider.validateResponse(samlResponse, samlConfig);

    // Log assertion validation
    await this.logAction(
      companyId,
      undefined,
      'saml',
      'saml_assertion_validated',
      'success'
    );

    // Extract user data from assertion
    const userData = {
      externalId: assertion.nameId,
      email: assertion.attributes.email?.[0] ||
             assertion.attributes.mail?.[0] ||
             assertion.nameId,
      displayName: assertion.attributes.displayName?.[0] ||
                   assertion.attributes.name?.[0] ||
                   assertion.nameId,
      firstName: assertion.attributes.firstName?.[0] ||
                 assertion.attributes.givenName?.[0],
      lastName: assertion.attributes.lastName?.[0] ||
                assertion.attributes.surname?.[0],
      groups: assertion.attributes.groups || assertion.attributes.memberOf || [],
    };

    // Create or update user
    const user = await this.provisionUser(companyId, 'saml', userData);

    // Create session with SAML tokens
    const sessionTokens = await this.createSession(
      user,
      'saml',
      {
        accessToken: assertion.sessionIndex || uuidv4(),
        refreshToken: undefined,
        expiresIn: 86400,
      },
      ipAddress,
      userAgent
    );

    // Log success
    await this.logAction(
      companyId,
      user.userId,
      'saml',
      'login_success',
      'success',
      {},
      ipAddress,
      userAgent
    );

    return { user, tokens: sessionTokens };
  }

  /**
   * Handle LDAP authentication
   */
  async handleLDAPAuth(
    companyId: string,
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: SSOUserDocument;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    const config = await SSOConfiguration.findByCompanyAndProvider(companyId, 'ldap');
    if (!config) {
      throw new Error('LDAP configuration not found');
    }

    const ldapConfig = config.config as LDAPSSOConfig;
    const ldapProvider = new LDAPSSOProvider(ldapConfig);

    // Log login attempt
    await this.logAction(
      companyId,
      undefined,
      'ldap',
      'login_attempt',
      'pending'
    );

    // Authenticate user
    const ldapUser = await ldapProvider.bindAndSearch(username, password);

    if (!ldapUser) {
      await this.logAction(
        companyId,
        undefined,
        'ldap',
        'login_failure',
        'failure',
        { reason: 'Invalid credentials' },
        ipAddress,
        userAgent
      );
      throw new Error('Invalid credentials');
    }

    // Create or update user
    const userData = LDAPSSOProvider.createUserFromLdapEntry(ldapUser, companyId);
    const user = await this.provisionUser(companyId, 'ldap', userData);

    // Create session
    const sessionTokens = await this.createSession(
      user,
      'ldap',
      {
        accessToken: uuidv4(),
        refreshToken: undefined,
        expiresIn: 86400,
      },
      ipAddress,
      userAgent
    );

    // Log success
    await this.logAction(
      companyId,
      user.userId,
      'ldap',
      'login_success',
      'success',
      {},
      ipAddress,
      userAgent
    );

    return { user, tokens: sessionTokens };
  }

  /**
   * Provision or update a user from SSO
   */
  private async provisionUser(
    companyId: string,
    provider: SSOProvider,
    userData: {
      externalId: string;
      email: string;
      displayName: string;
      firstName?: string;
      lastName?: string;
      department?: string;
      jobTitle?: string;
      groups?: string[];
    }
  ): Promise<SSOUserDocument> {
    let user = await SSOUser.findByExternalId(companyId, provider, userData.externalId);

    if (user) {
      // Update existing user
      user.email = userData.email.toLowerCase();
      user.displayName = userData.displayName;
      user.firstName = userData.firstName;
      user.lastName = userData.lastName;
      user.department = userData.department;
      user.jobTitle = userData.jobTitle;
      if (userData.groups) {
        user.groups = userData.groups;
      }
      user.status = 'active';
      user.lastLoginAt = new Date();
      await user.save();

      await this.logAction(
        companyId,
        user.userId,
        provider,
        'user_updated',
        'success'
      );
    } else {
      // Create new user
      user = await SSOUser.create({
        userId: uuidv4(),
        externalId: userData.externalId,
        companyId,
        provider,
        email: userData.email.toLowerCase(),
        displayName: userData.displayName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        department: userData.department,
        jobTitle: userData.jobTitle,
        groups: userData.groups || [],
        roles: [],
        status: 'active',
        provisionedAt: new Date(),
        lastLoginAt: new Date(),
        metadata: {},
      });

      await this.logAction(
        companyId,
        user.userId,
        provider,
        'user_provisioned',
        'success'
      );
    }

    return user;
  }

  /**
   * Create session for user
   */
  private async createSession(
    user: SSOUserDocument,
    provider: SSOProvider,
    tokens: OAuthTokens | { accessToken: string; refreshToken?: string; expiresIn: number },
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + (tokens.expiresIn || 86400) * 1000);

    // Create session record
    await SSOSession.create({
      sessionId,
      userId: user.userId,
      companyId: user.companyId,
      provider,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      lastActivityAt: new Date(),
      userAgent,
      ipAddress,
    });

    // Generate JWT
    const accessToken = this.generateAccessToken(user, sessionId);
    const refreshToken = tokens.refreshToken || uuidv4();

    return {
      accessToken,
      refreshToken,
      expiresIn: tokens.expiresIn || 86400,
    };
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(
    user: SSOUserDocument,
    sessionId: string
  ): string {
    const payload: TokenPayload = {
      userId: user.userId,
      companyId: user.companyId,
      email: user.email,
      roles: user.roles,
      sessionId,
      provider: user.provider,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, this.jwtSecret) as TokenPayload;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    // Find session by refresh token
    const session = await SSOSession.findOne({
      refreshToken,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user
    const user = await SSOUser.findOne({ userId: session.userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(user, session.sessionId);

    // Update session activity
    session.lastActivityAt = new Date();
    await session.save();

    return { accessToken, expiresIn: 3600 };
  }

  /**
   * Logout user
   */
  async logout(sessionId: string, userId?: string, ipAddress?: string): Promise<void> {
    if (sessionId) {
      await SSOSession.deleteOne({ sessionId });
    }

    if (userId) {
      await this.logAction(
        userId,
        userId,
        undefined as unknown as SSOProvider,
        'logout',
        'success',
        {},
        ipAddress
      );
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<SSOSession[]> {
    return SSOSession.findUserSessions(userId);
  }

  /**
   * Log SSO action
   */
  private async logAction(
    companyId: string,
    userId: string | undefined,
    provider: SSOProvider,
    action: string,
    status: 'success' | 'failure' | 'pending',
    metadata: Record<string, unknown> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await SSOLog.create({
      logId: uuidv4(),
      companyId,
      userId,
      provider,
      action: action as any,
      status,
      ipAddress,
      userAgent,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Get SAML metadata
   */
  async getSAMLMetadata(companyId: string): Promise<string> {
    const config = await SSOConfiguration.findByCompanyAndProvider(companyId, 'saml');
    if (!config) {
      throw new Error('SAML configuration not found');
    }

    const samlConfig = config.config as SAMLSSOConfig;
    return SAMLSSOProvider.generateMetadataXml(samlConfig);
  }

  /**
   * Generate SAML Auth URL
   */
  getSAMLLoginUrl(companyId: string, relayState?: string): string {
    const config = SSOConfiguration.findByCompanyAndProvider;
    // This would typically be called with actual config
    throw new Error('Call getSAMLLoginUrlFromConfig with config');
  }

  getSAMLLoginUrlFromConfig(config: SAMLSSOConfig, relayState?: string): string {
    return SAMLSSOProvider.generateAuthnRequestUrl(config, relayState);
  }

  getSAMLLoginFormFromConfig(config: SAMLSSOConfig, relayState?: string): string {
    return SAMLSSOProvider.generateAuthnRequestForm(config, relayState);
  }
}

export const ssoService = new SSOService();
