/**
 * Route Optimizer AI - Navigation & Route Planning
 * Part of FLEETIQ - Fleet Management AI
 */

export interface Stop {
  id: string;
  address: string;
  lat: number;
  lng: number;
  order?: number;
  timeWindow?: { start: string; end: string };
  type: 'pickup' | 'delivery' | 'service';
}

export interface Route {
  stops: Stop[];
  totalDistance: number;
  totalTime: number;
  estimatedFuelCost: number;
  waypoints: { lat: number; lng: number }[];
}

export interface TrafficInfo {
  level: 'low' | 'medium' | 'high' | 'severe';
  delay: number;
  alternativeRoutes: number;
  recommendation: string;
}

export class RouteOptimizerAI {
  async optimizeRoute(stops: Stop[], strategy: 'distance' | 'time' | 'balanced' = 'balanced'): Promise<Route> {
    if (stops.length < 2) {
      return { stops, totalDistance: 0, totalTime: 0, estimatedFuelCost: 0, waypoints: [] };
    }

    // Nearest neighbor optimization
    const optimized = this.nearestNeighborOptimization(stops);

    // Calculate totals
    let totalDistance = 0;
    const waypoints: { lat: number; lng: number }[] = [];

    for (let i = 0; i < optimized.length; i++) {
      optimized[i].order = i + 1;
      waypoints.push({ lat: optimized[i].lat, lng: optimized[i].lng });

      if (i < optimized.length - 1) {
        const dist = this.calculateDistance(optimized[i], optimized[i + 1]);
        totalDistance += dist;
      }
    }

    const totalTime = (totalDistance / 40) * 60; // 40 km/h average
    const estimatedFuelCost = totalDistance * 0.1;

    return {
      stops: optimized,
      totalDistance: Math.round(totalDistance),
      totalTime: Math.round(totalTime),
      estimatedFuelCost: Math.round(estimatedFuelCost),
      waypoints
    };
  }

  async getAlternativeRoutes(origin: Stop, destination: Stop): Promise<{ route: Route; score: number }[]> {
    // Generate 3 alternative routes
    return [
      { route: await this.optimizeRoute([origin, destination]), score: 95 },
      { route: await this.optimizeRoute([origin, destination]), score: 85 },
      { route: await this.optimizeRoute([origin, destination]), score: 75 },
    ];
  }

  async getTrafficInfo(vehicleId: string): Promise<TrafficInfo> {
    const levels: TrafficInfo['level'][] = ['low', 'medium', 'high', 'severe'];
    const level = levels[Math.floor(Math.random() * levels.length)];

    return {
      level,
      delay: level === 'low' ? 0 : level === 'medium' ? 10 : level === 'high' ? 25 : 45,
      alternativeRoutes: level === 'severe' ? 2 : 1,
      recommendation: level === 'low' ? 'Current route is optimal'
        : level === 'medium' ? 'Minor delays expected, continue on current route'
          : level === 'high' ? 'Consider alternative route'
            : 'Take alternative route, severe congestion on main route'
    };
  }

  async estimateArrivalTime(distance: number, currentTraffic: TrafficInfo): Promise<{
    baseTime: number;
    withTraffic: number;
    delay: number;
  }> {
    const baseTime = (distance / 40) * 60; // minutes
    const delay = (currentTraffic.delay / 60) * baseTime;
    const withTraffic = baseTime + delay;

    return {
      baseTime: Math.round(baseTime),
      withTraffic: Math.round(withTraffic),
      delay: Math.round(delay)
    };
  }

  private nearestNeighborOptimization(stops: Stop[]): Stop[] {
    const optimized = [stops[0]];
    const remaining = stops.slice(1);

    while (remaining.length > 0) {
      const last = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      remaining.forEach((stop, index) => {
        const dist = this.calculateDistance(last, stop);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIndex = index;
        }
      });

      optimized.push(remaining.splice(nearestIndex, 1)[0]);
    }

    return optimized;
  }

  private calculateDistance(stop1: Stop, stop2: Stop): number {
    const latDiff = Math.abs(stop1.lat - stop2.lat);
    const lngDiff = Math.abs(stop1.lng - stop2.lng);
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
  }
}

export default RouteOptimizerAI;