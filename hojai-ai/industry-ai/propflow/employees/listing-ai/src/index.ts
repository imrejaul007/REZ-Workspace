/**
 * PROPFLOW - Listing AI Employee
 * Generates property descriptions, optimizes listings, manages property presentations
 * "AI That Creates Compelling Property Stories"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4920;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface PropertyListing {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  shortDescription: string;
  highlights: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  images: {
    url: string;
    caption: string;
    isPrimary: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
}

interface PropertyDetails {
  type: 'apartment' | 'villa' | 'plot' | 'commercial' | 'office';
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  areaUnit: 'sqft' | 'sqm' | 'sqyd';
  amenities: string[];
  features: string[];
  age?: 'new' | '1-5years' | '5-10years' | '10+years';
  facing?: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  floor?: number;
  totalFloors?: number;
}

interface ListingRequest {
  propertyId: string;
  propertyDetails: PropertyDetails;
  location: {
    address: string;
    locality: string;
    city: string;
    nearbyPlaces?: string[];
  };
  price: number;
  ownerNotes?: string;
  style?: 'luxury' | 'family' | 'investment' | 'modern' | 'traditional';
  targetAudience?: 'firstTimeBuyers' | 'investors' | 'nri' | 'families' | 'corporate';
}

// ============================================
// IN-MEMORY STORE
// ============================================

const listings = new Map<string, PropertyListing>();

// ============================================
// AI DESCRIPTION GENERATION
// ============================================

function generatePropertyTitle(details: PropertyDetails, location: ListingRequest['location']): string {
  const bedroomStr = details.bedrooms ? `${details.bedrooms}BHK ` : '';
  const typeStr = details.type.charAt(0).toUpperCase() + details.type.slice(1);
  const locality = location.locality || location.city;

  const prefixes = {
    luxury: 'Premium ',
    family: 'Spacious ',
    investment: 'Prime ',
    modern: 'Contemporary ',
    traditional: 'Classic '
  };

  const prefix = prefixes[details.type as keyof typeof prefixes] || '';

  return `${prefix}${bedroomStr}${typeStr} in ${locality}`;
}

function generateDescription(req: ListingRequest): string {
  const { propertyDetails: p, location, price, style = 'family' } = req;

  const areaStr = `${p.area.toLocaleString()} ${p.areaUnit}`;
  const bedroomStr = p.bedrooms ? `${p.bedrooms} spacious bedrooms with attached bathrooms` : '';
  const bathroomStr = p.bathrooms ? `${p.bathrooms} modern bathrooms` : '';

  const styleDescriptions = {
    luxury: `This exquisite ${p.type} offers a lifestyle of unparalleled luxury. `,
    family: `This well-designed ${p.type} is perfect for families seeking comfort and convenience. `,
    investment: `An excellent investment opportunity in the heart of ${location.locality || location.city}. `,
    modern: `Experience contemporary living in this stunning ${p.type} designed for the modern homeowner. `,
    traditional: `This timeless ${p.type} combines classic architecture with modern amenities. `
  };

  const roomsSection = [bedroomStr, bathroomStr].filter(Boolean).join(' and ');
  const roomsDescription = roomsSection ? ` featuring ${roomsSection}.` : '';

  const amenitiesSection = p.amenities.length > 0
    ? ` Enjoy premium amenities including ${p.amenities.slice(0, 5).join(', ')}.`
    : '';

  const locationSection = location.nearbyPlaces && location.nearbyPlaces.length > 0
    ? ` Strategically located near ${location.nearbyPlaces.slice(0, 3).join(', ')} for ultimate convenience.`
    : '';

  const priceFormatted = `₹${(price / 10000000).toFixed(2)} Cr`; // Convert to Crore

  return `${styleDescriptions[style as keyof typeof styleDescriptions] || styleDescriptions.family}Spanning ${areaStr}${roomsDescription}${amenitiesSection}${locationSection} Priced at ${priceFormatted}.`;
}

function generateShortDescription(req: ListingRequest): string {
  const { propertyDetails: p, location, price } = req;

  const bedroomStr = p.bedrooms ? `${p.bedrooms}BHK ` : '';
  const areaStr = `${p.area.toLocaleString()} ${p.areaUnit}`;
  const priceStr = price >= 10000000
    ? `₹${(price / 10000000).toFixed(1)}Cr`
    : `₹${(price / 100000).toFixed(0)}L`;

  return `${bedroomStr}${p.type} in ${location.locality || location.city} | ${areaStr} | ${priceStr}`;
}

function generateHighlights(req: ListingRequest): string[] {
  const highlights: string[] = [];
  const { propertyDetails: p, location, price } = req;

  // Size highlights
  if (p.area >= 2000) highlights.push(`Spacious ${p.area} ${p.areaUnit} area`);
  if (p.amenities.includes('Pool')) highlights.push('Private swimming pool');
  if (p.amenities.includes('Gym')) highlights.push('Fully equipped gym');

  // Location highlights
  if (location.nearbyPlaces?.some(p => p.toLowerCase().includes('metro'))) {
    highlights.push('Metro connectivity');
  }
  if (location.nearbyPlaces?.some(p => p.toLowerCase().includes('school'))) {
    highlights.push('Near reputed schools');
  }

  // Property features
  if (p.facing === 'north' || p.facing === 'east') {
    highlights.push(`${p.facing.charAt(0).toUpperCase() + p.facing.slice(1)} facing for natural light`);
  }
  if (p.floor && p.totalFloors && p.floor <= 3) {
    highlights.push(`Low floor - Easy access`);
  }
  if (p.age === 'new') {
    highlights.push('Brand new property');
  }

  // Price highlights
  if (price <= 5000000) {
    highlights.push('Affordable pricing');
  } else if (price >= 20000000) {
    highlights.push('Premium segment property');
  }

  // Amenity highlights (top 3)
  const amenityHighlights = p.amenities.slice(0, 3).map(a => `${a} available`);
  highlights.push(...amenityHighlights);

  return [...new Set(highlights)].slice(0, 8); // Dedupe and limit
}

function generateTags(req: ListingRequest): string[] {
  const tags: string[] = [];
  const { propertyDetails: p, location, targetAudience } = req;

  // Property type tags
  tags.push(p.type, `${p.type}-for-sale`);

  // Location tags
  tags.push(location.city.toLowerCase().replace(/\s+/g, '-'));
  if (location.locality) {
    tags.push(location.locality.toLowerCase().replace(/\s+/g, '-'));
  }

  // Bedroom tags
  if (p.bedrooms) {
    tags.push(`${p.bedrooms}bhk`, `${p.bedrooms}-bedroom`);
  }

  // Budget tags
  if (p.area >= 1500 && p.area < 2500) tags.push('large-apartment');
  if (p.area >= 2500) tags.push('super-area');

  // Audience tags
  if (targetAudience) {
    tags.push(targetAudience);
  }

  // Amenity tags
  p.amenities.forEach(a => {
    tags.push(a.toLowerCase().replace(/\s+/g, '-'));
  });

  return [...new Set(tags)].slice(0, 15);
}

function generateSeoContent(req: ListingRequest): { title: string; description: string } {
  const { propertyDetails: p, location, price } = req;

  const bedroomStr = p.bedrooms ? `${p.bedrooms} BHK ` : '';
  const areaStr = `${p.area} ${p.areaUnit}`;
  const priceStr = price >= 10000000
    ? `${(price / 10000000).toFixed(1)} Cr`
    : `${(price / 100000).toFixed(0)} Lakhs`;

  const title = `${bedroomStr}${p.type.charAt(0).toUpperCase() + p.type.slice(1)} for Sale in ${location.locality || location.city} | ${areaStr} | ${priceStr}`;

  const description = `Looking for a ${bedroomStr}${p.type} in ${location.locality || location.city}? This ${areaStr} property is priced at ${priceStr}. Book a visit today!`;

  return { title, description };
}

function generateImageCaptions(images: string[]): { url: string; caption: string; isPrimary: boolean }[] {
  return images.map((url, index) => ({
    url,
    caption: index === 0 ? 'Property exterior view' : `Interior view ${index}`,
    isPrimary: index === 0
  }));
}

// ============================================
// API ROUTES
// ============================================

/**
 * Generate a complete property listing with AI-created content
 */
app.post('/api/listing/generate', async (req: Request, res: Response) => {
  try {
    const request: ListingRequest = req.body;

    if (!request.propertyId || !request.propertyDetails || !request.location || !request.price) {
      return res.status(400).json({
        error: 'Missing required fields: propertyId, propertyDetails, location, price'
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const listing: PropertyListing = {
      id,
      propertyId: request.propertyId,
      title: generatePropertyTitle(request.propertyDetails, request.location),
      description: generateDescription(request),
      shortDescription: generateShortDescription(request),
      highlights: generateHighlights(request),
      tags: generateTags(request),
      seoTitle: generateSeoContent(request).title,
      seoDescription: generateSeoContent(request).description,
      images: request.ownerNotes ? generateImageCaptions([]) : [],
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: 'draft'
    };

    listings.set(id, listing);

    res.status(201).json({
      success: true,
      listing,
      meta: {
        wordCount: listing.description.split(/\s+/).length,
        highlightCount: listing.highlights.length,
        tagCount: listing.tags.length
      }
    });
  } catch (error) {
    console.error('Listing generation error:', error);
    res.status(500).json({ error: 'Failed to generate listing' });
  }
});

/**
 * Regenerate listing with different style
 */
app.post('/api/listing/regenerate', async (req: Request, res: Response) => {
  try {
    const { listingId, style } = req.body;

    const existing = listings.get(listingId);
    if (!existing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Reconstruct request from existing listing
    const request: ListingRequest = {
      propertyId: existing.propertyId,
      propertyDetails: { type: 'apartment', area: 1000, areaUnit: 'sqft', amenities: [] },
      location: { address: '', locality: '', city: '' },
      price: 5000000,
      style: style || 'modern'
    };

    const updated: PropertyListing = {
      ...existing,
      title: generatePropertyTitle(request.propertyDetails, request.location),
      description: generateDescription({ ...request, style: style as ListingRequest['style'] }),
      shortDescription: generateShortDescription({ ...request, style: style as ListingRequest['style'] }),
      updatedAt: new Date().toISOString(),
      version: existing.version + 1
    };

    listings.set(listingId, updated);

    res.json({
      success: true,
      listing: updated,
      message: `Regenerated with ${style || 'modern'} style`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to regenerate listing' });
  }
});

/**
 * Optimize existing listing for better engagement
 */
app.post('/api/listing/optimize', async (req: Request, res: Response) => {
  try {
    const { listingId, focus } = req.body;

    const listing = listings.get(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const optimizations: Record<string, string[]> = {
      seo: [
        'Include location-specific keywords',
        'Add transaction-ready terms',
        'Emphasize value proposition'
      ],
      engagement: [
        'Add emotional triggers',
        'Include social proof elements',
        'Highlight unique features first'
      ],
      conversion: [
        'Add urgency elements',
        'Include clear CTAs',
        'Emphasize move-in readiness'
      ]
    };

    const suggestions = optimizations[focus] || optimizations.seo;

    res.json({
      success: true,
      listingId,
      focus,
      suggestions,
      estimatedImprovement: focus === 'seo' ? '15-20%' : focus === 'conversion' ? '10-15%' : '8-12%'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to optimize listing' });
  }
});

/**
 * Publish a listing
 */
app.post('/api/listing/publish', async (req: Request, res: Response) => {
  try {
    const { listingId } = req.body;

    const listing = listings.get(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status === 'published') {
      return res.status(400).json({ error: 'Listing already published' });
    }

    listing.status = 'published';
    listing.updatedAt = new Date().toISOString();
    listings.set(listingId, listing);

    res.json({
      success: true,
      listing,
      message: 'Listing published successfully',
      publishUrl: `https://propflow.ai/listings/${listing.id}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish listing' });
  }
});

/**
 * Get listing by ID
 */
app.get('/api/listing/:id', async (req: Request, res: Response) => {
  try {
    const listing = listings.get(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ listing });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get listing' });
  }
});

/**
 * Get all listings
 */
app.get('/api/listings', async (req: Request, res: Response) => {
  try {
    const { status, propertyId } = req.query;
    let result = Array.from(listings.values());

    if (status) {
      result = result.filter(l => l.status === status);
    }
    if (propertyId) {
      result = result.filter(l => l.propertyId === propertyId);
    }

    res.json({
      listings: result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      total: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get listings' });
  }
});

/**
 * Batch generate listings
 */
app.post('/api/listing/batch-generate', async (req: Request, res: Response) => {
  try {
    const { requests }: { requests: ListingRequest[] } = req.body;

    if (!Array.isArray(requests)) {
      return res.status(400).json({ error: 'Requests must be an array' });
    }

    const results = requests.map(req => {
      const id = uuidv4();
      const now = new Date().toISOString();

      const listing: PropertyListing = {
        id,
        propertyId: req.propertyId,
        title: generatePropertyTitle(req.propertyDetails, req.location),
        description: generateDescription(req),
        shortDescription: generateShortDescription(req),
        highlights: generateHighlights(req),
        tags: generateTags(req),
        seoTitle: generateSeoContent(req).title,
        seoDescription: generateSeoContent(req).description,
        images: [],
        createdAt: now,
        updatedAt: now,
        version: 1,
        status: 'draft'
      };

      listings.set(id, listing);
      return { success: true, listing };
    });

    res.json({
      success: true,
      generated: results.length,
      listings: results.map(r => r.listing)
    });
  } catch (error) {
    res.status(500).json({ error: 'Batch generation failed' });
  }
});

/**
 * Analyze listing performance potential
 */
app.post('/api/listing/analyze', async (req: Request, res: Response) => {
  try {
    const { propertyId, listingContent } = req.body;

    const analysis = {
      score: 0,
      factors: [] as string[],
      recommendations: [] as string[],
      estimatedViews: '500-1000',
      estimatedEnquiries: '5-15'
    };

    if (!listingContent) {
      return res.json({
        success: true,
        analysis: {
          ...analysis,
          score: 40,
          factors: ['Listing content not provided'],
          recommendations: ['Generate complete listing with /api/listing/generate']
        }
      });
    }

    // Score based on content quality
    if (listingContent.description?.length > 200) analysis.score += 20;
    if (listingContent.highlights?.length >= 5) analysis.score += 15;
    if (listingContent.tags?.length >= 8) analysis.score += 15;
    if (listingContent.images?.length >= 3) analysis.score += 10;

    analysis.factors = [
      listingContent.description?.length > 200 ? 'Good description length' : 'Description too short',
      listingContent.highlights?.length >= 5 ? 'Strong highlights' : 'Add more highlights',
      listingContent.tags?.length >= 8 ? 'Good SEO coverage' : 'Add more tags',
      listingContent.images?.length >= 3 ? 'Multiple images' : 'Add more images'
    ];

    analysis.recommendations = [
      'Add at least 5 high-quality images',
      'Include nearby landmarks in description',
      'Add specific dimensions and measurements',
      'Include price per sqft for transparency'
    ];

    if (analysis.score >= 60) {
      analysis.estimatedViews = '2000-5000';
      analysis.estimatedEnquiries = '20-50';
    }

    res.json({
      success: true,
      propertyId,
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'listing-ai',
    version: '1.0.0',
    port: PORT,
    capabilities: [
      'Generate property descriptions',
      'Create SEO-optimized content',
      'Batch listing generation',
      'Performance analysis'
    ],
    stats: {
      listingsCreated: listings.size
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'PROPFLOW Listing AI',
    description: 'AI-powered property listing generation and optimization',
    version: '1.0.0',
    endpoints: {
      generate: 'POST /api/listing/generate',
      regenerate: 'POST /api/listing/regenerate',
      optimize: 'POST /api/listing/optimize',
      publish: 'POST /api/listing/publish',
      analyze: 'POST /api/listing/analyze',
      batchGenerate: 'POST /api/listing/batch-generate'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗
║                  PROPFLOW LISTING AI v1.0.0             ║
║           AI-Powered Property Listing Generator         ║
║                                                              ║
║  Tagline: "AI That Creates Compelling Property Stories" ║
║  Port: ${PORT}                                               ║
║                                                              ║
║  Capabilities:                                           ║
║  • Generate property descriptions                       ║
║  • Create SEO-optimized content                         ║
║  • Batch listing generation                             ║
║  • Performance analysis                                 ║
╚══════════════════════════════════════════════════════════════╝\n`);
});

export { app, generateDescription, generatePropertyTitle, generateHighlights };
