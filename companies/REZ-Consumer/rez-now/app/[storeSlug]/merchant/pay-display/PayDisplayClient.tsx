'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { PaymentStatus } from '@/lib/types';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';
import Image from 'next/image';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.rezapp.com';

interface PaymentReceived {
  id: string;
  amount: number;
  customerName: string | null;
  customerPhone: string | null;
  razorpayPaymentId: string | null;
  storeSlug: string;
  createdAt: string;
}

// NW-HIGH-005: Use canonical PaymentStatus instead of inline literal union.
interface PendingPayment extends PaymentReceived {
  status: PaymentStatus;
  confirmedAt?: string;
  rejectedAt?: string;
}

interface PayDisplayClientProps {
  storeSlug: string;
  storeName: string;
  storeLogo: string | null;
}

function synthesizeDing(frequency = 880, duration = 0.15) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    ctx.close();
  } catch {
    // AudioContext not available — silent fallback
  }
}

// NW-CRIT-008: Correct paths use storeSlug as URL segment, paymentId as the resource identifier.
// Old paths: /api/web-ordering/store/${paymentId}/confirm (WRONG — paymentId in slug position)
// Correct:   /api/web-ordering/store/${storeSlug}/payments/${paymentId}/confirm
async function confirmPayment(storeSlug: string, paymentId: string): Promise<void> {
  const { authClient } = await import('@/lib/api/client');
  const { data } = await authClient.post(
    `/api/web-ordering/store/${storeSlug}/payments/${paymentId}/confirm`,
    { paymentId },
  );
  if (!data.success) throw new Error(data.message || 'Confirm failed');
}

async function rejectPayment(storeSlug: string, paymentId: string, reason?: string): Promise<void> {
  const { authClient } = await import('@/lib/api/client');
  const { data } = await authClient.post(
    `/api/web-ordering/store/${storeSlug}/payments/${paymentId}/reject`,
    { paymentId, reason },
  );
  if (!data.success) throw new Error(data.message || 'Reject failed');
}

async function fetchRecentPayments(storeSlug: string): Promise<PaymentReceived[]> {
  const { authClient } = await import('@/lib/api/client');
  const { data } = await authClient.get(`/api/web-ordering/store/${storeSlug}/payments`);
  if (data.success) return data.data.payments || [];
  return [];
}

export default function PayDisplayClient({ storeSlug, storeName, storeLogo }: PayDisplayClientProps) {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioEnabled = useRef(false);
  // NW-HIGH-012: Use a ref for dedup checking so the closure always sees the
  // current set without needing payments in the effect dependency array.
  const seenRef = useRef(new Set<string>());

  // Play ding sound once on first payment (user gesture unlocks AudioContext)
  const playDing = useCallback(() => {
    synthesizeDing();
    audioEnabled.current = true;
  }, []);

  // Load initial payment history
  useEffect(() => {
    fetchRecentPayments(storeSlug).then((initial) => {
      setPayments(
        initial.map((p) => ({
          ...p,
          status: 'pending' as const,
        })),
      );
    }).catch(() => {
      // Non-critical — real-time will still work
    });
  }, [storeSlug]);

  // Socket.IO connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join-store', { storeSlug });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('payment:received', (payment: PaymentReceived) => {
      if (payment.storeSlug !== storeSlug) return;
      // NW-HIGH-012: Use ref-based dedup — payments state from closure capture
      // would be stale since it is intentionally omitted from the effect deps.
      if (seenRef.current.has(payment.id)) return;
      seenRef.current.add(payment.id);

      synthesizeDing();
      setPayments((prev) => [{ ...payment, status: 'pending' as const }, ...prev].slice(0, 50));
    });

    socket.on('payment:confirmed', ({ paymentId }: { paymentId: string }) => {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, status: 'confirmed', confirmedAt: new Date().toISOString() } : p,
        ),
      );
    });

    socket.on('payment:rejected', ({ paymentId }: { paymentId: string }) => {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, status: 'rejected', rejectedAt: new Date().toISOString() } : p,
        ),
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [storeSlug]); // intentionally omit payments from deps

  const handleConfirm = useCallback(async (paymentId: string) => {
    if (processingIds.has(paymentId)) return;
    setProcessingIds((prev) => new Set([...prev, paymentId]));
    setError(null);
    try {
      await confirmPayment(storeSlug, paymentId); // NW-CRIT-008 fix: pass storeSlug
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, status: 'confirmed', confirmedAt: new Date().toISOString() } : p,
        ),
      );
      synthesizeDing(1200, 0.2); // higher pitch = success
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Confirm failed');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(paymentId);
        return next;
      });
    }
  }, [processingIds, storeSlug]);

  const handleReject = useCallback(async (paymentId: string) => {
    if (processingIds.has(paymentId)) return;
    setProcessingIds((prev) => new Set([...prev, paymentId]));
    setError(null);
    try {
      await rejectPayment(storeSlug, paymentId); // NW-CRIT-008 fix: pass storeSlug
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, status: 'rejected', rejectedAt: new Date().toISOString() } : p,
        ),
      );
      synthesizeDing(300, 0.3); // lower pitch = rejection
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(paymentId);
        return next;
      });
    }
  }, [processingIds, storeSlug]);

  const pending = payments.filter((p) => p.status === 'pending');
  const recent = payments.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {storeLogo && (
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-600">
              <Image src={storeLogo} alt={storeName} fill sizes="48px" className="object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{storeName} — Payment Kiosk</h1>
            <p className="text-xs text-gray-400">Scan &amp; Pay · Merchant View</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className={cn(
            'w-2.5 h-2.5 rounded-full transition-colors',
            socketConnected ? 'bg-green-400' : 'bg-red-400',
          )} title={socketConnected ? 'Connected' : 'Disconnected'} />
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            socketConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300',
          )}>
            {socketConnected ? 'Live' : 'Offline'}
          </span>
          {pending.length > 0 && (
            <span className="bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              {pending.length} pending
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border-b border-red-700 px-6 py-2 text-sm text-red-200">
          {error} — payment state unchanged
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Main: pending payments */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Pending Confirmations
          </h2>

          {pending.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">📲</div>
              <p className="text-gray-400 text-lg">Waiting for payments...</p>
              <p className="text-gray-600 text-sm mt-2">
                Payments will appear here in real time when customers complete UPI or card transactions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  processing={processingIds.has(payment.id)}
                  onDing={playDing}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: recent history */}
        <div className="lg:w-80 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Recent ({recent.length})
          </h2>
          <div className="bg-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-700">
            {recent.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm text-center">No recent payments</p>
            ) : (
              recent.map((payment) => (
                <div key={payment.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {payment.customerName || 'Customer'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatINR(payment.amount)}
                    </p>
                  </div>
                  <StatusBadge status={payment.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({
  payment,
  onConfirm,
  onReject,
  processing,
  onDing,
}: {
  payment: PendingPayment;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  processing: boolean;
  onDing: () => void;
}) {
  const timeLabel = new Date(payment.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className={cn(
      'bg-gray-800 border rounded-2xl p-5 transition-all',
      payment.status === 'confirmed' ? 'border-green-600 bg-green-900/20' :
      payment.status === 'rejected' ? 'border-red-600 bg-red-900/20' :
      'border-indigo-600 shadow-lg shadow-indigo-900/30 animate-pulse',
    )}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="text-2xl font-bold">{formatINR(payment.amount)}</p>
          <p className="text-sm text-gray-400 mt-1">
            {payment.customerName || 'Customer'}
            {payment.customerPhone && <span className="ml-2 text-gray-500">{payment.customerPhone}</span>}
          </p>
          {payment.razorpayPaymentId && (
            <p className="text-xs text-gray-600 mt-0.5 font-mono">{payment.razorpayPaymentId}</p>
            )}
          <p className="text-xs text-gray-600 mt-1">Ref: {payment.id}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500">{timeLabel}</p>
          <StatusBadge status={payment.status} />
        </div>
      </div>

      {payment.status === 'pending' && (
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            className="flex-1 !bg-green-600 hover:!bg-green-700 focus:ring-green-500"
            loading={processing}
            onClick={() => { onDing(); onConfirm(payment.id); }}
          >
            ✓ Confirm Payment
          </Button>
          <Button
            variant="danger"
            size="lg"
            loading={processing}
            onClick={() => onReject(payment.id)}
          >
            ✕ Reject
          </Button>
        </div>
      )}

      {payment.status === 'confirmed' && (
        <p className="text-green-400 text-sm font-medium">
          ✓ Confirmed at {payment.confirmedAt ? new Date(payment.confirmedAt).toLocaleTimeString('en-IN') : ''}
        </p>
      )}

      {payment.status === 'rejected' && (
        <p className="text-red-400 text-sm font-medium">
          ✕ Rejected at {payment.rejectedAt ? new Date(payment.rejectedAt).toLocaleTimeString('en-IN') : ''}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PendingPayment['status'] }) {
  const map: Record<string, { label: string; class: string }> = {
    pending: { label: 'Pending', class: 'bg-yellow-900 text-yellow-300 border-yellow-700' },
    confirmed: { label: 'Confirmed', class: 'bg-green-900 text-green-300 border-green-700' },
    rejected: { label: 'Rejected', class: 'bg-red-900 text-red-300 border-red-700' },
    paid: { label: 'Paid', class: 'bg-green-900 text-green-300 border-green-700' },
  };
  const { label, class: cls } = map[status];
  return (
    <span className={cn(
      'text-xs font-medium px-2 py-0.5 rounded-full border',
      cls,
    )}>
      {label}
    </span>
  );
}
