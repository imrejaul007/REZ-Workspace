import crypto from 'crypto';
import { SocialLink, SocialProvider, SocialAuthRequest, SocialAuthResponse, SocialLoginStats } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class SocialLoginService {
  private links: Map<string, SocialLink> = new Map();
  private customerLinks: Map<string, Set<string>> = new Map();
  private providerLinks: Map<string, Map<string, string>> = new Map();
  private stats: Map<string, { logins: number; registrations: number }> = new Map();

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  linkAccount(customerId: string, provider: SocialProvider, providerId: string, profile?: Partial<SocialLink>): SocialLink | null {
    const existingKey = `${provider}:${providerId}`;
    for (const [linkId, link] of this.links) {
      if (link.provider === provider && link.providerId === providerId && link.shopifyCustomerId !== customerId) {
        logger.warn(`Provider account already linked to another customer`, { provider, providerId });
        return null;
      }
    }

    const id = crypto.randomUUID();
    const link: SocialLink = {
      id,
      shopifyCustomerId: customerId,
      provider,
      providerId,
      email: profile?.email,
      displayName: profile?.displayName,
      profilePicture: profile?.profilePicture,
      accessToken: profile?.accessToken,
      refreshToken: profile?.refreshToken,
      tokenExpiresAt: profile?.tokenExpiresAt,
      scope: profile?.scope || [],
      isPrimary: profile?.isPrimary || false,
      linkedAt: new Date().toISOString(),
      metadata: {}
    };

    this.links.set(id, link);
    this.indexLink(link);

    if (!this.stats.has(customerId)) {
      this.stats.set(customerId, { logins: 0, registrations: 0 });
    }
    const custStats = this.stats.get(customerId)!;
    custStats.registrations++;

    logger.info(`Social account linked`, { customerId, provider, linkId: id });
    return link;
  }

  private indexLink(link: SocialLink): void {
    if (!this.customerLinks.has(link.shopifyCustomerId)) {
      this.customerLinks.set(link.shopifyCustomerId, new Set());
    }
    this.customerLinks.get(link.shopifyCustomerId)!.add(link.id!);

    if (!this.providerLinks.has(link.provider)) {
      this.providerLinks.set(link.provider, new Map());
    }
    this.providerLinks.get(link.provider)!.set(link.providerId, link.id!);
  }

  unlinkAccount(customerId: string, provider: SocialProvider): boolean {
    const links = this.getCustomerLinks(customerId);
    const link = links.find(l => l.provider === provider);
    if (!link) return false;

    this.links.delete(link.id!);
    this.customerLinks.get(customerId)?.delete(link.id!);
    this.providerLinks.get(provider)?.delete(link.providerId);
    logger.info(`Social account unlinked`, { customerId, provider });
    return true;
  }

  getCustomerLinks(customerId: string): SocialLink[] {
    const linkIds = this.customerLinks.get(customerId) || new Set();
    return Array.from(linkIds).map(id => this.links.get(id)).filter((l): l is SocialLink => !!l);
  }

  getLinkByProvider(provider: SocialProvider, providerId: string): SocialLink | undefined {
    const linkId = this.providerLinks.get(provider)?.get(providerId);
    return linkId ? this.links.get(linkId) : undefined;
  }

  updateLastLogin(linkId: string): void {
    const link = this.links.get(linkId);
    if (link) {
      link.lastLoginAt = new Date().toISOString();
      this.links.set(linkId, link);

      const custStats = this.stats.get(link.shopifyCustomerId);
      if (custStats) custStats.logins++;
    }
  }

  authenticate(request: SocialAuthRequest): SocialAuthResponse {
    const { provider, authorizationCode, idToken, accessToken } = request;

    let providerId = '';
    let email = '';
    let displayName = '';

    switch (provider) {
      case 'google':
        providerId = this.extractGoogleId(idToken || accessToken || '');
        email = this.extractGoogleEmail(idToken || accessToken || '');
        break;
      case 'facebook':
        providerId = this.extractFacebookId(accessToken || '');
        break;
      case 'apple':
        providerId = this.extractAppleId(idToken || '');
        email = this.extractAppleEmail(idToken || '');
        break;
      default:
        providerId = this.generateProviderId();
    }

    const existingLink = this.getLinkByProvider(provider, providerId);

    if (existingLink) {
      this.updateLastLogin(existingLink.id!);
      const customerLinks = this.getCustomerLinks(existingLink.shopifyCustomerId);

      logger.info(`Social login successful`, { provider, customerId: existingLink.shopifyCustomerId });
      return {
        success: true,
        customer: {
          id: existingLink.shopifyCustomerId,
          email: existingLink.email || '',
          firstName: existingLink.displayName?.split(' ')[0],
          lastName: existingLink.displayName?.split(' ').slice(1).join(' ')
        },
        token: this.generateToken(),
        isNewCustomer: false,
        linkedProviders: customerLinks.map(l => l.provider)
      };
    }

    const customerId = crypto.randomUUID();
    const link = this.linkAccount(customerId, provider, providerId, { email, displayName });

    if (!link) {
      return { success: false, error: 'Failed to link account', isNewCustomer: false, linkedProviders: [] };
    }

    logger.info(`New social registration`, { provider, customerId });
    return {
      success: true,
      customer: {
        id: customerId,
        email: email || '',
        firstName: displayName.split(' ')[0] || undefined,
        lastName: displayName.split(' ').slice(1).join(' ') || undefined
      },
      token: this.generateToken(),
      isNewCustomer: true,
      linkedProviders: [provider]
    };
  }

  private extractGoogleId(token: string): string {
    if (token.length < 20) return this.generateProviderId();
    return `google_${token.substring(0, 20)}`;
  }

  private extractGoogleEmail(token: string): string {
    return `user_${token.substring(0, 8)}@example.com`;
  }

  private extractFacebookId(token: string): string {
    if (token.length < 10) return this.generateProviderId();
    return `fb_${token.substring(0, 15)}`;
  }

  private extractAppleId(token: string): string {
    return `apple_${crypto.randomUUID().substring(0, 8)}`;
  }

  private extractAppleEmail(token: string): string {
    return `user_${token.substring(0, 8)}@privaterelay.apple.com`;
  }

  private generateProviderId(): string {
    return `${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
  }

  getStats(customerId?: string): SocialLoginStats {
    if (customerId) {
      const stats = this.stats.get(customerId);
      const links = this.getCustomerLinks(customerId);
      return {
        totalLogins: stats?.logins || 0,
        newRegistrations: stats?.registrations || 0,
        byProvider: links.reduce((acc, l) => ({ ...acc, [l.provider]: 1 }), {} as Record<string, number>),
        successRate: 100,
        avgSessionDuration: 1800
      };
    }

    let totalLogins = 0;
    let totalRegistrations = 0;
    const byProvider: Record<string, number> = {};

    for (const [linkId] of this.links) {
      const link = this.links.get(linkId)!;
      byProvider[link.provider] = (byProvider[link.provider] || 0) + 1;
    }

    for (const [, s] of this.stats) {
      totalLogins += s.logins;
      totalRegistrations += s.registrations;
    }

    return {
      totalLogins,
      newRegistrations: totalRegistrations,
      byProvider,
      successRate: totalLogins > 0 ? Math.round(((totalLogins - totalRegistrations) / totalLogins) * 100) : 100,
      avgSessionDuration: 1800
    };
  }
}

export const socialLoginService = new SocialLoginService();
