/**
 * HOJAI Core Connector
 * Connects FLEETIQ to HOJAI Core AI infrastructure
 */

export interface HOJAIConfig {
  baseUrl: string;
  apiKey: string;
}

export interface FleetContext {
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
}

export interface RouteAlert {
  type: 'traffic' | 'weather' | 'accident' | 'closure';
  severity: 'low' | 'medium' | 'high';
  message: string;
  alternativeRoutes?: number;
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  async analyzeIntent(text: string, context?: FleetContext): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, unknown>;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/intent/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text, context })
        }
      );

      if (!response.ok) {
        return { intent: 'unknown', confidence: 0, entities: {} };
      }

      return await response.json();
    } catch {
      return { intent: 'unknown', confidence: 0, entities: {} };
    }
  }

  async getRouteAlerts(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<RouteAlert[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/alerts/route`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ origin, destination })
        }
      );

      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }

  async getOptimizationSuggestions(tripData: {
    distance: number;
    fuelUsed: number;
    time: number;
    cargoWeight: number;
  }): Promise<{
    suggestions: { type: string; impact: string; savings: number }[];
    overallScore: number;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/optimization/fleet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tripData)
        }
      );

      if (!response.ok) {
        return {
          suggestions: [
            { type: 'Route', impact: 'Optimize stops order', savings: 50 },
            { type: 'Fuel', impact: 'Reduce idling time', savings: 30 },
          ],
          overallScore: 75
        };
      }

      return await response.json();
    } catch {
      return {
        suggestions: [],
        overallScore: 70
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default HOJAIConnector;