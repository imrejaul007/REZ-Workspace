/**
 * Map Intelligence Module
 *
 * Geographic visualization and territory mapping for GTM
 * Features:
 * - Territory visualization
 * - Prospect heatmaps
 * - Route optimization
 * - Geo-based targeting
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Configuration
const mapConfig = {
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || null,
  mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || null,
  hereApiKey: process.env.HERE_API_KEY || null
};

// In-memory storage
const territories = new Map();
const heatmaps = new Map();
const routes = new Map();

/**
 * Get coordinates for an address
 */
async function geocodeAddress(address) {
  if (mapConfig.googleMapsApiKey) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: mapConfig.googleMapsApiKey
        }
      });

      if (response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted: result.formatted_address,
          components: result.address_components
        };
      }
    } catch (error) {
      console.error('Google Geocoding error:', error.message);
    }
  }

  // Fallback to mock data
  return {
    lat: 28.6139 + (Math.random() - 0.5) * 10,
    lng: 77.2090 + (Math.random() - 0.5) * 10,
    formatted: address,
    components: [],
    mock: true
  };
}

/**
 * Get coordinates for a domain/company
 */
async function geocodeDomain(domain) {
  // In real implementation, would use Clearbit or similar
  // For now, return mock data
  const indiaLocations = [
    { lat: 28.6139, lng: 77.2090, city: 'Delhi' },
    { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
    { lat: 12.9716, lng: 77.5946, city: 'Bangalore' },
    { lat: 28.5355, lng: 77.2100, city: 'Noida' },
    { lat: 17.3850, lng: 78.4867, city: 'Hyderabad' },
    { lat: 13.0827, lng: 80.2707, city: 'Chennai' }
  ];

  const location = indiaLocations[Math.floor(Math.random() * indiaLocations.length)];
  return {
    domain,
    ...location,
    address: `${domain}, ${location.city}, India`,
    mock: true
  };
}

/**
 * Calculate distance between two points
 */
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Find nearby prospects within radius
 */
function findNearbyProspects(center, prospects, radiusKm = 50) {
  return prospects
    .map(p => ({
      ...p,
      distance: calculateDistance(center, { lat: p.lat, lng: p.lng })
    }))
    .filter(p => p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Create territory polygon
 */
function createTerritoryPolygon(territoryId, points) {
  const polygon = {
    id: uuidv4(),
    territoryId,
    type: 'polygon',
    coordinates: points.map(p => [p.lng, p.lat]),
    center: calculateCenter(points),
    area: calculatePolygonArea(points)
  };

  territories.set(polygon.id, polygon);
  return polygon;
}

/**
 * Calculate center of polygon
 */
function calculateCenter(points) {
  const sum = points.reduce((acc, p) => ({
    lat: acc.lat + p.lat,
    lng: acc.lng + p.lng
  }), { lat: 0, lng: 0 });

  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length
  };
}

/**
 * Calculate polygon area (simplified)
 */
function calculatePolygonArea(points) {
  // Simplified Shoelace formula
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].lng * points[j].lat;
    area -= points[j].lng * points[i].lat;
  }

  return Math.abs(area / 2) * 111; // Approximate conversion to km²
}

/**
 * Check if point is inside polygon
 */
function isPointInPolygon(point, polygon) {
  const coords = polygon.coordinates;
  let inside = false;

  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0], yi = coords[i][1];
    const xj = coords[j][0], yj = coords[j][1];

    if (((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Generate heatmap data for prospects
 */
function generateHeatmap(prospects, options = {}) {
  const {
    radius = 20,
    intensity = 1,
    gridSize = 50
  } = options;

  const heatmap = {
    id: uuidv4(),
    points: [],
    bounds: { min: { lat: 90, lng: 180 }, max: { lat: -90, lng: -180 } },
    grid: [],
    stats: {
      totalPoints: prospects.length,
      density: 0,
      hotspots: []
    },
    createdAt: new Date().toISOString()
  };

  // Calculate bounds
  prospects.forEach(p => {
    if (p.lat && p.lng) {
      heatmap.bounds.min.lat = Math.min(heatmap.bounds.min.lat, p.lat);
      heatmap.bounds.min.lng = Math.min(heatmap.bounds.min.lng, p.lng);
      heatmap.bounds.max.lat = Math.max(heatmap.bounds.max.lat, p.lat);
      heatmap.bounds.max.lng = Math.max(heatmap.bounds.max.lng, p.lng);
    }
  });

  // Create grid
  const latStep = (heatmap.bounds.max.lat - heatmap.bounds.min.lat) / gridSize;
  const lngStep = (heatmap.bounds.max.lng - heatmap.bounds.min.lng) / gridSize;

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const gridLat = heatmap.bounds.min.lat + i * latStep;
      const gridLng = heatmap.bounds.min.lng + j * lngStep;

      // Count prospects in radius
      let count = 0;
      prospects.forEach(p => {
        if (p.lat && p.lng) {
          const dist = calculateDistance(
            { lat: gridLat, lng: gridLng },
            { lat: p.lat, lng: p.lng }
          );
          if (dist <= radius) {
            count += intensity;
          }
        }
      });

      if (count > 0) {
        heatmap.grid.push({
          lat: gridLat,
          lng: gridLng,
          value: count,
          weight: Math.min(count / 10, 1)
        });
      }
    }
  }

  // Find hotspots (top 5 density areas)
  heatmap.grid.sort((a, b) => b.value - a.value);
  heatmap.stats.hotspots = heatmap.grid.slice(0, 5).map(h => ({
    lat: h.lat,
    lng: h.lng,
    intensity: h.value
  }));

  heatmaps.set(heatmap.id, heatmap);
  return heatmap;
}

/**
 * Optimize route between multiple stops
 */
function optimizeRoute(stops, options = {}) {
  const { start = null, end = null, maxDistance = null } = options;

  if (stops.length < 2) {
    return { route: stops, totalDistance: 0 };
  }

  // Simple nearest neighbor algorithm
  const route = [];
  const remaining = [...stops];
  let current = start || remaining.shift();
  let totalDistance = 0;

  while (remaining.length > 0) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const stop of remaining) {
      const dist = calculateDistance(current, stop);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = stop;
      }
    }

    if (maxDistance && totalDistance + nearestDist > maxDistance) {
      break;
    }

    route.push(nearest);
    totalDistance += nearestDist;
    current = nearest;
    remaining.splice(remaining.indexOf(nearest), 1);
  }

  if (end && route.length > 0) {
    totalDistance += calculateDistance(route[route.length - 1], end);
  }

  return {
    route,
    totalDistance,
    estimatedTime: Math.round(totalDistance * 2), // Assume 2 min per km
    waypoints: route.map((s, i) => ({ order: i + 1, ...s }))
  };
}

/**
 * Create territory map visualization data
 */
function createTerritoryMap(territoryId, prospects) {
  const territory = Array.from(territories.values())
    .find(t => t.territoryId === territoryId);

  if (!territory) {
    return { error: 'Territory not found' };
  }

  const assignedProspects = prospects.filter(p =>
    isPointInPolygon({ lat: p.lat, lng: p.lng }, territory)
  );

  return {
    territory: {
      id: territory.id,
      name: territory.name,
      polygon: territory.coordinates.map(c => ({ lat: c[1], lng: c[0] })),
      center: territory.center,
      area: territory.area
    },
    prospects: assignedProspects.map(p => ({
      id: p.id,
      company: p.company,
      lat: p.lat,
      lng: p.lng,
      score: p.score
    })),
    stats: {
      totalProspects: assignedProspects.length,
      avgScore: assignedProspects.reduce((a, b) => a + (b.score || 0), 0) / assignedProspects.length || 0
    }
  };
}

/**
 * Generate GeoJSON for map visualization
 */
function toGeoJSON(data, type = 'points') {
  if (type === 'points') {
    return {
      type: 'FeatureCollection',
      features: data.map(p => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat]
        },
        properties: {
          id: p.id,
          name: p.company || p.name,
          score: p.score,
          status: p.status
        }
      }))
    };
  }

  if (type === 'polygon') {
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [data.coordinates]
        },
        properties: {
          id: data.id,
          name: data.name,
          area: data.area
        }
      }]
    };
  }

  return { type: 'FeatureCollection', features: [] };
}

/**
 * Calculate optimal territory boundaries
 */
function calculateOptimalBoundaries(prospects, numTerritories = 3) {
  // Simple clustering by geographic regions
  const bounds = {
    north: Math.max(...prospects.filter(p => p.lat).map(p => p.lat)),
    south: Math.min(...prospects.filter(p => p.lat).map(p => p.lat)),
    east: Math.max(...prospects.filter(p => p.lng).map(p => p.lng)),
    west: Math.min(...prospects.filter(p => p.lng).map(p => p.lng))
  };

  const territories = [];
  const latStep = (bounds.north - bounds.south) / Math.ceil(Math.sqrt(numTerritories));
  const lngStep = (bounds.east - bounds.west) / Math.ceil(Math.sqrt(numTerritories));

  let idx = 0;
  for (let lat = bounds.south; lat < bounds.north && idx < numTerritories; lat += latStep) {
    for (let lng = bounds.west; lng < bounds.east && idx < numTerritories; lng += lngStep) {
      const polygon = [
        [lng, lat],
        [lng + lngStep, lat],
        [lng + lngStep, lat + latStep],
        [lng, lat + latStep],
        [lng, lat]
      ];

      territories.push({
        id: uuidv4(),
        name: `Territory ${idx + 1}`,
        bounds: { north: lat + latStep, south: lat, east: lng + lngStep, west: lng },
        polygon,
        center: { lat: lat + latStep / 2, lng: lng + lngStep / 2 },
        area: calculatePolygonArea(polygon.map(c => ({ lat: c[1], lng: c[0] })))
      });

      idx++;
    }
  }

  return territories;
}

/**
 * Get timezone for coordinates
 */
function getTimezone(lat, lng) {
  // Simplified timezone mapping for India
  return {
    timezone: 'Asia/Kolkata',
    offset: '+05:30',
    city: 'India'
  };
}

/**
 * Enrich prospects with geo data
 */
async function enrichWithGeo(prospects) {
  const enriched = [];

  for (const prospect of prospects) {
    let geoData = {
      lat: prospect.lat,
      lng: prospect.lng
    };

    if (!geoData.lat || !geoData.lng) {
      if (prospect.domain) {
        geoData = await geocodeDomain(prospect.domain);
      } else if (prospect.company) {
        geoData = await geocodeAddress(prospect.company);
      }
    }

    enriched.push({
      ...prospect,
      ...geoData,
      timezone: getTimezone(geoData.lat, geoData.lng)
    });
  }

  return enriched;
}

module.exports = {
  geocodeAddress,
  geocodeDomain,
  calculateDistance,
  findNearbyProspects,
  createTerritoryPolygon,
  isPointInPolygon,
  generateHeatmap,
  optimizeRoute,
  createTerritoryMap,
  toGeoJSON,
  calculateOptimalBoundaries,
  enrichWithGeo,
  getHeatmap: (id) => heatmaps.get(id),
  getTerritory: (id) => territories.get(id)
};
