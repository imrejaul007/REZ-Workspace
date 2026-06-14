import React, { useState, useEffect, useCallback } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';

type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
type RecurrenceEndType = 'never' | 'after' | 'on_date';

interface RecurrenceConfig {
  enabled: boolean;
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: number[];
  endType: RecurrenceEndType;
  occurrences: string; // kept as string for TextInput
  endDate: string;
}

const RECURRENCE_OPTIONS: Array<{ label: string; frequency: RecurrenceFrequency | null }> = [
  { label: 'Does not repeat', frequency: null },
  { label: 'Every day', frequency: 'daily' },
  { label: 'Every week', frequency: 'weekly' },
  { label: 'Every 2 weeks', frequency: 'biweekly' },
  { label: 'Every month', frequency: 'monthly' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api/client';
import { storageService } from '@/services/storage';
import { platformAlertSimple } from '@/utils/platformAlert';

interface StaffMember {
  _id: string;
  name: string;
  speciality?: string;
}

interface ServiceOption {
  _id: string;
  name: string;
  serviceDetails?: { duration: number };
  pricing?: { selling: number };
}

// 30-min slots 8am–10pm
function generateSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 22; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}
const ALL_SLOTS = generateSlots();

function fmtSlot(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// Next 14 days
function getNextDays(count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

const NEXT_DAYS = getNextDays(14);

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function NewAppointmentScreen() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(NEXT_DAYS[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null); // kept for picker highlight
  const [serviceTypeText, setServiceTypeText] = useState('');
  const [duration, setDuration] = useState('60');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState('');

  // Group booking state
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [guestCount, setGuestCount] = useState(2);
  const [guestDetails, setGuestDetails] = useState<Array<{ name: string; phone: string }>>([
    { name: '', phone: '' },
  ]);

  // Recurrence state
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    enabled: false,
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
    endType: 'never',
    occurrences: '4',
    endDate: '',
  });
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        const merchantData = await storageService.getMerchantData<unknown>();
        const sid = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
        setStoreId(sid);

        const [staffRes, servicesRes] = await Promise.all([
          apiClient.get<unknown>(`merchant/team?storeId=${sid}&limit=50`),
          apiClient.get<unknown>(`merchant/services?storeId=${sid}&limit=100`),
        ]);
        setStaff(staffRes.data?.members || staffRes.data || []);
        setServices(servicesRes.data?.services || servicesRes.data || []);
      } catch {
        // Non-fatal — user can still type service manually
      } finally {
        setLoadingInit(false);
      }
    })();
  }, []);

  // Load real availability when date changes
  const loadSlots = useCallback(
    async (date: Date) => {
      if (!storeId) return;
      try {
        setLoadingSlots(true);
        setSelectedSlot(null);
        const isoDate = fmtISO(date);
        const res = await apiClient.get<unknown>(
          `service-appointments/slots/${storeId}?date=${isoDate}`
        );
        const raw: Array<{ time: string; available: boolean }> = res.data || [];
        if (raw.length > 0) {
          setAvailableSlots(raw.filter((s) => s.available).map((s) => s.time));
        } else {
          // No slots from API — show empty list. Do not generate phantom slots.
          // A store with no configured availability should not show bookable times.
          setAvailableSlots([]);
        }
      } catch {
        // API error — show empty list rather than phantom 8am-10pm fallback slots
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [storeId]
  );

  useEffect(() => {
    loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const handleSelectService = (svc: ServiceOption) => {
    setSelectedService(svc);
    setSelectedServices((prev) => {
      const next = [...prev, svc];
      // Set primary service text + duration from first service
      if (next.length === 1) {
        setServiceTypeText(svc.name);
        if (svc.serviceDetails?.duration) setDuration(String(svc.serviceDetails.duration));
      }
      return next;
    });
    setShowServicePicker(false);
  };

  const handleRemoveService = (index: number) => {
    setSelectedServices((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setServiceTypeText('');
        setDuration('60');
        setSelectedService(null);
      } else if (index === 0) {
        setServiceTypeText(next[0].name);
        if (next[0].serviceDetails?.duration) setDuration(String(next[0].serviceDetails.duration));
      }
      return next;
    });
  };

  const totalServiceDuration = selectedServices.reduce(
    (sum, s) => sum + (s.serviceDetails?.duration || parseInt(duration) || 60),
    0
  );

  const handleSubmit = async () => {
    const serviceType =
      serviceTypeText.trim() || selectedServices[0]?.name || selectedService?.name || '';
    if (!serviceType) {
      platformAlertSimple('Validation', 'Select at least one service');
      return;
    }
    if (!selectedSlot) {
      platformAlertSimple('Validation', 'Select a time slot');
      return;
    }
    if (!custName.trim()) {
      platformAlertSimple('Validation', 'Customer name is required');
      return;
    }
    if (!custPhone.trim()) {
      platformAlertSimple('Validation', 'Customer phone is required');
      return;
    }
    if (!storeId) {
      platformAlertSimple('Error', 'Store not loaded');
      return;
    }

    const additionalServices = selectedServices.slice(1).map((s, i) => ({
      serviceName: s.name,
      duration: s.serviceDetails?.duration || 60,
      order: i + 1,
    }));

    const basePayload = {
      storeId,
      serviceType,
      appointmentDate: fmtISO(selectedDate),
      appointmentTime: selectedSlot,
      duration: parseInt(duration) || 60,
      specialInstructions: notes.trim() || undefined,
      staffId: selectedStaff?._id || undefined,
      staffName: selectedStaff?.name || undefined,
      ...(additionalServices.length > 0 && { additionalServices }),
    };

    if (!isGroupBooking) {
      try {
        setSaving(true);
        if (recurrence.enabled) {
          // Build recurrence payload
          const recurrencePayload: Record<string, unknown> = {
            frequency: recurrence.frequency,
            interval: recurrence.interval,
            endType: recurrence.endType,
          };
          if (recurrence.daysOfWeek.length > 0) {
            recurrencePayload.daysOfWeek = recurrence.daysOfWeek;
          }
          if (recurrence.endType === 'after') {
            recurrencePayload.occurrences = parseInt(recurrence.occurrences) || 4;
          } else if (recurrence.endType === 'on_date' && recurrence.endDate) {
            recurrencePayload.endDate = recurrence.endDate;
          }
          const res: unknown = await apiClient.post('service-appointments/recurring', {
            ...basePayload,
            customerName: custName.trim(),
            customerPhone: custPhone.trim(),
            customerEmail: custEmail.trim() || undefined,
            recurrence: recurrencePayload,
          });
          const count = res?.data?.createdCount || res?.createdCount || '?';
          platformAlertSimple(
            'Recurring Series Created',
            `${count} appointments scheduled starting ${fmtDate(selectedDate)}`
          );
        } else {
          await apiClient.post('service-appointments', {
            ...basePayload,
            customerName: custName.trim(),
            customerPhone: custPhone.trim(),
            customerEmail: custEmail.trim() || undefined,
          });
          platformAlertSimple(
            'Booked',
            `Appointment confirmed for ${fmtDate(selectedDate)} at ${fmtSlot(selectedSlot)}`
          );
        }
        router.back();
      } catch (err) {
        platformAlertSimple('Error', err?.message || 'Failed to create appointment');
      } finally {
        setSaving(false);
        setSavingProgress('');
      }
      return;
    }

    // Group booking: all guests share service/date/time/staff
    const groupBookingId =
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : uuidv4();

    const allGuests = [
      { name: custName.trim(), phone: custPhone.trim() },
      ...guestDetails.slice(0, guestCount - 1).map((g) => ({
        name: g.name.trim() || `Guest`,
        phone: g.phone.trim(),
      })),
    ];

    try {
      setSaving(true);
      for (let i = 0; i < allGuests.length; i++) {
        setSavingProgress(`Creating ${i + 1} of ${allGuests.length} appointments...`);
        await apiClient.post('service-appointments', {
          ...basePayload,
          customerName: allGuests[i].name,
          customerPhone: allGuests[i].phone,
          groupBookingId,
        });
      }
      platformAlertSimple(
        'Group Booked',
        `${allGuests.length} appointments confirmed for ${fmtDate(selectedDate)} at ${fmtSlot(selectedSlot)}`
      );
      router.back();
    } catch (err) {
      platformAlertSimple('Error', err?.message || 'Failed to create group appointment');
    } finally {
      setSaving(false);
      setSavingProgress('');
    }
  };

  if (loadingInit) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>New Appointment</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Group Booking Toggle */}
          <View style={styles.groupToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Group Booking</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: -6, marginBottom: 4 }}>
                Book multiple guests for the same slot
              </Text>
            </View>
            <Switch
              value={isGroupBooking}
              onValueChange={(v) => {
                setIsGroupBooking(v);
                if (v) {
                  setGuestCount(2);
                  setGuestDetails([{ name: '', phone: '' }]);
                }
              }}
              trackColor={{ false: '#d1d5db', true: '#4f46e5' }}
              thumbColor={isGroupBooking ? '#fff' : '#f4f4f4'}
            />
          </View>

          {isGroupBooking && (
            <View style={styles.groupSection}>
              {/* Guest count stepper */}
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Number of guests</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      if (guestCount <= 2) return;
                      const next = guestCount - 1;
                      setGuestCount(next);
                      setGuestDetails((prev) => prev.slice(0, next - 1));
                    }}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{guestCount}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      if (guestCount >= 10) return;
                      const next = guestCount + 1;
                      setGuestCount(next);
                      setGuestDetails((prev) => {
                        const copy = [...prev];
                        while (copy.length < next - 1) copy.push({ name: '', phone: '' });
                        return copy;
                      });
                    }}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Additional guests */}
              {Array.from({ length: guestCount - 1 }).map((_, idx) => (
                <View key={idx} style={styles.guestRow}>
                  <Text style={styles.guestLabel}>Guest {idx + 2}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Guest name"
                    placeholderTextColor="#9ca3af"
                    value={guestDetails[idx]?.name || ''}
                    onChangeText={(v) =>
                      setGuestDetails((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], name: v };
                        return copy;
                      })
                    }
                  />
                  <TextInput
                    style={[styles.input, { marginTop: 6 }]}
                    placeholder="Guest phone"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    value={guestDetails[idx]?.phone || ''}
                    onChangeText={(v) =>
                      setGuestDetails((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], phone: v };
                        return copy;
                      })
                    }
                  />
                </View>
              ))}
            </View>
          )}

          {/* Date picker */}
          <Text style={styles.sectionLabel}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
            {NEXT_DAYS.map((d, i) => {
              const active = fmtISO(d) === fmtISO(selectedDate);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[styles.dateChipDay, active && styles.dateChipTextActive]}>
                    {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dateChipNum, active && styles.dateChipTextActive]}>
                    {d.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time slots */}
          <Text style={styles.sectionLabel}>Time</Text>
          {loadingSlots ? (
            <ActivityIndicator color="#4f46e5" style={{ marginBottom: 16 }} />
          ) : (
            <View style={styles.slotsGrid}>
              {availableSlots.length === 0 ? (
                <Text style={styles.noSlots}>No available slots for this date</Text>
              ) : (
                availableSlots.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.slotChip, selectedSlot === t && styles.slotChipActive]}
                    onPress={() => setSelectedSlot(t)}
                  >
                    <Text style={[styles.slotText, selectedSlot === t && styles.slotTextActive]}>
                      {fmtSlot(t)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Repeat / Recurrence */}
          <Text style={styles.sectionLabel}>Repeat</Text>
          <TouchableOpacity style={styles.repeatRow} onPress={() => setShowRecurrencePicker(true)}>
            <Ionicons
              name="repeat-outline"
              size={18}
              color={recurrence.enabled ? '#4f46e5' : '#9ca3af'}
            />
            <Text style={[styles.repeatRowText, recurrence.enabled && { color: '#4f46e5' }]}>
              {recurrence.enabled
                ? RECURRENCE_OPTIONS.find((o) => o.frequency === recurrence.frequency)?.label ||
                  'Repeating'
                : 'Does not repeat'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {recurrence.enabled && (
            <View style={styles.recurrenceSummaryBox}>
              {(recurrence.frequency === 'weekly' || recurrence.frequency === 'biweekly') && (
                <View style={styles.dayChipsRow}>
                  {DAY_LABELS.map((label, idx) => {
                    const active = recurrence.daysOfWeek.includes(idx);
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.dayChip, active && styles.dayChipActive]}
                        onPress={() =>
                          setRecurrence((prev) => ({
                            ...prev,
                            daysOfWeek: active
                              ? prev.daysOfWeek.filter((d) => d !== idx)
                              : [...prev.daysOfWeek, idx],
                          }))
                        }
                      >
                        <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <View style={styles.endTypeRow}>
                {(['never', 'after', 'on_date'] as RecurrenceEndType[]).map((et) => (
                  <TouchableOpacity
                    key={et}
                    style={[
                      styles.endTypeChip,
                      recurrence.endType === et && styles.endTypeChipActive,
                    ]}
                    onPress={() => setRecurrence((prev) => ({ ...prev, endType: et }))}
                  >
                    <Text
                      style={[
                        styles.endTypeChipText,
                        recurrence.endType === et && styles.endTypeChipTextActive,
                      ]}
                    >
                      {et === 'never' ? 'Never' : et === 'after' ? 'After N times' : 'On date'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {recurrence.endType === 'after' && (
                <View style={styles.endConditionRow}>
                  <Text style={styles.endConditionLabel}>Occurrences</Text>
                  <TextInput
                    style={styles.endConditionInput}
                    keyboardType="numeric"
                    value={recurrence.occurrences}
                    onChangeText={(v) => setRecurrence((prev) => ({ ...prev, occurrences: v }))}
                    placeholder="4"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              )}
              {recurrence.endType === 'on_date' && (
                <View style={styles.endConditionRow}>
                  <Text style={styles.endConditionLabel}>End date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.endConditionInput, { width: 130 }]}
                    value={recurrence.endDate}
                    onChangeText={(v) => setRecurrence((prev) => ({ ...prev, endDate: v }))}
                    placeholder="2025-12-31"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              )}
            </View>
          )}

          {/* Services (multi-service) */}
          <Text style={styles.sectionLabel}>Services</Text>
          {selectedServices.map((svc, idx) => (
            <View key={idx} style={styles.multiServiceRow}>
              <Ionicons name="cut-outline" size={16} color="#4f46e5" />
              <Text style={styles.multiServiceName} numberOfLines={1}>
                {svc.name}
              </Text>
              {svc.serviceDetails?.duration ? (
                <Text style={styles.multiServiceDur}>{svc.serviceDetails.duration}m</Text>
              ) : null}
              <TouchableOpacity
                onPress={() => handleRemoveService(idx)}
                style={styles.multiServiceRemove}
              >
                <Ionicons name="close-circle" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          {selectedServices.length === 0 && (
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => (services.length > 0 ? setShowServicePicker(true) : undefined)}
            >
              <TextInput
                style={[styles.pickerInput, { flex: 1 }]}
                placeholder="Type or select a service…"
                placeholderTextColor="#9ca3af"
                value={serviceTypeText}
                onChangeText={setServiceTypeText}
              />
              {services.length > 0 && (
                <TouchableOpacity onPress={() => setShowServicePicker(true)}>
                  <Ionicons name="chevron-down" size={18} color="#6b7280" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
          {selectedServices.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <TouchableOpacity
                style={styles.addServiceBtn}
                onPress={() => setShowServicePicker(true)}
              >
                <Ionicons name="add-circle-outline" size={16} color="#4f46e5" />
                <Text style={styles.addServiceText}>Add another service</Text>
              </TouchableOpacity>
              {selectedServices.length > 1 && (
                <Text style={styles.totalDurText}>Total: {totalServiceDuration}m</Text>
              )}
            </View>
          )}

          {/* Duration */}
          <Text style={styles.sectionLabel}>Duration (minutes)</Text>
          <View style={styles.durationRow}>
            {[30, 45, 60, 90, 120].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationChip, duration === String(d) && styles.durationChipActive]}
                onPress={() => setDuration(String(d))}
              >
                <Text
                  style={[styles.durationText, duration === String(d) && styles.durationTextActive]}
                >
                  {d}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Staff */}
          <Text style={styles.sectionLabel}>Staff (optional)</Text>
          <TouchableOpacity style={styles.staffPickerBtn} onPress={() => setShowStaffPicker(true)}>
            <Ionicons
              name="person-circle-outline"
              size={20}
              color={selectedStaff ? '#4f46e5' : '#9ca3af'}
            />
            <Text style={[styles.staffPickerText, selectedStaff && { color: '#111' }]}>
              {selectedStaff ? selectedStaff.name : 'Any available staff'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {/* Customer */}
          <Text style={styles.sectionLabel}>Customer</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name *"
            placeholderTextColor="#9ca3af"
            value={custName}
            onChangeText={setCustName}
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Phone number *"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={custPhone}
            onChangeText={setCustPhone}
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Email (optional)"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={custEmail}
            onChangeText={setCustEmail}
          />

          {/* Notes */}
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
            placeholder="Colour formula, special instructions…"
            placeholderTextColor="#9ca3af"
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
            {saving ? (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <ActivityIndicator color="#fff" />
                {savingProgress ? (
                  <Text style={[styles.submitText, { fontSize: 13 }]}>{savingProgress}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.submitText}>
                {isGroupBooking
                  ? `Confirm ${guestCount} Appointments`
                  : recurrence.enabled
                    ? 'Confirm Recurring Series'
                    : 'Confirm Appointment'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Staff picker modal */}
      <Modal
        visible={showStaffPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStaffPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Staff</Text>
              <TouchableOpacity onPress={() => setShowStaffPicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.staffOption}
              onPress={() => {
                setSelectedStaff(null);
                setShowStaffPicker(false);
              }}
            >
              <Ionicons name="people-outline" size={20} color="#6b7280" />
              <Text style={styles.staffOptionText}>Any available staff</Text>
            </TouchableOpacity>
            {staff.map((s) => (
              <TouchableOpacity
                key={s._id}
                style={[
                  styles.staffOption,
                  selectedStaff?._id === s._id && styles.staffOptionActive,
                ]}
                onPress={() => {
                  setSelectedStaff(s);
                  setShowStaffPicker(false);
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={selectedStaff?._id === s._id ? '#4f46e5' : '#374151'}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.staffOptionText,
                      selectedStaff?._id === s._id && { color: '#4f46e5' },
                    ]}
                  >
                    {s.name}
                  </Text>
                  {s.speciality ? <Text style={styles.staffSpeciality}>{s.speciality}</Text> : null}
                </View>
                {selectedStaff?._id === s._id && (
                  <Ionicons name="checkmark" size={18} color="#4f46e5" />
                )}
              </TouchableOpacity>
            ))}
            {staff.length === 0 && (
              <Text style={styles.emptyPicker}>
                No staff members found. Add staff in Team settings.
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Recurrence picker modal */}
      <Modal
        visible={showRecurrencePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecurrencePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Repeat</Text>
              <TouchableOpacity onPress={() => setShowRecurrencePicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {RECURRENCE_OPTIONS.map((opt) => {
              const isSelected =
                opt.frequency === null
                  ? !recurrence.enabled
                  : recurrence.frequency === opt.frequency && recurrence.enabled;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.staffOption, isSelected && styles.staffOptionActive]}
                  onPress={() => {
                    if (opt.frequency === null) {
                      setRecurrence((prev) => ({ ...prev, enabled: false }));
                    } else {
                      setRecurrence((prev) => ({
                        ...prev,
                        enabled: true,
                        frequency: opt.frequency as RecurrenceFrequency,
                      }));
                    }
                    setShowRecurrencePicker(false);
                  }}
                >
                  <Ionicons
                    name={opt.frequency === null ? 'remove-circle-outline' : 'repeat-outline'}
                    size={20}
                    color={isSelected ? '#4f46e5' : '#374151'}
                  />
                  <Text style={[styles.staffOptionText, isSelected && { color: '#4f46e5' }]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#4f46e5" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Service picker modal */}
      <Modal
        visible={showServicePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServicePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service</Text>
              <TouchableOpacity onPress={() => setShowServicePicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {services.map((svc) => (
              <TouchableOpacity
                key={svc._id}
                style={styles.staffOption}
                onPress={() => handleSelectService(svc)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffOptionText}>{svc.name}</Text>
                  <Text style={styles.staffSpeciality}>
                    {svc.serviceDetails?.duration ? `${svc.serviceDetails.duration} min` : ''}
                    {svc.pricing?.selling ? ` · ₹${svc.pricing.selling}` : ''}
                  </Text>
                </View>
                {selectedService?._id === svc._id && (
                  <Ionicons name="checkmark" size={18} color="#4f46e5" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  content: { padding: 16, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    marginTop: 16,
  },
  dateRow: { marginBottom: 4 },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 52,
  },
  dateChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  dateChipDay: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  dateChipNum: { fontSize: 18, fontWeight: '800', color: '#111', marginTop: 2 },
  dateChipTextActive: { color: '#fff' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slotChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  slotText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  slotTextActive: { color: '#fff', fontWeight: '700' },
  noSlots: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginBottom: 4,
  },
  pickerInput: { fontSize: 15, color: '#111', paddingVertical: 10 },
  multiServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    gap: 8,
  },
  multiServiceName: { flex: 1, fontSize: 14, color: '#111', fontWeight: '500' },
  multiServiceDur: { fontSize: 12, color: '#6b7280' },
  multiServiceRemove: { padding: 2 },
  addServiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  addServiceText: { fontSize: 13, color: '#4f46e5', fontWeight: '500' },
  totalDurText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  durationChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  durationText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  durationTextActive: { color: '#fff' },
  staffPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 4,
  },
  staffPickerText: { flex: 1, fontSize: 14, color: '#9ca3af' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111',
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  staffOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  staffOptionActive: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  staffOptionText: { fontSize: 15, fontWeight: '600', color: '#111' },
  staffSpeciality: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  emptyPicker: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 24 },
  groupToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 16,
    marginBottom: 4,
  },
  groupSection: {
    backgroundColor: '#f0f0ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepperLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22 },
  stepperValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    minWidth: 24,
    textAlign: 'center',
  },
  guestRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#c7d2fe',
    marginTop: 8,
  },
  guestLabel: { fontSize: 12, fontWeight: '700', color: '#4f46e5', marginBottom: 6 },
  // Recurrence styles
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 4,
  },
  repeatRowText: { flex: 1, fontSize: 14, color: '#9ca3af' },
  recurrenceSummaryBox: {
    backgroundColor: '#f0f0ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    gap: 10,
  },
  dayChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#fff',
  },
  dayChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  dayChipText: { fontSize: 12, fontWeight: '600', color: '#4f46e5' },
  dayChipTextActive: { color: '#fff' },
  endTypeRow: { flexDirection: 'row', gap: 6 },
  endTypeChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  endTypeChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  endTypeChipText: { fontSize: 11, fontWeight: '600', color: '#4f46e5' },
  endTypeChipTextActive: { color: '#fff' },
  endConditionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  endConditionLabel: { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 },
  endConditionInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111',
    width: 70,
    textAlign: 'center',
  },
});
