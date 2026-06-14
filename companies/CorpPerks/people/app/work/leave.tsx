// ==========================================
// MyTalent - Leave Management Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, formatDate } from '../../src/components/Badge';
import { Card, Button, StatusBadge, EmptyState } from '../../src/components';
import { mockLeaveBalance, mockLeaveRequests, mockHolidays } from '../../src/data/mockData';
import { useAppStore } from '../../src/store/useAppStore';
import { getLeaveBalance, getLeaveRequests, applyLeave } from '../../src/services/leaveService';

export default function LeaveScreen() {
  const { leave, setLeaveBalance, setLeaveRequests, addLeaveRequest } = useAppStore();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState<'sick' | 'casual' | 'earned' | 'wfh'>('sick');
  const [reason, setReason] = useState('');
  const [selectedDates, setSelectedDates] = useState({ start: '', end: '' });

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
    const balanceResult = await getLeaveBalance('EMP001');
    const requestsResult = await getLeaveRequests('EMP001');

    if (balanceResult.success && balanceResult.balance) {
      setLeaveBalance(balanceResult.balance);
    }
    if (requestsResult.success && requestsResult.requests) {
      setLeaveRequests(requestsResult.requests);
    }
  };

  const handleApplyLeave = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for leave');
      return;
    }

    const result = await applyLeave('EMP001', leaveType, selectedDates.start, selectedDates.end, reason);

    if (result.success && result.request) {
      addLeaveRequest(result.request);
      setShowApplyModal(false);
      setReason('');
      setSelectedDates({ start: '', end: '' });
      Alert.alert('Success', 'Leave request submitted successfully!');
    }
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'sick': return '🏥';
      case 'casual': return '🏖️';
      case 'earned': return '🌟';
      case 'wfh': return '🏠';
      default: return '📋';
    }
  };

  const pendingRequests = mockLeaveRequests.filter((r) => r.status === 'pending');
  const approvedRequests = mockLeaveRequests.filter((r) => r.status === 'approved');

  return (
    <ScrollView style={styles.container}>
      {/* Leave Balance Cards */}
      <Text style={styles.sectionTitle}>Leave Balance</Text>
      <View style={styles.balanceGrid}>
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceIcon}>🏥</Text>
          <Text style={styles.balanceNum}>{mockLeaveBalance.sick}</Text>
          <Text style={styles.balanceLabel}>Sick</Text>
        </Card>
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceIcon}>🏖️</Text>
          <Text style={styles.balanceNum}>{mockLeaveBalance.casual}</Text>
          <Text style={styles.balanceLabel}>Casual</Text>
        </Card>
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceIcon}>🌟</Text>
          <Text style={styles.balanceNum}>{mockLeaveBalance.earned}</Text>
          <Text style={styles.balanceLabel}>Earned</Text>
        </Card>
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceIcon}>🏠</Text>
          <Text style={styles.balanceNum}>{mockLeaveBalance.wfh}</Text>
          <Text style={styles.balanceLabel}>WFH</Text>
        </Card>
      </View>

      {/* Apply Leave Button */}
      <Button
        title="+ Apply for Leave"
        variant="primary"
        fullWidth
        onPress={() => setShowApplyModal(true)}
        style={styles.applyBtn}
      />

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
          {pendingRequests.map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.requestType}>
                  <Text style={styles.requestIcon}>{getLeaveTypeIcon(request.type)}</Text>
                  <Text style={styles.requestTypeText}>
                    {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                  </Text>
                </View>
                <StatusBadge status="pending" />
              </View>
              <Text style={styles.requestDate}>{request.startDate} - {request.endDate}</Text>
              <Text style={styles.requestReason}>{request.reason}</Text>
              <Text style={styles.requestApplied}>Applied: {request.appliedOn}</Text>
            </Card>
          ))}
        </>
      )}

      {/* Approved Requests */}
      <Text style={styles.sectionTitle}>Leave History</Text>
      {approvedRequests.length > 0 ? (
        approvedRequests.map((request) => (
          <Card key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.requestType}>
                <Text style={styles.requestIcon}>{getLeaveTypeIcon(request.type)}</Text>
                <Text style={styles.requestTypeText}>
                  {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                </Text>
              </View>
              <StatusBadge status={request.status} />
            </View>
            <Text style={styles.requestDate}>{request.startDate} - {request.endDate}</Text>
            <Text style={styles.requestReason}>{request.reason}</Text>
            <View style={styles.requestFooter}>
              <Text style={styles.requestReviewed}>
                {request.reviewedBy && `Reviewed by: ${request.reviewedBy}`}
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <EmptyState
          icon="📅"
          title="No Leave History"
          description="Your approved leave requests will appear here"
        />
      )}

      {/* Upcoming Holidays */}
      <Text style={styles.sectionTitle}>Upcoming Holidays</Text>
      {mockHolidays.slice(0, 4).map((holiday) => (
        <Card key={holiday.id} style={styles.holidayCard}>
          <View style={styles.holidayInfo}>
            <Text style={styles.holidayName}>{holiday.name}</Text>
            <Text style={styles.holidayDate}>{formatDate(holiday.date)}</Text>
          </View>
          <View style={[styles.holidayBadge, {
            backgroundColor: holiday.type === 'national' ? `${Colors.error}20` :
                           holiday.type === 'state' ? `${Colors.warning}20` : `${Colors.success}20`
          }]}>
            <Text style={[styles.holidayType, {
              color: holiday.type === 'national' ? Colors.error :
                     holiday.type === 'state' ? Colors.warning : Colors.success
            }]}>
              {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
            </Text>
          </View>
        </Card>
      ))}

      <View style={styles.bottomSpacer} />

      {/* Apply Leave Modal */}
      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for Leave</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Leave Type</Text>
            <View style={styles.typeGrid}>
              {(['sick', 'casual', 'earned', 'wfh'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, leaveType === type && styles.typeBtnActive]}
                  onPress={() => setLeaveType(type)}
                >
                  <Text style={styles.typeIcon}>{getLeaveTypeIcon(type)}</Text>
                  <Text style={[styles.typeLabel, leaveType === type && styles.typeLabelActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter reason for leave"
              value={reason}
              onChangeText={setReason}
              multiline
            />

            <Button
              title="Submit Request"
              variant="primary"
              fullWidth
              onPress={handleApplyLeave}
              style={styles.submitBtn}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  balanceCard: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
  },
  balanceIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  balanceNum: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  applyBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  requestCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  requestTypeText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  requestDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  requestReason: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  requestApplied: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  requestFooter: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  requestReviewed: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  holidayCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holidayInfo: {},
  holidayName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  holidayDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  holidayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  holidayType: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.textMuted,
  },
  inputLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeBtn: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  typeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  typeLabelActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
});
