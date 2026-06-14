/**
 * SSO Service - SAML/OAuth Enterprise Login
 * Okta, Auth0, Azure AD integration
 */

const SSO_PREFIX = 'sso:';

interface SSOConfig {
  provider: 'okta' | 'auth0' | 'azure';
  domain: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

/**
 * Get SSO authorization URL
 */
export function getAuthUrl(config: SSOConfig, state: string): string {
  const endpoints = {
    okta: 'https://{domain}/oauth2/v1/authorize',
    auth0: 'https://{domain}/authorize',
    azure: 'https://login.microsoftonline.com/{domain}/oauth2/v2.0/authorize',
  };

  const url = endpoints[config.provider].replace('{domain}', config.domain);
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.callbackUrl,
    scope: 'openid profile email',
    state,
  });

  return `${url}?${params.toString()}`;
}

/**
 * Verify SSO token
 */
export async function verifyToken(
  config: SSOConfig,
  code: string
): Promise<{ userId: string; email: string; name?: string }> {
  const tokenUrl = getTokenUrl(config);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.callbackUrl,
    }),
  });

  const data = await response.json();
  return {
    userId: data.sub || data.id || '',
    email: data.email || '',
    name: data.name || '',
  };
}

function getTokenUrl(config: SSOConfig): string {
  const urls = {
    okta: `https://${config.domain}/oauth2/v1/token`,
    auth0: `https://${config.domain}/oauth/token`,
    azure: `https://login.microsoftonline.com/${config.domain}/oauth2/v2.0/token`,
  };
  return urls[config.provider];
}
