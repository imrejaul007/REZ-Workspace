// Utility functions

/**
 * Calculate the Haversine distance between two points in meters
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Generate a cache key for nearby apartment searches
 */
export function generateNearbyCacheKey(
  lat: number,
  lng: number,
  radius: number,
  filters?: Record<string, unknown>
): string {
  // Round coordinates to reduce cache fragmentation
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;
  const roundedRadius = Math.round(radius / 100) * 100; // Round to nearest 100m

  const filterStr = filters ? JSON.stringify(filters) : '';
  return `${roundedLat}:${roundedLng}:${roundedRadius}:${hashString(filterStr)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Calculate bounding box for a given point and radius
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusMeters: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const latDelta = radiusMeters / 111000; // ~111km per degree latitude
  const lngDelta = radiusMeters / (111000 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

/**
 * Format number with Indian number system (lakhs, crores)
 */
export function formatIndianNumber(num: number): string {
  if (num < 1000) return num.toString();

  const str = num.toString();
  const lastThree = str.substring(str.length - 3);
  const rest = str.substring(0, str.length - 3);

  const formatted =
    rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;

  return formatted;
}

/**
 * Calculate income level based on various factors
 */
export function inferIncomeLevel(
  avgRent?: number,
  flatSize?: number,
  amenities?: string[]
): 'low' | 'middle' | 'upper_middle' | 'high' {
  let score = 0;

  if (avgRent) {
    if (avgRent > 50000) score += 3;
    else if (avgRent > 30000) score += 2;
    else if (avgRent > 15000) score += 1;
  }

  if (flatSize) {
    if (flatSize > 2000) score += 3;
    else if (flatSize > 1500) score += 2;
    else if (flatSize > 1000) score += 1;
  }

  if (amenities) {
    const premiumAmenities = ['pool', 'gym', 'clubhouse', 'tennis', 'golf', 'spa'];
    const premiumCount = amenities.filter((a) =>
      premiumAmenities.includes(a.toLowerCase())
    ).length;
    score += premiumCount;
  }

  if (score >= 5) return 'high';
  if (score >= 3) return 'upper_middle';
  if (score >= 1) return 'middle';
  return 'low';
}

/**
 * Estimate devices per household based on income level
 */
export function estimateDevicesPerHousehold(
  incomeLevel: 'low' | 'middle' | 'upper_middle' | 'high'
): number {
  switch (incomeLevel) {
    case 'high':
      return 6;
    case 'upper_middle':
      return 4;
    case 'middle':
      return 3;
    case 'low':
      return 2;
    default:
      return 2;
  }
}

/**
 * Generate slug from apartment name
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}