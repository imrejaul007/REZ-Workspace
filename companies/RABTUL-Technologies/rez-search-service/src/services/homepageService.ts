import mongoose from 'mongoose';
import { cacheKey, cached } from './cacheHelper';

interface HomeFeedParams {
  userId?: string;
  lat?: number;
  lng?: number;
  city?: string;
}

export async function getHomeFeed(params: HomeFeedParams) {
  const { userId, lat, lng } = params;
  const Stores = mongoose.connection.collection('stores');
  const StoreVisits = mongoose.connection.collection('storevisits');
  const StorePayments = mongoose.connection.collection('storepayments');

  const sections: unknown[] = [];

  // 1. Nearby stores (if location provided)
  if (lat && lng) {
    const nearby = await cached(cacheKey('nearby', { lat: Math.round(lat * 100), lng: Math.round(lng * 100) }), 300, async () => {
      return Stores.aggregate([
        { $geoNear: { near: { type: 'Point', coordinates: [lng, lat] }, distanceField: 'distance', maxDistance: 5000, spherical: true } },
        { $match: { isActive: true } },
        { $limit: 10 },
        { $project: { _id: 1, name: 1, logo: 1, rating: 1, distance: 1, cashbackRate: 1, categories: 1 } },
      ]).toArray();
    });
    if (nearby.length > 0) sections.push({ type: 'nearby', title: 'Near You', stores: nearby });
  }

  // 2. Trending stores (most orders last 7 days)
  // SEA-015 FIX: Standardise TTL to 300s (was 900s, inconsistent with /search/trending).
  const trending = await cached(cacheKey('trending', {}), 300, async () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const topStores = await StorePayments.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: 'completed' } },
      { $group: { _id: '$storeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]).toArray();

    const ids = topStores.map((s) => new mongoose.Types.ObjectId(s._id));
    return Stores.find({ _id: { $in: ids }, isActive: true })
      .project({ _id: 1, name: 1, logo: 1, rating: 1, cashbackRate: 1, categories: 1 })
      .limit(10).toArray();
  });
  if (trending.length > 0) sections.push({ type: 'trending', title: 'Trending Now', stores: trending });

  // 3. Recently visited (user-specific)
  if (userId) {
    const recent = await cached(cacheKey('recent', { userId }), 300, async () => {
      const visits = await StoreVisits.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$storeId', lastVisit: { $first: '$createdAt' } } },
        { $sort: { lastVisit: -1 } },
        { $limit: 5 },
      ]).toArray();

      const ids = visits.map((v) => new mongoose.Types.ObjectId(v._id));
      return Stores.find({ _id: { $in: ids } })
        .project({ _id: 1, name: 1, logo: 1, rating: 1, cashbackRate: 1 })
        .toArray();
    });
    if (recent.length > 0) sections.push({ type: 'recentlyVisited', title: 'Visit Again', stores: recent });
  }

  // 4. Top offers (highest cashback)
  const topOffers = await cached(cacheKey('offers', {}), 900, async () => {
    return Stores.find({ isActive: true, cashbackRate: { $gt: 0 } })
      .project({ _id: 1, name: 1, logo: 1, rating: 1, cashbackRate: 1, categories: 1 })
      .sort({ cashbackRate: -1 })
      .limit(10).toArray();
  });
  if (topOffers.length > 0) sections.push({ type: 'topOffers', title: 'Best Offers', stores: topOffers });

  // 5. New stores
  const newStores = await cached(cacheKey('new', {}), 3600, async () => {
    const monthAgo = new Date(Date.now() - 30 * 86400000);
    return Stores.find({ isActive: true, createdAt: { $gte: monthAgo } })
      .project({ _id: 1, name: 1, logo: 1, rating: 1, cashbackRate: 1, categories: 1 })
      .sort({ createdAt: -1 })
      .limit(10).toArray();
  });
  if (newStores.length > 0) sections.push({ type: 'newStores', title: 'Just Opened', stores: newStores });

  return { sections };
}

export function getHomeSections() {
  return {
    sections: [
      { type: 'nearby', title: 'Near You', order: 1 },
      { type: 'trending', title: 'Trending Now', order: 2 },
      { type: 'recentlyVisited', title: 'Visit Again', order: 3 },
      { type: 'topOffers', title: 'Best Offers', order: 4 },
      { type: 'newStores', title: 'Just Opened', order: 5 },
    ],
  };
}
