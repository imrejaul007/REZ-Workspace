import { Types } from 'mongoose';

// ==================== ENUMS ====================

export type SSOProvider = 'google' | 'microsoft' | 'saml' | 'ldap' | 'oidc';
export type SSOStatus = 'active' | 'inactive' | 'pending_verification' | 'error';
export type SSOUserStatus = 'active' | 'suspended' | 'pending' | 'deprovisioned';
export type LDAPAuthenticationMethod = 'simple_bind' | 'sasl_external' | 'passwordless';

// ==================== SSO CONFIGURATION ====================

export interface ISSOConfiguration {
  _id?: Types.ObjectId;
  configId: string;
  companyId: string;
  provider: SSOProvider;

  // Status
  status: SSOStatus;
  isDefault: boolean;
  isPrimary: boolean;

  // Provider-specific configuration
  config: SSOProviderConfig;

  // Security settings
  securitySettings: {
    enforceSSO: boolean;
    allowPasswordLogin: boolean;
    sessionTimeout: number; // minutes
    maxSessionDuration: number; // hours
    requireMFA: boolean;
    allowedDomains?: string[]; // For domain restriction
    blockedDomains?: string[];
  };

  // Sync settings
  syncSettings: {
    autoProvisionUsers: boolean;
    autoUpdateUsers: boolean;
    syncGroups: boolean;
    syncFrequency: number; // hours
    lastSyncedAt?: Date;
  };

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  verifiedBy?: string;
}

export type SSOProviderConfig =
  | GoogleSSOConfig
  | MicrosoftSSOConfig
  | SAMLSSOConfig
  | LDAPSSOConfig
  | OIDCSSOConfig;

export interface GoogleSSOConfig {
  provider: 'google';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  hostedDomain?: string;
}

export interface MicrosoftSSOConfig {
  provider: 'microsoft';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenantId: string;
  authority: string;
}

export interface SAMLSSOConfig {
  provider: 'saml';
  issuer: string;
  entityId: string;
  assertionConsumerServiceUrl: string;
  singleLogoutServiceUrl?: string;
  certificate: string;
  privateKey: string;
  signatureAlgorithm: 'sha256' | 'sha512';
  digestAlgorithm: 'sha256' | 'sha512';
  nameIdFormat: string;
  identifierFormat: string;
  wantAssertionsSigned: boolean;
  wantAssertionsEncrypted: boolean;
  metadataUrl?: string;
  idpMetadataUrl?: string;
  idpEntityId?: string;
  idpCertificate?: string;
  idpSsoUrl?: string;
  idpSloUrl?: string;
}

export interface LDAPSSOConfig {
  provider: 'ldap';
  serverUrl: string;
  bindDN: string;
  bindPassword: string;
  searchBase: string;
  searchFilter: string;
  groupSearchBase?: string;
  groupSearchFilter?: string;
  usernameAttribute: string;
  emailAttribute: string;
  displayNameAttribute: string;
  groupAttribute?: string;
  tlsOptions: {
    rejectUnauthorized: boolean;
    caCert?: string;
  };
  authenticationMethod: LDAPAuthenticationMethod;
  port?: number;
  timeout?: number;
}

export interface OIDCSSOConfig {
  provider: 'oidc';
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  responseType: string;
  prompt?: string;
}

// ==================== SSO SESSIONS ====================

export interface ISSOSession {
  _id?: Types.ObjectId;
  sessionId: string;
  userId: string;
  companyId: string;
  provider: SSOProvider;
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// ==================== SSO USERS (Provisioning) ====================

export interface ISSOUser {
  _id?: Types.ObjectId;
  userId: string;
  externalId: string;
  companyId: string;
  provider: SSOProvider;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  jobTitle?: string;
  groups: string[];
  roles: string[];
  status: SSOUserStatus;
  provisionedAt: Date;
  lastLoginAt?: Date;
  metadata: Record<string, unknown>;
}

// ==================== SSO LOGS ====================

export interface ISSOLog {
  _id?: Types.ObjectId;
  logId: string;
  companyId: string;
  userId?: string;
  provider: SSOProvider;
  action: SSOAction;
  status: 'success' | 'failure' | 'pending';
  ipAddress?: string;
  userAgent?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export type SSOAction =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'token_refresh'
  | 'user_provisioned'
  | 'user_updated'
  | 'user_deprovisioned'
  | 'config_updated'
  | 'config_verified'
  | 'saml_assertion_validated'
  | 'saml_assertion_failed';

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface ConfigureSSORequest {
  companyId: string;
  provider: SSOProvider;
  config: SSOProviderConfig;
  securitySettings?: Partial<ISSOConfiguration['securitySettings']>;
  syncSettings?: Partial<ISSOConfiguration['syncSettings']>;
}

export interface VerifySSORequest {
  companyId: string;
  provider: SSOProvider;
  testUserId?: string;
  testUserPassword?: string;
}

export interface SSOCallbackRequest {
  companyId: string;
  provider: SSOProvider;
  code?: string;
  state?: string;
  samlResponse?: string;
  relayState?: string;
}

export interface LDAPBindRequest {
  companyId: string;
  username: string;
  password: string;
}

export interface SyncUsersRequest {
  companyId: string;
  provider: SSOProvider;
  fullSync?: boolean;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==================== SAML TYPES ====================

export interface SAMLMetadata {
  entityId: string;
  assertionConsumerServiceUrl: string;
  singleLogoutServiceUrl?: string;
  nameIdFormat: string;
  certificate: string;
  signatureAlgorithm: string;
  digestAlgorithm: string;
  wantAssertionsSigned: boolean;
  wantAssertionsEncrypted: boolean;
}

export interface SAMLAssertion {
  nameId: string;
  nameIdFormat: string;
  sessionIndex?: string;
  attributes: Record<string, string[]>;
  issuer: string;
  audienceRestriction?: string;
  notBefore?: Date;
  notOnOrAfter?: Date;
}

// ==================== TOKEN TYPES ====================

export interface TokenPayload {
  userId: string;
  companyId: string;
  email: string;
  roles: string[];
  sessionId: string;
  provider: SSOProvider;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sessionId: string;
  userId: string;
  companyId: string;
  iat: number;
  exp: number;
}
