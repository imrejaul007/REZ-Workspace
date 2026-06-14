import { useState } from 'react';
import {
  Search,
  Phone,
  MapPin,
  Star,
  Clock,
  Package,
  XCircle,
  MoreVertical,
  User,
  Bike,
  Filter,
} from 'lucide-react';
import clsx from 'clsx';
import RiderCard from '../components/RiderCard';

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

const riders: Rider[] = [
  {
    id: 'RID-001',
    name: 'John Davis',
    phone: '+1 (555) 111-2222',
    photo: 'https://i.pravatar.cc/150?u=john',
    status: 'online',
    rating: 4.9,
    totalDeliveries: 1247,
    successRate: 98.5,
    avgDeliveryTime: 24,
    earnings: 8420,
    joinedDate: '2023-03-15',
    vehicle: 'bike',
    currentLocation: { lat: 39.7830, lng: -89.6450 },
    currentOrder: 'ORD-7829',
  },
  {
    id: 'RID-002',
    name: 'Maria Santos',
    phone: '+1 (555) 222-3333',
    photo: 'https://i.pravatar.cc/150?u=maria',
    status: 'online',
    rating: 4.8,
    totalDeliveries: 2156,
    successRate: 97.2,
    avgDeliveryTime: 22,
    earnings: 12450,
    joinedDate: '2022-08-20',
    vehicle: 'scooter',
    currentLocation: { lat: 39.7890, lng: -89.6500 },
  },
  {
    id: 'RID-003',
    name: 'Alex Kim',
    phone: '+1 (555) 333-4444',
    photo: 'https://i.pravatar.cc/150?u=alex',
    status: 'busy',
    rating: 4.7,
    totalDeliveries: 892,
    successRate: 96.8,
    avgDeliveryTime: 28,
    earnings: 5680,
    joinedDate: '2023-06-10',
    vehicle: 'bike',
    currentOrder: 'ORD-7830',
  },
  {
    id: 'RID-004',
    name: 'David Lee',
    phone: '+1 (555) 444-5555',
    photo: 'https://i.pravatar.cc/150?u=david',
    status: 'online',
    rating: 4.6,
    totalDeliveries: 567,
    successRate: 95.4,
    avgDeliveryTime: 31,
    earnings: 3450,
    joinedDate: '2023-09-01',
    vehicle: 'car',
  },
  {
    id: 'RID-005',
    name: 'Emma Wilson',
    phone: '+1 (555) 555-6666',
    photo: 'https://i.pravatar.cc/150?u=emma',
    status: 'offline',
    rating: 4.9,
    totalDeliveries: 3421,
    successRate: 99.1,
    avgDeliveryTime: 19,
    earnings: 18920,
    joinedDate: '2021-12-05',
    vehicle: 'scooter',
  },
  {
    id: 'RID-006',
    name: 'Chris Martinez',
    phone: '+1 (555) 666-7777',
    photo: 'https://i.pravatar.cc/150?u=chris',
    status: 'online',
    rating: 4.5,
    totalDeliveries: 423,
    successRate: 94.2,
    avgDeliveryTime: 35,
    earnings: 2890,
    joinedDate: '2024-01-02',
    vehicle: 'bike',
    currentLocation: { lat: 39.7810, lng: -89.6420 },
  },
];

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

export default function Riders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'busy'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredRiders = riders.filter((rider) => {
    const matchesSearch =
      rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rider.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onlineRiders = riders.filter((r) => r.status === 'online').length;
  const busyRiders = riders.filter((r) => r.status === 'busy').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-50">
              <Bike className="w-5 h-5 text-green-600" />
            </div>
            <div className="stat-value">{onlineRiders}</div>
          </div>
          <div className="stat-label">Riders Online</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div className="stat-value">{busyRiders}</div>
          </div>
          <div className="stat-label">On Delivery</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary-50">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="stat-value">{riders.length}</div>
          </div>
          <div className="stat-label">Total Riders</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'btn-secondary flex items-center gap-2',
                showFilters && 'bg-gray-200'
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | 'online' | 'offline' | 'busy')
                }
                className="input-field"
              >
                <option value="all">All Statuses</option>
                <option value="online">Online</option>
                <option value="busy">On Delivery</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Riders Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRiders.map((rider) => (
            <RiderCard
              key={rider.id}
              rider={rider}
              onSelect={() => setSelectedRider(rider)}
              isSelected={selectedRider?.id === rider.id}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRiders.map((rider) => {
            const style = statusColors[rider.status];
            return (
              <div
                key={rider.id}
                onClick={() => setSelectedRider(rider)}
                className={clsx(
                  'card hover:shadow-md transition-all cursor-pointer',
                  selectedRider?.id === rider.id && 'ring-2 ring-primary-500'
                )}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={rider.photo}
                    alt={rider.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {rider.name}
                      </span>
                      <span className="badge bg-gray-100 text-gray-600 text-xs">
                        {rider.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {rider.rating}
                      </span>
                      <span>{rider.totalDeliveries} deliveries</span>
                      <span className="capitalize">{rider.vehicle}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={clsx('badge', style.bg, style.text)}>
                      <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5', style.dot)} />
                      {statusLabels[rider.status]}
                    </span>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredRiders.length === 0 && (
        <div className="card text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No riders found</h3>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Rider Detail Modal */}
      {selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedRider(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedRider.photo}
                  alt={selectedRider.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedRider.name}
                  </h2>
                  <span className="badge bg-gray-100 text-gray-600">
                    {selectedRider.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRider(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div
                className={clsx(
                  'flex items-center gap-2',
                  statusColors[selectedRider.status].text
                )}
              >
                <span
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    statusColors[selectedRider.status].dot
                  )}
                />
                {statusLabels[selectedRider.status]}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedRider.rating}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    Rating
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedRider.totalDeliveries}
                  </div>
                  <div className="text-sm text-gray-500">Total Deliveries</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedRider.avgDeliveryTime}m
                  </div>
                  <div className="text-sm text-gray-500">Avg. Time</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedRider.successRate}%
                  </div>
                  <div className="text-sm text-gray-500">Success Rate</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedRider.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Bike className="w-4 h-4 text-gray-400" />
                  <span className="capitalize">{selectedRider.vehicle}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Joined {new Date(selectedRider.joinedDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">Total Earnings</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${selectedRider.earnings.toLocaleString()}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <a
                  href={`tel:${selectedRider.phone}`}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
                <button className="btn-secondary flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Locate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
