/**
 * Hojai Hyperlocal Platform
 *
 * Geo Intelligence, Zones, Venues, Events, Footfall Prediction
 *
 * PORT: 4580
 */
export interface Zone {
    id: string;
    tenant_id: string;
    name: string;
    level: 'city' | 'district' | 'neighborhood' | 'micro_zone';
    boundary?: GeoJSON;
    center: {
        lat: number;
        lng: number;
    };
    demand_index: number;
    venue_count: number;
}
export interface Venue {
    id: string;
    tenant_id: string;
    name: string;
    type: 'restaurant' | 'retail' | 'gym' | 'salon' | 'clinic' | 'other';
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    zone_id: string;
    demand_index: number;
    rating?: number;
}
export interface Event {
    id: string;
    tenant_id: string;
    name: string;
    category: 'concert' | 'festival' | 'sports' | 'community';
    coordinates: {
        lat: number;
        lng: number;
    };
    zone_id: string;
    scale: 'small' | 'medium' | 'large';
    start_date: string;
    end_date: string;
    expected_attendance: number;
}
export interface FootfallPrediction {
    venue_id: string;
    date: string;
    predicted: number;
    confidence: number;
}
export declare class HojaiHyperlocalPlatform {
    /**
     * Create zone
     */
    createZone(tenantId: string, data: {
        name: string;
        level: Zone['level'];
        center: {
            lat: number;
            lng: number;
        };
        demand_index?: number;
    }): Promise<Zone>;
    /**
     * List zones
     */
    listZones(tenantId: string, level?: Zone['level']): Promise<Zone[]>;
    /**
     * Get zones near coordinates
     */
    getZonesNearby(tenantId: string, coordinates: {
        lat: number;
        lng: number;
    }, radiusKm?: number): Promise<Zone[]>;
    /**
     * Create venue
     */
    createVenue(tenantId: string, data: {
        name: string;
        type: Venue['type'];
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
        zone_id: string;
    }): Promise<Venue>;
    /**
     * List venues
     */
    listVenues(tenantId: string, zoneId?: string): Promise<Venue[]>;
    /**
     * Get venue demand
     */
    getVenueDemand(tenantId: string, venueId: string): Promise<{
        demand_index: number;
        peak_hours: number[];
    } | null>;
    /**
     * Create event
     */
    createEvent(tenantId: string, data: {
        name: string;
        category: Event['category'];
        coordinates: {
            lat: number;
            lng: number;
        };
        zone_id: string;
        scale: Event['scale'];
        start_date: string;
        end_date: string;
        expected_attendance: number;
    }): Promise<Event>;
    /**
     * Get event impact
     */
    getEventImpact(tenantId: string, eventId: string): Promise<{
        event: Event;
        impact_zones: {
            zone_id: string;
            impact_score: number;
        }[];
        demand_boost: number;
    } | null>;
    /**
     * List upcoming events
     */
    listEvents(tenantId: string, zoneId?: string): Promise<Event[]>;
    /**
     * Predict footfall
     */
    predictFootfall(tenantId: string, venueId: string, date: string): Promise<FootfallPrediction | null>;
    /**
     * Get footfall forecast
     */
    getFootfallForecast(tenantId: string, venueId: string, days?: number): Promise<FootfallPrediction[]>;
    private calculateDistance;
    private generateId;
}
export declare function createHyperlocalRoutes(platform: HojaiHyperlocalPlatform): import("express-serve-static-core").Router;
export declare function bootstrap(port?: number): Promise<{
    platform: HojaiHyperlocalPlatform;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    HojaiHyperlocalPlatform: typeof HojaiHyperlocalPlatform;
    createHyperlocalRoutes: typeof createHyperlocalRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map