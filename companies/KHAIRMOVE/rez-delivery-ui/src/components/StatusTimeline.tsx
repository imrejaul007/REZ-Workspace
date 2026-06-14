import clsx from 'clsx';
import {
  ShoppingCart,
  CheckCircle,
  ChefHat,
  Package,
  Bike,
  Home,
  XCircle,
} from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled';

const statusFlow: { status: OrderStatus; label: string; icon: typeof ShoppingCart }[] = [
  { status: 'pending', label: 'Order Placed', icon: ShoppingCart },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'preparing', label: 'Preparing', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: Package },
  { status: 'in_transit', label: 'In Transit', icon: Bike },
  { status: 'delivered', label: 'Delivered', icon: Home },
];

const statusIndex: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  in_transit: 4,
  delivered: 5,
  cancelled: -1,
};

interface StatusTimelineProps {
  status: OrderStatus;
  compact?: boolean;
}

export default function StatusTimeline({ status, compact = false }: StatusTimelineProps) {
  const currentIndex = statusIndex[status];
  const isCancelled = status === 'cancelled';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isCancelled ? (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Order Cancelled</span>
          </div>
        ) : (
          <>
            <span className="text-sm text-gray-600">
              {statusFlow[currentIndex]?.label || 'Unknown'}
            </span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${(currentIndex / (statusFlow.length - 1)) * 100}%` }}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {isCancelled ? (
        <div className="flex items-center justify-center p-6 bg-red-50 rounded-lg">
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="w-6 h-6" />
            <span className="text-lg font-medium">Order Cancelled</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          {/* Progress line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 mx-[5%]">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentIndex / (statusFlow.length - 1)) * 100}%` }}
            />
          </div>

          {/* Status steps */}
          <div className="relative flex justify-between w-full">
            {statusFlow.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div key={step.status} className="flex flex-col items-center">
                  <div
                    className={clsx(
                      'relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
                      isCompleted
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-400',
                      isCurrent && 'ring-4 ring-primary-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={clsx(
                      'mt-2 text-xs font-medium text-center',
                      isCompleted ? 'text-primary-700' : 'text-gray-400',
                      isCurrent && 'font-semibold'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status descriptions */}
      {!isCancelled && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-sm text-gray-700">
              {currentIndex === 0 && 'Order has been received and is waiting for confirmation.'}
              {currentIndex === 1 && 'Restaurant has confirmed the order and will start preparing.'}
              {currentIndex === 2 && 'The kitchen is preparing your order.'}
              {currentIndex === 3 && 'Order is ready and waiting for rider pickup.'}
              {currentIndex === 4 && 'Rider has picked up the order and is on the way.'}
              {currentIndex === 5 && 'Order has been successfully delivered!'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
