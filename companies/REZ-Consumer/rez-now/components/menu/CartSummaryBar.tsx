'use client';

import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { formatINR } from '@/lib/utils/currency';

export default function CartSummaryBar({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  const { items, totalItems, subtotal } = useCartStore();
  const count = totalItems();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-transparent pointer-events-none">
      <button
        onClick={() => router.push(`/${storeSlug}/cart`)}
        aria-label={`View cart, ${count} ${count === 1 ? 'item' : 'items'}`}
        className="w-full flex items-center justify-between bg-indigo-600 text-white px-5 py-4 rounded-2xl shadow-lg pointer-events-auto active:scale-[0.98] transition-transform focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
      >
        <span className="flex items-center gap-2" aria-hidden="true">
          <span className="bg-indigo-500 rounded-lg w-6 h-6 flex items-center justify-center text-xs font-bold">{count}</span>
          <span className="text-sm font-semibold">{count === 1 ? '1 item' : `${count} items`}</span>
        </span>
        <span className="text-sm font-bold" aria-hidden="true">View Cart · {formatINR(subtotal())}</span>
      </button>
    </div>
  );
}
