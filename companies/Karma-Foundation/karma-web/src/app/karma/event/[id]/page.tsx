'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Star,
  Leaf,
  Users,
  Shield,
  CheckCircle,
  QrCode,
  Wifi,
  Hand,
  ArrowRight,
  Wifi as WifiIcon,
  Leaf as LeafIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getEventDetail, getMyBooking, joinEvent, leaveEvent } from '@/lib/karmaApi';
import type { KarmaEvent, Booking } from '@/types/karma';

const CATEGORY_ICONS: Record<string, { color: string; bg: string }> = {
  environment: { color: '#22C55E', bg: '#DCFCE7' },
  food: { color: '#F97316', bg: '#FFF7ED' },
  health: { color: '#EF4444', bg: '#FEF2F2' },
  education: { color: '#3B82F6', bg: '#EFF6FF' },
  community: { color: '#8B5CF6', bg: '#F5F3FF' },
};

export default function EventDetailPage() {
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<KarmaEvent | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    setLoading(true);
    Promise.all([
      getEventDetail(id),
      getMyBooking(id),
    ]).then(([eventRes, bookingRes]) => {
      if (eventRes.success && eventRes.data) setEvent(eventRes.data);
      if (bookingRes.success) setBooking(bookingRes.data ?? null);
    }).catch(() => { /* non-fatal */ })
    .finally(() => setLoading(false));
  }, [params.id]);

  const handleJoin = async () => {
    if (!event) return;
    setJoining(true);
    try {
      const res = await joinEvent(event._id);
      if (res.success && res.data) {
        setBooking(res.data);
        alert(`You're registered for ${event.name}!`);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Something went wrong');
    } finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!event || !confirm('Are you sure you want to cancel your registration?')) return;
    setLeaving(true);
    try {
      const res = await leaveEvent(event._id);
      if (res.success) setBooking(null);
    } catch { /* non-fatal */ }
    finally { setLeaving(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="flex flex-col items-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Event not found</h2>
          <Link href="/karma/home">
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">Go to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const catCfg = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS.community;
  const progressPercent = event.capacity?.goal
    ? Math.min((event.capacity.enrolled / event.capacity.goal) * 100, 100)
    : 0;
  const estimatedKarma = Math.round(event.baseKarmaPerHour * event.expectedDurationHours);
  const isJoined = !!booking;
  const canCheckIn = isJoined && booking?.status !== 'checked_in' && !booking?.qrCheckedIn;
  const canCheckOut = isJoined && booking?.qrCheckedIn && !booking?.qrCheckedOut;

  const VerIcon = event.verificationMode === 'qr'
    ? QrCode
    : event.verificationMode === 'gps'
      ? WifiIcon
      : Hand;

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Hero Image */}
      <div className="relative h-56 overflow-hidden">
        {event.image ? (
          <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: catCfg.bg }}>
            <LeafIcon className="w-24 h-24" style={{ color: catCfg.color }} />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Back button */}
        <Link
          href="/karma/explore"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Category + Status */}
        <div className="absolute top-4 right-4 flex gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full capitalize" style={{ backgroundColor: catCfg.bg, color: catCfg.color }}>
            {event.category}
          </span>
          {event.status === 'ongoing' && (
            <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Title & Organizer */}
        <div className="-mt-6 relative z-10">
          <Card className="p-4">
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">{event.name}</h1>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs">🏢</div>
              <span className="text-sm text-muted-foreground">{event.organizer.name}</span>
            </div>
            {isJoined && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                Registered
              </span>
            )}
          </Card>
        </div>

        {/* Info */}
        <Card className="divide-y divide-border">
          <div className="flex items-start gap-3 p-4">
            <Calendar className="w-5 h-5 text-[#8B5CF6] mt-0.5" />
            <div>
              <div className="text-xs text-muted-foreground">Date</div>
              <div className="font-semibold text-sm text-gray-900">
                {event.date
                  ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'TBD'}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4">
            <Clock className="w-5 h-5 text-[#8B5CF6] mt-0.5" />
            <div>
              <div className="text-xs text-muted-foreground">Time</div>
              <div className="font-semibold text-sm text-gray-900">
                {event.time ? `${event.time.start} - ${event.time.end}` : 'TBD'} | Duration: {event.expectedDurationHours}h
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4">
            <MapPin className="w-5 h-5 text-[#8B5CF6] mt-0.5" />
            <div>
              <div className="text-xs text-muted-foreground">Location</div>
              <div className="font-semibold text-sm text-gray-900">{event.location.address}</div>
              {event.location.city && <div className="text-xs text-muted-foreground">{event.location.city}</div>}
            </div>
          </div>
          <div className="flex items-start gap-3 p-4">
            <VerIcon className="w-5 h-5 text-[#8B5CF6] mt-0.5" />
            <div>
              <div className="text-xs text-muted-foreground">Verification</div>
              <div className="font-semibold text-sm text-gray-900">
                {event.verificationMode === 'qr' ? 'QR Code scan' : event.verificationMode === 'gps' ? 'GPS check-in' : 'Manual'}
                {event.gpsRadius ? ` (within ${event.gpsRadius}m)` : ''}
              </div>
            </div>
          </div>
        </Card>

        {/* Capacity */}
        {event.capacity && (
          <Card className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-gray-900">Volunteer Spots</span>
              <span className="text-muted-foreground">{event.capacity.enrolled}/{event.capacity.goal} filled</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-[#8B5CF6] rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="text-xs text-muted-foreground">{event.capacity.goal - event.capacity.enrolled} spots remaining</div>
          </Card>
        )}

        {/* What You'll Earn */}
        <Card className="p-4">
          <h3 className="font-bold text-gray-900 mb-3">What You'll Earn</h3>
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center px-2">
              <Leaf className="w-6 h-6 text-[#8B5CF6] mx-auto mb-1" />
              <div className="font-extrabold text-lg text-gray-900">~{estimatedKarma}</div>
              <div className="text-xs text-muted-foreground">Karma Points</div>
            </div>
            <div className="text-center px-2">
              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <div className="font-extrabold text-lg text-gray-900">~{Math.round(estimatedKarma * 0.5)}</div>
              <div className="text-xs text-muted-foreground">ReZ Coins (L2)</div>
            </div>
            <div className="text-center px-2">
              <Clock className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <div className="font-extrabold text-lg text-gray-900">{event.totalHours ?? event.expectedDurationHours}h</div>
              <div className="text-xs text-muted-foreground">Hours Given</div>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="p-4">
          <h3 className="font-bold text-gray-900 mb-2">About This Event</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
        </Card>

        {/* Difficulty */}
        <Card className="p-4">
          <h3 className="font-bold text-gray-900 mb-2">Difficulty</h3>
          <span
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold capitalize"
            style={{
              backgroundColor: event.difficulty === 'easy' ? '#DCFCE7' : event.difficulty === 'hard' ? '#FFF1F2' : '#EFF6FF',
              color: event.difficulty === 'easy' ? '#22C55E' : event.difficulty === 'hard' ? '#EF4444' : '#3B82F6',
            }}
          >
            {event.difficulty === 'easy' ? 'No experience needed' : event.difficulty === 'hard' ? 'Requires training or physical effort' : 'Basic skills helpful'}
          </span>
        </Card>

        {/* Booking Status */}
        {booking && (
          <Card className="p-4">
            <h3 className="font-bold text-gray-900 mb-3">Your Status</h3>
            <div className="space-y-2">
              {[
                { label: 'Check In', done: booking.qrCheckedIn },
                { label: 'Check Out', done: booking.qrCheckedOut },
                { label: 'NGO Approval', done: booking.ngoApproved, indeterminate: booking.ngoApproved === false && booking.ngoApproved !== undefined },
                { label: 'Confidence', value: `${Math.round(booking.confidenceScore * 100)}%` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  {item.value ? (
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  ) : (
                    <span className={item.done ? 'text-green-600 font-semibold' : item.indeterminate ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                      {item.done ? 'Done' : item.indeterminate ? 'Rejected' : 'Pending'}
                    </span>
                  )}
                </div>
              ))}
              {booking.karmaEarned > 0 && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Karma Earned</span>
                  <span className="font-extrabold text-yellow-500">+{booking.karmaEarned}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4">
        <div className="max-w-2xl mx-auto">
          {event.status === 'completed' || event.status === 'cancelled' ? (
            <div className="text-center py-3 text-muted-foreground">
              {event.status === 'cancelled' ? 'This event was cancelled' : 'This event has ended'}
            </div>
          ) : !isJoined ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            >
              {joining ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Join Event</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-3">
              {canCheckIn && (
                <button className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                  <QrCode className="w-4 h-4" />
                  Check In
                </button>
              )}
              {canCheckOut && (
                <button className="flex-1 bg-[#F5F3FF] border border-[#8B5CF6] text-[#8B5CF6] font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                  <QrCode className="w-4 h-4" />
                  Check Out
                </button>
              )}
              {!canCheckIn && !canCheckOut && (
                <div className="flex-1 text-center py-3 text-muted-foreground text-sm">
                  {booking?.qrCheckedIn && !booking?.qrCheckedOut ? 'Checked in — check out when done' : 'Ready for check-in'}
                </div>
              )}
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="w-12 flex items-center justify-center rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              >
                {leaving ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <ArrowLeft className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
