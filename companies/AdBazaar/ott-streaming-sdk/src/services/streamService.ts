import { StreamAsset } from '../models/index.js';
import { config } from '../config/index.js';
import { getRedisClient } from '../config/redis.js';
import type { StreamAsset as IStreamAsset, StreamResponse } from '../types/index.js';

interface CDNConfig {
  primary: string;
  fallback: string[];
  regions: Record<string, string>;
}

const cdnConfig: CDNConfig = {
  primary: config.cdn.baseUrl,
  fallback: [
    'https://cdn1.adbazaar.com',
    'https://cdn2.adbazaar.com',
  ],
  regions: {
    'ap-south-1': 'https://cdn-ap-south.adbazaar.com',
    'us-east-1': 'https://cdn-us-east.adbazaar.com',
    'eu-west-1': 'https://cdn-eu-west.adbazaar.com',
  },
};

function selectCDN(deviceRegion?: string): string {
  if (deviceRegion && cdnConfig.regions[deviceRegion]) {
    return cdnConfig.regions[deviceRegion];
  }
  return cdnConfig.primary;
}

function generateStreamUrls(
  contentId: string,
  cdn: string
): IStreamAsset['streams'] {
  const qualities = [
    { quality: '4K', bitrate: 15000000, suffix: '4k' },
    { quality: '1080p', bitrate: 5000000, suffix: '1080p' },
    { quality: '720p', bitrate: 2500000, suffix: '720p' },
    { quality: '480p', bitrate: 1000000, suffix: '480p' },
    { quality: '360p', bitrate: 500000, suffix: '360p' },
  ];

  const streams: IStreamAsset['streams'] = [];

  for (const q of qualities) {
    // HLS streams
    streams.push({
      url: `${cdn}/streams/${contentId}/${q.suffix}/master.m3u8`,
      type: 'hls',
      quality: q.quality,
      bitrate: q.bitrate,
    });

    // DASH streams
    streams.push({
      url: `${cdn}/streams/${contentId}/${q.suffix}/manifest.mpd`,
      type: 'dash',
      quality: q.quality,
      bitrate: q.bitrate,
    });
  }

  return streams;
}

export async function getStreamAsset(
  contentId: string,
  deviceRegion?: string
): Promise<StreamResponse | null> {
  // Try cache first
  const redis = await getRedisClient();
  const cached = await redis.get(`stream:${contentId}`);

  if (cached) {
    return JSON.parse(cached);
  }

  // Query database
  let asset = await StreamAsset.findOne({ contentId });

  if (!asset) {
    // Create mock asset for demo purposes
    const cdn = selectCDN(deviceRegion);
    asset = await StreamAsset.create({
      contentId,
      title: `Content ${contentId}`,
      duration: 3600,
      streams: generateStreamUrls(contentId, cdn),
      thumbnail: `${cdn}/thumbnails/${contentId}/poster.jpg`,
      drm: {
        widevine: true,
        fairplay: true,
      },
      cdn,
    });
  }

  const response: StreamResponse = {
    contentId: asset.contentId,
    streams: asset.streams,
    drm: asset.drm,
  };

  // Cache for 1 hour
  await redis.setEx(`stream:${contentId}`, 3600, JSON.stringify(response));

  return response;
}

export async function getStreamAssetById(
  contentId: string
): Promise<IStreamAsset | null> {
  return StreamAsset.findOne({ contentId });
}

export async function createStreamAsset(
  data: Omit<IStreamAsset, 'createdAt' | 'updatedAt'>
): Promise<IStreamAsset> {
  const asset = await StreamAsset.create(data);

  // Invalidate cache
  const redis = await getRedisClient();
  await redis.del(`stream:${data.contentId}`);

  return asset;
}

export async function updateStreamAsset(
  contentId: string,
  updates: Partial<IStreamAsset>
): Promise<IStreamAsset | null> {
  const asset = await StreamAsset.findOneAndUpdate(
    { contentId },
    { $set: updates },
    { new: true }
  );

  if (asset) {
    // Invalidate cache
    const redis = await getRedisClient();
    await redis.del(`stream:${contentId}`);
  }

  return asset;
}

export async function deleteStreamAsset(contentId: string): Promise<boolean> {
  const result = await StreamAsset.deleteOne({ contentId });

  // Invalidate cache
  const redis = await getRedisClient();
  await redis.del(`stream:${contentId}`);

  return result.deletedCount > 0;
}

export async function getManifest(
  contentId: string,
  quality: string = '1080p',
  type: 'hls' | 'dash' = 'hls'
): Promise<{ manifestUrl: string; expiresAt: string } | null> {
  const asset = await getStreamAsset(contentId);

  if (!asset) {
    return null;
  }

  const stream = asset.streams.find(
    (s) => s.quality === quality && s.type === type
  );

  if (!stream) {
    return null;
  }

  const expiresAt = new Date(Date.now() + config.streaming.manifestTTL * 1000);

  return {
    manifestUrl: stream.url,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getAllStreamAssets(
  limit: number = 50,
  offset: number = 0
): Promise<IStreamAsset[]> {
  return StreamAsset.find({})
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);
}

export async function searchStreamAssets(
  query: string
): Promise<IStreamAsset[]> {
  return StreamAsset.find({
    $or: [
      { contentId: { $regex: query, $options: 'i' } },
      { title: { $regex: query, $options: 'i' } },
    ],
  }).limit(20);
}