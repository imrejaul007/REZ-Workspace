'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Users,
  Leaf,
  Star,
  X,
  Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getNearbyEvents } from '@/lib/karmaApi';
import type { KarmaEvent, EventCategory } from '@/types/karma';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { id: 'all', label: 'All', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'environment', label: 'Environment', color: '#22C55E', bg: '#DCFCE7' },
  { id: 'food', label: 'Food', color: '#F97316', bg: '#FFF7ED' },
  { id: 'health', label: 'Health', color: '#EF4444', bg: '#FEF2F2' },
  { id: 'education', label: 'Education', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'community', label: 'Community', color: '#8B5CF6', bg: '#F5F3FF' },
];

const STATUS_TABS = [
  { id: 'published', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Past' },
];

const CATEGORY_ICONS: Record<string, { color: string; bg: string }> = {
  environment: { color: '#22C55E', bg: '#DCFCE7' },
  food: { color: '#F97316', bg: '#FFF7ED' },
  health: { color: '#EF4444', bg: '#FEF2F2' },
  education: { color: '#3B82F6', bg: '#EFF6FF' },
  community: { color: '#8B5CF6', bg: '#F5F3FF' },
};

// ---------------------------------------------------------------------------
// Event Card
// ---------------------------------------------------------------------------
function ExploreEventCard({ event }: { event: KarmaEvent }) {
  const cat = CATEGORIES.find((c) => c.id === event.category) ?? CATEGORIES[0];
  const catCfg = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS.community;
  const progressPercent = event.capacity?.goal
    ? Math.min((event.capacity.enrolled / event.capacity.goal) * 100, 100)
    : 0;
  const spotsLeft = event.capacity ? event.capacity.goal - event.capacity.enrolled : null;

  return (
    <Link href={`/karma/event/${event._id}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border">
        {/* Hero Image */}
        <div className="relative h-40 overflow-hidden">
          {event.image ? (
            <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: catCfg.bg }}>
              <Leaf className="w-16 h-16" style={{ color: catCfg.color }} />
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            {event.status === 'ongoing' ? (
              <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full capitalize">
                {event.status}
              </span>
            )}
          </div>
          {/* Karma reward */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">
            <Star className="w-3 h-3" />
            +{event.maxKarmaPerEvent}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category + Difficulty */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-1 rounded-full capitalize" style={{ backgroundColor: catCfg.bg, color: catCfg.color }}>
              {event.category}
            </span>
            <span className="text-xs font-bold px-2 py-1 rounded-full capitalize" style={{
              backgroundColor: event.difficulty === 'easy' ? '#DCFCE7' : event.difficulty === 'hard' ? '#FFF1F2' : '#EFF6FF',
              color: event.difficulty === 'easy' ? '#22C55E' : event.difficulty === 'hard' ? '#EF4444' : '#3B82F6',
            }}>
              {event.difficulty}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base text-gray-900 mb-1 line-clamp-2">{event.name}</h3>

          {/* Organizer */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-xs">🏢</div>
            <span className="text-sm text-muted-foreground truncate">{event.organizer.name}</span>
          </div>

          {/* Meta */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{event.date ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBD'}{event.time ? `, ${event.time.start}` : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{event.location.city ?? event.location.address}</span>
            </div>
          </div>

          {/* Impact */}
          {event.impactUnit && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mb-3">
              <Star className="w-3.5 h-3.5" />
              ~{Math.round(event.maxKarmaPerEvent / event.expectedDurationHours)} karma/hr &bull; {event.impactUnit}
            </div>
          )}

          {/* Capacity */}
          {event.capacity && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{event.capacity.enrolled}/{event.capacity.goal} enrolled</span>
                <span>{spotsLeft != null && spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#8B5CF6] rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-4 pt-3 border-t border-border">
            <span className="flex items-center gap-1 text-xs font-semibold text-[#8B5CF6]">
              <Leaf className="w-3.5 h-3.5" />
              {event.maxKarmaPerEvent} karma
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {event.expectedDurationHours}h
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Users className="w-3.5 h-3.5" />
              {event.confirmedVolunteers}/{event.maxVolunteers}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<KarmaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const filters: Record<string, string> = { status: selectedStatus };
    if (selectedCategory !== 'all') filters.category = selectedCategory;
    try {
      const res = await getNearbyEvents(filters as Record<string, string>);
      if (res.success && res.data) {
        let data = res.data.events ?? [];
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          data = data.filter(
            (e) =>
              e.name.toLowerCase().includes(q) ||
              e.organizer.name.toLowerCase().includes(q) ||
              e.location.city?.toLowerCase().includes(q),
          );
        }
        setEvents(data);
      }
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, [selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Explore Events</h1>
        <p className="text-muted-foreground text-sm">Find your next impact</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search events, NGOs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border"
              style={{
                backgroundColor: isActive ? cat.bg : 'transparent',
                borderColor: isActive ? cat.color : '#e5e7eb',
                color: isActive ? cat.color : '#6b7280',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Status Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className="py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: selectedStatus === tab.id ? '#8B5CF6' : '#fff',
              color: selectedStatus === tab.id ? '#fff' : '#6b7280',
              border: selectedStatus === tab.id ? 'none' : '1px solid #e5e7eb',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-6">
          <Leaf className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-bold text-lg text-gray-900 mb-2">No events found</h3>
          <p className="text-muted-foreground text-sm text-center mb-6">
            {selectedCategory !== 'all'
              ? `No ${selectedCategory} events right now`
              : `No ${selectedStatus} events right now`}
          </p>
          <Link href="/karma/home">
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">Go to Home</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <ExploreEventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
