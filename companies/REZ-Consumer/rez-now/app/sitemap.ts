import { MetadataRoute } from 'next';

/**
 * Static sitemap for REZ Now.
 *
 * Dynamic store URLs (https://now.rez.money/{storeSlug}) are not listed here
 * because there is no public store-enumeration endpoint. They are indexed
 * naturally by search engines when users visit them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://now.rez.money/',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
