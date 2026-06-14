import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { apiClient } from '@/services/api/client';

// ─── Types ───────────────────────────────────────────────────────────────────

type PatchTestResult = 'pass' | 'reaction';

interface PatchTestEntry {
  _id?: string;
  serviceCategory: string;
  result: PatchTestResult;
  testedAt: string;
  expiresAt: string;
  conductedBy?: string;
  notes?: string;
}

interface ClientPatchHistory {
  name: string;
  phoneNumber?: string;
  patchTests: PatchTestEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RESULT_CONFIG: Record<PatchTestResult, { label: string; color: string; bg: string }> = {
  pass: { label: 'Pass', color: '#059669', bg: '#D1FAE5' },
  reaction: { label: 'Reaction', color: '#DC2626', bg: '#FEE2E2' },
};

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatchTestScreen() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();

  // Client search / lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedClientId, setResolvedClientId] = useState<string>(clientId || '');

  // History
  const [history, setHistory] = useState<ClientPatchHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [serviceCategory, setServiceCategory] = useState('hair_colour');
  const [result, setResult] = useState<PatchTestResult>('pass');
  const [testedAt, setTestedAt] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Load history when we have a clientId ──────────────────────────────────

  const loadHistory = useCallback(async (id: string) => {
    if (!id) return;
    setHistoryLoading(true);
    try {
      const res = await apiClient.get<ClientPatchHistory>(`merchant/patch-tests/${id}`);
      if (res.data) setHistory(res.data);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load history',
        text2: err?.response?.data?.message || err.message,
      });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientId) {
      setResolvedClientId(clientId);
      loadHistory(clientId);
    }
  }, [clientId, loadHistory]);

  const onRefresh = useCallback(async () => {
    if (!resolvedClientId) return;
    setRefreshing(true);
    await loadHistory(resolvedClientId);
    setRefreshing(false);
  }, [resolvedClientId, loadHistory]);

  // ── Manual client ID lookup (simple: type ID and press Go) ───────────────

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setResolvedClientId(trimmed);
    loadHistory(trimmed);
  }, [searchQuery, loadHistory]);

  // ── Submit new patch test ─────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!resolvedClientId) {
      Toast.show({ type: 'error', text1: 'Select a client first' });
      return;
    }
    if (!serviceCategory.trim()) {
      Toast.show({ type: 'error', text1: 'Service category is required' });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('merchant/patch-tests/record', {
        clientId: resolvedClientId,
        serviceCategory: serviceCategory.trim(),
        result,
        testedAt: new Date(testedAt).toISOString(),
        notes: notes.trim() || undefined,
      });

      Toast.show({ type: 'success', text1: 'Patch test recorded' });
      setShowForm(false);
      setNotes('');
      setTestedAt(todayISO());
      // Refresh history
      await loadHistory(resolvedClientId);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to record patch test',
        text2: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  }, [resolvedClientId, serviceCategory, result, testedAt, notes, loadHistory]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle}>Patch Test</ThemedText>
          <Text style={styles.headerSubtitle}>
            Record allergy patch test results for colour services
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            resolvedClientId ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {/* Client Search */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Find Client</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter client ID"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                <Ionicons name="search" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Loading */}
          {historyLoading && (
            <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
          )}

          {/* Client history */}
          {!historyLoading && history && (
            <>
              <View style={styles.clientCard}>
                <Ionicons name="person-circle-outline" size={32} color="#7C3AED" />
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{history.name || 'Unknown Client'}</Text>
                  {history.phoneNumber ? (
                    <Text style={styles.clientPhone}>{history.phoneNumber}</Text>
                  ) : null}
                </View>
              </View>

              {/* Record New Test button */}
              {!showForm && (
                <TouchableOpacity style={styles.recordBtn} onPress={() => setShowForm(true)}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.recordBtnText}>Record New Test</Text>
                </TouchableOpacity>
              )}

              {/* New test form */}
              {showForm && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>New Patch Test</Text>

                  <Text style={styles.fieldLabel}>Service Category</Text>
                  <TextInput
                    style={styles.textInput}
                    value={serviceCategory}
                    onChangeText={setServiceCategory}
                    placeholder="e.g. hair_colour, lash_tint"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                  />

                  <Text style={styles.fieldLabel}>Result</Text>
                  <View style={styles.resultRow}>
                    {(['pass', 'reaction'] as PatchTestResult[]).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.resultOption,
                          result === r && {
                            backgroundColor: RESULT_CONFIG[r].bg,
                            borderColor: RESULT_CONFIG[r].color,
                          },
                        ]}
                        onPress={() => setResult(r)}
                      >
                        <Text
                          style={[
                            styles.resultOptionText,
                            result === r && { color: RESULT_CONFIG[r].color, fontWeight: '700' },
                          ]}
                        >
                          {RESULT_CONFIG[r].label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Tested On</Text>
                  <TextInput
                    style={styles.textInput}
                    value={testedAt}
                    onChangeText={setTestedAt}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numbers-and-punctuation"
                  />

                  <Text style={styles.fieldLabel}>Notes (optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Any observations or client feedback"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.formActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                      onPress={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.submitBtnText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* History list */}
              <Text style={styles.historyTitle}>Test History</Text>

              {history.patchTests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="flask-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No patch tests recorded yet</Text>
                </View>
              ) : (
                [...history.patchTests]
                  .sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime())
                  .map((pt, idx) => {
                    const cfg = RESULT_CONFIG[pt.result] ?? RESULT_CONFIG.pass;
                    const expired = isExpired(pt.expiresAt);
                    return (
                      <View key={pt._id ?? idx} style={styles.historyCard}>
                        <View style={styles.historyCardTop}>
                          <Text style={styles.historyCategory}>{pt.serviceCategory}</Text>
                          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.badgeText, { color: cfg.color }]}>
                              {cfg.label}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.historyMeta}>
                          <Ionicons name="calendar-outline" size={13} color="#6B7280" />
                          <Text style={styles.historyMetaText}>Tested: {fmtDate(pt.testedAt)}</Text>
                        </View>

                        <View style={styles.historyMeta}>
                          <Ionicons
                            name={expired ? 'close-circle-outline' : 'checkmark-circle-outline'}
                            size={13}
                            color={expired ? '#DC2626' : '#059669'}
                          />
                          <Text
                            style={[
                              styles.historyMetaText,
                              { color: expired ? '#DC2626' : '#059669' },
                            ]}
                          >
                            {expired
                              ? `Expired ${fmtDate(pt.expiresAt)}`
                              : `Valid until ${fmtDate(pt.expiresAt)}`}
                          </Text>
                        </View>

                        {pt.notes ? <Text style={styles.historyNotes}>{pt.notes}</Text> : null}

                        {pt.conductedBy ? (
                          <Text style={styles.historyConductedBy}>By: {pt.conductedBy}</Text>
                        ) : null}
                      </View>
                    );
                  })
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  backBtn: {
    paddingTop: 2,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  loader: {
    marginVertical: 32,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  clientPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  recordBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  notesInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  resultRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resultOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resultOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyNotes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  historyConductedBy: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
