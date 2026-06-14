'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import KitchenDisplay from '@/components/kds/KitchenDisplay';
import { KDSOrder, KDSOrderStatus } from '@/lib/types';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';

export default function KitchenPage() {
  const params = useParams();
  const storeSlug = params.storeSlug as string;
  const [selectedOrder, setSelectedOrder] = useState<KDSOrder | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Get store ID from localStorage or context (in production, this would come from auth)
  const storeId = 'demo-store-id'; // This would be fetched based on storeSlug

  return (
    <>
      {!showFullscreen ? (
        <div className="min-h-screen bg-gray-100">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
                <p className="text-sm text-gray-500">{storeSlug}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFullscreen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Enter Fullscreen
                </button>
              </div>
            </div>
          </header>

          {/* KDS Component */}
          <main className="p-6">
            <KitchenDisplay
              storeId={storeId}
              storeSlug={storeSlug}
              refreshInterval={30000} // Refresh every 30 seconds
              soundEnabled={true}
              onOrderClick={(order) => setSelectedOrder(order)}
            />
          </main>

          {/* Order Detail Modal */}
          {selectedOrder && (
            <OrderDetailModal
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
            />
          )}
        </div>
      ) : (
        <div className="fixed inset-0 z-50 bg-gray-900">
          <KitchenDisplay
            storeId={storeId}
            storeSlug={storeSlug}
            refreshInterval={30000}
            soundEnabled={true}
            onOrderClick={(order) => setSelectedOrder(order)}
          />

          {/* Exit fullscreen button */}
          <button
            onClick={() => setShowFullscreen(false)}
            className="fixed top-4 right-4 z-50 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium backdrop-blur"
          >
            Exit Fullscreen
          </button>

          {/* Order Detail Modal */}
          {selectedOrder && (
            <OrderDetailModal
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              darkMode={true}
            />
          )}
        </div>
      )}
    </>
  );
}

// Order Detail Modal Component
interface OrderDetailModalProps {
  order: KDSOrder;
  onClose: () => void;
  darkMode?: boolean;
}

function OrderDetailModal({ order, onClose, darkMode = false }: OrderDetailModalProps) {
  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const subtextClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative rounded-2xl p-6 w-full max-w-lg', bgClass)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={cn('text-xl font-bold', textClass)}>
              Order #{order.orderNumber}
            </h2>
            <p className={subtextClass}>
              {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
              {order.customerName && ` - ${order.customerName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn('p-2 rounded-lg hover:bg-gray-100', darkMode && 'hover:bg-gray-700')}
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="space-y-4 mb-6">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start gap-4">
              <div className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold',
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              )}>
                {item.quantity}
              </div>
              <div className="flex-1">
                <p className={cn('font-semibold', textClass)}>{item.name}</p>
                {item.customizations && Object.keys(item.customizations).length > 0 && (
                  <p className={cn('text-sm', subtextClass)}>
                    {Object.entries(item.customizations)
                      .map(([key, values]) => `${key}: ${values.join(', ')}`)
                      .join(' | ')}
                  </p>
                )}
                {item.notes && (
                  <p className="text-sm text-yellow-500 mt-1">Note: {item.notes}</p>
                )}
              </div>
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-medium capitalize',
                item.status === 'ready' ? 'bg-green-100 text-green-700' :
                item.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              )}>
                {item.status}
              </span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className={cn('p-4 rounded-lg mb-6', darkMode ? 'bg-gray-700' : 'bg-yellow-50')}>
            <p className={cn('text-sm font-medium', darkMode ? 'text-yellow-300' : 'text-yellow-800')}>
              Order Notes: {order.notes}
            </p>
          </div>
        )}

        {/* Order Info */}
        <div className={cn('flex items-center justify-between pt-4 border-t', darkMode ? 'border-gray-700' : 'border-gray-200')}>
          <div>
            <p className={subtextClass}>Placed at</p>
            <p className={textClass}>{new Date(order.createdAt).toLocaleTimeString()}</p>
          </div>
          <div className="text-right">
            <p className={subtextClass}>Time elapsed</p>
            <p className={cn('text-lg font-bold', textClass)}>
              {Math.floor(order.elapsedSeconds / 60)}:{(order.elapsedSeconds % 60).toString().padStart(2, '0')}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
