import { v4 as uuidv4 } from 'uuid';
import type {
  AdBreak,
  InsertedAd,
  ManifestProcessRequest,
  ManifestProcessResponse,
  AdBreakCompleteRequest,
  SpliceInsertRequest,
  ContentType,
  ManifestType,
} from '../types/index.js';
import { StreamManifestModel } from '../models/index.js';
import { manifestService } from './manifest.js';
import { redisService } from './redis.js';
import { config } from '../config/index.js';

export class AdInsertionService {
  private readonly CACHE_TTL = 3600;
  private readonly AD_BREAK_CACHE_PREFIX = 'ssai:adbreak:';
  private readonly STREAM_CACHE_PREFIX = 'ssai:stream:';

  async createStream(
    contentId: string,
    contentType: ContentType,
    manifestType: ManifestType,
    originalManifestUrl: string,
    adBreaks?: Partial<AdBreak>[]
  ): Promise<string> {
    const streamId = uuidv4();

    const stream = new StreamManifestModel({
      streamId,
      contentId,
      contentType,
      manifestType,
      originalManifestUrl,
      modifiedManifestUrl: '',
      adBreaks: adBreaks?.map(ab => ({
        id: uuidv4(),
        position: ab.position ?? 'midroll',
        offset: ab.offset,
        duration: ab.duration ?? 120,
        maxAds: ab.maxAds ?? 10,
        status: 'scheduled',
        insertedAds: [],
      })) ?? [],
      status: 'active',
    });

    await stream.save();

    await redisService.set(
      `${this.STREAM_CACHE_PREFIX}${streamId}`,
      { streamId, contentId, status: 'active' },
      this.CACHE_TTL
    );

    return streamId;
  }

  async getStream(streamId: string): Promise<typeof StreamManifestModel.prototype | null> {
    const cached = await redisService.get<{ streamId: string; contentId: string; status: string }>(
      `${this.STREAM_CACHE_PREFIX}${streamId}`
    );

    if (cached) {
      return StreamManifestModel.findOne({ streamId }).exec();
    }

    const stream = await StreamManifestModel.findOne({ streamId }).exec();

    if (stream) {
      await redisService.set(
        `${this.STREAM_CACHE_PREFIX}${streamId}`,
        { streamId: stream.streamId, contentId: stream.contentId, status: stream.status },
        this.CACHE_TTL
      );
    }

    return stream;
  }

  async processManifest(request: ManifestProcessRequest): Promise<ManifestProcessResponse> {
    const { contentUrl, contentType, manifestType, adBreaks } = request;

    const contentId = this.extractContentId(contentUrl);
    const streamId = await this.createStream(
      contentId,
      contentType,
      manifestType,
      contentUrl,
      adBreaks
    );

    const stream = await StreamManifestModel.findOne({ streamId }).exec();

    if (!stream) {
      throw new Error('Failed to create stream');
    }

    let totalAdDuration = 0;

    if (manifestType === 'hls') {
      await manifestService.processHLSManifest(
        contentUrl,
        stream.adBreaks,
        stream.slateUrl
      );
    } else {
      await manifestService.processDASHManifest(
        contentUrl,
        stream.adBreaks,
        stream.slateUrl
      );
    }

    for (const adBreak of stream.adBreaks) {
      totalAdDuration += adBreak.duration;
    }

    const modifiedUrl = manifestService.generateModifiedManifestUrl(streamId, manifestType);

    stream.modifiedManifestUrl = modifiedUrl;
    await stream.save();

    return {
      manifestUrl: modifiedUrl,
      adBreaks: stream.adBreaks,
      totalAdDuration,
      metadata: {
        contentId,
        processedAt: new Date(),
        cdnUrl: config.cdn.baseUrl,
      },
    };
  }

  async getModifiedManifest(streamId: string): Promise<string | null> {
    const stream = await StreamManifestModel.findOne({ streamId }).exec();

    if (!stream) {
      return null;
    }

    if (stream.modifiedManifestUrl) {
      return stream.modifiedManifestUrl;
    }

    await manifestService.processHLSManifest(
      stream.originalManifestUrl,
      stream.adBreaks,
      stream.slateUrl
    );

    const modifiedUrl = manifestService.generateModifiedManifestUrl(streamId, stream.manifestType);
    stream.modifiedManifestUrl = modifiedUrl;
    await stream.save();

    return modifiedUrl;
  }

 async spliceInsert(request: SpliceInsertRequest): Promise<AdBreak> {
    const { streamId, spliceEventId, breakDuration, startTime, assets } = request;

    const stream = await StreamManifestModel.findOne({ streamId }).exec();

    if (!stream) {
      throw new Error('Stream not found');
    }

    const adBreak: AdBreak = {
      id: uuidv4(),
      position: 'midroll',
      offset: startTime,
      duration: breakDuration,
      maxAds: assets?.length ?? 10,
      status: 'active',
      insertedAds: [],
      actualStartTime: new Date(),
    };

    if (assets) {
      for (let i = 0; i < assets.length; i++) {
        const ad: InsertedAd = {
          id: uuidv4(),
          adId: `ad-${spliceEventId}-${i}`,
          creativeUrl: assets[i] ?? '',
          duration: breakDuration / assets.length,
          offset: i * (breakDuration / assets.length),
          status: 'pending',
        };
        adBreak.insertedAds.push(ad);
      }
    }

    stream.adBreaks.push(adBreak);
    await stream.save();

    await redisService.set(
      `${this.AD_BREAK_CACHE_PREFIX}${adBreak.id}`,
      adBreak,
      this.CACHE_TTL
    );

    return adBreak;
  }

  async getAdBreak(streamId: string, adBreakId?: string): Promise<AdBreak | AdBreak[] | null> {
    const stream = await StreamManifestModel.findOne({ streamId }).exec();

    if (!stream) {
      return null;
    }

    if (adBreakId) {
      const adBreak = stream.adBreaks.find(ab => ab.id === adBreakId);
      return adBreak ?? null;
    }

    return stream.adBreaks;
  }

  async completeAdBreak(streamId: string, request: AdBreakCompleteRequest): Promise<AdBreak | null> {
    const { adBreakId, completedAds } = request;

    const stream = await StreamManifestModel.findOne({ streamId }).exec();

    if (!stream) {
      return null;
    }

    const adBreak = stream.adBreaks.find(ab => ab.id === adBreakId);

    if (!adBreak) {
      return null;
    }

    adBreak.status = 'completed';
    adBreak.actualEndTime = new Date();

    for (const ad of adBreak.insertedAds) {
      if (completedAds.includes(ad.id)) {
        ad.status = 'completed';
        ad.completedAt = new Date();
      }
    }

    await stream.save();

    await redisService.del(`${this.AD_BREAK_CACHE_PREFIX}${adBreakId}`);

    return adBreak;
  }

  async scheduleAdBreak(
    streamId: string,
    position: 'preroll' | 'midroll' | 'postroll',
    duration: number,
    offset?: number
  ): Promise<AdBreak> {
    const stream = await StreamManifestModel.findOne({ streamId }).exec();

    if (!stream) {
      throw new Error('Stream not found');
    }

    const adBreak: AdBreak = {
      id: uuidv4(),
      position,
      offset,
      duration,
      maxAds: 10,
      status: 'scheduled',
      insertedAds: [],
      scheduledTime: new Date(),
    };

    stream.adBreaks.push(adBreak);
    await stream.save();

    return adBreak;
  }

  async getSlateUrl(streamId: string): Promise<{ slateUrl: string; duration: number } | null> {
    const stream = await StreamManifestModel.findOne({ streamId }).exec();

    if (!stream) {
      return null;
    }

    const slateUrl = stream.slateUrl ?? `${config.cdn.baseUrl}/slate/default.mp4`;
    const duration = 10;

    return { slateUrl, duration };
  }

  async setSlateUrl(streamId: string, slateUrl: string): Promise<boolean> {
    const stream = await StreamManifestModel.findOneAndUpdate(
      { streamId },
      { slateUrl },
      { new: true }
    ).exec();

    return stream !== null;
  }

  async deactivateStream(streamId: string): Promise<boolean> {
    const stream = await StreamManifestModel.findOneAndUpdate(
      { streamId },
      { status: 'inactive' },
      { new: true }
    ).exec();

    if (stream) {
      await redisService.del(`${this.STREAM_CACHE_PREFIX}${streamId}`);
    }

    return stream !== null;
  }

  async getActiveStreams(): Promise<string[]> {
    const streams = await StreamManifestModel.find({ status: 'active' })
      .select('streamId')
      .exec();

    return streams.map(s => s.streamId);
  }

 async getActiveAdBreaksCount(): Promise<number> {
    const count = await StreamManifestModel.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$adBreaks' },
      { $match: { 'adBreaks.status': 'active' } },
      { $count: 'total' },
    ]).exec();

    return count[0]?.total ?? 0;
  }

  private extractContentId(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1]?.replace(/\.(m3u8|mpd)$/, '') ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

export const adInsertionService = new AdInsertionService();