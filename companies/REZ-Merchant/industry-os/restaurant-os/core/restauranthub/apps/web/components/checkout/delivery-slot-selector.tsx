'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Truck,
  Zap,
  Crown,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Info,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CloudRain,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  useDeliverySlots,
  DeliverySlot,
  DeliveryZone,
  formatSlotTime,
  formatSlotPrice,
  getSlotAvailabilityText,
  getSlotTypeLabel,
  getSlotTypeBadgeColor
} from '@/lib/delivery-slots';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DeliverySlotSelectorProps {
  onSlotSelect: (slot: DeliverySlot | null) => void;
  selectedSlot?: DeliverySlot | null;
  userPostcode?: string;
  className?: string;
}

interface SlotFilters {
  type: 'all' | 'standard' | 'express' | 'priority';
  maxPrice: number;
  timePreference: 'all' | 'morning' | 'afternoon' | 'evening';
}

export default function DeliverySlotSelector({
  onSlotSelect,
  selectedSlot,
  userPostcode,
  className
}: DeliverySlotSelectorProps) {
  const {
    schedule,
    loading,
    zones,
    availableDates,
    findZone,
    getSlots,
    getAvailability,
    bookSlot,
    updateSchedule,
    getRecommendations,
    getStatistics
  } = useDeliverySlots();

  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SlotFilters>({
    type: 'all',
    maxPrice: 500,
    timePreference: 'all'
  });

  // Auto-detect zone from postcode
  useEffect(() => {
    if (userPostcode && !selectedZone) {
      const zone = findZone(userPostcode);
      if (zone) {
        setSelectedZone(zone);
      }
    }
  }, [userPostcode, findZone, selectedZone]);

  // Auto-select first available date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const currentSlots = React.useMemo(() => {
    if (!selectedDate || !selectedZone) return [];

    let slots = getSlots(selectedDate, selectedZone.id);

    // Apply filters
    if (filters.type !== 'all') {
      slots = slots.filter(slot => slot.type === filters.type);
    }

    if (filters.maxPrice < 500) {
      slots = slots.filter(slot => slot.price <= filters.maxPrice);
    }

    if (filters.timePreference !== 'all') {
      const timeRanges = {
        morning: { start: '06:00', end: '12:00' },
        afternoon: { start: '12:00', end: '17:00' },
        evening: { start: '17:00', end: '23:59' }
      };
      const range = timeRanges[filters.timePreference];
      slots = slots.filter(slot => 
        slot.startTime >= range.start && slot.startTime < range.end
      );
    }

    // Search filter
    if (searchQuery) {
      slots = slots.filter(slot =>
        formatSlotTime(slot).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSlotTypeLabel(slot.type).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return slots;
  }, [selectedDate, selectedZone, getSlots, filters, searchQuery]);

  const availability = selectedDate ? getAvailability(selectedDate) : null;
  const statistics = selectedDate ? getStatistics(selectedDate) : null;

  const handleSlotSelect = async (slot: DeliverySlot) => {
    if (selectedSlot?.id === slot.id) {
      onSlotSelect(null);
      return;
    }

    onSlotSelect(slot);
    updateSchedule({ selectedSlot: slot, zone: selectedZone || undefined });
    
    toast({
      title: "Delivery Slot Selected",
      description: `${formatSlotTime(slot)} on ${new Date(slot.date).toLocaleDateString()}`,
    });
  };

  const getSlotIcon = (type: DeliverySlot['type']) => {
    switch (type) {
      case 'standard': return Truck;
      case 'express': return Zap;
      case 'priority': return Crown;
      default: return Clock;
    }
  };

  const getSlotDescription = (type: DeliverySlot['type']) => {
    switch (type) {
      case 'standard': return 'Regular delivery with standard timeline';
      case 'express': return 'Faster delivery with priority handling';
      case 'priority': return 'Premium delivery with highest priority';
      default: return '';
    }
  };

  if (!selectedZone) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Area
          </CardTitle>
          <CardDescription>
            Please provide your postcode to check delivery availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                placeholder="Enter your postcode"
                onChange={(e) => e.target.value}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className="p-4 border border-border rounded-lg text-left hover:bg-accent/50 transition-colors"
                >
                  <h3 className="font-semibold">{zone.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Base fee: ₹{zone.baseDeliveryFee}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Est. {zone.estimatedDuration} mins
                  </p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Zone Info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">{selectedZone.name}</CardTitle>
                <CardDescription>
                  Base delivery fee: ₹{selectedZone.baseDeliveryFee} • Est. {selectedZone.estimatedDuration} mins
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              
              onClick={() => setSelectedZone(null)}
            >
              Change Area
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Date Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Delivery Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {availableDates.slice(0, 14).map((date) => {
              const dateObj = new Date(date);
              const isSelected = selectedDate === date;
              const stats = getStatistics(date);
              
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "p-3 border rounded-lg text-center transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent/50"
                  )}
                >
                  <div className="text-sm font-medium">
                    {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {dateObj.getDate()}
                  </div>
                  <div className="text-xs opacity-75">
                    {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  {stats && (
                    <div className="text-xs mt-1">
                      {stats.availableSlots} slots
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <>
          {/* Filters & Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search slots..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="type-filter">Delivery Type</Label>
                        <select
                          id="type-filter"
                          value={filters.type}
                          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as unknown }))}
                          className="w-full p-2 border border-border rounded-md"
                        >
                          <option value="all">All Types</option>
                          <option value="standard">Standard</option>
                          <option value="express">Express</option>
                          <option value="priority">Priority</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="time-filter">Time Preference</Label>
                        <select
                          id="time-filter"
                          value={filters.timePreference}
                          onChange={(e) => setFilters(prev => ({ ...prev, timePreference: e.target.value as unknown }))}
                          className="w-full p-2 border border-border rounded-md"
                        >
                          <option value="all">Any Time</option>
                          <option value="morning">Morning (6AM-12PM)</option>
                          <option value="afternoon">Afternoon (12PM-5PM)</option>
                          <option value="evening">Evening (5PM-11PM)</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="price-filter">Max Price: ₹{filters.maxPrice}</Label>
                        <input
                          id="price-filter"
                          type="range"
                          min="50"
                          max="500"
                          step="25"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Availability Info */}
          {availability && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {availability.weatherAlert && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <CloudRain className="h-4 w-4" />
                      <span className="text-sm">{availability.weatherAlert}</span>
                    </div>
                  )}
                  
                  {availability.capacityAlert && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">High demand - book early!</span>
                    </div>
                  )}
                  
                  {statistics && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {statistics.availableSlots} of {statistics.totalSlots} slots available
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Slots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Time Slots
              </CardTitle>
              <CardDescription>
                Choose your preferred delivery time for {new Date(selectedDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading slots...</span>
                </div>
              ) : currentSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No slots available</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or selecting a different date
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentSlots.map((slot) => {
                    const Icon = getSlotIcon(slot.type);
                    const isSelected = selectedSlot?.id === slot.id;
                    const remaining = slot.maxCapacity - slot.bookedCount;
                    const isLowAvailability = remaining <= 3;
                    
                    return (
                      <motion.button
                        key={slot.id}
                        onClick={() => handleSlotSelect(slot)}
                        className={cn(
                          "p-4 border rounded-lg text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:bg-accent/50"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "p-2 rounded-lg",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">
                                {formatSlotTime(slot)}
                              </h3>
                              <Badge 
                                variant="secondary" 
                                className={cn("text-xs", getSlotTypeBadgeColor(slot.type))}
                              >
                                {getSlotTypeLabel(slot.type)}
                              </Badge>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Price</span>
                            <span className="font-semibold">{formatSlotPrice(slot)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Duration</span>
                            <span>{slot.estimatedDuration} mins</span>
                          </div>
                          
                          <div className="text-xs">
                            <span 
                              className={cn(
                                "font-medium",
                                isLowAvailability ? "text-orange-600" : "text-green-600"
                              )}
                            >
                              {getSlotAvailabilityText(slot)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            {getSlotDescription(slot.type)}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Slot Summary */}
          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <CheckCircle className="h-5 w-5" />
                    Selected Delivery Slot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Date & Time</Label>
                      <p className="font-semibold">
                        {new Date(selectedSlot.date).toLocaleDateString()} at {formatSlotTime(selectedSlot)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Delivery Type</Label>
                      <p className="font-semibold">{getSlotTypeLabel(selectedSlot.type)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Cost</Label>
                      <p className="font-semibold">{formatSlotPrice(selectedSlot)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}