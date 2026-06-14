import { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Phone,
  Package,
  User,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import TrackingMap from '../components/TrackingMap';
import StatusTimeline from '../components/StatusTimeline';

interface TrackingOrder {
  id: string;
  customer: string;
  phone: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered';
  items: string[];
  amount: number;
  rider?: {
    name: string;
    phone: string;
    rating: number;
  };
  estimatedArrival: Date;
  distance: number;
  coordinates: {
    pickup: [number, number];
    delivery: [number, number];
    rider: [number, number];
  };
}

const trackingOrders: TrackingOrder[] = [
  {
    id: 'ORD-7829',
    customer: 'Sarah Mitchell',
    phone: '+1 (555) 234-5678',
    pickupAddress: '123 Restaurant Lane, Springfield, IL 62701',
    deliveryAddress: '742 Evergreen Terrace, Springfield, IL 62701',
    status: 'in_transit',
    items: ['2x Margherita Pizza', '1x Garlic Bread', '2x Coca Cola'],
    amount: 34.50,
    rider: {
      name: 'John Davis',
      phone: '+1 (555) 111-2222',
      rating: 4.9,
    },
    estimatedArrival: new Date(Date.now() + 12 * 60000),
    distance: 3.2,
    coordinates: {
      pickup: [-89.6501, 39.7817],
      delivery: [-89.6401, 39.7850],
      rider: [-89.6450, 39.7830],
    },
  },
  {
    id: 'ORD-7825',
    customer: 'Lisa Thompson',
    phone: '+1 (555) 678-9012',
    pickupAddress: '456 Thai Kitchen Ave, Cupertino, CA 95014',
    deliveryAddress: '1 Infinite Loop, Cupertino, CA 95014',
    status: 'preparing',
    items: ['2x Pad Thai', '1x Spring Rolls', '1x Thai Iced Tea'],
    amount: 31.50,
    estimatedArrival: new Date(Date.now() + 45 * 60000),
    distance: 2.8,
    coordinates: {
      pickup: [-122.0322, 37.3318],
      delivery: [-122.0300, 37.3300],
      rider: [-122.0322, 37.3318],
    },
  },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function CountdownTimer({ targetTime }: { targetTime: Date }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetTime.getTime() - now;
      setTimeLeft(Math.max(0, Math.floor(distance / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="font-mono text-4xl font-bold text-primary-600">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}

export default function Tracking() {
  const [selectedOrder, setSelectedOrder] = useState<TrackingOrder | null>(null);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (trackingOrders.length > 0 && !selectedOrder) {
      setSelectedOrder(trackingOrders[0]);
    }
  }, []);

  const activeOrders = trackingOrders.filter(
    (order) => order.status === 'in_transit' || order.status === 'ready'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeOrders.length} active deliveries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
              isLive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
            )}
          >
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              )}
            />
            {isLive ? 'Live' : 'Paused'}
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {isLive ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Active Orders
          </h2>
          <div className="space-y-3">
            {trackingOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={clsx(
                  'w-full text-left card hover:shadow-md transition-all',
                  selectedOrder?.id === order.id && 'ring-2 ring-primary-500'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{order.id}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {order.customer}
                    </div>
                  </div>
                  <ChevronRight
                    className={clsx(
                      'w-5 h-5 text-gray-400 transition-transform',
                      selectedOrder?.id === order.id && 'rotate-90'
                    )}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={clsx(
                      'badge',
                      order.status === 'in_transit'
                        ? 'bg-primary-50 text-primary-700'
                        : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {order.status === 'in_transit' ? 'In Transit' : 'Ready'}
                  </span>
                  {order.status === 'in_transit' && (
                    <span className="text-sm font-medium text-primary-600">
                      ETA {formatTime(order.estimatedArrival)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map and Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrder ? (
            <>
              {/* Map */}
              <div className="card p-0 overflow-hidden">
                <TrackingMap
                  pickup={selectedOrder.coordinates.pickup}
                  delivery={selectedOrder.coordinates.delivery}
                  rider={selectedOrder.status === 'in_transit' ? selectedOrder.coordinates.rider : undefined}
                  isLive={isLive && selectedOrder.status === 'in_transit'}
                />
              </div>

              {/* ETA Banner */}
              {selectedOrder.status === 'in_transit' && (
                <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-primary-100 text-sm font-medium">
                        Estimated Time of Arrival
                      </div>
                      <div className="mt-1">
                        <CountdownTimer targetTime={selectedOrder.estimatedArrival} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-primary-100 text-sm">
                        Distance Remaining
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {selectedOrder.distance} km
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rider Info */}
              {selectedOrder.rider && (
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {selectedOrder.rider.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="text-yellow-500">★</span>
                          {selectedOrder.rider.rating} rating
                        </div>
                      </div>
                    </div>
                    <a
                      href={`tel:${selectedOrder.rider.phone}`}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Info */}
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                    Delivery Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Deliver to</div>
                        <div className="font-medium text-gray-900">
                          {selectedOrder.customer}
                        </div>
                        <div className="text-sm text-gray-600 mt-0.5">
                          {selectedOrder.deliveryAddress}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Navigation className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Pickup from</div>
                        <div className="text-sm text-gray-900 mt-0.5">
                          {selectedOrder.pickupAddress}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4 text-gray-400" />
                      {selectedOrder.items.length} items
                    </div>
                    <ul className="space-y-1">
                      {selectedOrder.items.slice(0, 3).map((item, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 pl-6"
                        >
                          {item}
                        </li>
                      ))}
                      {selectedOrder.items.length > 3 && (
                        <li className="text-sm text-gray-500 pl-6">
                          +{selectedOrder.items.length - 3} more items
                        </li>
                      )}
                    </ul>
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(selectedOrder.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Order Progress
                </h3>
                <StatusTimeline status={selectedOrder.status} />
              </div>
            </>
          ) : (
            <div className="card text-center py-16">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No Order Selected
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Select an order from the list to view tracking details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
