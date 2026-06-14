'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../StoreContextProvider';
import { useUIStore } from '@/lib/store/uiStore';
import { getOrder, sendReceipt } from '@/lib/api/orders';
import { WebOrder } from '@/lib/types';
import { formatINR } from '@/lib/utils/currency';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import StoreImage from '@/components/ui/StoreImage';

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ storeSlug: string; orderNumber: string }>;
}) {
  const { storeSlug, orderNumber } = use(params);
  const router = useRouter();
  const { store } = useStore();
  const { showToast } = useUIStore();

  const [order, setOrder] = useState<WebOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiptSending, setReceiptSending] = useState(false);
  const [canPrint, setCanPrint] = useState(false);

  useEffect(() => {
    setCanPrint(typeof window !== 'undefined');
  }, []);

  useEffect(() => {
    getOrder(orderNumber)
      .then(setOrder)
      .catch(() => showToast('Could not load receipt.', 'error'))
      .finally(() => setLoading(false));
  }, [orderNumber, showToast]);

  async function handleSendReceipt(via: 'whatsapp' | 'email') {
    setReceiptSending(true);
    try {
      await sendReceipt(orderNumber, via);
      showToast(
        `Receipt sent via ${via === 'whatsapp' ? 'WhatsApp' : 'email'}!`,
        'success'
      );
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to send receipt', 'error');
    } finally {
      setReceiptSending(false);
    }
  }

  function handleShare() {
    if (!order) return;
    const text = buildShareText(order);
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: `Receipt – Order #${order.orderNumber}`, text }).catch(() => {});
    } else {
      window.print();
    }
  }

  function buildShareText(o: WebOrder): string {
    const lines = [
      `Receipt from ${o.storeName}`,
      `Order #${o.orderNumber}`,
      `Date: ${new Date(o.createdAt).toLocaleString('en-IN')}`,
      '',
      'Items:',
      ...o.items.map((i) => `  ${i.name} x${i.quantity}  ${formatINR(i.price * i.quantity)}`),
      '',
      `Subtotal: ${formatINR(o.subtotal)}`,
    ];
    if (o.gst > 0) lines.push(`GST: ${formatINR(o.gst)}`);
    if (o.discount > 0) lines.push(`Discount: -${formatINR(o.discount)}`);
    if (o.tip > 0) lines.push(`Tip: ${formatINR(o.tip)}`);
    lines.push(`Total: ${formatINR(o.total)}`);
    return lines.join('\n');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-500">Receipt not found.</p>
        <Button onClick={() => router.push(`/${storeSlug}`)}>Back to Menu</Button>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-8 print-receipt-root">
      {/* Back button — hidden when printing */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-900"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Receipt</h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4 print-receipt-body print:max-w-[80mm] print:mx-auto print:pt-2 print:space-y-1">
        {/* Store header */}
        <div className="bg-white rounded-xl px-4 py-5 text-center">
          <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-3">
            <StoreImage
              src={store.logo}
              alt={store.name}
              width={56}
              height={56}
              className="w-14 h-14 object-cover"
              priority
            />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{store.name}</h2>
          {store.address && (
            <p className="text-xs text-gray-500 mt-1">{store.address}</p>
          )}
        </div>

        {/* Order meta */}
        <div className="bg-white rounded-xl px-4 py-4">
          <div className="flex justify-between text-sm text-gray-700 mb-1">
            <span className="font-medium">Order</span>
            <span className="font-bold">#{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Date &amp; time</span>
            <span>{formattedDate}</span>
          </div>
          {order.tableNumber && (
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Table</span>
              <span>{order.tableNumber}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl px-4 py-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Items</h3>
          <div className="divide-y divide-gray-50">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-700 py-2">
                <span>
                  {item.name}
                  <span className="text-gray-400 ml-1">x{item.quantity}</span>
                </span>
                <span>{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bill breakdown */}
        <div className="bg-white rounded-xl px-4 py-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Bill Summary</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          {order.gst > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>GST</span>
              <span>{formatINR(order.gst)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatINR(order.discount)}</span>
            </div>
          )}
          {order.tip > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tip</span>
              <span>{formatINR(order.tip)}</span>
            </div>
          )}
          {order.donation > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Donation</span>
              <span>{formatINR(order.donation)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total paid</span>
            <span>{formatINR(order.total)}</span>
          </div>
        </div>

        {/* Actions — hidden when printing */}
        <div className="space-y-2 print:hidden">
          <div className="flex gap-2">
            <Button variant="primary" fullWidth onClick={handleShare}>
              Download / Share
            </Button>
            {canPrint && (
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors shrink-0"
                aria-label="Print receipt"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span className="hidden sm:inline">Print</span>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              loading={receiptSending}
              onClick={() => handleSendReceipt('whatsapp')}
            >
              Send on WhatsApp
            </Button>
            <Button
              variant="secondary"
              fullWidth
              loading={receiptSending}
              onClick={() => handleSendReceipt('email')}
            >
              Send by email
            </Button>
          </div>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => router.push(`/${storeSlug}/order/${orderNumber}`)}
          >
            Back to order
          </Button>
        </div>

        {/* Thank you footer — only visible when printing */}
        <div className="hidden print-thank-you text-center py-4 border-t border-dashed border-gray-300">
          <p className="text-sm font-semibold text-gray-900">Thank you!</p>
          <p className="text-xs text-gray-500 mt-0.5">Powered by REZ Now</p>
        </div>
      </div>
    </div>
  );
}
