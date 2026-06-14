/**
 * Delivery slot selection and management system
 * Handles time slots, availability, and scheduling for restaurant deliveries
 */

import React from 'react';

export interface DeliverySlot {
  id: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  available: boolean;
  bookedCount: number;
  maxCapacity: number;
  price: number; // Additional cost for this slot
  type: 'standard' | 'express' | 'priority';
  zone: string; // Delivery zone
  estimatedDuration: number; // Minutes
}

export interface DeliveryZone {
  id: string;
  name: string;
  postcodes: string[];
  baseDeliveryFee: number;
  expressAvailable: boolean;
  priorityAvailable: boolean;
  maxDistance: number; // km
  estimatedDuration: number; // base minutes
}

export interface DeliverySchedule {
  selectedSlot?: DeliverySlot;
  zone?: DeliveryZone;
  specialInstructions?: string;
  contactlessDelivery?: boolean;
  preferredLocation?: string;
}

export interface DeliveryAvailability {
  date: string;
  slots: DeliverySlot[];
  isHoliday: boolean;
  weatherAlert?: string;
  capacityAlert?: boolean;
}

const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone-1',
    name: 'Central District',
    postcodes: ['100001', '100002', '100003', '100004', '100005'],
    baseDeliveryFee: 50,
    expressAvailable: true,
    priorityAvailable: true,
    maxDistance: 5,
    estimatedDuration: 30
  },
  {
    id: 'zone-2',
    name: 'North District',
    postcodes: ['100010', '100011', '100012', '100013', '100014'],
    baseDeliveryFee: 70,
    expressAvailable: true,
    priorityAvailable: false,
    maxDistance: 8,
    estimatedDuration: 45
  },
  {
    id: 'zone-3',
    name: 'South District',
    postcodes: ['100020', '100021', '100022', '100023', '100024'],
    baseDeliveryFee: 80,
    expressAvailable: false,
    priorityAvailable: false,
    maxDistance: 12,
    estimatedDuration: 60
  },
  {
    id: 'zone-4',
    name: 'Extended Area',
    postcodes: ['100030', '100031', '100032', '100033', '100034'],
    baseDeliveryFee: 120,
    expressAvailable: false,
    priorityAvailable: false,
    maxDistance: 20,
    estimatedDuration: 90
  }
];

const STANDARD_TIME_SLOTS = [
  { start: '09:00', end: '11:00', capacity: 20 },
  { start: '11:00', end: '13:00', capacity: 25 },
  { start: '13:00', end: '15:00', capacity: 30 },
  { start: '15:00', end: '17:00', capacity: 30 },
  { start: '17:00', end: '19:00', capacity: 35 },
  { start: '19:00', end: '21:00', capacity: 25 }
];

const EXPRESS_TIME_SLOTS = [
  { start: '10:00', end: '11:00', capacity: 8 },
  { start: '12:00', end: '13:00', capacity: 10 },
  { start: '14:00', end: '15:00', capacity: 10 },
  { start: '16:00', end: '17:00', capacity: 12 },
  { start: '18:00', end: '19:00', capacity: 15 },
  { start: '20:00', end: '21:00', capacity: 8 }
];

const PRIORITY_TIME_SLOTS = [
  { start: '10:30', end: '11:30', capacity: 5 },
  { start: '12:30', end: '13:30', capacity: 5 },
  { start: '14:30', end: '15:30', capacity: 5 },
  { start: '16:30', end: '17:30', capacity: 5 },
  { start: '18:30', end: '19:30', capacity: 5 }
];

const HOLIDAYS = [
  '2024-01-26', '2024-03-08', '2024-03-25', '2024-04-14', 
  '2024-05-01', '2024-08-15', '2024-10-02', '2024-10-31',
  '2024-12-25', '2024-12-31'
];

export class DeliverySlotManager {
  private schedule: Map<string, DeliveryAvailability> = new Map();

  constructor() {
    this.generateSlots();
  }

  /**
   * Generate delivery slots for the next 14 days
   */
  private generateSlots() {
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const isHoliday = HOLIDAYS.includes(dateStr);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      if (isHoliday) {
        this.schedule.set(dateStr, {
          date: dateStr,
          slots: [],
          isHoliday: true,
          weatherAlert: 'No delivery on public holidays'
        });
        continue;
      }

      const slots: DeliverySlot[] = [];
      
      // Generate slots for each zone
      DELIVERY_ZONES.forEach(zone => {
        // Standard slots
        STANDARD_TIME_SLOTS.forEach((timeSlot, index) => {
          const bookedCount = Math.floor(Math.random() * (timeSlot.capacity * 0.7)); // Random booking simulation
          
          slots.push({
            id: `${dateStr}-${zone.id}-standard-${index}`,
            date: dateStr,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            available: bookedCount < timeSlot.capacity,
            bookedCount,
            maxCapacity: timeSlot.capacity,
            price: zone.baseDeliveryFee,
            type: 'standard',
            zone: zone.id,
            estimatedDuration: zone.estimatedDuration
          });
        });

        // Express slots (if available for zone)
        if (zone.expressAvailable) {
          EXPRESS_TIME_SLOTS.forEach((timeSlot, index) => {
            const bookedCount = Math.floor(Math.random() * (timeSlot.capacity * 0.8));
            
            slots.push({
              id: `${dateStr}-${zone.id}-express-${index}`,
              date: dateStr,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
              available: bookedCount < timeSlot.capacity,
              bookedCount,
              maxCapacity: timeSlot.capacity,
              price: zone.baseDeliveryFee + 50,
              type: 'express',
              zone: zone.id,
              estimatedDuration: Math.floor(zone.estimatedDuration * 0.7)
            });
          });
        }

        // Priority slots (if available for zone)
        if (zone.priorityAvailable) {
          PRIORITY_TIME_SLOTS.forEach((timeSlot, index) => {
            const bookedCount = Math.floor(Math.random() * (timeSlot.capacity * 0.9));
            
            slots.push({
              id: `${dateStr}-${zone.id}-priority-${index}`,
              date: dateStr,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
              available: bookedCount < timeSlot.capacity,
              bookedCount,
              maxCapacity: timeSlot.capacity,
              price: zone.baseDeliveryFee + 100,
              type: 'priority',
              zone: zone.id,
              estimatedDuration: Math.floor(zone.estimatedDuration * 0.5)
            });
          });
        }
      });

      // Check for capacity alerts
      const totalAvailableSlots = slots.filter(s => s.available).length;
      const capacityAlert = totalAvailableSlots < slots.length * 0.3;

      // Weather alerts simulation
      const weatherAlert = Math.random() < 0.1 ? 
        'Weather may affect delivery times' : undefined;

      this.schedule.set(dateStr, {
        date: dateStr,
        slots: slots.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        isHoliday: false,
        weatherAlert,
        capacityAlert
      });
    }
  }

  /**
   * Get delivery zones
   */
  getDeliveryZones(): DeliveryZone[] {
    return [...DELIVERY_ZONES];
  }

  /**
   * Find delivery zone by postcode
   */
  findZoneByPostcode(postcode: string): DeliveryZone | null {
    return DELIVERY_ZONES.find(zone => 
      zone.postcodes.includes(postcode)
    ) || null;
  }

  /**
   * Get available dates
   */
  getAvailableDates(): string[] {
    return Array.from(this.schedule.keys())
      .filter(date => {
        const availability = this.schedule.get(date);
        return availability && !availability.isHoliday && 
               availability.slots.some(slot => slot.available);
      })
      .sort();
  }

  /**
   * Get delivery slots for a specific date and zone
   */
  getSlots(date: string, zoneId?: string, type?: 'standard' | 'express' | 'priority'): DeliverySlot[] {
    const availability = this.schedule.get(date);
    if (!availability || availability.isHoliday) {
      return [];
    }

    let slots = availability.slots;

    if (zoneId) {
      slots = slots.filter((slot) => slot.zone === zoneId);
    }

    if (type) {
      slots = slots.filter((slot) => slot.type === type);
    }

    return slots.filter((slot) => slot.available);
  }

  /**
   * Get delivery availability for a date
   */
  getAvailability(date: string): DeliveryAvailability | null {
    return this.schedule.get(date) || null;
  }

  /**
   * Book a delivery slot
   */
  bookSlot(slotId: string): boolean {
    for (const [date, availability] of Array.from(this.schedule.entries())) {
      const slot = availability.slots.find((s) => s.id === slotId);
      if (slot && slot.available) {
        slot.bookedCount++;
        if (slot.bookedCount >= slot.maxCapacity) {
          slot.available = false;
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Cancel a booking
   */
  cancelBooking(slotId: string): boolean {
    for (const [date, availability] of Array.from(this.schedule.entries())) {
      const slot = availability.slots.find((s) => s.id === slotId);
      if (slot) {
        slot.bookedCount = Math.max(0, slot.bookedCount - 1);
        slot.available = slot.bookedCount < slot.maxCapacity;
        return true;
      }
    }
    return false;
  }

  /**
   * Get slot statistics
   */
  getSlotStatistics(date: string) {
    const availability = this.getAvailability(date);
    if (!availability) return null;

    const totalSlots = availability.slots.length;
    const availableSlots = availability.slots.filter(s => s.available).length;
    const bookedSlots = totalSlots - availableSlots;
    
    const slotsByType = availability.slots.reduce((acc, slot) => {
      acc[slot.type] = (acc[slot.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averagePrice = availability.slots.reduce((sum, slot) => sum + slot.price, 0) / totalSlots;

    return {
      totalSlots,
      availableSlots,
      bookedSlots,
      utilizationRate: (bookedSlots / totalSlots) * 100,
      slotsByType,
      averagePrice,
      hasWeatherAlert: !!availability.weatherAlert,
      hasCapacityAlert: !!availability.capacityAlert
    };
  }

  /**
   * Search slots by criteria
   */
  searchSlots(criteria: {
    dateRange?: { start: string; end: string };
    zoneId?: string;
    type?: 'standard' | 'express' | 'priority';
    maxPrice?: number;
    timeRange?: { start: string; end: string };
  }): DeliverySlot[] {
    const results: DeliverySlot[] = [];

    for (const [date, availability] of Array.from(this.schedule.entries())) {
      if (availability.isHoliday) continue;

      // Date range filter
      if (criteria.dateRange) {
        if (date < criteria.dateRange.start || date > criteria.dateRange.end) {
          continue;
        }
      }

      let slots = availability.slots.filter((slot) => slot.available);

      // Apply filters
      if (criteria.zoneId) {
        slots = slots.filter((slot) => slot.zone === criteria.zoneId);
      }

      if (criteria.type) {
        slots = slots.filter((slot) => slot.type === criteria.type);
      }

      if (criteria.maxPrice) {
        slots = slots.filter((slot) => slot.price <= (criteria.maxPrice || 0));
      }

      if (criteria.timeRange) {
        slots = slots.filter(slot => 
          slot.startTime >= criteria.timeRange!.start && 
          slot.endTime <= criteria.timeRange!.end
        );
      }

      results.push(...slots);
    }

    return results.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }

  /**
   * Get recommended slots based on user preferences
   */
  getRecommendedSlots(preferences: {
    preferredTime?: 'morning' | 'afternoon' | 'evening';
    maxPrice?: number;
    zone?: string;
    urgency?: 'low' | 'medium' | 'high';
  }): DeliverySlot[] {
    const timeRanges = {
      morning: { start: '09:00', end: '12:00' },
      afternoon: { start: '12:00', end: '17:00' },
      evening: { start: '17:00', end: '21:00' }
    };

    const urgencyTypes = {
      low: 'standard',
      medium: 'express',
      high: 'priority'
    } as const;

    const searchCriteria: unknown = {
      dateRange: { 
        start: new Date().toISOString().split('T')[0], 
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
      }
    };

    if (preferences.preferredTime) {
      searchCriteria.timeRange = timeRanges[preferences.preferredTime];
    }

    if (preferences.maxPrice) {
      searchCriteria.maxPrice = preferences.maxPrice;
    }

    if (preferences.zone) {
      searchCriteria.zoneId = preferences.zone;
    }

    if (preferences.urgency) {
      searchCriteria.type = urgencyTypes[preferences.urgency];
    }

    return this.searchSlots(searchCriteria).slice(0, 10);
  }
}

// Singleton instance
export const deliverySlotManager = new DeliverySlotManager();

// React hook for delivery slots
export function useDeliverySlots() {
  const [schedule, setSchedule] = React.useState<DeliverySchedule>({});
  const [loading, setLoading] = React.useState(false);

  const zones = React.useMemo(() => deliverySlotManager.getDeliveryZones(), []);
  const availableDates = React.useMemo(() => deliverySlotManager.getAvailableDates(), []);

  const findZone = React.useCallback((postcode: string) => {
    return deliverySlotManager.findZoneByPostcode(postcode);
  }, []);

  const getSlots = React.useCallback((date: string, zoneId?: string, type?: 'standard' | 'express' | 'priority') => {
    return deliverySlotManager.getSlots(date, zoneId, type);
  }, []);

  const getAvailability = React.useCallback((date: string) => {
    return deliverySlotManager.getAvailability(date);
  }, []);

  const bookSlot = React.useCallback(async (slot: DeliverySlot) => {
    setLoading(true);
    try {
      const success = deliverySlotManager.bookSlot(slot.id);
      if (success) {
        setSchedule(prev => ({ ...prev, selectedSlot: slot }));
      }
      return success;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSchedule = React.useCallback((updates: Partial<DeliverySchedule>) => {
    setSchedule(prev => ({ ...prev, ...updates }));
  }, []);

  const clearSchedule = React.useCallback(() => {
    setSchedule({});
  }, []);

  const getRecommendations = React.useCallback((preferences: Parameters<typeof deliverySlotManager.getRecommendedSlots>[0]) => {
    return deliverySlotManager.getRecommendedSlots(preferences);
  }, []);

  const searchSlots = React.useCallback((criteria: Parameters<typeof deliverySlotManager.searchSlots>[0]) => {
    return deliverySlotManager.searchSlots(criteria);
  }, []);

  return {
    schedule,
    loading,
    zones,
    availableDates,
    findZone,
    getSlots,
    getAvailability,
    bookSlot,
    updateSchedule,
    clearSchedule,
    getRecommendations,
    searchSlots,
    getStatistics: (date: string) => deliverySlotManager.getSlotStatistics(date)
  };
}

// Utility functions
export function formatSlotTime(slot: DeliverySlot): string {
  return `${slot.startTime} - ${slot.endTime}`;
}

export function formatSlotPrice(slot: DeliverySlot): string {
  return `₹${slot.price}`;
}

export function getSlotAvailabilityText(slot: DeliverySlot): string {
  const remaining = slot.maxCapacity - slot.bookedCount;
  if (remaining <= 0) return 'Fully booked';
  if (remaining <= 3) return `Only ${remaining} slots left`;
  return `${remaining} slots available`;
}

export function getSlotTypeLabel(type: DeliverySlot['type']): string {
  switch (type) {
    case 'standard': return 'Standard';
    case 'express': return 'Express';
    case 'priority': return 'Priority';
    default: return type;
  }
}

export function getSlotTypeBadgeColor(type: DeliverySlot['type']): string {
  switch (type) {
    case 'standard': return 'bg-blue-100 text-blue-800';
    case 'express': return 'bg-orange-100 text-orange-800';
    case 'priority': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}