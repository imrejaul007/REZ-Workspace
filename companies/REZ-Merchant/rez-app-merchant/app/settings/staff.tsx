import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import { logger } from '@/utils/logger';

type StaffRole = 'cashier' | 'manager';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  isActive: boolean;
  addedAt: string;
}

interface InviteForm {
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
}

const ROLE_LABELS: Record<StaffRole, string> = {
  cashier: 'Cashier',
  manager: 'Manager',
};

const ROLE_COLORS: Record<StaffRole, { bg: string; text: string }> = {
  cashier: { bg: '#F3F4F6', text: '#374151' },
  manager: { bg: '#FEF3C7', text: '#92400E' },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  } catch {
    return '—';
  }
}

function RoleBadge({ role }: { role: StaffRole }) {
  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.cashier;
  return (
    <View style={[badgeStyles.badge, { backgroundColor: colors.bg }]}>
      <ThemedText style={[badgeStyles.text, { color: colors.text }]}>
        {ROLE_LABELS[role] ?? role}
      </ThemedText>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default function StaffManagementScreen() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState<InviteForm>({
    name: '',
    email: '',
    phone: '',
    role: 'cashier',
  });

  const fetchStaff = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await apiClient.get<unknown>('merchant/staff');
      const payload = res.data ?? res;
      setStaff(Array.isArray(payload) ? payload : []);
    } catch (err) {
      logger.error('Staff fetch error:', err);
      const msg = err.message || 'Failed to load staff';
      setError(msg);
      if (!isRefreshing) platformAlertSimple('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleInvite = async () => {
    if (!form.name.trim()) {
      platformAlertSimple('Validation', 'Please enter a name.');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      platformAlertSimple('Validation', 'Please enter an email or phone number.');
      return;
    }
    try {
      setInviting(true);
      await apiClient.post('merchant/staff/invite', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
      });
      setInviteVisible(false);
      setForm({ name: '', email: '', phone: '', role: 'cashier' });
      await fetchStaff(true);
      platformAlertSimple('Invited', `${form.name} has been invited as ${ROLE_LABELS[form.role]}.`);
    } catch (err) {
      logger.error('Staff invite error:', err);
      platformAlertSimple('Error', err.message || 'Failed to invite staff member.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = (member: StaffMember) => {
    platformAlertConfirm(
      'Remove Staff',
      `Are you sure you want to remove ${member.name}?`,
      async () => {
        try {
          await apiClient.delete(`merchant/staff/${member.id}`);
          setStaff((prev) => prev.filter((s) => s.id !== member.id));
        } catch (err) {
          logger.error('Staff remove error:', err);
          platformAlertSimple('Error', err.message || 'Failed to remove staff member.');
        }
      }
    );
  };

  const renderStaffCard = ({ item }: { item: StaffMember }) => (
    <View style={styles.staffCard}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : '?'}
          </ThemedText>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <ThemedText style={styles.cardName}>{item.name}</ThemedText>
            <RoleBadge role={item.role} />
          </View>
          <ThemedText style={styles.cardContact}>{item.email || item.phone || '—'}</ThemedText>
          <View style={styles.cardMetaRow}>
            <View
              style={[styles.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#D1D5DB' }]}
            />
            <ThemedText
              style={[styles.statusText, { color: item.isActive ? '#10B981' : '#9CA3AF' }]}
            >
              {item.isActive ? 'Active' : 'Inactive'}
            </ThemedText>
            <ThemedText style={styles.addedAt}>· Added {formatDate(item.addedAt)}</ThemedText>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)}>
        <Ionicons name="trash-outline" size={18} color={Colors.light.destructive} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Staff Management
        </ThemedText>
        <TouchableOpacity style={styles.inviteHeaderBtn} onPress={() => setInviteVisible(true)}>
          <Ionicons name="person-add" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Invite button banner */}
      <View style={styles.inviteBanner}>
        <ThemedText style={styles.inviteBannerText}>
          {staff.length} staff member{staff.length !== 1 ? 's' : ''}
        </ThemedText>
        <TouchableOpacity style={styles.inviteBtn} onPress={() => setInviteVisible(true)}>
          <Ionicons name="person-add-outline" size={16} color="#fff" />
          <ThemedText style={styles.inviteBtnText}>Invite Staff</ThemedText>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading staff...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.destructive} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchStaff()}>
            <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchStaff(true)}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={56} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No staff added yet</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Invite team members to manage your store
              </ThemedText>
              <TouchableOpacity
                style={styles.emptyInviteBtn}
                onPress={() => setInviteVisible(true)}
              >
                <ThemedText style={styles.emptyInviteBtnText}>Invite Staff</ThemedText>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderStaffCard}
        />
      )}

      {/* Invite Modal */}
      <Modal
        visible={inviteVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInviteVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Invite Staff Member</ThemedText>
              <TouchableOpacity onPress={() => setInviteVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <ThemedText style={styles.fieldLabel}>Name *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={Colors.light.textSecondary}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              />

              {/* Email */}
              <ThemedText style={styles.fieldLabel}>Email</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.light.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              />

              {/* Phone */}
              <ThemedText style={styles.fieldLabel}>Phone</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Mobile number"
                placeholderTextColor={Colors.light.textSecondary}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              />

              {/* Role selector */}
              <ThemedText style={styles.fieldLabel}>Role</ThemedText>
              <View style={styles.roleRow}>
                {(['cashier', 'manager'] as StaffRole[]).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleOption, form.role === role && styles.roleOptionActive]}
                    onPress={() => setForm((f) => ({ ...f, role }))}
                  >
                    <Ionicons
                      name={role === 'manager' ? 'shield-checkmark-outline' : 'card-outline'}
                      size={18}
                      color={form.role === role ? Colors.light.primary : Colors.light.textSecondary}
                    />
                    <ThemedText
                      style={[
                        styles.roleOptionText,
                        form.role === role && styles.roleOptionTextActive,
                      ]}
                    >
                      {ROLE_LABELS[role]}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, inviting && styles.submitBtnDisabled]}
                onPress={handleInvite}
                disabled={inviting}
              >
                {inviting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.submitBtnText}>Send Invite</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  inviteHeaderBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.light.text },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  inviteBannerText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  inviteBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 14,
    paddingBottom: 32,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cardContact: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addedAt: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  removeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.errorLight,
    marginLeft: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 8 },
  errorText: { fontSize: 14, color: Colors.light.destructive, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyInviteBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  emptyInviteBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalClose: { padding: 4 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  roleOptionActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight2,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  roleOptionTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
