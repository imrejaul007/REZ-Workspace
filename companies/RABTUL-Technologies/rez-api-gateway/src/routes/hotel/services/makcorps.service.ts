/**
 * Makcorps Service
 * API calls to Makcorps hotel booking system
 */

import { OTAProperty, OTARoom, SearchParams } from '../types/makcorps.types';
import { DEMO_PROPERTIES } from '../data/demo-properties.data';

export class MakcorpsService {
  /**
   * Search for hotels based on criteria
   */
  async searchProperties(params: SearchParams): Promise<OTAProperty[]> {
    // In production, call Makcorps API:
    // const response = await fetch(`${MAKCORPS_API_URL}/hotels/search?${params}`, {
    //   headers: { 'Authorization': `Bearer ${MAKCORPS_ACCESS_TOKEN}` }
    // });

    let properties = [...DEMO_PROPERTIES];

    if (params.city) {
      properties = properties.filter(p =>
        p.address.city.toLowerCase().includes(params.city!.toLowerCase())
      );
    }

    if (params.minRating) {
      properties = properties.filter(p => p.starRating >= params.minRating!);
    }

    if (params.maxPrice) {
      properties = properties
        .map(p => ({
          ...p,
          rooms: p.rooms.filter(r => r.corporateRate <= params.maxPrice!),
        }))
        .filter(p => p.rooms.length > 0);
    }

    return properties;
  }

  /**
   * Get property by ID
   */
  async getProperty(propertyId: string): Promise<OTAProperty | undefined> {
    return DEMO_PROPERTIES.find(p => p.propertyId === propertyId);
  }

  /**
   * Get available rooms for a property
   */
  async getAvailableRooms(propertyId: string): Promise<OTARoom[]> {
    const property = DEMO_PROPERTIES.find(p => p.propertyId === propertyId);
    if (!property) {
      return [];
    }
    return property.rooms.filter(r => r.available);
  }

  /**
   * Get room by ID from a property
   */
  async getRoom(propertyId: string, roomId: string): Promise<OTARoom | undefined> {
    const property = DEMO_PROPERTIES.find(p => p.propertyId === propertyId);
    if (!property) {
      return undefined;
    }
    return property.rooms.find(r => r.roomId === roomId);
  }

  /**
   * Get all properties (for internal use)
   */
  getAllProperties(): OTAProperty[] {
    return DEMO_PROPERTIES;
  }
}

export const makcorpsService = new MakcorpsService();
