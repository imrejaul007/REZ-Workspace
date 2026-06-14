// ==========================================
// MyTalent - Home Dashboard Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, formatCurrency, getTimeOfDay } from '../../src/components/Badge';
import { Card, Button, ProgressBar, BalanceCard, StatusBadge } from '../../src/components';
import { useAppStore } from '../../src/store/useAppStore';
import {
  mockEmployee,
  mockLeaveBalance,
  mockAttendanceSummary,
  mockUpcomingEvents,
  mockTasks,
  mockPayslips,
  mockAIInsights,
  mockQuickActions,
} from '../../src/data/mockData';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const { attendance, checkIn, checkOut } = useAppStore();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationEnabled(true);
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    } catch (error) {
      logger.info('Location permission error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleCheckIn = async () => {
    if (!locationEnabled) {
      Alert.alert('Location Required', 'Please enable location to check in');
      return;
    }

    try {
      checkIn(location || undefined);
      Alert.alert('Success', 'Checked in successfully!');
    } catch (error) {
      Alert.alert('Error', 'Could not complete check-in');
    }
  };

  const handleCheckOut = () => {
    checkOut();
    Alert.alert('Success', 'Checked out successfully!');
  };

  const pendingTasksCount = mockTasks.filter((t) => t.status === 'pending').length;
  const upcomingHolidaysCount = 8;
  const activeBenefitsCount = 8;
  const nextPayDate = 'June 1, 2026';
  const recognitionToday = 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getTimeOfDay()}</Text>
            <Text style={styles.userName}>{mockEmployee.name}</Text>
            <Text style={styles.designation}>{mockEmployee.designation}</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>{mockEmployee.avatar}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Check-in Card */}
        <View style={styles.checkInCard}>
          <View style={styles.checkInInfo}>
            <Text style={styles.checkInTitle}>
              {attendance.isCheckedIn ? 'Checked In' : 'Ready to Check In?'}
            </Text>
            <Text style={styles.checkInTime}>
              {attendance.isCheckedIn
                ? attendance.checkInTime
                : attendance.isCheckedIn
                ? `Since ${attendance.checkInTime}`
                : 'Tap to start your day'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.checkInBtn, attendance.isCheckedIn && styles.checkOutBtn]}
            onPress={attendance.isCheckedIn ? handleCheckOut : handleCheckIn}
          >
            <Text style={styles.checkInBtnText}>
              {attendance.isCheckedIn ? 'CHECK OUT' : 'CHECK IN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {mockQuickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionItem}
              onPress={() => {
                switch (action.title) {
                  case 'Check In':
                    navigation.navigate('Work');
                    break;
                  case 'Apply Leave':
                    navigation.navigate('Work');
                    break;
                  case 'View Payslip':
                    navigation.navigate('Pay');
                    break;
                  case 'Tasks':
                    navigation.navigate('Work');
                    break;
                  case 'Benefits':
                    navigation.navigate('Benefits');
                    break;
                  case 'AI Coach':
                    navigation.navigate('Career');
                    break;
                }
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                <Text style={styles.quickActionEmoji}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionLabel}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Overview */}
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.overviewRow}>
          <BalanceCard
            balance={mockLeaveBalance.sick + mockLeaveBalance.casual}
            label="Leave Balance"
            icon="📅"
            color={Colors.primary}
            style={styles.overviewCard}
          />
          <BalanceCard
            balance={pendingTasksCount}
            label="Pending Tasks"
            icon="✅"
            color={Colors.warning}
            style={styles.overviewCard}
          />
          <BalanceCard
            balance={upcomingHolidaysCount}
            label="Holidays"
            icon="🏖️"
            color={Colors.success}
            style={styles.overviewCard}
          />
        </View>

        {/* Working Hours Progress */}
        <Card style={styles.workingHoursCard}>
          <View style={styles.workingHoursHeader}>
            <Text style={styles.workingHoursTitle}>Today's Working Hours</Text>
            <Text style={styles.workingHoursSubtitle}>
              {attendance.isCheckedIn ? 'In Progress' : 'Not Started'}
            </Text>
          </View>
          <ProgressBar
            progress={attendance.isCheckedIn ? 35 : 0}
            color={Colors.primary}
            height={10}
            style={styles.workingHoursProgress}
          />
          <View style={styles.workingHoursFooter}>
            <Text style={styles.workingHoursLabel}>
              {attendance.isCheckedIn ? '3h 45m / 9h' : '0h / 9h'}
            </Text>
            <Text style={styles.workingHoursTarget}>Target: 9 hours</Text>
          </View>
        </Card>

        {/* Leave Balance Summary */}
        <Card style={styles.leaveCard}>
          <Text style={styles.cardTitle}>Leave Balance</Text>
          <View style={styles.leaveBalanceRow}>
            <View style={styles.leaveBalanceItem}>
              <Text style={styles.leaveBalanceNum}>{mockLeaveBalance.sick}</Text>
              <Text style={styles.leaveBalanceLabel}>Sick</Text>
            </View>
            <View style={styles.leaveBalanceItem}>
              <Text style={styles.leaveBalanceNum}>{mockLeaveBalance.casual}</Text>
              <Text style={styles.leaveBalanceLabel}>Casual</Text>
            </View>
            <View style={styles.leaveBalanceItem}>
              <Text style={styles.leaveBalanceNum}>{mockLeaveBalance.earned}</Text>
              <Text style={styles.leaveBalanceLabel}>Earned</Text>
            </View>
            <View style={styles.leaveBalanceItem}>
              <Text style={styles.leaveBalanceNum}>{mockLeaveBalance.wfh}</Text>
              <Text style={styles.leaveBalanceLabel}>WFH</Text>
            </View>
          </View>
          <Button
            title="Apply for Leave"
            variant="outline"
            size="sm"
            fullWidth
            onPress={() => navigation.navigate('Work')}
            style={styles.applyLeaveBtn}
          />
        </Card>

        {/* Payroll Summary */}
        <Card style={styles.payrollCard}>
          <View style={styles.payrollHeader}>
            <View>
              <Text style={styles.cardTitle}>Latest Payslip</Text>
              <Text style={styles.payrollMonth}>May 2026</Text>
            </View>
            <StatusBadge status="pending" />
          </View>
          <Text style={styles.payrollAmount}>{formatCurrency(mockPayslips[0].netPay)}</Text>
          <Text style={styles.payrollLabel}>Net Pay</Text>
          <View style={styles.payrollFooter}>
            <Text style={styles.payrollNextPay}>Next Payday: {nextPayDate}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Pay')}>
              <Text style={styles.viewPayslipText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recognition */}
        <Card style={styles.recognitionCard}>
          <View style={styles.recognitionHeader}>
            <Text style={styles.cardTitle}>Recognition</Text>
            <Text style={styles.recognitionCount}>{recognitionToday} today</Text>
          </View>
          <View style={styles.recognitionItem}>
            <Text style={styles.recognitionIcon}>🏆</Text>
            <View style={styles.recognitionContent}>
              <Text style={styles.recognitionText}>Great work on the payment integration!</Text>
              <Text style={styles.recognitionFrom}>From: Priya Patel</Text>
            </View>
          </View>
        </Card>

        {/* Benefits Available */}
        <Card style={styles.benefitsCard}>
          <View style={styles.benefitsHeader}>
            <Text style={styles.cardTitle}>Benefits Available</Text>
            <View style={styles.benefitsBadge}>
              <Text style={styles.benefitsBadgeText}>{activeBenefitsCount}</Text>
            </View>
          </View>
          <Text style={styles.benefitsValue}>₹1.5L+ Value</Text>
          <Text style={styles.benefitsSubtext}>Including health, wellness, and perks</Text>
          <Button
            title="Explore Benefits"
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate('Benefits')}
            style={styles.exploreBenefitsBtn}
          />
        </Card>

        {/* AI Insights */}
        <Card style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Text style={styles.cardTitle}>AI Insights</Text>
            <Text style={styles.insightsIcon}>🤖</Text>
          </View>
          {mockAIInsights.map((insight) => (
            <View key={insight.type} style={styles.insightItem}>
              <Text style={styles.insightEmoji}>{insight.icon}</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDesc}>{insight.description}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Upcoming Events */}
        <Card style={styles.eventsCard}>
          <Text style={styles.cardTitle}>Upcoming</Text>
          {mockUpcomingEvents.map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <View style={styles.eventIcon}>
                <Text>📅</Text>
              </View>
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventTime}>{event.time} • {event.date}</Text>
              </View>
            </View>
          ))}
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.md,
  },
  userName: {
    color: Colors.textInverse,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginTop: 4,
  },
  designation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.textInverse,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  checkInCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    marginTop: -Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.lg,
  },
  checkInInfo: {
    flex: 1,
  },
  checkInTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  checkInTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  checkInBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  checkOutBtn: {
    backgroundColor: Colors.error,
  },
  checkInBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
  },
  quickActionItem: {
    width: '33.33%',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  overviewRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  overviewCard: {
    flex: 1,
  },
  workingHoursCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  workingHoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workingHoursTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  workingHoursSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  workingHoursProgress: {
    marginTop: Spacing.md,
  },
  workingHoursFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  workingHoursLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  workingHoursTarget: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  leaveCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  leaveBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  leaveBalanceItem: {
    alignItems: 'center',
  },
  leaveBalanceNum: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  leaveBalanceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  applyLeaveBtn: {
    marginTop: Spacing.sm,
  },
  payrollCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  payrollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  payrollMonth: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  payrollAmount: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    marginTop: Spacing.sm,
  },
  payrollLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  payrollFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  payrollNextPay: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  viewPayslipText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  recognitionCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  recognitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recognitionCount: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
  },
  recognitionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    backgroundColor: Colors.backgroundDark,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  recognitionIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  recognitionContent: {
    flex: 1,
  },
  recognitionText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  recognitionFrom: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  benefitsCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
  },
  benefitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  benefitsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  benefitsBadgeText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },
  benefitsValue: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginTop: Spacing.sm,
  },
  benefitsSubtext: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  exploreBenefitsBtn: {
    marginTop: Spacing.md,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  insightsCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightsIcon: {
    fontSize: 20,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  insightEmoji: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  insightDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  eventsCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  eventTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
