import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  Clock,
  MapPin,
  User,
  Phone,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUpDown,
  Package,
} from 'lucide-react';
import clsx from 'clsx';
import StatusTimeline from '../components/StatusTimeline';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customer: string;
  phone: string;
  address: string;
  items: string[];
  status: OrderStatus;
  source: 'app' | 'web' | 'phone';
  time: string;
  amount: number;
  rider?: string;
}

const orders: Order[] = [
  {
    id: 'ORD-7829',
    customer: 'Sarah Mitchell',
    phone: '+1 (555) 234-5678',
    address: '742 Evergreen Terrace, Springfield, IL 62701',
    items: ['2x Margherita Pizza', '1x Garlic Bread', '2x Coca Cola'],
    status: 'in_transit',
    source: 'app',
    time: '2024-01-15T14:32:00',
    amount: 34.50,
    rider: 'John D.',
  },
  {
    id: 'ORD-7828',
    customer: 'Michael Chen',
    phone: '+1 (555) 345-6789',
    address: '221B Baker Street, London District, NY 10001',
    items: ['1x Chicken Teriyaki Bowl', '1x Miso Soup', '1x Green Tea'],
    status: 'pending',
    source: 'web',
    time: '2024-01-15T14:28:00',
    amount: 28.00,
  },
  {
    id: 'ORD-7827',
    customer: 'Emma Wilson',
    phone: '+1 (555) 456-7890',
    address: '1600 Pennsylvania Avenue, Metro City, DC 20500',
    items: ['1x Classic Burger', '1x French Fries', '1x Milkshake'],
    status: 'delivered',
    source: 'app',
    time: '2024-01-15T14:20:00',
    amount: 52.75,
    rider: 'Alex K.',
  },
  {
    id: 'ORD-7826',
    customer: 'James Rodriguez',
    phone: '+1 (555) 567-8901',
    address: '350 Fifth Avenue, Manhattan, NY 10118',
    items: ['3x Sushi Roll Platter', '1x Edamame', '2x Sake'],
    status: 'delivered',
    source: 'phone',
    time: '2024-01-15T14:15:00',
    amount: 89.99,
    rider: 'Maria S.',
  },
  {
    id: 'ORD-7825',
    customer: 'Lisa Thompson',
    phone: '+1 (555) 678-9012',
    address: '1 Infinite Loop, Cupertino, CA 95014',
    items: ['2x Pad Thai', '1x Spring Rolls', '1x Thai Iced Tea'],
    status: 'preparing',
    source: 'app',
    time: '2024-01-15T14:10:00',
    amount: 31.50,
    rider: 'David L.',
  },
  {
    id: 'ORD-7824',
    customer: 'Robert Kim',
    phone: '+1 (555) 789-0123',
    address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
    items: ['1x Beef Bulgogi', '2x Bibimbap', '1x Kimchi Fried Rice'],
    status: 'confirmed',
    source: 'web',
    time: '2024-01-15T14:05:00',
    amount: 45.00,
  },
  {
    id: 'ORD-7823',
    customer: 'Amanda Foster',
    phone: '+1 (555) 890-1234',
    address: '410 Terry Ave N, Seattle, WA 98109',
    items: ['1x Fish & Chips', '1x Clam Chowder', '1x Apple Pie'],
    status: 'cancelled',
    source: 'phone',
    time: '2024-01-15T14:00:00',
    amount: 38.50,
  },
  {
    id: 'ORD-7822',
    customer: 'David Park',
    phone: '+1 (555) 901-2345',
    address: '1355 Market St, San Francisco, CA 94103',
    items: ['2x BBQ Ribs', '1x Coleslaw', '2x Cornbread'],
    status: 'ready',
    source: 'app',
    time: '2024-01-15T13:55:00',
    amount: 67.00,
    rider: 'Chris M.',
  },
];

const statusColors: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  preparing: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  ready: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  in_transit: { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
  delivered: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
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

const sourceLabels: Record<string, string> = {
  app: 'Mobile App',
  web: 'Website',
  phone: 'Phone',
};

function formatTime(dateString: string): string {
  const date = new Date(dateString);
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

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'amount'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesSource = sourceFilter === 'all' || order.source === sourceFilter;
        return matchesSearch && matchesStatus && matchesSource;
      })
      .sort((a, b) => {
        const order = sortOrder === 'desc' ? -1 : 1;
        if (sortBy === 'time') {
          return (new Date(a.time).getTime() - new Date(b.time).getTime()) * order;
        }
        return (a.amount - b.amount) * order;
      });
  }, [searchQuery, statusFilter, sourceFilter, sortBy, sortOrder]);

  const handleSort = (column: 'time' | 'amount') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredOrders.length} orders found
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'btn-secondary flex items-center gap-2',
              showFilters && 'bg-gray-200'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown
              className={clsx(
                'w-4 h-4 transition-transform',
                showFilters && 'rotate-180'
              )}
            />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                className="input-field"
              >
                <option value="all">All Statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Sources</option>
                {Object.entries(sourceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const statusStyle = statusColors[order.status];
          const isExpanded = expandedOrder === order.id;

          return (
            <div
              key={order.id}
              className="card hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{order.id}</span>
                    <span
                      className={clsx(
                        'badge',
                        statusStyle.bg,
                        statusStyle.text
                      )}
                    >
                      <span
                        className={clsx('w-1.5 h-1.5 rounded-full mr-1.5', statusStyle.dot)}
                      />
                      {statusLabels[order.status]}
                    </span>
                    <span className="badge bg-gray-100 text-gray-600">
                      {sourceLabels[order.source]}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      {order.customer}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {order.address}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {order.phone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(order.amount)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatTime(order.time)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setExpandedOrder(isExpanded ? null : order.id)
                      }
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Eye className="w-5 h-5 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-6">
                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Order Items
                    </h4>
                    <ul className="space-y-2">
                      {order.items.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Status Timeline */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Status Timeline
                    </h4>
                    <StatusTimeline status={order.status} />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    {order.status === 'pending' && (
                      <>
                        <button className="btn-primary flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Confirm Order
                        </button>
                        <button className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50">
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button className="btn-primary flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'ready' && !order.rider && (
                      <button className="btn-primary flex items-center gap-2">
                        Assign Rider
                      </button>
                    )}
                    {order.rider && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Assigned to:</span>
                        <span>{order.rider}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="card text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Sort Info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Sorted by {sortBy === 'time' ? 'time' : 'amount'} ({sortOrder === 'desc' ? 'newest first' : 'oldest first'})
        </span>
        <button
          onClick={() => handleSort(sortBy)}
          className="flex items-center gap-1 hover:text-gray-700"
        >
          <ArrowUpDown className="w-4 h-4" />
          Change sort
        </button>
      </div>
    </div>
  );
}
