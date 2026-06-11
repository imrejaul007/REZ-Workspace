/**
 * Catalog Service
 * Business logic for managing salon services, categories, packages, and availability
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Service,
  ServiceWithTimestamps,
  Category,
  Package,
  CreateServiceInput,
  UpdateServiceInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreatePackageInput,
  UpdatePackageInput,
  ServiceAvailability,
  TimeSlot,
  StaffAvailability,
  InMemoryStore,
  createEmptyStore,
  Booking,
  Currency,
} from '../models/service.model';

// ============================================
// Store Singleton
// ============================================

let store: InMemoryStore = createEmptyStore();

// Default business hours
const BUSINESS_HOURS = {
  start: '09:00',
  end: '20:00',
  slotDuration: 30, // minutes
};

const DEFAULT_CURRENCY: Currency = 'USD';

// ============================================
// Service Helpers
// ============================================

const getCurrentTimestamp = (): string => new Date().toISOString();

const getDefaultServiceValues = () => ({
  currency: DEFAULT_CURRENCY,
  requiresConsultation: false,
  prepTime: 0,
  cleanupTime: 0,
  availableStaff: [],
  images: [],
  tags: [],
  isActive: true,
});

// ============================================
// Service Business Logic
// ============================================

export const createService = (input: CreateServiceInput): ServiceWithTimestamps => {
  const now = getCurrentTimestamp();
  const defaults = getDefaultServiceValues();

  const service: ServiceWithTimestamps = {
    id: uuidv4(),
    name: input.name,
    description: input.description,
    category: input.category,
    duration: input.duration,
    price: input.price,
    currency: input.currency || defaults.currency,
    requiresConsultation: input.requiresConsultation ?? defaults.requiresConsultation,
    prepTime: input.prepTime ?? defaults.prepTime,
    cleanupTime: input.cleanupTime ?? defaults.cleanupTime,
    availableStaff: input.availableStaff || defaults.availableStaff,
    isActive: defaults.isActive,
    images: input.images || defaults.images,
    tags: input.tags || defaults.tags,
    createdAt: now,
    updatedAt: now,
  };

  store.services.set(service.id, service);
  return service;
};

export const getServiceById = (id: string): ServiceWithTimestamps | undefined => {
  return store.services.get(id);
};

export const getAllServices = (includeInactive = false): ServiceWithTimestamps[] => {
  const services = Array.from(store.services.values());
  if (!includeInactive) {
    return services.filter((s) => s.isActive);
  }
  return services;
};

export const getServicesByCategory = (category: string): ServiceWithTimestamps[] => {
  return Array.from(store.services.values()).filter(
    (s) => s.category.toLowerCase() === category.toLowerCase() && s.isActive
  );
};

export const updateService = (id: string, input: UpdateServiceInput): ServiceWithTimestamps | null => {
  const service = store.services.get(id);
  if (!service) return null;

  const updatedService: ServiceWithTimestamps = {
    ...service,
    ...input,
    id: service.id, // prevent id change
    createdAt: service.createdAt, // prevent createdAt change
    updatedAt: getCurrentTimestamp(),
  };

  store.services.set(id, updatedService);
  return updatedService;
};

export const deleteService = (id: string): boolean => {
  return store.services.delete(id);
};

export const softDeleteService = (id: string): ServiceWithTimestamps | null => {
  return updateService(id, { isActive: false });
};

// ============================================
// Category Business Logic
// ============================================

export const createCategory = (input: CreateCategoryInput): Category => {
  const category: Category = {
    id: uuidv4(),
    name: input.name,
    description: input.description,
    icon: input.icon,
    displayOrder: input.displayOrder ?? getNextDisplayOrder(),
    isActive: input.isActive ?? true,
  };

  store.categories.set(category.id, category);
  return category;
};

const getNextDisplayOrder = (): number => {
  const categories = Array.from(store.categories.values());
  if (categories.length === 0) return 1;
  return Math.max(...categories.map((c) => c.displayOrder)) + 1;
};

export const getCategoryById = (id: string): Category | undefined => {
  return store.categories.get(id);
};

export const getAllCategories = (includeInactive = false): Category[] => {
  const categories = Array.from(store.categories.values());
  if (!includeInactive) {
    return categories.filter((c) => c.isActive);
  }
  return categories.sort((a, b) => a.displayOrder - b.displayOrder);
};

export const updateCategory = (id: string, input: UpdateCategoryInput): Category | null => {
  const category = store.categories.get(id);
  if (!category) return null;

  const updatedCategory: Category = {
    ...category,
    ...input,
    id: category.id,
  };

  store.categories.set(id, updatedCategory);
  return updatedCategory;
};

export const deleteCategory = (id: string): boolean => {
  return store.categories.delete(id);
};

// ============================================
// Package Business Logic
// ============================================

export const createPackage = (input: CreatePackageInput): Package | null => {
  // Validate all services exist
  const invalidServices = input.services.filter((sid) => !store.services.has(sid));
  if (invalidServices.length > 0) {
    console.error(`Invalid service IDs: ${invalidServices.join(', ')}`);
    return null;
  }

  // Calculate original price from services
  const originalPrice = input.services.reduce((sum, sid) => {
    const service = store.services.get(sid);
    return sum + (service?.price || 0);
  }, 0);

  const now = getCurrentTimestamp();
  const packageEntity: Package = {
    id: uuidv4(),
    name: input.name,
    description: input.description,
    services: input.services,
    originalPrice,
    packagePrice: input.packagePrice,
    currency: input.currency || DEFAULT_CURRENCY,
    validityDays: input.validityDays ?? 90,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  store.packages.set(packageEntity.id, packageEntity);
  return packageEntity;
};

export const getPackageById = (id: string): Package | undefined => {
  return store.packages.get(id);
};

export const getAllPackages = (includeInactive = false): Package[] => {
  const packages = Array.from(store.packages.values());
  if (!includeInactive) {
    return packages.filter((p) => p.isActive);
  }
  return packages;
};

export const getPackageWithServices = (id: string): { package: Package; services: Service[] } | null => {
  const pkg = store.packages.get(id);
  if (!pkg) return null;

  const services = pkg.services
    .map((sid) => store.services.get(sid))
    .filter((s): s is ServiceWithTimestamps => s !== undefined);

  return { package: pkg, services };
};

export const updatePackage = (id: string, input: UpdatePackageInput): Package | null => {
  const pkg = store.packages.get(id);
  if (!pkg) return null;

  // If services are being updated, validate them
  if (input.services) {
    const invalidServices = input.services.filter((sid) => !store.services.has(sid));
    if (invalidServices.length > 0) {
      console.error(`Invalid service IDs: ${invalidServices.join(', ')}`);
      return null;
    }
  }

  const updatedPackage: Package = {
    ...pkg,
    ...input,
    id: pkg.id,
    originalPrice: input.services ? calculateOriginalPrice(input.services) : pkg.originalPrice,
    createdAt: pkg.createdAt,
    updatedAt: getCurrentTimestamp(),
  };

  store.packages.set(id, updatedPackage);
  return updatedPackage;
};

const calculateOriginalPrice = (serviceIds: string[]): number => {
  return serviceIds.reduce((sum, sid) => {
    const service = store.services.get(sid);
    return sum + (service?.price || 0);
  }, 0);
};

export const deletePackage = (id: string): boolean => {
  return store.packages.delete(id);
};

// ============================================
// Availability Business Logic
// ============================================

export const getServiceAvailability = (
  serviceId: string,
  date: string,
  staffId?: string
): ServiceAvailability | null => {
  const service = store.services.get(serviceId);
  if (!service) return null;

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return null;

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = parsedDate.getDay();

  // Generate all possible time slots for the day
  const slots = generateTimeSlots(service.duration + service.prepTime + service.cleanupTime);

  // Get bookings for this service on this date
  const dayStart = new Date(parsedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(parsedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const dayBookings = Array.from(store.bookings.values()).filter((booking) => {
    const bookingStart = new Date(booking.startTime);
    return (
      booking.serviceId === serviceId &&
      bookingStart >= dayStart &&
      bookingStart <= dayEnd &&
      booking.status !== 'cancelled'
    );
  });

  // Get available staff
  let staffList = service.availableStaff;
  if (staffId) {
    staffList = staffList.filter((s) => s === staffId);
  }

  const staffAvailability: StaffAvailability[] = staffList.map((sid) => {
    const staffBookings = dayBookings.filter((b) => b.staffId === sid);
    const availableSlots = calculateAvailableSlots(slots, staffBookings, service.duration + service.prepTime + service.cleanupTime);

    return {
      staffId: sid,
      staffName: `Staff ${sid.substring(0, 8)}`, // Placeholder name
      availableSlots,
    };
  });

  const totalAvailableSlots = staffAvailability.reduce(
    (sum, sa) => sum + sa.availableSlots.filter((s) => s.available).length,
    0
  );

  return {
    serviceId,
    serviceName: service.name,
    date,
    totalSlots: slots.length,
    availableSlots: totalAvailableSlots,
    staffAvailability,
  };
};

const generateTimeSlots = (serviceDuration: number): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const [startHour, startMin] = BUSINESS_HOURS.start.split(':').map(Number);
  const [endHour, endMin] = BUSINESS_HOURS.end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  let currentMinutes = startMinutes;
  while (currentMinutes + serviceDuration <= endMinutes) {
    const slotStart = minutesToTime(currentMinutes);
    const slotEnd = minutesToTime(currentMinutes + serviceDuration);

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: true,
    });

    currentMinutes += BUSINESS_HOURS.slotDuration;
  }

  return slots;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const calculateAvailableSlots = (
  baseSlots: TimeSlot[],
  bookings: Booking[],
  totalServiceTime: number
): TimeSlot[] => {
  return baseSlots.map((slot) => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = slotStart + totalServiceTime;

    const isAvailable = !bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      const bookingStartMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
      const bookingEndMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

      // Check for overlap
      return slotStart < bookingEndMinutes && slotEnd > bookingStartMinutes;
    });

    return { ...slot, available: isAvailable };
  });
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// ============================================
// Booking Management (for availability tracking)
// ============================================

export const addBooking = (booking: Omit<Booking, 'id'>): Booking => {
  const newBooking: Booking = {
    id: uuidv4(),
    ...booking,
  };
  store.bookings.set(newBooking.id, newBooking);
  return newBooking;
};

export const getBookingsForService = (serviceId: string, date?: string): Booking[] => {
  let bookings = Array.from(store.bookings.values()).filter((b) => b.serviceId === serviceId);

  if (date) {
    const parsedDate = new Date(date);
    const dayStart = new Date(parsedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(parsedDate);
    dayEnd.setHours(23, 59, 59, 999);

    bookings = bookings.filter((b) => {
      const bookingStart = new Date(b.startTime);
      return bookingStart >= dayStart && bookingStart <= dayEnd;
    });
  }

  return bookings;
};

// ============================================
// Store Management (for testing/reset)
// ============================================

export const getStore = (): InMemoryStore => store;

export const resetStore = (): void => {
  store = createEmptyStore();
};

export const initializeSampleData = (): void => {
  // Create sample categories
  const hairCategory = createCategory({
    name: 'Hair',
    description: 'Hair cutting, styling, coloring and treatments',
    icon: 'scissors',
    displayOrder: 1,
  });

  const skinCategory = createCategory({
    name: 'Skin',
    description: 'Facials, skincare and beauty treatments',
    icon: 'sparkles',
    displayOrder: 2,
  });

  const nailsCategory = createCategory({
    name: 'Nails',
    description: 'Manicure, pedicure and nail art',
    icon: 'palette',
    displayOrder: 3,
  });

  const bodyCategory = createCategory({
    name: 'Body',
    description: 'Massage, spa and body treatments',
    icon: 'heart',
    displayOrder: 4,
  });

  // Create sample services
  createService({
    name: 'Classic Haircut',
    description: 'Professional haircut with wash and style',
    category: hairCategory.name,
    duration: 45,
    price: 35,
    tags: ['haircut', 'basic', 'popular'],
  });

  createService({
    name: 'Hair Coloring',
    description: 'Full color treatment with premium products',
    category: hairCategory.name,
    duration: 120,
    price: 85,
    requiresConsultation: true,
    tags: ['coloring', 'premium'],
  });

  createService({
    name: 'Deep Conditioning Treatment',
    description: 'Intensive hair treatment for damaged hair',
    category: hairCategory.name,
    duration: 45,
    price: 40,
    tags: ['treatment', 'hair-care'],
  });

  createService({
    name: 'Classic Facial',
    description: 'Refreshing facial with cleanse, exfoliation and hydration',
    category: skinCategory.name,
    duration: 60,
    price: 55,
    tags: ['facial', 'basic', 'popular'],
  });

  createService({
    name: 'Anti-Aging Facial',
    description: 'Advanced facial targeting fine lines and wrinkles',
    category: skinCategory.name,
    duration: 75,
    price: 95,
    requiresConsultation: true,
    tags: ['facial', 'anti-aging', 'premium'],
  });

  createService({
    name: 'Classic Manicure',
    description: 'Nail shaping, cuticle care and polish',
    category: nailsCategory.name,
    duration: 30,
    price: 25,
    tags: ['manicure', 'basic'],
  });

  createService({
    name: 'Gel Manicure',
    description: 'Long-lasting gel polish application',
    category: nailsCategory.name,
    duration: 45,
    price: 40,
    tags: ['manicure', 'gel', 'popular'],
  });

  createService({
    name: 'Swedish Massage',
    description: 'Relaxing full body massage',
    category: bodyCategory.name,
    duration: 60,
    price: 70,
    tags: ['massage', 'relaxation', 'popular'],
  });

  createService({
    name: 'Hot Stone Massage',
    description: 'Therapeutic massage with heated stones',
    category: bodyCategory.name,
    duration: 90,
    price: 110,
    tags: ['massage', 'hot-stone', 'premium'],
  });

  createService({
    name: 'Body Wrap Treatment',
    description: 'Detoxifying body wrap with minerals',
    category: bodyCategory.name,
    duration: 60,
    price: 85,
    tags: ['body', 'detox', 'treatment'],
  });

  console.log('Sample data initialized successfully');
};
