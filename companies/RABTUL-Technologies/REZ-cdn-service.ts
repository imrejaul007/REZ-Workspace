/**
 * CDN Service - Asset Delivery
 */

const CDN_PREFIX = 'cdn:';
const ASSET_TTL = 86400 * 30; // 30 days

interface CDNAsset {
  id: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Upload asset
 */
export async function uploadAsset(
  file: Buffer,
  type: string,
  name: string
): Promise<CDNAsset> {
  const id = `asset_${Date.now()}`;
  const key = `${CDN_PREFIX}${id}`;

  await redis.setex(key, ASSET_TTL, JSON.stringify({
    id,
    data: file.toString('base64'),
    type,
    name,
    size: file.length,
    uploadedAt: new Date(),
  }));

  return {
    id,
    url: `/cdn/${id}`,
    type,
    size: file.length,
    uploadedAt: new Date(),
  };
}

/**
 * Get asset
 */
export async function getAsset(id: string): Promise<CDNAsset | null> {
  const stored = await redis.get(`${CDN_PREFIX}${id}`);
  if (!stored) return null;
  return JSON.parse(stored);
}

/**
 * Delete asset
 */
export async function deleteAsset(id: string): Promise<void> {
  await redis.del(`${CDN_PREFIX}${id}`);
}
