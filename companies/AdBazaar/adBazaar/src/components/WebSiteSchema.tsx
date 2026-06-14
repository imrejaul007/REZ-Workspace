import Script from 'next/script'

/**
 * WebSite Schema Component
 *
 * Adds JSON-LD structured data for WebSite with search action.
 * This enables search box functionality in Google search results.
 *
 * CRITICAL SEO FIX: Previously no website structured data was present.
 */
export default function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AdBazaar',
    url: 'https://adbazaar.com',
    description:
      "India's closed-loop ad marketplace. Find, book, and track billboard and retail ad spaces with QR attribution via REZ.",
    inLanguage: 'en-IN',
    isAccessibleForFree: 'True',
    about: {
      '@type': 'Thing',
      name: 'Advertising marketplace',
      description: 'Buy and sell advertising space across India',
    },
    audience: {
      '@type': 'Audience',
      name: 'Advertisers and publishers in India',
    },
    publisher: {
      '@type': 'Organization',
      name: 'REZ',
      url: 'https://rez.money',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://adbazaar.com/browse?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
