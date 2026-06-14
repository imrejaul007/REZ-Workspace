import crypto from 'crypto';
import { SEOMeta, SEOScore, SitemapConfig, RedirectRule } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class SEOService {
  private metas: Map<string, SEOMeta> = new Map();
  private sitemaps: Map<string, SitemapConfig> = new Map();
  private redirects: Map<string, RedirectRule> = new Map();
  private productMetas: Map<string, string> = new Map();

  createOrUpdateMeta(identifier: string, data: Partial<SEOMeta> & { shopifyProductId?: string; shopifyCollectionId?: string; shopifyPageId?: string }): SEOMeta {
    const existing = this.metas.get(identifier);
    const id = existing?.id || crypto.randomUUID();
    const meta: SEOMeta = {
      id,
      keywords: [],
      ...existing,
      ...data,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.metas.set(identifier, meta);
    if (data.shopifyProductId) {
      this.productMetas.set(data.shopifyProductId, identifier);
    }
    logger.info(`SEO meta saved`, { id });
    return meta;
  }

  getMeta(identifier: string): SEOMeta | undefined {
    return this.metas.get(identifier);
  }

  getProductMeta(productId: string): SEOMeta | undefined {
    const identifier = this.productMetas.get(productId);
    return identifier ? this.metas.get(identifier) : undefined;
  }

  analyzeSEO(productId: string, data: { title: string; description: string; url: string; images: string[] }): SEOScore {
    const issues: SEOScore['issues'] = [];

    let titleScore = 0;
    if (data.title.length >= 30 && data.title.length <= 60) titleScore = 100;
    else if (data.title.length >= 20 && data.title.length <= 70) titleScore = 80;
    else titleScore = 50;

    if (data.title.length < 30) issues.push({ type: 'warning', message: 'Title is too short (min 30 chars)', field: 'title' });
    if (data.title.length > 70) issues.push({ type: 'warning', message: 'Title is too long (max 70 chars)', field: 'title' });

    let descriptionScore = 0;
    if (data.description.length >= 120 && data.description.length <= 160) descriptionScore = 100;
    else if (data.description.length >= 80 && data.description.length <= 200) descriptionScore = 70;
    else descriptionScore = 40;

    if (data.description.length < 120) issues.push({ type: 'warning', message: 'Meta description too short', field: 'description' });
    if (data.description.length > 160) issues.push({ type: 'warning', message: 'Meta description too long', field: 'description' });

    const imageScore = data.images.length >= 1 ? 100 : 60;
    if (data.images.length === 0) issues.push({ type: 'warning', message: 'No product images', field: 'images' });

    const urlScore = data.url.includes('-') ? 90 : 70;
    if (!data.url.includes('-')) issues.push({ type: 'info', message: 'URL could be more descriptive', field: 'url' });

    const overallScore = Math.round((titleScore + descriptionScore + imageScore + urlScore) / 4);

    return {
      productId,
      overallScore,
      titleScore,
      descriptionScore,
      imageScore,
      urlScore,
      structuredDataScore: 85,
      issues
    };
  }

  generateSitemap(shopId: string): string {
    const config = this.sitemaps.get(shopId);
    if (!config) return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';

    const urls: string[] = [];
    const now = new Date().toISOString().split('T')[0];

    if (config.includeProducts) {
      urls.push('  <url><loc>https://example.com/products/sample</loc><lastmod>' + now + '</lastmod><changefreq>' + (config.changefreq || 'weekly') + '</changefreq><priority>1.0</priority></url>');
    }
    if (config.includeCollections) {
      urls.push('  <url><loc>https://example.com/collections/all</loc><lastmod>' + now + '</lastmod><changefreq>' + (config.changefreq || 'weekly') + '</changefreq><priority>0.8</priority></url>');
    }
    if (config.includePages) {
      urls.push('  <url><loc>https://example.com/pages/about</loc><lastmod>' + now + '</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>');
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  }

  createSitemap(config: Omit<SitemapConfig, 'id' | 'lastGenerated'>): SitemapConfig {
    const id = crypto.randomUUID();
    const sitemap: SitemapConfig = { ...config, id, lastGenerated: new Date().toISOString() };
    this.sitemaps.set(config.shopifyShopId, sitemap);
    return sitemap;
  }

  getSitemap(shopId: string): SitemapConfig | undefined {
    return this.sitemaps.get(shopId);
  }

  createRedirect(rule: Omit<RedirectRule, 'id' | 'hitCount' | 'createdAt'>): RedirectRule {
    const id = crypto.randomUUID();
    const redirect: RedirectRule = { ...rule, id, hitCount: 0, createdAt: new Date().toISOString() };
    this.redirects.set(id, redirect);
    logger.info(`Redirect created`, { id, from: rule.oldPath, to: rule.newPath });
    return redirect;
  }

  getRedirect(path: string): RedirectRule | undefined {
    for (const redirect of this.redirects.values()) {
      if (redirect.isActive && redirect.oldPath === path) {
        redirect.hitCount++;
        return redirect;
      }
    }
    return undefined;
  }

  getAllRedirects(shopId: string): RedirectRule[] {
    return Array.from(this.redirects.values()).filter(r => r.shopifyShopId === shopId);
  }

  deleteRedirect(id: string): boolean {
    return this.redirects.delete(id);
  }

  bulkCreateRedirects(shopId: string, rules: Array<{ oldPath: string; newPath: string; type?: '301' | '302' | '307' }>): RedirectRule[] {
    return rules.map(rule => this.createRedirect({ ...rule, type: rule.type || '301', shopifyShopId: shopId, isActive: true }));
  }
}

export const seoService = new SEOService();
