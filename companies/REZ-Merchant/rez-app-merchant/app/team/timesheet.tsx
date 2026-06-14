/**
 * Team - Staff Timesheet Screen
 * Shows time entries for a date range with per-staff totals.
 */

import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface TimeEntry {
  _id: string;
  staffId: string;
  staffName: string;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  totalMinutes?: number;
  date: string;
  notes?: string;
}

interface StaffSummary {
  staffId: string;
  staffName: string;
  totalMinutes: number;
  totalHours: number;
  entryCount: number;
}

interface TimesheetResponse {
  entries: TimeEntry[];
  summary: StaffSummary[];
  total: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function getWeekRange(): { from: string; to: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(sunday) };
}

function formatTime(iso?: string): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function minutesToHm(minutes?: number): string {
  if (!minutes || minutes <= 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function TimesheetScreen() {
  const { storeId } = useAuth() as unknown as { storeId?: string };

  const defaultRange = getWeekRange();
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [staffFilter, setStaffFilter] = useState('');

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'entries' | 'summary'>('summary');

  const fetchTimesheet = useCallback(async () => {
    if (!storeId) return;
    try {
      const params = new URLSearchParams({ storeId, dateFrom, dateTo });
      if (staffFilter.trim()) params.set('staffId', staffFilter.trim());

      const res = await apiClient.get<{ data: TimesheetResponse }>(
        `/staff-time/timesheet?${params.toString()}`
      );
      const data = res.data?.data ?? (res.data as unknown as TimesheetResponse);
      setEntries(data.entries || []);
      setSummary(data.summary || []);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to load timesheet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId, dateFrom, dateTo, staffFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchTimesheet();
    }, [fetchTimesheet])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTimesheet();
  };

  const handleSearch = () => {
    setLoading(true);
    fetchTimesheet();
  };

  const renderSummaryTable = () => (
    <View style={styles.tableContainer}>
      {/* Header */}
      <View style={[styles.tableRow, styles.tableHeader]}>
        <ThemedText style={[styles.tableCell, styles.tableCellName, styles.tableHeaderText]}>
          Staff
        </ThemedText>
        <ThemedText style={[styles.tableCell, styles.tableCellSmall, styles.tableHeaderText]}>
          Days
        </ThemedText>
        <ThemedText style={[styles.tableCell, styles.tableCellTime, styles.tableHeaderText]}>
          Total
        </ThemedText>
      </View>

      {summary.length === 0 ? (
        <View style={styles.emptyRow}>
          <ThemedText style={styles.emptyRowText}>No data for this period</ThemedText>
        </View>
      ) : (
        summary.map((s) => (
          <View key={s.staffId} style={styles.tableRow}>
            <ThemedText style={[styles.tableCell, styles.tableCellName]}>{s.staffName}</ThemedText>
            <ThemedText style={[styles.tableCell, styles.tableCellSmall]}>
              {s.entryCount}
            </ThemedText>
            <ThemedText style={[styles.tableCell, styles.tableCellTime, styles.totalHoursText]}>
              {s.totalHours}h
            </ThemedText>
          </View>
        ))
      )}

      {summary.length > 0 && (
        <View style={[styles.tableRow, styles.totalsRow]}>
          <ThemedText style={[styles.tableCell, styles.tableCellName, styles.totalText]}>
            Total
          </ThemedText>
          <ThemedText style={[styles.tableCell, styles.tableCellSmall, styles.totalText]}>
            {summary.reduce((acc, s) => acc + s.entryCount, 0)}
          </ThemedText>
          <ThemedText style={[styles.tableCell, styles.tableCellTime, styles.totalText]}>
            {parseFloat(summary.reduce((acc, s) => acc + s.totalHours, 0).toFixed(2))}h
          </ThemedText>
        </View>
      )}
    </View>
  );

  const renderEntriesTable = () => (
    <View style={styles.tableContainer}>
      {/* Header */}
      <View style={[styles.tableRow, styles.tableHeader]}>
        <ThemedText style={[styles.tableCell, styles.tableCellName, styles.tableHeaderText]}>
          Staff
        </ThemedText>
        <ThemedText style={[styles.tableCell, styles.tableCellDate, styles.tableHeaderText]}>
          Date
        </ThemedText>
        <ThemedText style={[styles.tableCell, styles.tableCellTime, styles.tableHeaderText]}>
          In
        </ThemedText>
        <ThemedText style={[styles.tableCell, styles.tableCellTime, styles.tableHeaderText]}>
          Out
        </ThemedText>
        <ThemedText style={[styles.tableCell, styles.tableCellSmall, styles.tableHeaderText]}>
          Brk
        </ThemedText>
        <ThemedText style={[styles.tableCell, styles.tableCellTime, styles.tableHeaderText]}>
          Total
        </ThemedText>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyRow}>
          <ThemedText style={styles.emptyRowText}>No entries for this period</ThemedText>
        </View>
      ) : (
        entries.map((entry) => (
          <View key={entry._id} style={styles.tableRow}>
            <ThemedText style={[styles.tableCell, styles.tableCellName]} numberOfLines={1}>
              {entry.staffName}
            </ThemedText>
            <ThemedText style={[styles.tableCell, styles.tableCellDate]}>{entry.date}</ThemedText>
            <ThemedText style={[styles.tableCell, styles.tableCellTime]}>
              {formatTime(entry.clockIn)}
            </ThemedText>
            <ThemedText style={[styles.tableCell, styles.tableCellTime]}>
              {entry.clockOut ? formatTime(entry.clockOut) : '--'}
            </ThemedText>
            <ThemedText style={[styles.tableCell, styles.tableCellSmall]}>
              {entry.breakMinutes}m
            </ThemedText>
            <ThemedText style={[styles.tableCell, styles.tableCellTime, styles.totalHoursText]}>
              {entry.totalMinutes ? minutesToHm(entry.totalMinutes) : '--'}
            </ThemedText>
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <ThemedText style={styles.loadingText}>Loading timesheet...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Filters */}
        <View style={styles.filtersSection}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <ThemedText style={styles.fieldLabel}>From</ThemedText>
              <TextInput
                style={styles.dateInput}
                value={dateFrom}
                onChangeText={setDateFrom}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
            <View style={styles.dateSeparator} />
            <View style={styles.dateField}>
              <ThemedText style={styles.fieldLabel}>To</ThemedText>
              <TextInput
                style={styles.dateInput}
                value={dateTo}
                onChangeText={setDateTo}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={handleSearch}>
              <Ionicons name="search" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
            onPress={() => setActiveTab('summary')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
              Summary
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'entries' && styles.tabActive]}
            onPress={() => setActiveTab('entries')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'entries' && styles.tabTextActive]}>
              Entries ({entries.length})
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          horizontal={activeTab === 'entries'}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            activeTab === 'summary' ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors.light.primary]}
                tintColor={Colors.light.primary}
              />
            ) : undefined
          }
        >
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {activeTab === 'summary' ? renderSummaryTable() : renderEntriesTable()}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.light.textSecondary,
  },
  filtersSection: {
    backgroundColor: Colors.light.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  dateField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.light.text,
  },
  dateSeparator: {
    width: 8,
    height: 1,
    backgroundColor: Colors.light.border,
    marginBottom: 14,
  },
  applyButton: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tableContainer: {
    minWidth: '100%',
    padding: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  tableHeader: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tableHeaderText: {
    fontWeight: '700',
    color: Colors.light.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 13,
    color: Colors.light.text,
    paddingHorizontal: 4,
  },
  tableCellName: {
    flex: 2,
    minWidth: 90,
  },
  tableCellDate: {
    flex: 1.5,
    minWidth: 80,
  },
  tableCellTime: {
    flex: 1,
    minWidth: 50,
    textAlign: 'center',
  },
  tableCellSmall: {
    flex: 0.7,
    minWidth: 40,
    textAlign: 'center',
  },
  totalHoursText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  totalsRow: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderTopWidth: 2,
    borderTopColor: Colors.light.border,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  totalText: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  emptyRow: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  emptyRowText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  bottomSpacing: {
    height: 32,
  },
});
