export interface DriverLocation {
  lat: number;
  lng: number;
}

export interface DriverStatusUpdate {
  status: 'available' | 'busy' | 'offline';
}

export interface LocationUpdate {
  lat: number;
  lng: number;
}

export interface DriverStats {
  totalDeliveries: number;
  rating: number;
  earnings: {
    today: number;
    week: number;
    month: number;
  };
}

export interface NearbyDriverSearch {
  lat: number;
  lng: number;
  radiusKm?: number;
  vehicleType?: 'bike' | 'scooter' | 'car';
  limit?: number;
}

export interface DeliveryAssignment {
  driverId: string;
  orderId: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryLocation: {
    lat: number;
    lng: number;
    address: string;
  };
}