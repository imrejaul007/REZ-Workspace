import { v4 as uuidv4 } from 'uuid';
import { DownloadRecord, AttributionRecord, UnsplashPhoto } from '../types';
import { unsplashService } from './unsplash.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('DownloadService');

// In-memory storage
const downloads: Map<string, DownloadRecord> = new Map();
const attributions: Map<string, AttributionRecord[]> = new Map();

export class DownloadService {
  async recordDownload(
    tenantId: string,
    photoId: string,
    downloadUrl: string,
    ipAddress?: string
  ): Promise<DownloadRecord> {
    const record: DownloadRecord = {
      id: uuidv4(),
      tenantId,
      photoId,
      downloadedAt: new Date(),
      downloadUrl,
      ipAddress,
    };

    downloads.set(record.id, record);
    logger.info('Download recorded', { downloadId: record.id, photoId, tenantId });

    return record;
  }

  async getDownloadsByTenant(tenantId: string): Promise<DownloadRecord[]> {
    return Array.from(downloads.values())
      .filter(d => d.tenantId === tenantId)
      .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime());
  }

  async getDownloadsByPhoto(tenantId: string, photoId: string): Promise<DownloadRecord[]> {
    return Array.from(downloads.values())
      .filter(d => d.tenantId === tenantId && d.photoId === photoId)
      .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime());
  }

  async recordAttribution(photo: UnsplashPhoto): Promise<AttributionRecord> {
    const attribution: AttributionRecord = {
      photoId: photo.id,
      photographerName: photo.user.name,
      photographerUsername: photo.user.username,
      photographerUrl: photo.user.links.html,
      downloadUrl: photo.urls.full,
      downloadLocation: photo.links.downloadLocation,
      usedAt: new Date(),
    };

    const existing = attributions.get(photo.id) || [];
    existing.push(attribution);
    attributions.set(photo.id, existing);

    logger.info('Attribution recorded', { photoId: photo.id });

    return attribution;
  }

  async getAttributions(photoId: string): Promise<AttributionRecord[]> {
    return attributions.get(photoId) || [];
  }

  async getAllAttributions(): Promise<AttributionRecord[]> {
    const all: AttributionRecord[] = [];
    for (const records of attributions.values()) {
      all.push(...records);
    }
    return all.sort((a, b) => b.usedAt.getTime() - a.usedAt.getTime());
  }

  // Generate attribution text for a photo
  generateAttributionText(photo: UnsplashPhoto): string {
    const attr = unsplashService.getAttribution(photo);
    return `Photo by ${attr.photographerName} on Unsplash: ${attr.sourceUrl}`;
  }

  // Generate HTML attribution for a photo
  generateAttributionHtml(photo: UnsplashPhoto): string {
    const attr = unsplashService.getAttribution(photo);
    return `Photo by <a href="${attr.photographerUrl}" target="_blank" rel="noopener">${attr.photographerName}</a> on <a href="${attr.sourceUrl}" target="_blank" rel="noopener">Unsplash</a>`;
  }

  // Get download statistics for a tenant
  async getStats(tenantId: string): Promise<{
    totalDownloads: number;
    uniquePhotos: number;
    downloadsByMonth: Record<string, number>;
  }> {
    const tenantDownloads = await this.getDownloadsByTenant(tenantId);

    const uniquePhotos = new Set(tenantDownloads.map(d => d.photoId));
    const downloadsByMonth: Record<string, number> = {};

    for (const download of tenantDownloads) {
      const month = `${download.downloadedAt.getFullYear()}-${String(download.downloadedAt.getMonth() + 1).padStart(2, '0')}`;
      downloadsByMonth[month] = (downloadsByMonth[month] || 0) + 1;
    }

    return {
      totalDownloads: tenantDownloads.length,
      uniquePhotos: uniquePhotos.size,
      downloadsByMonth,
    };
  }
}

export const downloadService = new DownloadService();
