import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface ImageOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg';
}

export class CDNImageService {
  async upload(file: Buffer | string, folder: string): Promise<string> {
    const result = await cloudinary.v2.uploader.upload(file, {
      folder: `rez/${folder}`,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    return result.secure_url;
  }

  getOptimizedUrl(url: string, options: ImageOptions = {}): string {
    if (!url || !url.includes('cloudinary.com')) return url;

    const transforms: string[] = [];
    if (options.width) transforms.push(`w_${options.width}`);
    if (options.height) transforms.push(`h_${options.height}`);
    if (options.crop) transforms.push(`c_${options.crop}`);
    if (options.quality) transforms.push(`q_${options.quality}`);
    if (options.format) transforms.push(`f_${options.format}`);

    if (transforms.length === 0) return url;

    // Insert transforms into Cloudinary URL
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const baseUrl = url.substring(0, uploadIndex + 8);
    const path = url.substring(uploadIndex + 8);
    return `${baseUrl}${transforms.join(',')}/${path}`;
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.v2.uploader.destroy(publicId);
  }
}
