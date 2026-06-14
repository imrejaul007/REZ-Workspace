import mongoose from 'mongoose';
import { cacheKey, cached } from './cacheHelper';

export async function getPersonalized(userId: string, limit = 10) {
  return cached(cacheKey('personalized', { userId }), 300, async () => {
    const Stores = mongoose.connection.collection('stores');
    const StorePayments = mongoose.connection.collection('storepayments');

    // Find user's top categories from order history
    const userOrders = await StorePayments.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
      { $group: { _id: '$storeId', count: { $sum: 1 }, lastOrder: { $first: '$createdAt' } } },
      { $sort: { count: -1 } },
    ]).toArray();

    if (userOrders.length === 0) {
      // Fallback: trending stores
      return Stores.find({ isActive: true })
        .project({ _id: 1, name: 1, logo: 1, rating: 1, cashbackRate: 1, categories: 1 })
        .sort({ rating: -1 }).limit(limit).toArray();
    }

    // Get stores in same categories the user frequents
    const visitedIds = userOrders.map((o) => new mongoose.Types.ObjectId(o._id));
    const visitedStores = await Stores.find({ _id: { $in: visitedIds } })
      .project({ categories: 1 }).toArray();

    const categorySlugs = new Set<string>();
    visitedStores.forEach((s) => {
      (s.categories || []).forEach((c) => {
        if (c?.slug) categorySlugs.add(c.slug);
      });
    });

    return Stores.find({
      isActive: true,
      _id: { $nin: visitedIds },
      'categories.slug': { $in: [...categorySlugs] },
    })
      .project({ _id: 1, name: 1, logo: 1, rating: 1, cashbackRate: 1, categories: 1 })
      .sort({ rating: -1 }).limit(limit).toArray();
  });
}

export async function getStoreRecommendations(storeId: string, limit = 5) {
  return cached(cacheKey('storeRec', { storeId }), 900, async () => {
    const Stores = mongoose.connection.collection('stores');
    const StoreVisits = mongoose.connection.collection('storevisits');

    // Co-occurrence: users who visited this store also visited...
    const visitors = await StoreVisits.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      { $sort: { createdAt: -1 } },
      { $limit: 200 },
      { $group: { _id: '$userId' } },
    ]).toArray();

    const userIds = visitors.map((v) => v._id);

    const coVisited = await StoreVisits.aggregate([
      { $match: { userId: { $in: userIds }, storeId: { $ne: new mongoose.Types.ObjectId(storeId) } } },
      { $group: { _id: '$storeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]).toArray();

    const ids = coVisited.map((s) => new mongoose.Types.ObjectId(s._id));
    return Stores.find({ _id: { $in: ids }, isActive: true })
      .project({ _id: 1, name: 1, logo: 1, rating: 1, cashbackRate: 1 })
      .toArray();
  });
}

export async function getTrending(city?: string, category?: string, limit = 10) {
  // SEA-015 FIX: Standardise TTL to 300s (same as /search/trending).
  return cached(cacheKey('trending', { city, category }), 300, async () => {
    const Stores = mongoose.connection.collection('stores');
    const StorePayments = mongoose.connection.collection('storepayments');

    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const top = await StorePayments.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: 'completed' } },
      { $group: { _id: '$storeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit * 2 },
    ]).toArray();

    const ids = top.map((s) => new mongoose.Types.ObjectId(s._id));
    const filter: unknown = { _id: { $in: ids }, isActive: true };
    if (city) {
      // SEA-009 FIX: Cap city at 100 chars to prevent pathological regex compilation.
      const safeCity = city.slice(0, 100);
      const escapedCity = safeCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter['address.city'] = new RegExp(escapedCity, 'i');
    }
    if (category) filter['categories.slug'] = category;

    return Stores.find(filter)
      .project({ _id: 1, name: 1, logo: 1, rating: 1, cashbackRate: 1, categories: 1 })
      .limit(limit).toArray();
  });
}

export async function getPickedForYou(userId: string, limit = 10) {
  return cached(cacheKey('picked', { userId }), 300, async () => {
    const Stores = mongoose.connection.collection('stores');
    const half = Math.ceil(limit / 2);

    // 50% from user's categories
    const personalized = await getPersonalized(userId, half);

    // 50% highly rated they haven't visited
    const StoreVisits = mongoose.connection.collection('storevisits');
    const visited = await StoreVisits.distinct('storeId', { userId: new mongoose.Types.ObjectId(userId) });
    const highRated = await Stores.find({
      isActive: true,
      _id: { $nin: visited },
      rating: { $gte: 4 },
    })
      .project({ _id: 1, name: 1, logo: 1, rating: 1, cashbackRate: 1, categories: 1 })
      .sort({ rating: -1 }).limit(half).toArray();

    // Merge and deduplicate
    const seen = new Set<string>();
    const result: unknown[] = [];
    for (const s of [...personalized, ...highRated]) {
      const id = s._id.toString();
      if (!seen.has(id)) { seen.add(id); result.push(s); }
    }
    return result.slice(0, limit);
  });
}
