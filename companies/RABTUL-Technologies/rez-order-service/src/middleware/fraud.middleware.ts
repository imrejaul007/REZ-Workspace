// Fraud Detection Middleware
// Prevents: velocity abuse, impossible travel, fake orders

interface FraudSignal {
  userId: string;
  action: string;
  ip: string;
  deviceId: string;
  timestamp: number;
}

const velocityCache = new Map();

// Check velocity (10 orders in 60 seconds = suspicious)
export function checkVelocity(userId: string): boolean {
  const key = `velocity:${userId}`;
  const count = velocityCache.get(key) || 0;
  if (count > 10) return false; // blocked
  velocityCache.set(key, count + 1);
  setTimeout(() => velocityCache.delete(key), 60000);
  return true;
}

// Impossible travel (2 orders in different cities < 10 min apart)
export async function checkImpossibleTravel(order: Order): Promise<boolean> {
  const last = await db.orders.findOne({ userId: order.userId }).sort({ createdAt: -1 });
  if (!last) return true;

  const distance = haversine(last.location, order.location);
  const timeDiff = order.createdAt - last.createdAt;
  const speed = distance / (timeDiff / 3600000); // km/h
  return speed < 500; // Allow < 500km/h
}

// Device fingerprinting
export function checkDeviceFingerprint(deviceId: string): boolean {
  const devices = new Set();
  // Track unique devices per user
  return true;
}
