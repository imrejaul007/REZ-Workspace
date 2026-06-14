/**
 * Corporate B2B Dashboard
 *
 * Merchants can:
 *  - Register/view their company account
 *  - Add employees (single or bulk CSV)
 *  - Distribute coins to employees or departments
 *  - View analytics: utilization, top spenders, dept breakdown
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { platformAlertSimple, platformAlert } from '@/utils/platformAlert';
import { apiClient } from '@/services/api/client';
import * as Haptics from 'expo-haptics';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CorporateAccount {
  _id: string;
  companyName: string;
  companyEmail: string;
  adminEmail: string;
  industry?: string;
  coinBalance: number;
  totalCoinsLoaded: number;
  totalCoinsDistributed: number;
  totalCoinsRedeemed: number;
  memberCount: number;
  plan: 'starter' | 'growth' | 'enterprise';
  isActive: boolean;
  lastDistributionAt?: string;
}

interface Member {
  _id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  status: 'active' | 'invited' | 'deactivated';
  coinsReceived: number;
  coinsSpent: number;
}

interface Analytics {
  overview: {
    coinBalance: number;
    totalCoinsLoaded: number;
    totalCoinsDistributed: number;
    totalCoinsRedeemed: number;
    utilizationRate: number;
  };
  members: { total: number; active: number; invited: number; pendingCoins: number };
  departments: Array<{ _id: string; members: number; coinsReceived: number; coinsSpent: number }>;
  topSpenders: Member[];
}

type Tab = 'overview' | 'members' | 'distribute' | 'analytics';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fc(n: number) {
  return n.toLocaleString('en-IN');
}

const PLAN_COLORS: Record<string, string> = {
  starter: '#6b7280',
  growth: '#7C3AED',
  enterprise: '#F59E0B',
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CorporateDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [membersPage, setMembersPage] = useState(1);
  const [memberSearch, setMemberSearch] = useState('');

  // Register modal
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({
    companyName: '',
    companyEmail: '',
    adminEmail: '',
    industry: '',
  });
  const [registering, setRegistering] = useState(false);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    department: '',
    designation: '',
  });
  const [addingMember, setAddingMember] = useState(false);

  // Bulk distribute modal
  const [showDistribute, setShowDistribute] = useState(false);
  const [distForm, setDistForm] = useState({ coins: '', department: '', note: '' });
  const [distributing, setDistributing] = useState(false);

  // ── Data Loading ───────────────────────────────────────────────────────────

  const loadAccount = useCallback(async () => {
    try {
      const res = await apiClient.get('merchant/corporate');
      if (res.success) setAccount(res.data);
    } catch {
      setAccount(null);
    }
  }, []);

  const loadMembers = useCallback(
    async (page = 1) => {
      if (!account) return;
      try {
        const res = await apiClient.get(`merchant/corporate/members?page=${page}&limit=30`);
        if (res.success) {
          setMembers(page === 1 ? res.data : (prev) => [...prev, ...res.data]);
          setMembersPage(page);
        }
      } catch {}
    },
    [account]
  );

  const loadAnalytics = useCallback(async () => {
    if (!account) return;
    try {
      const res = await apiClient.get('merchant/corporate/analytics');
      if (res.success) setAnalytics(res.data);
    } catch {}
  }, [account]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await loadAccount();
    setLoading(false);
  }, [loadAccount]);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (account) {
      loadMembers(1);
      loadAnalytics();
    }
  }, [account]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    if (account) {
      await Promise.all([loadMembers(1), loadAnalytics()]);
    }
    setRefreshing(false);
  };

  // ── Register ───────────────────────────────────────────────────────────────

  const handleRegister = async () => {
    const { companyName, companyEmail, adminEmail } = regForm;
    if (!companyName || !companyEmail || !adminEmail) {
      return platformAlertSimple(
        'Missing Fields',
        'Company name, email, and admin email are required.'
      );
    }
    setRegistering(true);
    try {
      const res = await apiClient.post('merchant/corporate/register', regForm);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAccount(res.data);
        setShowRegister(false);
      } else {
        platformAlertSimple('Error', res.message || 'Registration failed');
      }
    } catch (e) {
      platformAlertSimple('Error', e.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  // ── Add Member ─────────────────────────────────────────────────────────────

  const handleAddMember = async () => {
    if (!memberForm.name || !memberForm.email) {
      return platformAlertSimple('Missing Fields', 'Name and email are required.');
    }
    setAddingMember(true);
    try {
      const res = await apiClient.post('merchant/corporate/members', memberForm);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMembers((prev) => [res.data, ...prev]);
        setAccount((prev) => (prev ? { ...prev, memberCount: prev.memberCount + 1 } : prev));
        setMemberForm({ name: '', email: '', department: '', designation: '' });
        setShowAddMember(false);
      } else {
        platformAlertSimple('Error', res.message || 'Failed to add member');
      }
    } catch (e) {
      platformAlertSimple('Error', e.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  // ── Distribute ─────────────────────────────────────────────────────────────

  const handleDistribute = async () => {
    const coins = parseInt(distForm.coins, 10);
    if (!coins || coins < 1) return platformAlertSimple('Invalid', 'Enter a valid coin amount.');

    const target = distForm.department
      ? `department "${distForm.department}"`
      : 'all active members';
    platformAlert('Confirm Distribution', `Send ${fc(coins)} coins each to ${target}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Coins',
        style: 'default',
        onPress: async () => {
          setDistributing(true);
          try {
            const payload: unknown = { coins, note: distForm.note || undefined };
            if (distForm.department) payload.department = distForm.department;
            else payload.all = true;

            const res = await apiClient.post('merchant/corporate/distribute', payload);
            if (res.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              platformAlertSimple('Done!', res.message);
              setShowDistribute(false);
              setDistForm({ coins: '', department: '', note: '' });
              await loadAll();
              await loadAnalytics();
            } else {
              platformAlertSimple('Failed', res.message || 'Distribution failed');
            }
          } catch (e) {
            platformAlertSimple('Error', e.message || 'Distribution failed');
          } finally {
            setDistributing(false);
          }
        },
      },
    ]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Corporate Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!account) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Corporate Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="business" size={56} color="#7C3AED" />
          <Text style={styles.emptyTitle}>Set Up Corporate Account</Text>
          <Text style={styles.emptySubtitle}>
            Distribute REZ coins to your employees as rewards, perks, and incentives.
          </Text>
          <TouchableOpacity style={styles.setupBtn} onPress={() => setShowRegister(true)}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.setupBtnText}>Register Company</Text>
          </TouchableOpacity>
        </View>

        <RegisterModal
          visible={showRegister}
          form={regForm}
          onChange={setRegForm}
          onSubmit={handleRegister}
          onClose={() => setShowRegister(false)}
          loading={registering}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {account.companyName}
        </Text>
        <TouchableOpacity
          style={styles.distributeHeaderBtn}
          onPress={() => setShowDistribute(true)}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Plan badge */}
      <View style={[styles.planBadge, { backgroundColor: PLAN_COLORS[account.plan] }]}>
        <Text style={styles.planBadgeText}>{account.plan.toUpperCase()} PLAN</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['overview', 'members', 'distribute', 'analytics'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
      >
        {tab === 'overview' && <OverviewTab account={account} analytics={analytics} />}
        {tab === 'members' && (
          <MembersTab
            members={members}
            search={memberSearch}
            onSearchChange={setMemberSearch}
            onAdd={() => setShowAddMember(true)}
          />
        )}
        {tab === 'distribute' && (
          <DistributeTab
            account={account}
            analytics={analytics}
            onDistribute={() => setShowDistribute(true)}
          />
        )}
        {tab === 'analytics' && <AnalyticsTab analytics={analytics} />}
      </ScrollView>

      {/* Add Member Modal */}
      <MemberModal
        visible={showAddMember}
        form={memberForm}
        onChange={setMemberForm}
        onSubmit={handleAddMember}
        onClose={() => setShowAddMember(false)}
        loading={addingMember}
      />

      {/* Distribute Modal */}
      <DistributeModal
        visible={showDistribute}
        form={distForm}
        onChange={setDistForm}
        onSubmit={handleDistribute}
        onClose={() => setShowDistribute(false)}
        loading={distributing}
        balance={account.coinBalance}
        memberCount={account.memberCount}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = '#7C3AED',
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function OverviewTab({
  account,
  analytics,
}: {
  account: CorporateAccount;
  analytics: Analytics | null;
}) {
  return (
    <>
      <View style={styles.statsRow}>
        <StatCard label="Coin Balance" value={fc(account.coinBalance)} color="#7C3AED" />
        <StatCard label="Distributed" value={fc(account.totalCoinsDistributed)} color="#10B981" />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Redeemed" value={fc(account.totalCoinsRedeemed)} color="#F59E0B" />
        <StatCard label="Members" value={String(account.memberCount)} color="#3B82F6" />
      </View>
      {analytics && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Utilization Rate</Text>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(analytics.overview.utilizationRate, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {analytics.overview.utilizationRate}% of distributed coins spent
          </Text>
        </View>
      )}
      {account.lastDistributionAt && (
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            Last distribution:{' '}
            {new Date(account.lastDistributionAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
      )}
    </>
  );
}

function MembersTab({
  members,
  search,
  onSearchChange,
  onAdd,
}: {
  members: Member[];
  search: string;
  onSearchChange: (s: string) => void;
  onAdd: () => void;
}) {
  const filtered = search
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.includes(search.toLowerCase())
      )
    : members;

  return (
    <>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search members..."
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <Ionicons name="person-add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={40} color="#d1d5db" />
          <Text style={styles.emptyListText}>No members yet. Add your first employee.</Text>
        </View>
      ) : (
        filtered.map((m) => (
          <View key={m._id} style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{m.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.memberEmail}>{m.email}</Text>
              {m.department ? <Text style={styles.memberDept}>{m.department}</Text> : null}
            </View>
            <View style={styles.memberStats}>
              <View
                style={[
                  styles.statusBadge,
                  m.status === 'active' ? styles.statusActive : styles.statusInvited,
                ]}
              >
                <Text style={styles.statusText}>{m.status}</Text>
              </View>
              <Text style={styles.memberCoins}>{fc(m.coinsReceived)} coins</Text>
            </View>
          </View>
        ))
      )}
    </>
  );
}

function DistributeTab({
  account,
  analytics,
  onDistribute,
}: {
  account: CorporateAccount;
  analytics: Analytics | null;
  onDistribute: () => void;
}) {
  return (
    <>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{fc(account.coinBalance)}</Text>
        <Text style={styles.balanceSub}>REZ Coins</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onDistribute}>
        <Ionicons name="send" size={20} color="#fff" />
        <Text style={styles.primaryBtnText}>Distribute Coins</Text>
      </TouchableOpacity>

      {analytics && analytics.departments.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Department Summary</Text>
          {analytics.departments.map((d) => (
            <View key={d._id || 'unassigned'} style={styles.deptRow}>
              <View>
                <Text style={styles.deptName}>{d._id || 'Unassigned'}</Text>
                <Text style={styles.deptMembers}>
                  {d.members} member{d.members !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.deptCoins}>
                <Text style={styles.deptReceived}>{fc(d.coinsReceived)} sent</Text>
                <Text style={styles.deptSpent}>{fc(d.coinsSpent)} spent</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function AnalyticsTab({ analytics }: { analytics: Analytics | null }) {
  if (!analytics)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Member Status</Text>
        <View style={styles.statsRow}>
          <StatCard label="Total" value={String(analytics.members.total)} />
          <StatCard label="Active" value={String(analytics.members.active)} color="#10B981" />
          <StatCard label="Pending" value={String(analytics.members.invited)} color="#F59E0B" />
        </View>
        {analytics.members.pendingCoins > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="hourglass-outline" size={14} color="#F59E0B" />
            <Text style={styles.infoText}>
              {fc(analytics.members.pendingCoins)} coins held for unregistered employees
            </Text>
          </View>
        )}
      </View>

      {analytics.topSpenders.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Spenders</Text>
          {analytics.topSpenders.map((m, i) => (
            <View key={m._id} style={styles.topSpenderRow}>
              <Text style={styles.topSpenderRank}>#{i + 1}</Text>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.name}</Text>
                {m.department ? <Text style={styles.memberDept}>{m.department}</Text> : null}
              </View>
              <Text style={styles.topSpenderCoins}>{fc(m.coinsSpent)} spent</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────

function RegisterModal({ visible, form, onChange, onSubmit, onClose, loading }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Register Company</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {[
              { key: 'companyName', label: 'Company Name *', placeholder: 'Acme Corp' },
              {
                key: 'companyEmail',
                label: 'Company Email *',
                placeholder: 'hr@acmecorp.com',
                keyboard: 'email-address',
              },
              {
                key: 'adminEmail',
                label: 'HR Admin Email *',
                placeholder: 'admin@acmecorp.com',
                keyboard: 'email-address',
              },
              { key: 'industry', label: 'Industry', placeholder: 'Technology, Retail, etc.' },
            ].map((f) => (
              <View key={f.key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form[f.key]}
                  onChangeText={(v: string) => onChange((p) => ({ ...p, [f.key]: v }))}
                  placeholder={f.placeholder}
                  placeholderTextColor="#9ca3af"
                  keyboardType={(f as unknown as { keyboard?: import('react-native').KeyboardTypeOptions }).keyboard || 'default'}
                  autoCapitalize="none"
                />
              </View>
            ))}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="business" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Register Company</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MemberModal({ visible, form, onChange, onSubmit, onClose, loading }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Employee</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {[
              { key: 'name', label: 'Full Name *', placeholder: 'Rahul Sharma' },
              {
                key: 'email',
                label: 'Work Email *',
                placeholder: 'rahul@company.com',
                keyboard: 'email-address',
              },
              { key: 'department', label: 'Department', placeholder: 'Engineering' },
              { key: 'designation', label: 'Designation', placeholder: 'Software Engineer' },
            ].map((f) => (
              <View key={f.key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form[f.key]}
                  onChangeText={(v: string) => onChange((p) => ({ ...p, [f.key]: v }))}
                  placeholder={f.placeholder}
                  placeholderTextColor="#9ca3af"
                  keyboardType={(f as unknown as { keyboard?: import('react-native').KeyboardTypeOptions }).keyboard || 'default'}
                  autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                />
              </View>
            ))}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Add Employee</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DistributeModal({
  visible,
  form,
  onChange,
  onSubmit,
  onClose,
  loading,
  balance,
  memberCount,
}) {
  const coins = parseInt(form.coins, 10) || 0;
  const total = coins * memberCount;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Distribute Coins</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{fc(balance)}</Text>
              <Text style={styles.balanceSub}>REZ Coins</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Coins per Employee *</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.coins}
                onChangeText={(v: string) => onChange((p) => ({ ...p, coins: v }))}
                placeholder="100"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Department (leave empty for all)</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.department}
                onChangeText={(v: string) => onChange((p) => ({ ...p, department: v }))}
                placeholder="Engineering (or leave empty)"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { height: 72, textAlignVertical: 'top' }]}
                value={form.note}
                onChangeText={(v: string) => onChange((p) => ({ ...p, note: v }))}
                placeholder="Diwali bonus, performance reward..."
                placeholderTextColor="#9ca3af"
                multiline
              />
            </View>

            {coins > 0 && (
              <View style={styles.distSummary}>
                <Ionicons name="information-circle" size={16} color="#7C3AED" />
                <Text style={styles.distSummaryText}>
                  {fc(coins)} coins per employee
                  {form.department
                    ? ` → "${form.department}" department`
                    : ` → all ${memberCount} active member${memberCount !== 1 ? 's' : ''} (max ${fc(total)} coins)`}
                  {total > balance ? '\n⚠️ Insufficient balance for all members' : ''}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, (loading || coins < 1) && { opacity: 0.5 }]}
              onPress={onSubmit}
              disabled={loading || coins < 1}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>
                    Send {coins > 0 ? `${fc(coins)} Coins` : 'Coins'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#7C3AED',
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  distributeHeaderBtn: { width: 40, alignItems: 'flex-end' },
  planBadge: { paddingVertical: 4, alignItems: 'center' },
  planBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#7C3AED' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  statSub: { fontSize: 10, color: '#9ca3af' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  progressBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 4 },
  progressLabel: { fontSize: 12, color: '#6b7280' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#6b7280' },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111', paddingVertical: 10 },
  addBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: { fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 16, fontWeight: '700', color: '#7C3AED' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#111' },
  memberEmail: { fontSize: 12, color: '#6b7280' },
  memberDept: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  memberStats: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusInvited: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 10, fontWeight: '700', color: '#374151' },
  memberCoins: { fontSize: 11, color: '#7C3AED', fontWeight: '600' },
  balanceCard: { backgroundColor: '#7C3AED', borderRadius: 16, padding: 20, alignItems: 'center' },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  balanceAmount: { fontSize: 36, fontWeight: '900', color: '#fff', marginVertical: 4 },
  balanceSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 15,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  deptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  deptName: { fontSize: 14, fontWeight: '600', color: '#111' },
  deptMembers: { fontSize: 12, color: '#6b7280' },
  deptCoins: { alignItems: 'flex-end' },
  deptReceived: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },
  deptSpent: { fontSize: 11, color: '#10B981' },
  topSpenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topSpenderRank: { fontSize: 14, fontWeight: '800', color: '#7C3AED', width: 28 },
  topSpenderCoins: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  distSummary: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  distSummaryText: { flex: 1, fontSize: 13, color: '#5B21B6', lineHeight: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  setupBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  modalContent: { padding: 16, gap: 14, paddingBottom: 40 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },
});
