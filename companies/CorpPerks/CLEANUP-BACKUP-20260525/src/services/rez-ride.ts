/**
 * REZ Ride Integration
 * Connect PeopleOS to REZ Ride for commute tracking
 */

const REZ_RIDE_API = process.env.REZ_RIDE_API || 'https://rez-ride.rezapp.com/api';

export interface Ride {
  id: string;
  userId: string;
  pickup: Location;
  dropoff: Location;
  fare: number;
  status: 'pending' | 'completed' | 'cancelled';
  vehicleType: 'auto' | 'bike' | 'car';
  createdAt: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface RideEstimate {
  fare: number;
  eta: number;
  distance: number;
}

// ─── Book Ride ───────────────────────────────────────────────────

export async function bookRide(data: {
  pickup: Location;
  dropoff: Location;
  vehicleType: 'auto' | 'bike' | 'car';
  scheduledAt?: string;
}): Promise<{ success: boolean; ride?: Ride; error?: string }> {
  try {
    const response = await fetch(`${REZ_RIDE_API}/rides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { success: true, ride: result.ride };
  } catch (error) {
    return { success: false, error: 'Failed to book ride' };
  }
}

// ─── Get Ride Estimate ──────────────────────────────────────────

export async function getEstimate(pickup: Location, dropoff: Location, vehicleType: string): Promise<RideEstimate | null> {
  try {
    const response = await fetch(`${REZ_RIDE_API}/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup, dropoff, vehicleType }),
    });
    const result = await response.json();
    return result.estimate;
  } catch {
    return null;
  }
}

// ─── Get My Rides ──────────────────────────────────────────────

export async function getMyRides(userId: string): Promise<Ride[]> {
  try {
    const response = await fetch(`${REZ_RIDE_API}/rides/user/${userId}`);
    const result = await response.json();
    return result.rides || [];
  } catch {
    return [];
  }
}

// ─── Commute Tracking ─────────────────────────────────────────

export interface CommuteStats {
  monthlyFare: number;
  monthlyRides: number;
  co2Saved: number;
  avgDistance: number;
}

export async function getCommuteStats(userId: string): Promise<CommuteStats | null> {
  try {
    const response = await fetch(`${REZ_RIDE_API}/commute/stats/${userId}`);
    const result = await response.json();
    return result.stats;
  } catch {
    return null;
  }
}

// ─── Corporate Commute Benefit ─────────────────────────────────

export interface CommuteBenefit {
  companySubsidy: number;
  monthlyLimit: number;
  remaining: number;
  eligibleRoutes: string[];
}

export async function getCommuteBenefit(userId: string, companyId: string): Promise<CommuteBenefit | null> {
  try {
    const response = await fetch(`${REZ_RIDE_API}/corporate/commute-benefit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, companyId }),
    });
    const result = await response.json();
    return result.benefit;
  } catch {
    return null;
  }
}

// ─── Claim Travel Expense ─────────────────────────────────────

export async function claimTravelExpense(data: {
  rideId: string;
  employeeId: string;
  category: 'commute' | 'business' | 'client';
}): Promise<{ success: boolean; claimId?: string }> {
  try {
    const response = await fetch(`${REZ_RIDE_API}/expenses/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { success: true, claimId: result.claimId };
  } catch {
    return { success: false };
  }
}
