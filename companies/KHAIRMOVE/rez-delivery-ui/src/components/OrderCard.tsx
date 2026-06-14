import { Clock, User, MapPin, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customer: string;
  address: string;
  status: OrderStatus;
  time: string;
  amount: number;
  rider: string | null;
}

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  confirmed: { bg: 'bg-blue-50', text: 'text-blue-700' },
  preparing: { bg: 'bg-purple-50', text: 'text-purple-700' },
  ready: { bg: 'bg-orange-50', text: 'text-orange-700' },
  in_transit: { bg: 'bg-primary-50', text: 'text-primary-700' },
  delivered: { bg: 'bg-green-50', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700' },
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
}

export default function OrderCard({ order, showActions = true }: OrderCardProps) {
  const statusStyle = statusColors[order.status];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{order.id}</span>
            <span className={clsx('badge', statusStyle.bg, statusStyle.text)}>
              {statusLabels[order.status]}
            </span>
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              {order.customer}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate max-w-[200px]">{order.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4 text-gray-400" />
              {order.time}
            </div>
          </div>

          {order.rider && (
            <div className="mt-2 text-sm text-gray-500">
              Rider: <span className="font-medium text-gray-700">{order.rider}</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            ${order.amount.toFixed(2)}
          </div>
          {showActions && (
            <Link
              to="/tracking"
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium mt-2"
            >
              Track
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
