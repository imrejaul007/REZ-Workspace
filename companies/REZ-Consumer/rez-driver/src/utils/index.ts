import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import {
  DeliveryStatus,
  DeliveryType,
  DeliveryTypeInfo,
  DELIVERY_TYPE_CONFIG,
  VehicleType,
  VehicleCategory,
  VehicleCapacity,
  RideStatus,
} from '../types';

// ============================================================================
// DATE FORMATTING UTILITIES
// ============================================================================

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
};

export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatSmartDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) {
    return `Today, ${format(d, 'h:mm a')}`;
  }
  if (isYesterday(d)) {
    return `Yesterday, ${format(d, 'h:mm a')}`;
  }
  return format(d, 'MMM d, h:mm a');
};

export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return 'Expired';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatEarnings = (amount: number, showSign = false): string => {
  const formatted = formatCurrency(amount);
  if (showSign && amount > 0) {
    return `+${formatted}`;
  }
  return formatted;
};

// ============================================================================
// DISTANCE FORMATTING
// ============================================================================

export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

export const formatDistanceMiles = (km: number): string => {
  const miles = km * 0.621371;
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
};

// ============================================================================
// DURATION FORMATTING
// ============================================================================

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
};

export const formatDurationSeconds = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  return formatDuration(Math.round(seconds / 60));
};

// ============================================================================
// DELIVERY STATUS UTILITIES
// ============================================================================

export const getStatusColor = (status: DeliveryStatus): string => {
  switch (status) {
    case 'pending':
      return '#FFA500'; // Orange
    case 'accepted':
      return '#2196F3'; // Blue
    case 'arrived_pickup':
      return '#3F51B5'; // Indigo
    case 'picked_up':
      return '#9C27B0'; // Purple
    case 'in_transit':
      return '#00BCD4'; // Cyan
    case 'arrived_dropoff':
      return '#00ACC1'; // Teal
    case 'delivered':
      return '#4CAF50'; // Green
    case 'cancelled':
      return '#9E9E9E'; // Grey
    case 'failed':
      return '#F44336'; // Red
    default:
      return '#757575'; // Grey
  }
};

export const getStatusLabel = (status: DeliveryStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Heading to Pickup';
    case 'arrived_pickup':
      return 'Arrived at Pickup';
    case 'picked_up':
      return 'Picked Up';
    case 'in_transit':
      return 'In Transit';
    case 'arrived_dropoff':
      return 'Arrived at Dropoff';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
};

export const getStatusIcon = (status: DeliveryStatus): string => {
  switch (status) {
    case 'pending':
      return 'clock';
    case 'accepted':
      return 'navigation';
    case 'arrived_pickup':
      return 'map-marker-check';
    case 'picked_up':
      return 'package-variant';
    case 'in_transit':
      return 'truck-delivery';
    case 'arrived_dropoff':
      return 'map-marker';
    case 'delivered':
      return 'check-circle';
    case 'cancelled':
      return 'cancel';
    case 'failed':
      return 'alert-circle';
    default:
      return 'help-circle';
  }
};

export const isDeliveryActive = (status: DeliveryStatus): boolean => {
  return ['accepted', 'arrived_pickup', 'picked_up', 'in_transit', 'arrived_dropoff'].includes(status);
};

export const isDeliveryComplete = (status: DeliveryStatus): boolean => {
  return status === 'delivered';
};

// ============================================================================
// RIDE STATUS UTILITIES
// ============================================================================

export const getRideStatusColor = (status: RideStatus): string => {
  switch (status) {
    case 'pending':
      return '#FFA500';
    case 'accepted':
      return '#2196F3';
    case 'arrived':
      return '#4CAF50';
    case 'in_progress':
      return '#00BCD4';
    case 'completed':
      return '#4CAF50';
    case 'cancelled':
      return '#9E9E9E';
    case 'no_show':
      return '#F44336';
    default:
      return '#757575';
  }
};

export const getRideStatusLabel = (status: RideStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Heading to Pickup';
    case 'arrived':
      return 'Arrived';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'No Show';
    default:
      return status;
  }
};

// ============================================================================
// DELIVERY TYPE UTILITIES
// ============================================================================

export const getDeliveryTypeInfo = (type: DeliveryType): DeliveryTypeInfo => {
  return DELIVERY_TYPE_CONFIG[type];
};

export const getDeliveryTypeName = (type: DeliveryType): string => {
  return DELIVERY_TYPE_CONFIG[type]?.name || type;
};

export const getDeliveryTypeColor = (type: DeliveryType): string => {
  return DELIVERY_TYPE_CONFIG[type]?.color || '#757575';
};

export const getDeliveryTypeIcon = (type: DeliveryType): string => {
  return DELIVERY_TYPE_CONFIG[type]?.icon || 'package';
};

export const isDeliveryTypeActive = (type: DeliveryType): boolean => {
  const now = new Date();
  const hour = now.getHours();
  // Peak hours: 11-14 (lunch) and 18-21 (dinner)
  const isPeakHour = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
  return isPeakHour;
};

export const getDeliveryTypeEmoji = (type: DeliveryType): string => {
  switch (type) {
    case 'food':
      return 'restaurant';
    case 'grocery':
      return 'shopping-cart';
    case 'medicine':
      return 'medical-bag';
    case 'courier':
      return 'package-variant';
    case 'furniture':
      return 'sofa';
    case 'cab':
      return 'car';
    case 'ride_share':
      return 'account-group';
    default:
      return 'package';
  }
};

export const getAllDeliveryTypes = (): DeliveryType[] => {
  return ['food', 'grocery', 'medicine', 'courier', 'furniture', 'cab', 'ride_share'];
};

export const getDeliveryServiceTypes = (): DeliveryType[] => {
  return ['food', 'grocery', 'medicine', 'courier', 'furniture'];
};

export const getRideServiceTypes = (): DeliveryType[] => {
  return ['cab', 'ride_share'];
};

// ============================================================================
// VEHICLE UTILITIES
// ============================================================================

export const getVehicleCategory = (type: VehicleType): VehicleCategory => {
  if (type.includes('bike')) return 'bike';
  if (type.includes('motorcycle')) return 'motorcycle';
  if (type.includes('van') || type.includes('truck') || type === 'car_van') return 'van';
  if (type === 'flatbed' || type === 'delivery_truck') return 'truck';
  return 'car';
};

export const getVehicleCategoryLabel = (category: VehicleCategory): string => {
  switch (category) {
    case 'bike':
      return 'Bike';
    case 'motorcycle':
      return 'Motorcycle';
    case 'car':
      return 'Car';
    case 'van':
      return 'Van';
    case 'truck':
      return 'Truck';
    default:
      return category;
  }
};

export const formatVehicleType = (type: VehicleType): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const canHandleDeliveryType = (
  vehicleType: VehicleType,
  deliveryType: DeliveryType
): boolean => {
  const config = DELIVERY_TYPE_CONFIG[deliveryType];
  const vehicleCategory = getVehicleCategory(vehicleType);
  return config.vehicleRequirements.includes(vehicleCategory);
};

export const formatCapacity = (capacity: VehicleCapacity): string => {
  const weight = capacity.maxWeight >= 1000
    ? `${(capacity.maxWeight / 1000).toFixed(1)}t`
    : `${capacity.maxWeight}kg`;
  const volume = capacity.maxVolume >= 1000
    ? `${(capacity.maxVolume / 1000).toFixed(1)}m³`
    : `${capacity.maxVolume}L`;
  return `${weight} | ${volume}`;
};

// ============================================================================
// PHONE NUMBER UTILITIES
// ============================================================================

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const isValidLicensePlate = (plate: string): boolean => {
  // Basic validation for US license plates
  const plateRegex = /^[A-Z0-9]{2,8}$/i;
  return plateRegex.test(plate);
};

// ============================================================================
// GEOLOCATION UTILITIES
// ============================================================================

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

// ============================================================================
// GENERAL UTILITIES
// ============================================================================

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const sortByDate = <T extends { createdAt: Date | string }>(
  items: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const sortDeliveriesByPriority = <T extends { status: DeliveryStatus }>(
  deliveries: T[]
): T[] => {
  const statusPriority: Record<DeliveryStatus, number> = {
    in_transit: 0,
    arrived_dropoff: 1,
    picked_up: 2,
    arrived_pickup: 3,
    accepted: 4,
    pending: 5,
    delivered: 6,
    failed: 7,
    cancelled: 8,
  };

  return [...deliveries].sort((a, b) => {
    return statusPriority[a.status] - statusPriority[b.status];
  });
};

export const filterByDeliveryType = <T extends { deliveryType: DeliveryType }>(
  items: T[],
  types: DeliveryType[]
): T[] => {
  if (types.length === 0) return items;
  return items.filter((item) => types.includes(item.deliveryType));
};

// ============================================================================
// EARNINGS UTILITIES
// ============================================================================

export const calculateEarningsForDelivery = (
  distance: number,
  weight: number,
  deliveryType: DeliveryType,
  surgeMultiplier = 1.0,
  tip = 0
): {
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  surgeFee: number;
  tip: number;
  total: number;
} => {
  const config = DELIVERY_TYPE_CONFIG[deliveryType];
  const baseFee = config.baseEarning;
  const distanceFee = distance * config.perKmRate;
  const weightFee = weight * config.perKgRate;
  const surgeFee = (baseFee + distanceFee + weightFee) * (surgeMultiplier - 1);
  const total = (baseFee + distanceFee + weightFee) * surgeMultiplier + tip;

  return {
    baseFee,
    distanceFee,
    weightFee,
    surgeFee,
    tip,
    total,
  };
};

export const calculateRideEarnings = (
  distance: number,
  duration: number,
  rideType: 'cab' | 'ride_share',
  surgeMultiplier = 1.0,
  tip = 0
): {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeFare: number;
  tip: number;
  total: number;
} => {
  const config = DELIVERY_TYPE_CONFIG[rideType];
  const baseFare = config.baseEarning;
  const perKmRate = config.perKmRate;
  const perMinuteRate = rideType === 'cab' ? 0.5 : 0.3;

  const distanceFare = distance * perKmRate;
  const timeFare = duration * perMinuteRate;
  const fare = baseFare + distanceFare + timeFare;
  const surgeFare = fare * (surgeMultiplier - 1);
  const total = (fare + surgeFare) + tip;

  return {
    baseFare,
    distanceFare,
    timeFare,
    surgeFare,
    tip,
    total,
  };
};

// ============================================================================
// COLOR UTILITIES
// ============================================================================

export const getContrastColor = (hexColor: string): string => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.replace('#', '').substring(0, 2), 16);
  const g = parseInt(hex.replace('#', '').substring(2, 4), 16);
  const b = parseInt(hex.replace('#', '').substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
