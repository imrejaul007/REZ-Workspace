import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { mockDiscovery } from '../../services/mockServices.js';

export const discoverRouter = Router();

// Trend predictions data
const TREND_PREDICTIONS = [
  {
    id: 'trend-1',
    category: 'restaurants',
    title: 'Hidden Gem Restaurants',
    description: 'Local favorites gaining popularity',
    emoji: '🏆',
    trendScore: 0.95,
    predictedPeak: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
    venues: [],
  },
  {
    id: 'trend-2',
    category: 'spa',
    title: 'Wellness Retreats',
    description: 'Self-care is the new luxury',
    emoji: '🧘',
    trendScore: 0.88,
    predictedPeak: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
    venues: [],
  },
  {
    id: 'trend-3',
    category: 'events',
    title: 'Live Music Nights',
    description: 'Weekend music events on the rise',
    emoji: '🎸',
    trendScore: 0.82,
    predictedPeak: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    venues: [],
  },
  {
    id: 'trend-4',
    category: 'cafes',
    title: 'Specialty Coffee',
    description: 'Artisan cafes trending locally',
    emoji: '☕',
    trendScore: 0.78,
    predictedPeak: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
    venues: [],
  },
  {
    id: 'trend-5',
    category: 'fitness',
    title: 'Sunrise Yoga Sessions',
    description: 'Outdoor fitness gaining momentum',
    emoji: '🌅',
    trendScore: 0.72,
    predictedPeak: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
    venues: [],
  },
];

// GET /discovery - Main discovery endpoint
discoverRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { intent, lat, lng, category, q, limit = 10 } = req.query;

    const items = await mockDiscovery.search({
      query: q as string,
      mood: intent as string,
      location: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
      limit: Number(limit),
    });

    res.json({
      success: true,
      items,
      section: intent as string || 'discover',
    });
  })
);

// GET /discovery/trending
discoverRouter.get(
  '/trending',
  asyncHandler(async (req, res) => {
    const { lat, lng, limit = 10 } = req.query;

    const items = await mockDiscovery.getTrending(
      lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
    );

    res.json({
      success: true,
      items: items.slice(0, Number(limit)),
    });
  })
);

// GET /discovery/trends - AI trend predictions
discoverRouter.get(
  '/trends',
  asyncHandler(async (req, res) => {
    const { lat, lng, limit = 5 } = req.query;

    // Get trending venues to populate trend predictions
    const trendingVenues = await mockDiscovery.getTrending(
      lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
    );

    // Assign venues to trends
    const trendsWithVenues = TREND_PREDICTIONS.map((trend) => ({
      ...trend,
      venues: trendingVenues
        .filter((v) => v.category === trend.category)
        .slice(0, 3),
    }));

    res.json({
      success: true,
      trends: trendsWithVenues.slice(0, Number(limit)),
      lastUpdated: new Date().toISOString(),
    });
  })
);

// GET /discovery/nearby
discoverRouter.get(
  '/nearby',
  asyncHandler(async (req, res) => {
    const { lat, lng, limit = 20, category } = req.query;

    const items = await mockDiscovery.getNearby(
      lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
      Number(limit),
    );

    // Filter by category if specified
    let filtered = items;
    if (category) {
      filtered = items.filter((item) => item.category === category);
    }

    res.json({
      success: true,
      items: filtered,
    });
  })
);

// GET /discovery/mood/:mood
discoverRouter.get(
  '/mood/:mood',
  asyncHandler(async (req, res) => {
    const { mood } = req.params;
    const { lat, lng } = req.query;

    const moodTitles: Record<string, { title: string; subtitle: string }> = {
      bored: { title: "You're bored, huh?", subtitle: 'Let me suggest something fun!' },
      celebrate: { title: 'Celebration time!', subtitle: 'Here are some special places.' },
      relax: { title: 'Time to unwind', subtitle: 'Peaceful spots for you.' },
      adventure: { title: 'Feeling adventurous?', subtitle: 'Try something new!' },
      date: { title: 'Date night!', subtitle: 'Romantic spots for two.' },
      food: { title: 'Hungry?', subtitle: 'Delicious options nearby.' },
    };

    const meta = moodTitles[mood] || { title: 'For you', subtitle: 'Curated just for you.' };

    const items = await mockDiscovery.search({
      mood,
      location: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
      limit: 10,
    });

    res.json({
      success: true,
      items,
      title: meta.title,
      subtitle: meta.subtitle,
    });
  })
);

// GET /discovery/search
discoverRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q, lat, lng } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query parameter "q" is required' },
      });
    }

    const items = await mockDiscovery.search({
      query: q as string,
      location: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
    });

    res.json({
      success: true,
      items,
      query: q,
    });
  })
);

// GET /discovery/categories
discoverRouter.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = [
      { id: 'restaurants', name: 'Restaurants', emoji: '🍽️' },
      { id: 'cafes', name: 'Cafes', emoji: '☕' },
      { id: 'trials', name: 'Trials', emoji: '✨' },
      { id: 'spa', name: 'Spa & Wellness', emoji: '💆' },
      { id: 'events', name: 'Events', emoji: '🎭' },
      { id: 'fitness', name: 'Fitness', emoji: '💪' },
    ];

    res.json({
      success: true,
      categories,
    });
  })
);
