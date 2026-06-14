// ==========================================
// MyTalent - Attendance Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import * as Location from 'expo-location';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, formatCurrency } from '../../src/components/Badge';
import { Card, Button, StatusBadge } from '../../src/components';
import { mockAttendanceHistory, mockAttendanceSummary } from '../../src/data/mockData';
import { useAppStore } from '../../src/store/useAppStore';
import { getAttendanceHistory } from '../../src/services/attendanceService';

export default function AttendanceScreen() {
  const { attendance, checkIn, checkOut } = useAppStore();
  const [history, setHistory] = useState(mockAttendanceHistory);
  const [isWFH, setIsWFH] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadAttendance();
    checkLocation();
  }, []);

  const checkLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationEnabled(true);
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      logger.info('Location error:', error);
    }
  };

  const loadAttendance = async () => {
    const result = await getAttendanceHistory('EMP001');
    if (result.success && result.records) {
      setHistory(result.records);
    }
  };

  const handleCheckIn = async () => {
    if (!locationEnabled && !isWFH) {
      Alert.alert('Location Required', 'Please enable location or enable WFH mode');
      return;
    }

    checkIn(currentLocation || undefined);
    Alert.alert('Success', 'Checked in successfully!');
  };

  const handleCheckOut = () => {
    checkOut();
    Alert.alert('Success', 'Checked out successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return Colors.success;
      case 'absent': return Colors.error;
      case 'late': return Colors.warning;
      case 'half-day': return Colors.secondary;
      default: return Colors.textMuted;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Current Shift Card */}
      <Card style={styles.shiftCard}>
        <View style={styles.shiftHeader}>
          <Text style={styles.shiftTitle}>Today's Attendance</Text>
          <StatusBadge status={attendance.isCheckedIn ? 'present' : 'half-day'} />
        </View>

        <View style={styles.shiftInfo}>
          <View style={styles.shiftItem}>
            <Text style={styles.shiftLabel}>Check In</Text>
            <Text style={styles.shiftValue}>
              {attendance.isCheckedIn ? attendance.checkInTime : '--:--'}
            </Text>
          </View>
          <View style={styles.shiftDivider} />
          <View style={styles.shiftItem}>
            <Text style={styles.shiftLabel}>Check Out</Text>
            <Text style={styles.shiftValue}>
              {attendance.todayAttendance?.checkOut || '--:--'}
            </Text>
          </View>
          <View style={styles.shiftDivider} />
          <View style={styles.shiftItem}>
            <Text style={styles.shiftLabel}>Hours</Text>
            <Text style={styles.shiftValue}>
              {attendance.todayAttendance?.hoursWorked?.toFixed(1) || '0'}h
            </Text>
          </View>
        </View>

        <View style={styles.shiftActions}>
          <TouchableOpacity
            style={[styles.actionBtn, attendance.isCheckedIn && styles.actionBtnDanger]}
            onPress={attendance.isCheckedIn ? handleCheckOut : handleCheckIn}
          >
            <Text style={styles.actionBtnText}>
              {attendance.isCheckedIn ? 'CHECK OUT' : 'CHECK IN'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.wfhRow}>
          <Text style={styles.wfhLabel}>Work From Home</Text>
          <Switch
            value={isWFH}
            onValueChange={setIsWFH}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={isWFH ? Colors.primary : Colors.textMuted}
          />
        </View>

        <View style={styles.geoStatus}>
          <Text style={styles.geoStatusText}>
            {locationEnabled ? 'GPS Location: Enabled' : 'GPS Location: Disabled'}
          </Text>
        </View>
      </Card>

      {/* Attendance Options */}
      <Text style={styles.sectionTitle}>Attendance Options</Text>
      <View style={styles.optionsGrid}>
        <TouchableOpacity style={styles.optionCard}>
          <Text style={styles.optionIcon}>📍</Text>
          <Text style={styles.optionTitle}>GPS</Text>
          <Text style={styles.optionDesc}>Location-based</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionCard}>
          <Text style={styles.optionIcon}>📷</Text>
          <Text style={styles.optionTitle}>Face</Text>
          <Text style={styles.optionDesc}>Face recognition</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionCard}>
          <Text style={styles.optionIcon}>📱</Text>
          <Text style={styles.optionTitle}>QR</Text>
          <Text style={styles.optionDesc}>Scan office QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionCard}>
          <Text style={styles.optionIcon}>🏠</Text>
          <Text style={styles.optionTitle}>WFH</Text>
          <Text style={styles.optionDesc}>Work from home</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>This Month</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {mockAttendanceSummary.present}
            </Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.error }]}>
              {mockAttendanceSummary.absent}
            </Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>
              {mockAttendanceSummary.late}
            </Text>
            <Text style={styles.summaryLabel}>Late</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{mockAttendanceSummary.totalHours}h</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>
        <View style={styles.summaryFooter}>
          <Text style={styles.onTimeRate}>On-time Rate: {mockAttendanceSummary.onTimeRate}%</Text>
        </View>
      </Card>

      {/* Attendance History */}
      <Text style={styles.sectionTitle}>Attendance History</Text>
      {history.map((record) => (
        <Card key={record.id} style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyDate}>{record.date}</Text>
              <Text style={styles.historyType}>{record.type}</Text>
            </View>
            <StatusBadge status={record.status} />
          </View>
          <View style={styles.historyTimes}>
            <View style={styles.historyTimeItem}>
              <Text style={styles.historyTimeLabel}>In</Text>
              <Text style={styles.historyTimeValue}>{record.checkIn || '--'}</Text>
            </View>
            <View style={styles.historyTimeItem}>
              <Text style={styles.historyTimeLabel}>Out</Text>
              <Text style={styles.historyTimeValue}>{record.checkOut || '--'}</Text>
            </View>
            <View style={styles.historyTimeItem}>
              <Text style={styles.historyTimeLabel}>Hours</Text>
              <Text style={styles.historyTimeValue}>{record.hoursWorked.toFixed(1)}h</Text>
            </View>
          </View>
        </Card>
      ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  shiftCard: {
    margin: Spacing.md,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  shiftInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.lg,
  },
  shiftItem: {
    alignItems: 'center',
  },
  shiftDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  shiftLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  shiftValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  shiftActions: {
    marginTop: Spacing.lg,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  actionBtnDanger: {
    backgroundColor: Colors.error,
  },
  actionBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  wfhRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  wfhLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  geoStatus: {
    marginTop: Spacing.sm,
  },
  geoStatusText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  optionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  optionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  summaryCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  summaryFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
  },
  onTimeRate: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  historyCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyDate: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  historyType: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyTimes: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  historyTimeItem: {
    flex: 1,
    alignItems: 'center',
  },
  historyTimeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  historyTimeValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
