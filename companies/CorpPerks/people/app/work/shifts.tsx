// ==========================================
// MyTalent - Shift Scheduling Screen
// Employee Shift Management & Scheduling
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Colors } from '../../src/components/Badge';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: 'morning' | 'afternoon' | 'night' | 'flexi';
  status: 'scheduled' | 'completed' | 'absent' | 'leave';
  location?: string;
  isWeekend?: boolean;
  isHoliday?: boolean;
  holidayName?: string;
  duration: number;
  isOvertime?: boolean;
  overtimeHours?: number;
}

interface ShiftStats {
  totalShifts: number;
  completedShifts: number;
  upcomingShifts: number;
  totalHours: number;
  overtimeHours: number;
  averageHoursPerDay: number;
}

export default function ShiftsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'swap'>('week');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  const mockStats: ShiftStats = {
    totalShifts: 22,
    completedShifts: 18,
    upcomingShifts: 4,
    totalHours: 176,
    overtimeHours: 12,
    averageHoursPerDay: 8,
  };

  const generateWeekDates = () => {
    const dates = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const mockShifts: Shift[] = [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '18:00',
      shiftType: 'morning',
      status: 'scheduled',
      location: 'Office - HQ',
      duration: 8,
    },
    {
      id: '2',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '18:00',
      shiftType: 'morning',
      status: 'scheduled',
      location: 'Office - HQ',
      duration: 8,
    },
    {
      id: '3',
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      startTime: '12:00',
      endTime: '21:00',
      shiftType: 'afternoon',
      status: 'scheduled',
      location: 'Office - HQ',
      duration: 8,
    },
    {
      id: '4',
      date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '18:00',
      shiftType: 'morning',
      status: 'scheduled',
      location: 'Remote',
      duration: 8,
    },
    {
      id: '5',
      date: new Date(Date.now() + 345600000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '18:00',
      shiftType: 'morning',
      status: 'scheduled',
      location: 'Office - HQ',
      duration: 8,
      isOvertime: true,
      overtimeHours: 2,
    },
    {
      id: '6',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '18:00',
      shiftType: 'morning',
      status: 'completed',
      location: 'Office - HQ',
      duration: 8,
    },
    {
      id: '7',
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '18:00',
      shiftType: 'morning',
      status: 'completed',
      location: 'Office - HQ',
      duration: 8,
    },
  ];

  const weekDates = generateWeekDates();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // API call would go here
      // const response = await shiftService.getMyShifts(employeeId);
    } catch (error) {
      logger.error('Failed to load shift data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const getShiftForDate = (date: Date): Shift | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return mockShifts.find((s) => s.date === dateStr);
  };

  const getShiftTypeIcon = (type: string) => {
    switch (type) {
      case 'morning':
        return '🌅';
      case 'afternoon':
        return '☀️';
      case 'night':
        return '🌙';
      case 'flexi':
        return '⏰';
      default:
        return '📅';
    }
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'morning':
        return '#f59e0b';
      case 'afternoon':
        return '#10b981';
      case 'night':
        return '#8b5cf6';
      case 'flexi':
        return '#3b82f6';
      default:
        return Colors.textMuted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'scheduled':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'absent':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'leave':
        return { bg: '#fef3c7', text: '#b45309' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const handleShiftSwap = () => {
    Alert.alert(
      'Request Shift Swap',
      'This will open the shift swap request form.',
      [{ text: 'OK' }]
    );
  };

  const handleRequestTimeOff = () => {
    Alert.alert(
      'Request Time Off',
      'This will open the time off request form.',
      [{ text: 'OK' }]
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newStart);
  };

  const handleViewShift = (shift: Shift) => {
    setSelectedShift(shift);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading shifts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shifts</Text>
        <Text style={styles.headerSubtitle}>Your work schedule</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>
            {mockStats.totalHours}h
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {mockStats.completedShifts}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Overtime</Text>
          <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
            {mockStats.overtimeHours}h
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'week' && styles.tabActive]}
          onPress={() => setActiveTab('week')}
        >
          <Text style={[styles.tabText, activeTab === 'week' && styles.tabTextActive]}>
            Week View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'month' && styles.tabActive]}
          onPress={() => setActiveTab('month')}
        >
          <Text style={[styles.tabText, activeTab === 'month' && styles.tabTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'swap' && styles.tabActive]}
          onPress={() => setActiveTab('swap')}
        >
          <Text style={[styles.tabText, activeTab === 'swap' && styles.tabTextActive]}>
            Swap
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'week' && (
          <>
            {/* Week Navigation */}
            <View style={styles.weekNav}>
              <TouchableOpacity onPress={() => navigateWeek('prev')}>
                <Text style={styles.navArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.weekLabel}>
                {weekDates[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                {' - '}
                {weekDates[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => navigateWeek('next')}>
                <Text style={styles.navArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Week Calendar */}
            <View style={styles.weekCalendar}>
              {weekDates.map((date) => {
                const shift = getShiftForDate(date);
                const isCurrentDay = isToday(date);
                const isWeekendDay = isWeekend(date);

                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[
                      styles.dayColumn,
                      isCurrentDay && styles.dayColumnToday,
                      isWeekendDay && !shift && styles.dayColumnWeekend,
                    ]}
                    onPress={() => shift && handleViewShift(shift)}
                    disabled={!shift}
                  >
                    <Text
                      style={[
                        styles.dayName,
                        isCurrentDay && styles.dayNameToday,
                      ]}
                    >
                      {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        isCurrentDay && styles.dayNumberToday,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {shift ? (
                      <View
                        style={[
                          styles.shiftIndicator,
                          { backgroundColor: getShiftTypeColor(shift.shiftType) },
                        ]}
                      >
                        <Text style={styles.shiftIndicatorText}>
                          {getShiftTypeIcon(shift.shiftType)}
                        </Text>
                        <Text style={styles.shiftTimeText}>
                          {shift.startTime}-{shift.endTime}
                        </Text>
                        {shift.isOvertime && (
                          <View style={styles.overtimeBadge}>
                            <Text style={styles.overtimeText}>+{shift.overtimeHours}h</Text>
                          </View>
                        )}
                      </View>
                    ) : isWeekendDay ? (
                      <Text style={styles.weekendText}>Off</Text>
                    ) : (
                      <Text style={styles.noShiftText}>-</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Shift Types Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Morning</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Afternoon</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
                <Text style={styles.legendText}>Night</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>Flexi</Text>
              </View>
            </View>

            {/* Upcoming Shifts */}
            <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
            {mockShifts
              .filter((s) => s.status === 'scheduled' && new Date(s.date) >= new Date())
              .slice(0, 5)
              .map((shift) => {
                const statusStyle = getStatusColor(shift.status);
                return (
                  <TouchableOpacity
                    key={shift.id}
                    style={styles.shiftCard}
                    onPress={() => handleViewShift(shift)}
                  >
                    <View style={styles.shiftCardLeft}>
                      <View
                        style={[
                          styles.shiftTypeIcon,
                          { backgroundColor: getShiftTypeColor(shift.shiftType) + '20' },
                        ]}
                      >
                        <Text style={styles.shiftTypeEmoji}>
                          {getShiftTypeIcon(shift.shiftType)}
                        </Text>
                      </View>
                      <View style={styles.shiftCardInfo}>
                        <Text style={styles.shiftCardDate}>
                          {new Date(shift.date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                        <Text style={styles.shiftCardTime}>
                          {shift.startTime} - {shift.endTime} ({shift.duration}h)
                          {shift.isOvertime && (
                            <Text style={{ color: '#8b5cf6' }}> +{shift.overtimeHours}h OT</Text>
                          )}
                        </Text>
                        {shift.location && (
                          <Text style={styles.shiftCardLocation}>📍 {shift.location}</Text>
                        )}
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {shift.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </>
        )}

        {activeTab === 'month' && (
          <>
            {/* Monthly Overview */}
            <View style={styles.monthCard}>
              <Text style={styles.monthTitle}>May 2026</Text>
              <View style={styles.monthStats}>
                <View style={styles.monthStat}>
                  <Text style={[styles.monthStatValue, { color: '#3b82f6' }]}>22</Text>
                  <Text style={styles.monthStatLabel}>Working Days</Text>
                </View>
                <View style={styles.monthStat}>
                  <Text style={[styles.monthStatValue, { color: '#10b981' }]}>176</Text>
                  <Text style={styles.monthStatLabel}>Total Hours</Text>
                </View>
                <View style={styles.monthStat}>
                  <Text style={[styles.monthStatValue, { color: '#8b5cf6' }]}>8</Text>
                  <Text style={styles.monthStatLabel}>Avg/Day</Text>
                </View>
              </View>
            </View>

            {/* Monthly Calendar Grid */}
            <View style={styles.monthGrid}>
              <View style={styles.monthWeekDays}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={styles.monthWeekDay}>
                    {day}
                  </Text>
                ))}
              </View>
              <View style={styles.monthDays}>
                {/* Empty cells for first week offset */}
                {[...Array(5)].map((_, i) => (
                  <View key={`empty-${i}`} style={styles.monthDayCell} />
                ))}
                {[...Array(26)].map((_, i) => {
                  const day = i + 1;
                  const hasShift = !(
                    (day >= 1 && day <= 5) ||
                    (day >= 8 && day <= 9) ||
                    (day >= 15 && day <= 16) ||
                    (day >= 22 && day <= 23) ||
                    day === 29
                  );
                  return (
                    <View
                      key={day}
                      style={[
                        styles.monthDayCell,
                        hasShift && styles.monthDayWorking,
                        (day === 30 || day === 31) && styles.monthDayWeekend,
                      ]}
                    >
                      <Text
                        style={[
                          styles.monthDayNumber,
                          hasShift && styles.monthDayNumberWorking,
                        ]}
                      >
                        {day}
                      </Text>
                      {hasShift && <View style={styles.monthDayDot} />}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Shift Summary */}
            <Text style={styles.sectionTitle}>Shift Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>🌅</Text>
                <Text style={[styles.summaryCount, { color: '#f59e0b' }]}>15</Text>
                <Text style={styles.summaryLabel}>Morning</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>☀️</Text>
                <Text style={[styles.summaryCount, { color: '#10b981' }]}>4</Text>
                <Text style={styles.summaryLabel}>Afternoon</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>🌙</Text>
                <Text style={[styles.summaryCount, { color: '#8b5cf6' }]}>2</Text>
                <Text style={styles.summaryLabel}>Night</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>⏰</Text>
                <Text style={[styles.summaryCount, { color: '#3b82f6' }]}>1</Text>
                <Text style={styles.summaryLabel}>Flexi</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'swap' && (
          <>
            {/* Swap Options */}
            <View style={styles.swapCard}>
              <Text style={styles.swapTitle}>Shift Swap Options</Text>
              <TouchableOpacity style={styles.swapButton} onPress={handleShiftSwap}>
                <Text style={styles.swapButtonIcon}>🔄</Text>
                <View style={styles.swapButtonContent}>
                  <Text style={styles.swapButtonTitle}>Request Shift Swap</Text>
                  <Text style={styles.swapButtonDesc}>
                    Swap shifts with a colleague
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.swapButton} onPress={handleRequestTimeOff}>
                <Text style={styles.swapButtonIcon}>🏖️</Text>
                <View style={styles.swapButtonContent}>
                  <Text style={styles.swapButtonTitle}>Request Time Off</Text>
                  <Text style={styles.swapButtonDesc}>
                    Apply for leave or day off
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Available Swaps */}
            <Text style={styles.sectionTitle}>Available Swaps</Text>
            <View style={styles.emptySwap}>
              <Text style={styles.emptySwapIcon}>📭</Text>
              <Text style={styles.emptySwapTitle}>No Swap Requests</Text>
              <Text style={styles.emptySwapDesc}>
                When colleagues request a shift swap, they'll appear here
              </Text>
            </View>

            {/* Swap History */}
            <Text style={styles.sectionTitle}>Swap History</Text>
            <View style={styles.historyCard}>
              <View style={styles.historyRow}>
                <Text style={styles.historyIcon}>🔄</Text>
                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>Swap with Rahul K.</Text>
                  <Text style={styles.historyDesc}>
                    May 15 (Morning) ↔ May 18 (Afternoon)
                  </Text>
                </View>
                <View style={[styles.historyStatus, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.historyStatusText, { color: '#15803d' }]}>
                    Completed
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Shift Detail Modal */}
      <Modal
        visible={!!selectedShift}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedShift(null)}
      >
        {selectedShift && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shift Details</Text>
              <TouchableOpacity onPress={() => setSelectedShift(null)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View
                style={[
                  styles.shiftDetailCard,
                  { backgroundColor: getShiftTypeColor(selectedShift.shiftType) },
                ]}
              >
                <Text style={styles.shiftDetailEmoji}>
                  {getShiftTypeIcon(selectedShift.shiftType)}
                </Text>
                <Text style={styles.shiftDetailType}>
                  {selectedShift.shiftType.charAt(0).toUpperCase() +
                    selectedShift.shiftType.slice(1)}{' '}
                  Shift
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedShift.date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailHalf}>
                  <Text style={styles.detailLabel}>Start Time</Text>
                  <Text style={styles.detailValue}>{selectedShift.startTime}</Text>
                </View>
                <View style={styles.detailHalf}>
                  <Text style={styles.detailLabel}>End Time</Text>
                  <Text style={styles.detailValue}>{selectedShift.endTime}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailHalf}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{selectedShift.duration} hours</Text>
                </View>
                <View style={styles.detailHalf}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>
                    {selectedShift.location || 'Not assigned'}
                  </Text>
                </View>
              </View>

              {selectedShift.isOvertime && (
                <View style={styles.detailSection}>
                  <View style={styles.overtimeInfo}>
                    <Text style={styles.overtimeIcon}>⏰</Text>
                    <View>
                      <Text style={styles.overtimeTitle}>Overtime</Text>
                      <Text style={styles.overtimeValue}>
                        +{selectedShift.overtimeHours} hours approved
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  onPress={() => {
                    Alert.alert('Swap', 'Opening swap request...');
                  }}
                >
                  <Text style={styles.modalSecondaryButtonText}>Request Swap</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalPrimaryButton}
                  onPress={() => {
                    Alert.alert('Time Off', 'Opening time off request...');
                  }}
                >
                  <Text style={styles.modalPrimaryButtonText}>Request Time Off</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  navArrow: {
    fontSize: 24,
    color: '#3b82f6',
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  weekCalendar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  dayColumnToday: {
    backgroundColor: '#3b82f620',
  },
  dayColumnWeekend: {
    backgroundColor: '#f3f4f6',
  },
  dayName: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  dayNameToday: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginVertical: 4,
  },
  dayNumberToday: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  shiftIndicator: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginTop: 4,
    width: '90%',
  },
  shiftIndicatorText: {
    fontSize: 14,
  },
  shiftTimeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 2,
  },
  overtimeBadge: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  overtimeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weekendText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  noShiftText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  shiftCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  shiftCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shiftTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shiftTypeEmoji: {
    fontSize: 20,
  },
  shiftCardInfo: {
    flex: 1,
  },
  shiftCardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  shiftCardTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  shiftCardLocation: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  monthCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthStat: {
    alignItems: 'center',
  },
  monthStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  monthStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  monthGrid: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  monthWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  monthWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  monthDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDayWorking: {
    backgroundColor: '#3b82f610',
    borderRadius: 20,
  },
  monthDayWeekend: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  monthDayNumber: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  monthDayNumberWorking: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  monthDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
    marginTop: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  swapCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  swapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  swapButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  swapButtonContent: {
    flex: 1,
  },
  swapButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  swapButtonDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptySwap: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptySwapIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptySwapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySwapDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  historyDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  shiftDetailCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  shiftDetailEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  shiftDetailType: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  detailHalf: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
  },
  overtimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    borderRadius: 12,
    padding: 14,
  },
  overtimeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  overtimeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  overtimeValue: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 32,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
