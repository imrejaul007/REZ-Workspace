import Script from 'next/script'

/**
 * Organization Schema Component
 *
 * Adds JSON-LD structured data for Organization to improve SEO.
 * This enables rich search results in Google.
 *
 * CRITICAL SEO FIX: Previously no structured data was present,
 * causing missed opportunities for rich snippets.
 */
export default function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AdBazaar',
    description:
      "India's closed-loop ad marketplace. Find, book, and track billboard and retail ad spaces with QR attribution via REZ.",
    url: 'https://adbazaar.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://adbazaar.com/logo.png',
      width: 512,
      height: 512,
    },
    image: 'https://adbazaar.com/og-image.png',
    sameAs: [
      'https://twitter.com/rezmoney',
      'https://www.linkedin.com/company/rezmoney',
      'https://www.instagram.com/rezmoney',
      'https://www.facebook.com/rezmoney',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English', 'Hindi'],
      areaServed: 'IN',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    foundingDate: '2024',
    parentOrganization: {
      '@type': 'Organization',
      name: 'REZ',
      url: 'https://rez.money',
    },
  }

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
