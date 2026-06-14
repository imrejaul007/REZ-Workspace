import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { appointmentService, ServiceAppointment } from '@/services/api/appointments';
import { uploadsService } from '@/services/api/uploads';
import { apiClient } from '@/services/api/client';
import { platformAlertSimple, platformAlert } from '@/utils/platformAlert';
import Toast from 'react-native-toast-message';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  in_progress: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444',
  no_show: '#DC2626',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-Show',
};

function fmtTime(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${p}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appt, setAppt] = useState<ServiceAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Treatment notes modal
  const [showNotes, setShowNotes] = useState(false);
  const [stylistNotes, setStylistNotes] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Before / after photos
  const [photoBefore, setPhotoBefore] = useState('');
  const [photoAfter, setPhotoAfter] = useState('');
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  // Tip modal
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [customTipText, setCustomTipText] = useState('');
  const [completingWithTip, setCompletingWithTip] = useState(false);

  // Series edit scope picker
  const [showSeriesEditSheet, setShowSeriesEditSheet] = useState(false);
  const [seriesEditScope, setSeriesEditScope] = useState<
    'this' | 'this_and_following' | 'all' | null
  >(null);
  const [savingSeriesEdit, setSavingSeriesEdit] = useState(false);

  const load = useCallback(
    async (isRefreshing = false) => {
      if (!id) return;
      try {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);
        const data = await appointmentService.getAppointment(id);
        setAppt(data);
      } catch {
        platformAlertSimple('Error', 'Failed to load appointment');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleCompleteWithTip = async () => {
    if (!appt) return;
    const tip = customTipText ? parseInt(customTipText, 10) || 0 : tipAmount;
    try {
      setCompletingWithTip(true);
      // Pass tip in the status update body via direct apiClient call
      const res = await apiClient.put<ServiceAppointment>(
        `/service-appointments/${appt._id}/status`,
        { status: 'completed', tip: tip > 0 ? tip : undefined }
      );
      const updated: ServiceAppointment = res.data ?? (res as unknown as ServiceAppointment);
      setAppt(updated);
      setShowTipModal(false);
      setStylistNotes(appt.treatmentNotes?.stylistNotes || '');
      setClientNotes(appt.treatmentNotes?.clientVisibleNotes || '');
      setPhotoBefore(appt.treatmentNotes?.photos?.before || '');
      setPhotoAfter(appt.treatmentNotes?.photos?.after || '');
      setShowNotes(true);
      if (tip > 0) {
        Toast.show({
          type: 'success',
          text1: 'Appointment completed',
          text2: `Tip collected: ₹${tip}`,
        });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to complete appointment' });
    } finally {
      setCompletingWithTip(false);
    }
  };

  const handleAction = async (
    status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  ) => {
    if (!appt) return;
    if (status === 'completed') {
      // Show tip modal first
      setTipAmount(0);
      setCustomTipText('');
      setShowTipModal(true);
      return;
    }
    if (status === 'cancelled') {
      platformAlert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const updated = await appointmentService.updateStatus(
                appt._id,
                'cancelled',
                'Cancelled by merchant'
              );
              setAppt(updated);
            } catch {
              platformAlertSimple('Error', 'Failed to cancel appointment');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]);
      return;
    }
    try {
      setActionLoading(true);
      const updated = await appointmentService.updateStatus(appt._id, status);
      setAppt(updated);
    } catch {
      platformAlertSimple('Error', 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!appt) return;
    try {
      setSavingNotes(true);
      await appointmentService.addTreatmentNotes(appt._id, {
        stylistNotes: stylistNotes.trim() || undefined,
        clientVisibleNotes: clientNotes.trim() || undefined,
        photosBefore: photoBefore || undefined,
        photosAfter: photoAfter || undefined,
      });
      const updated = await appointmentService.updateStatus(appt._id, 'completed');
      setAppt(updated);
      setShowNotes(false);
    } catch {
      platformAlertSimple('Error', 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const pickPhoto = async (slot: 'before' | 'after') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      const uri = result.assets[0].uri;
      if (slot === 'before') setUploadingBefore(true);
      else setUploadingAfter(true);
      try {
        const uploaded = await uploadsService.uploadImage(
          uri,
          `appt-${slot}-${Date.now()}.jpg`,
          'general'
        );
        if (slot === 'before') setPhotoBefore(uploaded.url);
        else setPhotoAfter(uploaded.url);
        Toast.show({
          type: 'success',
          text1: `${slot === 'before' ? 'Before' : 'After'} photo uploaded`,
        });
      } catch {
        Toast.show({ type: 'error', text1: 'Photo upload failed' });
      } finally {
        if (slot === 'before') setUploadingBefore(false);
        else setUploadingAfter(false);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Could not access photo library' });
    }
  };

  const handleSeriesEdit = async (scope: 'this' | 'this_and_following' | 'all') => {
    if (!appt) return;
    try {
      setSavingSeriesEdit(true);
      await apiClient.put(`/service-appointments/${appt._id}/series`, { updateScope: scope });
      setShowSeriesEditSheet(false);
      Toast.show({
        type: 'success',
        text1: 'Series updated',
        text2:
          scope === 'this'
            ? 'This appointment updated'
            : scope === 'all'
              ? 'All in series updated'
              : 'This and following updated',
      });
      await load();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update series' });
    } finally {
      setSavingSeriesEdit(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  if (!appt) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>Appointment not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLinkBtn}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[appt.status] || '#6b7280';
  const canConfirm = appt.status === 'pending';
  const canStart = appt.status === 'confirmed';
  const canComplete = appt.status === 'in_progress';
  const canCancel = appt.status === 'pending' || appt.status === 'confirmed';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Appointment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {/* Status + Number */}
        <View style={styles.topCard}>
          <View style={styles.topLeft}>
            <Text style={styles.apptNum}>{appt.appointmentNumber}</Text>
            <Text style={styles.serviceType}>{appt.serviceType}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[appt.status] || appt.status}
            </Text>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.card}>
          <Row icon="calendar-outline" label="Date" value={fmtDate(appt.appointmentDate)} />
          <Row
            icon="time-outline"
            label="Time"
            value={`${fmtTime(appt.appointmentTime)} · ${appt.duration} min`}
          />
          {appt.recurrence?.enabled && (
            <View style={recurStyles.recurBadgeRow}>
              <Ionicons name="repeat-outline" size={14} color="#4f46e5" />
              <Text style={recurStyles.recurBadgeText}>
                Repeating
                {appt.recurrence?.frequency ? ` · ${appt.recurrence.frequency}` : ''}
                {appt.recurrence?.seriesIndex != null
                  ? ` (${appt.recurrence.seriesIndex + 1})`
                  : ''}
              </Text>
              <TouchableOpacity
                style={recurStyles.editSeriesBtn}
                onPress={() => setShowSeriesEditSheet(true)}
              >
                <Text style={recurStyles.editSeriesBtnText}>Edit series</Text>
              </TouchableOpacity>
            </View>
          )}
          {appt.staffName && (
            <Row icon="person-circle-outline" label="Staff" value={appt.staffName} />
          )}
          {!appt.staffName && appt.staffMember && (
            <Row icon="person-circle-outline" label="Staff" value={appt.staffMember} />
          )}
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Row icon="person-outline" label="Name" value={appt.customerName} />
          <Row icon="call-outline" label="Phone" value={appt.customerPhone} />
          {appt.customerEmail && (
            <Row icon="mail-outline" label="Email" value={appt.customerEmail} />
          )}
          {appt.specialInstructions && (
            <Row icon="chatbubble-outline" label="Notes" value={appt.specialInstructions} />
          )}
        </View>

        {/* Treatment Notes (shown if unknown exist) */}
        {(appt.treatmentNotes?.stylistNotes ||
          appt.treatmentNotes?.clientVisibleNotes ||
          appt.treatmentNotes?.photos?.before ||
          appt.treatmentNotes?.photos?.after) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Treatment Notes</Text>

            {/* Internal notes */}
            {appt.treatmentNotes?.stylistNotes && (
              <View style={styles.internalNotesBox}>
                <View style={styles.notesBadgeRow}>
                  <Ionicons name="lock-closed-outline" size={13} color="#6B7280" />
                  <Text style={styles.notesBadgeLabel}>Internal Notes (visible to team only)</Text>
                </View>
                <Text style={styles.notesBodyText}>{appt.treatmentNotes.stylistNotes}</Text>
              </View>
            )}

            {/* Client-visible notes */}
            {appt.treatmentNotes?.clientVisibleNotes && (
              <View style={styles.clientNotesBox}>
                <View style={styles.notesBadgeRow}>
                  <Ionicons name="person-outline" size={13} color="#2563EB" />
                  <Text style={styles.clientNotesBadgeLabel}>
                    Client Notes (shared with client)
                  </Text>
                </View>
                <Text style={styles.clientNotesBodyText}>
                  {appt.treatmentNotes.clientVisibleNotes}
                </Text>
              </View>
            )}

            {/* Before / After photos */}
            {(appt.treatmentNotes?.photos?.before || appt.treatmentNotes?.photos?.after) && (
              <View style={styles.photosRow}>
                {appt.treatmentNotes?.photos?.before && (
                  <View style={styles.photoSlot}>
                    <Text style={styles.photoLabel}>Before</Text>
                    <Image
                      source={{ uri: appt.treatmentNotes.photos.before }}
                      style={styles.photoThumb}
                      resizeMode="cover"
                    />
                  </View>
                )}
                {appt.treatmentNotes?.photos?.after && (
                  <View style={styles.photoSlot}>
                    <Text style={styles.photoLabel}>After</Text>
                    <Image
                      source={{ uri: appt.treatmentNotes.photos.after }}
                      style={styles.photoThumb}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Action buttons */}
        {(canConfirm || canStart || canComplete || canCancel) && (
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Actions</Text>
            <View style={styles.actionGrid}>
              {canConfirm && (
                <ActionBtn
                  icon="checkmark-circle-outline"
                  label="Confirm"
                  color="#3B82F6"
                  onPress={() => handleAction('confirmed')}
                  loading={actionLoading}
                />
              )}
              {canStart && (
                <ActionBtn
                  icon="play-circle-outline"
                  label="Start"
                  color="#8B5CF6"
                  onPress={() => handleAction('in_progress')}
                  loading={actionLoading}
                />
              )}
              {canComplete && (
                <ActionBtn
                  icon="checkmark-done-circle-outline"
                  label="Complete"
                  color="#10B981"
                  onPress={() => handleAction('completed')}
                  loading={actionLoading}
                />
              )}
              {canCancel && (
                <ActionBtn
                  icon="close-circle-outline"
                  label="Cancel"
                  color="#EF4444"
                  onPress={() => handleAction('cancelled')}
                  loading={actionLoading}
                />
              )}
            </View>
          </View>
        )}

        {/* Timeline */}
        {appt.statusHistory && appt.statusHistory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Timeline</Text>
            {appt.statusHistory!.map((h, i) => (
              <View key={i} style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: STATUS_COLORS[h.status] || '#9ca3af' },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineStatus}>{STATUS_LABELS[h.status] || h.status}</Text>
                  <Text style={styles.timelineTime}>
                    {h.timestamp
                      ? new Date(h.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                    {h.note ? ` · ${h.note}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Series Edit Scope Modal */}
      <Modal
        visible={showSeriesEditSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSeriesEditSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Recurring Appointment</Text>
              <TouchableOpacity onPress={() => setShowSeriesEditSheet(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={recurStyles.editSheetSubtitle}>
              Which appointments do you want to update?
            </Text>
            {(
              [
                {
                  scope: 'this' as const,
                  label: 'Edit this appointment',
                  sub: 'Only changes this occurrence',
                  icon: 'calendar-outline' as const,
                },
                {
                  scope: 'this_and_following' as const,
                  label: 'Edit this and following',
                  sub: 'Changes this and all future appointments',
                  icon: 'arrow-forward-circle-outline' as const,
                },
                {
                  scope: 'all' as const,
                  label: 'Edit all in series',
                  sub: 'Changes every appointment in the series',
                  icon: 'repeat-outline' as const,
                },
              ] as const
            ).map(({ scope, label, sub, icon }) => (
              <TouchableOpacity
                key={scope}
                style={[
                  recurStyles.scopeOption,
                  seriesEditScope === scope && recurStyles.scopeOptionActive,
                ]}
                onPress={() => setSeriesEditScope(scope)}
                disabled={savingSeriesEdit}
              >
                <Ionicons
                  name={icon}
                  size={22}
                  color={seriesEditScope === scope ? '#4f46e5' : '#374151'}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      recurStyles.scopeLabel,
                      seriesEditScope === scope && { color: '#4f46e5' },
                    ]}
                  >
                    {label}
                  </Text>
                  <Text style={recurStyles.scopeSub}>{sub}</Text>
                </View>
                {seriesEditScope === scope && (
                  <Ionicons name="checkmark-circle" size={20} color="#4f46e5" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                recurStyles.applyBtn,
                (!seriesEditScope || savingSeriesEdit) && { opacity: 0.5 },
              ]}
              onPress={() => seriesEditScope && handleSeriesEdit(seriesEditScope)}
              disabled={!seriesEditScope || savingSeriesEdit}
            >
              {savingSeriesEdit ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={recurStyles.applyBtnText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tip Modal */}
      <Modal
        visible={showTipModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Collect Tip?</Text>
              <TouchableOpacity onPress={() => setShowTipModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Quick amounts</Text>
            <View style={tipStyles.chipRow}>
              {[0, 50, 100, 200, 500].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    tipStyles.tipChip,
                    tipAmount === amt && !customTipText && tipStyles.tipChipActive,
                  ]}
                  onPress={() => {
                    setTipAmount(amt);
                    setCustomTipText('');
                  }}
                >
                  <Text
                    style={[
                      tipStyles.tipChipText,
                      tipAmount === amt && !customTipText && tipStyles.tipChipTextActive,
                    ]}
                  >
                    {amt === 0 ? 'No tip' : `\u20B9${amt}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Custom amount</Text>
            <TextInput
              style={[styles.notesInput, { height: 44 }]}
              placeholder="Enter amount..."
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={customTipText}
              onChangeText={(v) => {
                setCustomTipText(v);
                setTipAmount(0);
              }}
            />
            <Text style={tipStyles.totalLine}>
              {(customTipText ? parseInt(customTipText, 10) || 0 : tipAmount) > 0
                ? `Tip: \u20B9${customTipText ? parseInt(customTipText, 10) || 0 : tipAmount}`
                : 'No tip selected'}
            </Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCompleteWithTip}
                disabled={completingWithTip}
              >
                {completingWithTip ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Confirm & Complete</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={async () => {
                  setShowTipModal(false);
                  try {
                    setActionLoading(true);
                    const updated = await appointmentService.updateStatus(
                      appt?._id ?? '',
                      'completed'
                    );
                    setAppt(updated);
                    setShowNotes(true);
                  } catch {
                    Toast.show({ type: 'error', text1: 'Failed to complete appointment' });
                  } finally {
                    setActionLoading(false);
                  }
                }}
              >
                <Text style={styles.skipText}>Skip — no tip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Treatment Notes Modal */}
      <Modal
        visible={showNotes}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotes(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalSheetScroll}
            contentContainerStyle={styles.modalSheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Treatment Notes</Text>
              <TouchableOpacity onPress={() => setShowNotes(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Internal notes section */}
            <View style={styles.internalNotesBox}>
              <View style={styles.notesBadgeRow}>
                <Ionicons name="lock-closed-outline" size={13} color="#6B7280" />
                <Text style={styles.notesBadgeLabel}>Internal Notes (visible to team only)</Text>
              </View>
              <TextInput
                style={[styles.notesInput, { height: 80, marginTop: 8 }]}
                placeholder="Colour formula, products used, observations…"
                placeholderTextColor="#9ca3af"
                multiline
                value={stylistNotes}
                onChangeText={setStylistNotes}
              />
            </View>

            {/* Client-visible notes section */}
            <View style={styles.clientNotesBox}>
              <View style={styles.notesBadgeRow}>
                <Ionicons name="person-outline" size={13} color="#2563EB" />
                <Text style={styles.clientNotesBadgeLabel}>Client Notes (shared with client)</Text>
              </View>
              <TextInput
                style={[styles.notesInput, { height: 70, marginTop: 8, borderColor: '#BFDBFE' }]}
                placeholder="Home care instructions, next visit suggestion…"
                placeholderTextColor="#9ca3af"
                multiline
                value={clientNotes}
                onChangeText={setClientNotes}
              />
            </View>

            {/* Before / After Photos */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Before / After Photos</Text>
            <View style={styles.photoPickerRow}>
              {/* Before photo */}
              <TouchableOpacity
                style={styles.photoPickerSlot}
                onPress={() => pickPhoto('before')}
                disabled={uploadingBefore}
              >
                {uploadingBefore ? (
                  <ActivityIndicator color="#6B7280" />
                ) : photoBefore ? (
                  <Image
                    source={{ uri: photoBefore }}
                    style={styles.photoPickerThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.photoPickerLabel}>Before</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* After photo */}
              <TouchableOpacity
                style={styles.photoPickerSlot}
                onPress={() => pickPhoto('after')}
                disabled={uploadingAfter}
              >
                {uploadingAfter ? (
                  <ActivityIndicator color="#6B7280" />
                ) : photoAfter ? (
                  <Image
                    source={{ uri: photoAfter }}
                    style={styles.photoPickerThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.photoPickerLabel}>After</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveNotes} disabled={savingNotes}>
              {savingNotes ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save & Mark Complete</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={async () => {
                try {
                  setActionLoading(true);
                  const updated = await appointmentService.updateStatus(appt._id, 'completed');
                  setAppt(updated);
                  setShowNotes(false);
                } catch {
                  Toast.show({ type: 'error', text1: 'Failed to complete appointment' });
                } finally {
                  setActionLoading(false);
                }
              }}
            >
              <Text style={styles.skipText}>Skip notes — just complete</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color="#9ca3af" style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  onPress,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: color + '40', backgroundColor: color + '10' }]}
      onPress={onPress}
      disabled={loading}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    gap: 10,
  },
  emptyText: { fontSize: 15, color: '#6b7280' },
  backLinkBtn: { marginTop: 8 },
  backLink: { fontSize: 14, color: '#4f46e5', fontWeight: '600' },
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
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  topCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topLeft: { flex: 1 },
  apptNum: { fontSize: 13, fontWeight: '700', color: '#4f46e5', marginBottom: 2 },
  serviceType: { fontSize: 20, fontWeight: '800', color: '#111' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    gap: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  rowLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 1 },
  rowValue: { fontSize: 14, color: '#111', fontWeight: '500' },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineStatus: { fontSize: 13, fontWeight: '600', color: '#111' },
  timelineTime: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalSheetScroll: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  modalSheetContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 13, color: '#9ca3af' },

  // Notes section styles (Tasks 3 & 4)
  internalNotesBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 12,
  },
  clientNotesBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    marginBottom: 12,
  },
  notesBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  notesBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  clientNotesBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notesBodyText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  clientNotesBodyText: { fontSize: 14, color: '#1E40AF', lineHeight: 20 },

  // Photo thumbnails in detail view
  photosRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  photoSlot: { flex: 1, alignItems: 'center', gap: 4 },
  photoLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  photoThumb: { width: '100%', height: 90, borderRadius: 8 },

  // Photo picker in modal
  photoPickerRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoPickerSlot: {
    flex: 1,
    height: 90,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  photoPickerThumb: { width: '100%', height: '100%' },
  photoPickerLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
});

const recurStyles = StyleSheet.create({
  recurBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0ff',
    marginTop: 4,
  },
  recurBadgeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  editSeriesBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#eff0ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  editSeriesBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
  },
  editSheetSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  scopeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  scopeOptionActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#f0f0ff',
  },
  scopeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  scopeSub: {
    fontSize: 12,
    color: '#9ca3af',
  },
  applyBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

const tipStyles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  tipChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  tipChipActive: { borderColor: '#10B981', backgroundColor: '#f0fdf4' },
  tipChipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  tipChipTextActive: { color: '#10B981' },
  totalLine: { fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 4 },
});
