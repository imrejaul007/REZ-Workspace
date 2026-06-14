import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ssoService } from '../services/ssoService';
import {
  authMiddleware,
  adminCheckMiddleware,
  internalServiceMiddleware,
} from '../middleware';
import { ApiResponse } from '../types';

const router = Router();

// Validation schemas
const configureGoogleSSOSchema = z.object({
  companyId: z.string().min(1),
  securitySettings: z.object({
    enforceSSO: z.boolean().optional(),
    allowPasswordLogin: z.boolean().optional(),
    sessionTimeout: z.number().optional(),
    maxSessionDuration: z.number().optional(),
    requireMFA: z.boolean().optional(),
    allowedDomains: z.array(z.string()).optional(),
    blockedDomains: z.array(z.string()).optional(),
  }).optional(),
  syncSettings: z.object({
    autoProvisionUsers: z.boolean().optional(),
    autoUpdateUsers: z.boolean().optional(),
    syncGroups: z.boolean().optional(),
    syncFrequency: z.number().optional(),
  }).optional(),
});

const configureMicrosoftSSOSchema = z.object({
  companyId: z.string().min(1),
  tenantId: z.string().min(1),
  securitySettings: z.object({
    enforceSSO: z.boolean().optional(),
    allowPasswordLogin: z.boolean().optional(),
    sessionTimeout: z.number().optional(),
    maxSessionDuration: z.number().optional(),
    requireMFA: z.boolean().optional(),
    allowedDomains: z.array(z.string()).optional(),
    blockedDomains: z.array(z.string()).optional(),
  }).optional(),
  syncSettings: z.object({
    autoProvisionUsers: z.boolean().optional(),
    autoUpdateUsers: z.boolean().optional(),
    syncGroups: z.boolean().optional(),
    syncFrequency: z.number().optional(),
  }).optional(),
});

const configureSAMLSSOSchema = z.object({
  companyId: z.string().min(1),
  issuer: z.string().min(1),
  entityId: z.string().min(1),
  assertionConsumerServiceUrl: z.string().url(),
  certificate: z.string().min(1),
  privateKey: z.string().min(1),
  idpMetadataUrl: z.string().url().optional(),
  idpEntityId: z.string().optional(),
  idpCertificate: z.string().optional(),
  idpSsoUrl: z.string().url().optional(),
  idpSloUrl: z.string().url().optional(),
  securitySettings: z.object({
    enforceSSO: z.boolean().optional(),
    allowPasswordLogin: z.boolean().optional(),
    sessionTimeout: z.number().optional(),
    maxSessionDuration: z.number().optional(),
    requireMFA: z.boolean().optional(),
    allowedDomains: z.array(z.string()).optional(),
    blockedDomains: z.array(z.string()).optional(),
  }).optional(),
  syncSettings: z.object({
    autoProvisionUsers: z.boolean().optional(),
    autoUpdateUsers: z.boolean().optional(),
    syncGroups: z.boolean().optional(),
    syncFrequency: z.number().optional(),
  }).optional(),
});

const configureLDAPSSOSchema = z.object({
  companyId: z.string().min(1),
  serverUrl: z.string().min(1),
  bindDN: z.string().min(1),
  bindPassword: z.string().min(1),
  searchBase: z.string().min(1),
  searchFilter: z.string().min(1),
  usernameAttribute: z.string().optional(),
  emailAttribute: z.string().optional(),
  displayNameAttribute: z.string().optional(),
  groupSearchBase: z.string().optional(),
  groupSearchFilter: z.string().optional(),
  tlsOptions: z.object({
    rejectUnauthorized: z.boolean(),
    caCert: z.string().optional(),
  }).optional(),
  securitySettings: z.object({
    enforceSSO: z.boolean().optional(),
    allowPasswordLogin: z.boolean().optional(),
    sessionTimeout: z.number().optional(),
    maxSessionDuration: z.number().optional(),
    requireMFA: z.boolean().optional(),
    allowedDomains: z.array(z.string()).optional(),
    blockedDomains: z.array(z.string()).optional(),
  }).optional(),
  syncSettings: z.object({
    autoProvisionUsers: z.boolean().optional(),
    autoUpdateUsers: z.boolean().optional(),
    syncGroups: z.boolean().optional(),
    syncFrequency: z.number().optional(),
  }).optional(),
});

const verifySSOSchema = z.object({
  companyId: z.string().min(1),
  provider: z.enum(['google', 'microsoft', 'saml', 'ldap']),
  testUserId: z.string().optional(),
  testUserPassword: z.string().optional(),
});

const ldapAuthSchema = z.object({
  companyId: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
});

// Middleware for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== AUTH ROUTES ====================

// Get Google OAuth URL
router.get('/auth/google',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId, redirectUri } = req.query;

    if (!companyId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'companyId is required',
      };
      return res.status(400).json(response);
    }

    const authUrl = ssoService.getGoogleAuthUrl(
      companyId as string,
      redirectUri as string || process.env.GOOGLE_REDIRECT_URI || ''
    );

    const response: ApiResponse<{ authUrl: string }> = {
      success: true,
      data: { authUrl },
    };

    res.json(response);
  })
);

// Google OAuth callback
router.get('/auth/google/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Authorization code required',
      };
      return res.status(400).json(response);
    }

    let companyId: string = '';
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
        companyId = stateData.companyId;
      }
    } catch {
      // State parsing failed, companyId will be extracted from callback
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
      const result = await ssoService.handleGoogleCallback(
        code as string,
        companyId,
        ipAddress,
        userAgent
      );

      const response: ApiResponse<{
        user: typeof result.user;
        tokens: typeof result.tokens;
      }> = {
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
        message: 'Login successful',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
      res.status(401).json(response);
    }
  })
);

// Get Microsoft OAuth URL
router.get('/auth/microsoft',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.query;

    if (!companyId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'companyId is required',
      };
      return res.status(400).json(response);
    }

    const authUrl = ssoService.getMicrosoftAuthUrl(companyId as string);

    const response: ApiResponse<{ authUrl: string }> = {
      success: true,
      data: { authUrl },
    };

    res.json(response);
  })
);

// Microsoft OAuth callback
router.get('/auth/microsoft/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Authorization code required',
      };
      return res.status(400).json(response);
    }

    let companyId: string = '';
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
        companyId = stateData.companyId;
      }
    } catch {
      // State parsing failed
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
      const result = await ssoService.handleMicrosoftCallback(
        code as string,
        companyId,
        ipAddress,
        userAgent
      );

      const response: ApiResponse<{
        user: typeof result.user;
        tokens: typeof result.tokens;
      }> = {
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
        message: 'Login successful',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
      res.status(401).json(response);
    }
  })
);

// ==================== SAML ROUTES ====================

// Get SAML metadata
router.get('/metadata/:companyId',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;

    try {
      const metadata = await ssoService.getSAMLMetadata(companyId);
      res.type('application/xml');
      res.send(metadata);
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'SAML configuration not found',
      });
    }
  })
);

// SAML login initiation (redirect to IdP)
router.get('/login/saml/:companyId',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const { relayState } = req.query;

    // Get SAML config from database
    const configs = await ssoService.getConfiguration(companyId);
    const samlConfig = configs.find(c => c.provider === 'saml');

    if (!samlConfig) {
      return res.status(404).json({
        success: false,
        error: 'SAML configuration not found',
      });
    }

    const { SAMLSSOProvider } = await import('../providers/samlSSOProvider');
    const loginUrl = SAMLSSOProvider.generateAuthnRequestUrl(
      samlConfig.config as any,
      relayState as string
    );

    res.redirect(loginUrl);
  })
);

// SAML callback (ACS endpoint)
router.post('/callback/saml',
  asyncHandler(async (req: Request, res: Response) => {
    const { SAMLResponse, RelayState } = req.body;

    if (!SAMLResponse) {
      return res.status(400).json({
        success: false,
        error: 'SAMLResponse required',
      });
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Extract companyId from relay state if present
    let companyId = '';
    if (RelayState) {
      try {
        const relayData = JSON.parse(Buffer.from(RelayState, 'base64').toString());
        companyId = relayData.companyId;
      } catch {
        companyId = RelayState;
      }
    }

    try {
      const result = await ssoService.handleSAMLAssertion(
        SAMLResponse,
        companyId,
        RelayState,
        ipAddress,
        userAgent
      );

      const response: ApiResponse<{
        user: typeof result.user;
        tokens: typeof result.tokens;
      }> = {
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
        message: 'SAML authentication successful',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'SAML authentication failed',
      };
      res.status(401).json(response);
    }
  })
);

// ==================== LDAP ROUTES ====================

// LDAP authentication
router.post('/auth/ldap',
  asyncHandler(async (req: Request, res: Response) => {
    const validated = ldapAuthSchema.parse(req.body);

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
      const result = await ssoService.handleLDAPAuth(
        validated.companyId,
        validated.username,
        validated.password,
        ipAddress,
        userAgent
      );

      const response: ApiResponse<{
        user: typeof result.user;
        tokens: typeof result.tokens;
      }> = {
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
        message: 'Authentication successful',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid credentials',
      };
      res.status(401).json(response);
    }
  })
);

// ==================== CONFIG ROUTES ====================

// Configure Google SSO
router.post('/configure/google',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = configureGoogleSSOSchema.parse(req.body);

    const config = await ssoService.configureSSO({
      companyId: validated.companyId,
      provider: 'google',
      config: {
        provider: 'google',
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
      },
      securitySettings: validated.securitySettings,
      syncSettings: validated.syncSettings,
    }, req.user?.userId || '');

    const response: ApiResponse<typeof config> = {
      success: true,
      data: config,
      message: 'Google SSO configured successfully',
    };

    res.json(response);
  })
);

// Configure Microsoft SSO
router.post('/configure/microsoft',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = configureMicrosoftSSOSchema.parse(req.body);

    const config = await ssoService.configureSSO({
      companyId: validated.companyId,
      provider: 'microsoft',
      config: {
        provider: 'microsoft',
        clientId: process.env.MICROSOFT_CLIENT_ID || '',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
        redirectUri: process.env.MICROSOFT_REDIRECT_URI || '',
        tenantId: validated.tenantId,
        authority: `https://login.microsoftonline.com/${validated.tenantId}`,
      },
      securitySettings: validated.securitySettings,
      syncSettings: validated.syncSettings,
    }, req.user?.userId || '');

    const response: ApiResponse<typeof config> = {
      success: true,
      data: config,
      message: 'Microsoft SSO configured successfully',
    };

    res.json(response);
  })
);

// Configure SAML SSO
router.post('/configure/saml',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = configureSAMLSSOSchema.parse(req.body);

    const config = await ssoService.configureSSO({
      companyId: validated.companyId,
      provider: 'saml',
      config: {
        provider: 'saml',
        issuer: validated.issuer,
        entityId: validated.entityId,
        assertionConsumerServiceUrl: validated.assertionConsumerServiceUrl,
        certificate: validated.certificate,
        privateKey: validated.privateKey,
        signatureAlgorithm: 'sha256',
        digestAlgorithm: 'sha256',
        nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        wantAssertionsSigned: true,
        wantAssertionsEncrypted: false,
        idpMetadataUrl: validated.idpMetadataUrl,
        idpEntityId: validated.idpEntityId,
        idpCertificate: validated.idpCertificate,
        idpSsoUrl: validated.idpSsoUrl,
        idpSloUrl: validated.idpSloUrl,
      },
      securitySettings: validated.securitySettings,
      syncSettings: validated.syncSettings,
    }, req.user?.userId || '');

    const response: ApiResponse<typeof config> = {
      success: true,
      data: config,
      message: 'SAML SSO configured successfully',
    };

    res.json(response);
  })
);

// Configure LDAP SSO
router.post('/configure/ldap',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = configureLDAPSSOSchema.parse(req.body);

    const config = await ssoService.configureSSO({
      companyId: validated.companyId,
      provider: 'ldap',
      config: {
        provider: 'ldap',
        serverUrl: validated.serverUrl,
        bindDN: validated.bindDN,
        bindPassword: validated.bindPassword,
        searchBase: validated.searchBase,
        searchFilter: validated.searchFilter,
        usernameAttribute: validated.usernameAttribute || 'uid',
        emailAttribute: validated.emailAttribute || 'mail',
        displayNameAttribute: validated.displayNameAttribute || 'cn',
        groupSearchBase: validated.groupSearchBase,
        groupSearchFilter: validated.groupSearchFilter,
        tlsOptions: validated.tlsOptions || { rejectUnauthorized: true },
        authenticationMethod: 'simple_bind',
      },
      securitySettings: validated.securitySettings,
      syncSettings: validated.syncSettings,
    }, req.user?.userId || '');

    const response: ApiResponse<typeof config> = {
      success: true,
      data: config,
      message: 'LDAP SSO configured successfully',
    };

    res.json(response);
  })
);

// ==================== CONFIG MANAGEMENT ====================

// Get SSO config
router.get('/config/:companyId',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;

    const configs = await ssoService.getConfiguration(companyId);

    // Remove sensitive data from response
    const sanitizedConfigs = configs.map(config => ({
      ...config.toObject(),
      config: {
        ...config.config,
        clientSecret: config.config.clientSecret ? '***' : undefined,
        privateKey: config.config.privateKey ? '***' : undefined,
        bindPassword: config.config.bindPassword ? '***' : undefined,
      },
    }));

    const response: ApiResponse<typeof sanitizedConfigs> = {
      success: true,
      data: sanitizedConfigs,
    };

    res.json(response);
  })
);

// Verify SSO config
router.post('/verify',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = verifySSOSchema.parse(req.body);

    const result = await ssoService.verifyConfiguration(
      validated.companyId,
      validated.provider,
      validated.testUserId,
      validated.testUserPassword
    );

    const response: ApiResponse<typeof result> = {
      success: result.success,
      data: result,
      message: result.success ? 'SSO verified successfully' : 'SSO verification failed',
    };

    res.status(result.success ? 200 : 400).json(response);
  })
);

// ==================== TOKEN MANAGEMENT ====================

// Refresh token
router.post('/token/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'refreshToken required',
      });
    }

    try {
      const tokens = await ssoService.refreshToken(refreshToken);

      const response: ApiResponse<typeof tokens> = {
        success: true,
        data: tokens,
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
      res.status(401).json(response);
    }
  })
);

// Logout
router.post('/logout',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = req.ip || req.socket.remoteAddress;

    await ssoService.logout(
      req.sessionId!,
      req.user?.userId,
      ipAddress
    );

    const response: ApiResponse<null> = {
      success: true,
      message: 'Logged out successfully',
    };

    res.json(response);
  })
);

// Get user sessions
router.get('/sessions',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const sessions = await ssoService.getUserSessions(req.user!.userId);

    const response: ApiResponse<typeof sessions> = {
      success: true,
      data: sessions,
    };

    res.json(response);
  })
);

// ==================== USER MANAGEMENT ====================

// Get provisioned users
router.get('/users/:companyId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const { provider, status, page, limit } = req.query;

    // This would typically be implemented in a separate user service
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'User management endpoint - integrate with user service' },
    };

    res.json(response);
  })
);

export default router;
