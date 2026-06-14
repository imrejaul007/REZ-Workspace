import { Lounge, LoungeSearchParams } from '../types';
import { logger } from '../utils/logger';

const sampleLounges: Lounge[] = [
  {
    id: 'LNG001',
    name: 'Air India Maharaja Lounge',
    airport: 'DEL',
    terminal: 'T3',
    description: 'Premium lounge with authentic Indian cuisine, spa services, and business amenities.',
    images: ['/lounges/maharaja-1.jpg', '/lounges/maharaja-2.jpg'],
    amenities: ['wifi', 'food', 'drinks', 'spa', 'shower', 'business', 'quiet_zone', 'tv'],
    operatingHours: '24 hours',
    rating: 4.5,
    reviewCount: 1234,
    price: { amount: 2500, currency: 'INR', perPerson: true },
    capacity: 150,
    available: true,
    location: { lat: 28.5665, lng: 77.1031 }
  },
  {
    id: 'LNG002',
    name: 'Plaza Premium Lounge',
    airport: 'DEL',
    terminal: 'T2',
    description: 'Award-winning lounge with international buffet and premium bar.',
    images: ['/lounges/plaza-1.jpg'],
    amenities: ['wifi', 'food', 'drinks', 'shower', 'business', 'sleeping_pods'],
    operatingHours: '06:00 - 23:00',
    rating: 4.3,
    reviewCount: 892,
    price: { amount: 2200, currency: 'INR', perPerson: true },
    capacity: 100,
    available: true,
    location: { lat: 28.5665, lng: 77.1031 }
  },
  {
    id: 'LNG003',
    name: 'Vistara Club',
    airport: 'BOM',
    terminal: 'T2',
    description: 'Elegant lounge featuring premium Indian and international cuisine.',
    images: ['/lounges/vistara-1.jpg'],
    amenities: ['wifi', 'food', 'drinks', 'shower', 'business'],
    operatingHours: '05:00 - 22:00',
    rating: 4.4,
    reviewCount: 567,
    price: { amount: 2000, currency: 'INR', perPerson: true },
    capacity: 80,
    available: true,
    location: { lat: 19.0896, lng: 72.8656 }
  },
  {
    id: 'LNG004',
    name: 'SkyTeam Lounge',
    airport: 'BLR',
    terminal: 'T1',
    description: 'Modern lounge with panoramic runway views and gourmet dining.',
    images: ['/lounges/skyteam-1.jpg'],
    amenities: ['wifi', 'food', 'drinks', 'shower', 'business', 'bar', 'runway_view'],
    operatingHours: '00:00 - 24:00',
    rating: 4.6,
    reviewCount: 445,
    price: { amount: 2800, currency: 'INR', perPerson: true },
    capacity: 120,
    available: true,
    location: { lat: 13.1979, lng: 77.7063 }
  },
  {
    id: 'LNG005',
    name: 'First Class Lounge',
    airport: 'CCU',
    terminal: 'T1',
    description: 'Luxurious lounge with personal butler service and fine dining.',
    images: ['/lounges/firstclass-1.jpg'],
    amenities: ['wifi', 'food', 'drinks', 'spa', 'shower', 'business', 'private_suites', 'butler'],
    operatingHours: '24 hours',
    rating: 4.8,
    reviewCount: 234,
    price: { amount: 4500, currency: 'INR', perPerson: true },
    capacity: 50,
    available: true,
    location: { lat: 22.6547, lng: 88.4465 }
  }
];

export class LoungeService {
  async searchLounges(params: LoungeSearchParams): Promise<Lounge[]> {
    logger.info('Searching lounges', params);

    let results = [...sampleLounges];

    if (params.airport) {
      results = results.filter(l => l.airport === params.airport?.toUpperCase());
    }

    if (params.terminal) {
      results = results.filter(l => l.terminal === params.terminal);
    }

    if (params.amenities && params.amenities.length > 0) {
      results = results.filter(l =>
        params.amenities!.every(a => l.amenities.includes(a))
      );
    }

    if (params.rating) {
      results = results.filter(l => l.rating >= params.rating!);
    }

    if (params.priceRange) {
      results = results.filter(l =>
        l.price.amount >= params.priceRange!.min &&
        l.price.amount <= params.priceRange!.max
      );
    }

    return results;
  }

  async getLoungeById(loungeId: string): Promise<Lounge | null> {
    return sampleLounges.find(l => l.id === loungeId) || null;
  }

  async getLoungesByAirport(airport: string): Promise<Lounge[]> {
    return sampleLounges.filter(l => l.airport === airport.toUpperCase());
  }

  async getAmenities(): Promise<string[]> {
    return ['wifi', 'food', 'drinks', 'spa', 'shower', 'business', 'quiet_zone', 'tv', 'sleeping_pods', 'bar', 'runway_view', 'private_suites', 'butler'];
  }
}

export const loungeService = new LoungeService();
export default loungeService;