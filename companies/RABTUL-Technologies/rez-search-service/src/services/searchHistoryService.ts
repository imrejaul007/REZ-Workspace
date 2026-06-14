import mongoose from 'mongoose';
import { cacheKey, cached } from './cacheHelper';

const MAX_QUERY_LENGTH = 200;

export async function saveSearch(userId: string, query: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error('Invalid userId');
  const trimmed = query.trim().toLowerCase().slice(0, MAX_QUERY_LENGTH);
  if (!trimmed) return;
  const Histories = mongoose.connection.collection('searchhistories');
  await Histories.insertOne({
    userId: new mongoose.Types.ObjectId(userId),
    query: trimmed,
    createdAt: new Date(),
  });
}

export async function getRecentSearches(userId: string, limit = 10) {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error('Invalid userId');
  const Histories = mongoose.connection.collection('searchhistories');
  return Histories.find({ userId: new mongoose.Types.ObjectId(userId) })
    .project({ query: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getPopularSearches(limit = 10) {
  return cached(cacheKey('popular', {}), 3600, async () => {
    const Histories = mongoose.connection.collection('searchhistories');
    const dayAgo = new Date(Date.now() - 86400000);
    return Histories.aggregate([
      { $match: { createdAt: { $gte: dayAgo } } },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { query: '$_id', count: 1, _id: 0 } },
    ]).toArray();
  });
}
