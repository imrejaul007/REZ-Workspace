import crypto from 'crypto';
import { ProductFeed, FeedItem, Channel } from '../types/index.js';
import { logger } from '../utils/logger.js';

interface ProductInput {
  id: string;
  title: string;
  description: string;
  link: string;
  image: string;
  price: number;
  salePrice?: number;
  inStock: boolean;
  brand?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  productType?: string;
}

export class FeedService {
  private feeds: Map<string, ProductFeed> = new Map();
  private channels: Map<string, Channel> = new Map();

  createFeed(feedData: Omit<ProductFeed, 'id' | 'lastGenerated' | 'createdAt' | 'updatedAt'>): ProductFeed {
    const id = crypto.randomUUID();
    const feed: ProductFeed = {
      ...feedData,
      id,
      lastGenerated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.feeds.set(id, feed);
    logger.info(`Product feed created`, { id });
    return feed;
  }

  getFeed(id: string): ProductFeed | undefined {
    return this.feeds.get(id);
  }

  getShopFeeds(shopId: string): ProductFeed[] {
    return Array.from(this.feeds.values()).filter(f => f.shopifyShopId === shopId);
  }

  updateFeed(id: string, updates: Partial<ProductFeed>): ProductFeed | undefined {
    const feed = this.feeds.get(id);
    if (!feed) return undefined;
    const updated = { ...feed, ...updates, id, updatedAt: new Date().toISOString() };
    this.feeds.set(id, updated);
    return updated;
  }

  generateFeed(feedId: string, products: ProductInput[]): FeedItem[] {
    const feed = this.feeds.get(feedId);
    if (!feed) return [];

    return products
      .filter(p => feed.includeOutOfStock || p.inStock)
      .map(p => ({
        id: p.id,
        title: p.title.substring(0, 150),
        description: p.description.substring(0, 5000),
        link: p.link,
        imageLink: p.image,
        price: `${p.price} ${feed.googleCategory || 'INR'}`,
        salePrice: p.salePrice ? `${p.salePrice} ${feed.googleCategory || 'INR'}` : undefined,
        availability: p.inStock ? 'in_stock' as const : 'out_of_stock' as const,
        condition: 'new' as const,
        brand: p.brand,
        mpn: p.sku,
        gtin: p.barcode,
        googleProductCategory: feed.googleCategory,
        productType: p.productType || p.category
      }));
  }

  exportFeed(feedId: string, format: 'xml' | 'csv' | 'json' | 'tsv', items: FeedItem[]): string {
    switch (format) {
      case 'xml':
        return this.toXML(items);
      case 'csv':
        return this.toCSV(items);
      case 'json':
        return JSON.stringify(items, null, 2);
      case 'tsv':
        return this.toTSV(items);
      default:
        return this.toXML(items);
    }
  }

  private toXML(items: FeedItem[]): string {
    const itemsXml = items.map(item => `  <item>
    <g:id>${item.id}</g:id>
    <g:title><![CDATA[${item.title}]]></g:title>
    <g:description><![CDATA[${item.description}]]></g:description>
    <g:link>${item.link}</g:link>
    <g:image_link>${item.imageLink}</g:image_link>
    <g:price>${item.price}</g:price>
    <g:availability>${item.availability === 'in_stock' ? 'in_stock' : 'out_of_stock'}</g:availability>
    <g:condition>${item.condition}</g:condition>
    ${item.brand ? `<g:brand>${item.brand}</g:brand>` : ''}
    ${item.mpn ? `<g:mpn>${item.mpn}</g:mpn>` : ''}
    ${item.gtin ? `<g:gtin>${item.gtin}</g:gtin>` : ''}
  </item>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
  <title>Product Feed</title>
  <link>https://example.com</link>
  <description>Generated product feed</description>
${itemsXml}
</channel>
</rss>`;
  }

  private toCSV(items: FeedItem[]): string {
    const headers = ['id', 'title', 'description', 'link', 'image_link', 'price', 'availability', 'condition', 'brand', 'mpn', 'gtin'];
    const rows = items.map(item => headers.map(h => {
      const val = item[h as keyof FeedItem];
      return typeof val === 'string' && (val.includes(',') || val.includes('"')) ? `"${val.replace(/"/g, '""')}"` : val || '';
    }).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  private toTSV(items: FeedItem[]): string {
    const headers = ['id', 'title', 'description', 'link', 'image_link', 'price', 'availability', 'condition'];
    const rows = items.map(item => headers.map(h => String(item[h as keyof FeedItem] || '')).join('\t'));
    return [headers.join('\t'), ...rows].join('\n');
  }

  createChannel(channelData: Omit<Channel, 'id' | 'lastSync' | 'syncStatus'>): Channel {
    const id = crypto.randomUUID();
    const channel: Channel = { ...channelData, id };
    this.channels.set(id, channel);
    logger.info(`Channel created`, { id, channel: channelData.channel });
    return channel;
  }

  getChannel(id: string): Channel | undefined {
    return this.channels.get(id);
  }

  getShopChannels(shopId: string): Channel[] {
    return Array.from(this.channels.values()).filter(c => c.shopifyShopId === shopId);
  }

  updateChannelSync(id: string, status: Channel['syncStatus'], error?: string): void {
    const channel = this.channels.get(id);
    if (channel) {
      channel.lastSync = new Date().toISOString();
      channel.syncStatus = status;
      channel.errorMessage = error;
      this.channels.set(id, channel);
    }
  }

  syncChannel(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    try {
      this.updateChannelSync(channelId, 'success');
      logger.info(`Channel synced`, { channelId });
      return true;
    } catch (error) {
      this.updateChannelSync(channelId, 'failed', String(error));
      return false;
    }
  }
}

export const feedService = new FeedService();
