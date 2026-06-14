import { Star, Package, Clock, TrendingUp, Phone, MapPin, Bike, MoreVertical } from 'lucide-react';
import clsx from 'clsx';

interface Rider {
  id: string;
  name: string;
  phone: string;
  photo: string;
  status: 'online' | 'offline' | 'busy';
  rating: number;
  totalDeliveries: number;
  successRate: number;
  avgDeliveryTime: number;
  earnings: number;
  joinedDate: string;
  vehicle: 'bike' | 'scooter' | 'car';
  currentLocation?: {
    lat: number;
    lng: number;
  };
  currentOrder?: string;
}

const statusColors = {
  online: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  offline: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  busy: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

const statusLabels = {
  online: 'Online',
  offline: 'Offline',
  busy: 'On Delivery',
};

const vehicleIcons = {
  bike: Bike,
  scooter: Bike,
  car: Bike,
};

interface RiderCardProps {
  rider: Rider;
  onSelect?: () => void;
  isSelected?: boolean;
}

export default function RiderCard({ rider, onSelect, isSelected }: RiderCardProps) {
  const style = statusColors[rider.status];
  const VehicleIcon = vehicleIcons[rider.vehicle];

  return (
    <div
      onClick={onSelect}
      className={clsx(
        'card hover:shadow-md transition-all cursor-pointer',
        isSelected && 'ring-2 ring-primary-500'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <img
          src={rider.photo}
          alt={rider.name}
          className="w-14 h-14 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">
              {rider.name}
            </span>
            <span className={clsx('badge', style.bg, style.text)}>
              <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5', style.dot)} />
              {statusLabels[rider.status]}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-gray-900">{rider.rating}</span>
            <span className="text-sm text-gray-500">({rider.totalDeliveries} deliveries)</span>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{rider.avgDeliveryTime}m</div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            Avg Time
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{rider.successRate}%</div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <TrendingUp className="w-3 h-3" />
            Success
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">${(rider.earnings / 1000).toFixed(1)}k</div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <Package className="w-3 h-3" />
            Earned
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <VehicleIcon className="w-4 h-4" />
            <span className="capitalize">{rider.vehicle}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`tel:${rider.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </a>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current order badge */}
      {rider.currentOrder && (
        <div className="mt-3 px-3 py-2 bg-primary-50 rounded-lg">
          <div className="text-xs text-primary-600 font-medium">
            Currently delivering: {rider.currentOrder}
          </div>
        </div>
      )}
    </div>
  );
}
