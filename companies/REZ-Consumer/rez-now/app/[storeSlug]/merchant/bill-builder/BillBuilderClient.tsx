'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBillBuilderStore } from '@/lib/store/billStore';
import { createMerchantBill, getActiveBills, cancelBill } from '@/lib/api/merchantBill';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';
import Image from 'next/image';

// ─── Quick-add item presets (customizable per store type) ─────────────────────
interface QuickItem {
  name: string;
  pricePaise: number;
}

const QUICK_ITEMS: QuickItem[] = [
  { name: 'Tea / Coffee', pricePaise: 2000 },
  { name: 'Water Bottle', pricePaise: 2000 },
  { name: 'Snacks', pricePaise: 3000 },
  { name: 'Lunch', pricePaise: 15000 },
  { name: 'Dinner', pricePaise: 20000 },
  { name: 'Parcel', pricePaise: 10000 },
  { name: 'Parking', pricePaise: 2000 },
  { name: 'Other', pricePaise: 0 },
];

interface ActiveBill {
  billId: string;
  billNumber: string;
  items: { name: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  expiresAt: string;
  createdAt: string;
}

interface BillBuilderClientProps {
  storeSlug: string;
  storeName: string;
  storeLogo: string | null;
}

export default function BillBuilderClient({ storeSlug, storeName, storeLogo }: BillBuilderClientProps) {
  const router = useRouter();
  const store = useBillBuilderStore();
  const [activeBills, setActiveBills] = useState<ActiveBill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  const [generatedBillId, setGeneratedBillId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [discountInput, setDiscountInput] = useState('');

  // Load active bills
  const loadActiveBills = useCallback(async () => {
    setLoadingBills(true);
    try {
      const bills = (await getActiveBills(storeSlug)) as ActiveBill[];
      setActiveBills(bills);
    } catch {
      // Silently fail — active bills are non-critical
    } finally {
      setLoadingBills(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadActiveBills();
    const interval = setInterval(loadActiveBills, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [loadActiveBills]);

  const subtotal = store.getSubtotal();
  const total = store.getTotal();

  async function handleAddQuickItem(item: QuickItem) {
    if (item.pricePaise === 0) {
      setShowCustomItem(true);
      return;
    }
    store.addItem(item.name, item.pricePaise);
  }

  async function handleAddCustomItem() {
    if (!customName.trim() || !customPrice) return;
    const pricePaise = Math.round(parseFloat(customPrice) * 100);
    if (isNaN(pricePaise) || pricePaise < 0) return;
    store.addItem(customName.trim(), pricePaise);
    setCustomName('');
    setCustomPrice('');
    setShowCustomItem(false);
  }

  async function handleSetDiscount() {
    const discountRs = parseFloat(discountInput || '0');
    if (isNaN(discountRs) || discountRs < 0) return;
    store.setDiscount(Math.round(discountRs * 100));
  }

  async function handleGenerateQR() {
    if (store.items.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const discountPaise = discountInput ? Math.round(parseFloat(discountInput) * 100) : 0;
      const result = await createMerchantBill({
        storeSlug,
        items: store.items.map((i) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice })),
        discount: discountPaise,
      });
      setGeneratedUrl(result.payUrl);
      setGeneratedBillId(result.billId);
      store.clearBill();
      setDiscountInput('');
      await loadActiveBills();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate payment link');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCancelBill(billId: string) {
    try {
      await cancelBill(billId);
      setActiveBills((prev) => prev.filter((b) => b.billId !== billId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to cancel bill');
    }
  }

  function handleCopyLink() {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl).then(() => {
      // no-op — user sees the link
    });
  }

  function handleShareLink() {
    if (!generatedUrl) return;
    if (navigator.share) {
      navigator.share({ title: `Pay at ${storeName}`, url: generatedUrl }).catch(() => {});
    } else {
      handleCopyLink();
    }
  }

  const hasItems = store.items.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          {storeLogo && (
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
              <Image src={storeLogo} alt={storeName} fill sizes="40px" className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">Bill Builder</h1>
            <p className="text-xs text-gray-500">{storeName}</p>
          </div>
          <button
            onClick={() => router.push(`/${storeSlug}/merchant/pay-display`)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Payment Kiosk →
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline font-medium">Dismiss</button>
        </div>
      )}

      {/* Generated QR link */}
      {generatedUrl && (
        <div className="mx-4 mt-4 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-indigo-900">Payment link generated!</p>
          <div className="bg-white rounded-xl px-3 py-2 text-xs font-mono text-gray-600 break-all">
            {generatedUrl}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCopyLink}>Copy Link</Button>
            <Button size="sm" variant="secondary" onClick={handleShareLink}>Share</Button>
            <Button size="sm" variant="ghost" onClick={() => { setGeneratedUrl(null); setGeneratedBillId(null); }}>
              New Bill
            </Button>
          </div>
          <p className="text-xs text-indigo-700">
            Share this link with the customer — expires in 15 minutes. Payment will appear on the kiosk automatically.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Left: Bill construction */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Quick-add grid */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Add</h2>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_ITEMS.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleAddQuickItem(item)}
                  className="bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl py-3 px-2 text-center transition-colors"
                >
                  <p className="text-xs font-medium text-gray-800 leading-tight">{item.name}</p>
                  {item.pricePaise > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{formatINR(item.pricePaise)}</p>
                  )}
                </button>
              ))}
            </div>

            {/* Custom item entry */}
            {showCustomItem && (
              <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-indigo-800">Custom Item</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
                  />
                  <input
                    type="number"
                    placeholder="₹"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-24 px-3 py-2 text-sm border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
                  />
                  <Button size="sm" onClick={handleAddCustomItem}>Add</Button>
                </div>
                <button
                  onClick={() => setShowCustomItem(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Current bill items */}
          {hasItems && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Current Bill ({store.items.length})</h2>
                <button onClick={store.clearBill} className="text-xs text-red-500 hover:text-red-700">
                  Clear all
                </button>
              </div>
              <div className="space-y-2">
                {store.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">@ {formatINR(item.unitPrice)} × {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => store.updateQty(item.id, item.qty - 1)}
                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => store.updateQty(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 w-20 text-right flex-shrink-0">
                      {formatINR(item.qty * item.unitPrice)}
                    </p>
                    <button
                      onClick={() => store.removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Discount */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Discount (₹)</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    min="0"
                    step="1"
                  />
                  <Button size="sm" variant="secondary" onClick={handleSetDiscount}>Apply</Button>
                </div>
                {store.discount > 0 && (
                  <p className="text-xs text-green-600 mt-1">Discount: −{formatINR(store.discount)}</p>
                )}
              </div>

              {/* Totals */}
              <div className="mt-4 pt-3 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                {store.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>−{formatINR(store.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
                  <span>Total</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Generate QR button */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <Button
              fullWidth
              size="lg"
              loading={generating}
              disabled={!hasItems || total <= 0}
              onClick={handleGenerateQR}
              className={hasItems ? '!bg-indigo-600 hover:!bg-indigo-700' : ''}
            >
              {hasItems ? `Generate Payment Link — ${formatINR(total)}` : 'Add items to generate link'}
            </Button>
          </div>
        </div>

        {/* Right: Active bills list */}
        <div className="lg:w-80 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Active Bills ({activeBills.length})</h2>
              <button onClick={loadActiveBills} className="text-xs text-indigo-600 hover:text-indigo-700">
                {loadingBills ? '...' : 'Refresh'}
              </button>
            </div>

            {activeBills.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p>No active bills</p>
                <p className="text-xs mt-1">Generated links will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBills.map((bill) => (
                  <ActiveBillCard
                    key={bill.billId}
                    bill={bill}
                    onCancel={() => handleCancelBill(bill.billId)}
                    onCopy={() => {
                      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${storeSlug}/pay/checkout?billId=${bill.billId}&paymentId=${bill.billId}`;
                      navigator.clipboard.writeText(url).catch(() => {});
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Active Bill Card ──────────────────────────────────────────────────────────
function ActiveBillCard({
  bill,
  onCancel,
  onCopy,
}: {
  bill: ActiveBill;
  onCancel: () => void;
  onCopy: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [status, setStatus] = useState<'active' | 'expiring' | 'expired'>('active');

  useEffect(() => {
    function update() {
      const ms = new Date(bill.expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft('Expired');
        setStatus('expired');
        return;
      }
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      setStatus(ms < 120000 ? 'expiring' : 'active'); // < 2 min = expiring
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [bill.expiresAt]);

  return (
    <div className="border border-gray-200 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{bill.billNumber}</p>
          <p className="text-xs text-gray-500">{bill.items.length} item{bill.items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-bold text-gray-900">{formatINR(bill.total)}</p>
          <p className={cn(
            'text-xs font-medium',
            status === 'expired' ? 'text-red-500' :
            status === 'expiring' ? 'text-orange-500' : 'text-green-600'
          )}>
            {timeLeft}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCopy}
          className="flex-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 rounded-lg py-1.5 hover:bg-indigo-50 transition-colors"
        >
          Copy Link
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 rounded-lg py-1.5 px-3 hover:bg-red-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
