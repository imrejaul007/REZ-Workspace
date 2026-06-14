/**
 * CustomerProfile Component - Detailed customer view with history
 *
 * Features:
 * - Customer details display
 * - Visit history
 * - Service preferences
 * - Notes and tags
 * - Contact actions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { salonService, SalonCustomer, SalonServiceHistory } from '@/services/api/salon';

interface CustomerProfileProps {
  customer: SalonCustomer;
  onUpdate: () => void;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.light.primary,
  },
  actionBtnPrimaryText: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  notesCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  noteText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  noteInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    color: Colors.light.text,
  },
  saveNoteBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  saveNoteBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  historyList: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  historyItemLast: {
    borderBottomWidth: 0,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyService: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyAmountValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  historyStaff: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  preferencesCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  preferenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  preferenceText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  addPreferenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addPreferenceText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
});

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer, onUpdate }) => {
  const [notes, setNotes] = useState(customer.notes || '');
  const [serviceHistory, setServiceHistory] = useState<SalonServiceHistory[]>(customer.serviceHistory || []);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCall = useCallback(() => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  }, [customer.phone]);

  const handleMessage = useCallback(() => {
    if (customer.phone) {
      Linking.openURL(`sms:${customer.phone}`);
    }
  }, [customer.phone]);

  const handleSaveNotes = useCallback(async () => {
    try {
      await salonService.updateCustomerNotes(customer._id, notes);
      setIsEditingNotes(false);
      onUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to save notes');
    }
  }, [customer._id, notes, onUpdate]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatLastVisit = (dateStr?: string) => {
    if (!dateStr) return 'No visits yet';
    const visitDate = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateStr);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>{getInitials(customer.name)}</ThemedText>
        </View>
        <ThemedText style={styles.customerName}>{customer.name}</ThemedText>
        <ThemedText style={styles.customerPhone}>{customer.phone}</ThemedText>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <Ionicons name="call-outline" size={18} color={Colors.light.text} />
            <ThemedText style={styles.actionBtnText}>Call</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleMessage}>
            <Ionicons name="chatbubble-outline" size={18} color={Colors.light.text} />
            <ThemedText style={styles.actionBtnText}>Message</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => {
              // Navigate to booking screen
            }}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <ThemedText style={[styles.actionBtnText, styles.actionBtnPrimaryText]}>Book</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{customer.visitCount || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Visits</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{customer.loyaltyPoints || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Loyalty Points</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{formatLastVisit(customer.lastVisitDate)}</ThemedText>
          <ThemedText style={styles.statLabel}>Last Visit</ThemedText>
        </View>
      </View>

      {/* Notes Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
          <TouchableOpacity onPress={() => setIsEditingNotes(!isEditingNotes)}>
            <Ionicons
              name={isEditingNotes ? 'close-outline' : 'create-outline'}
              size={20}
              color={Colors.light.primary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.notesCard}>
          {isEditingNotes ? (
            <>
              <TextInput
                style={styles.noteInput}
                placeholder="Add notes about this customer..."
                placeholderTextColor={Colors.light.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity style={styles.saveNoteBtn} onPress={handleSaveNotes}>
                <ThemedText style={styles.saveNoteBtnText}>Save Notes</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <ThemedText style={styles.noteText}>
              {notes || 'No notes yet. Tap the edit button to add notes about this customer.'}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Service Preferences */}
      {customer.preferences && customer.preferences.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
          </View>
          <View style={styles.preferencesCard}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {customer.preferences.map((pref, index) => (
                <View key={index} style={styles.preferenceChip}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
                  <ThemedText style={[styles.preferenceText, { marginLeft: 4 }]}>{pref}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Service History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Service History</ThemedText>
        </View>
        {serviceHistory.length > 0 ? (
          <View style={styles.historyList}>
            {serviceHistory.map((history, index) => (
              <View
                key={history._id || index}
                style={[
                  styles.historyItem,
                  index === serviceHistory.length - 1 && styles.historyItemLast,
                ]}
              >
                <View style={styles.historyIcon}>
                  <Ionicons name="cut-outline" size={18} color={Colors.light.primary} />
                </View>
                <View style={styles.historyInfo}>
                  <ThemedText style={styles.historyService}>{history.serviceName}</ThemedText>
                  <ThemedText style={styles.historyMeta}>
                    {formatDate(history.date)}
                    {history.stylist && ` • ${history.stylist}`}
                  </ThemedText>
                </View>
                <View style={styles.historyAmount}>
                  <ThemedText style={styles.historyAmountValue}>
                    Rs. {history.amount.toLocaleString()}
                  </ThemedText>
                  {history.staff && (
                    <ThemedText style={styles.historyStaff}>By {history.staff}</ThemedText>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.historyList}>
            <ThemedText style={styles.emptyText}>
              No service history yet. Services will appear here after visits.
            </ThemedText>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
