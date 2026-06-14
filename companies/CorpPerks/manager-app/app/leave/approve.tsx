// ==========================================
// CorpPerks Manager App - Leave Approvals Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Card, Avatar, Badge, Button } from '../src/components';
import { api } from '../src/services/api';
import { useStore } from '../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatDate,
} from '../src/utils/theme';
import { LeaveRequest } from '../src/types';

export default function LeaveApproveScreen() {
  const { leaveRequests, setLeaveRequests, updateLeaveRequest } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pendingRequests = leaveRequests.filter((r) => r.status === 'pending');

  useEffect(() => {
    setLoading(false);
  }, [leaveRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.getLeaveRequests('pending');
      if (response.success && response.data) {
        setLeaveRequests(response.data);
      }
    } catch (error) {
      logger.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const openActionModal = (request: LeaveRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setComment('');
    setShowActionModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedRequest) return;

    if (actionType === 'reject' && !comment.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);

    try {
      let response;
      if (actionType === 'approve') {
        response = await api.approveLeave(selectedRequest.id, comment || undefined);
      } else {
        response = await api.rejectLeave(selectedRequest.id, comment);
      }

      if (response.success) {
        updateLeaveRequest(selectedRequest.id, actionType);
        setShowActionModal(false);
        Alert.alert(
          'Success',
          `Leave request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to process request');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequestCard = ({ item }: { item: LeaveRequest }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar
          uri={item.employeeAvatar}
          name={item.employeeName}
          size="lg"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.employeeName}>{item.employeeName}</Text>
          <Text style={styles.designation}>Software Engineer</Text>
          <Text style={styles.appliedDate}>
            Applied {formatDate(item.appliedOn, 'relative')}
          </Text>
        </View>
        <Badge
          label={item.type}
          variant="leaveType"
          size="sm"
        />
      </View>

      {/* Date Details */}
      <View style={styles.dateCard}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>From</Text>
          <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
        </View>
        <View style={styles.dateDivider} />
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>To</Text>
          <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
        </View>
        <View style={styles.daysContainer}>
          <Text style={styles.daysValue}>{item.days}</Text>
          <Text style={styles.daysLabel}>days</Text>
        </View>
      </View>

      {/* Reason */}
      <View style={styles.reasonSection}>
        <Text style={styles.sectionLabel}>Reason</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>

      {/* Leave Balance Impact */}
      <View style={styles.balanceSection}>
        <Text style={styles.sectionLabel}>Leave Balance Impact</Text>
        <View style={styles.balanceGrid}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceType}>Sick</Text>
            <Text style={styles.balanceDays}>{item.leaveBalanceAtTime.sick} days left</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceType}>Casual</Text>
            <Text style={styles.balanceDays}>{item.leaveBalanceAtTime.casual} days left</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceType}>Earned</Text>
            <Text style={styles.balanceDays}>{item.leaveBalanceAtTime.earned} days left</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Reject"
          onPress={() => openActionModal(item, 'reject')}
          variant="outline"
          size="md"
          style={styles.rejectButton}
        />
        <Button
          title="Approve"
          onPress={() => openActionModal(item, 'approve')}
          variant="primary"
          size="md"
          style={styles.approveButton}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>celebration</Text>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>
              No pending leave requests to review
            </Text>
          </View>
        }
        ListHeaderComponent={
          pendingRequests.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {pendingRequests.length} request{pendingRequests.length > 1 ? 's' : ''} pending
              </Text>
            </View>
          ) : null
        }
      />

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request
              </Text>

              {selectedRequest && (
                <View style={styles.modalRequestInfo}>
                  <Avatar
                    uri={selectedRequest.employeeAvatar}
                    name={selectedRequest.employeeName}
                    size="md"
                  />
                  <View style={styles.modalRequestDetails}>
                    <Text style={styles.modalEmployeeName}>
                      {selectedRequest.employeeName}
                    </Text>
                    <Text style={styles.modalLeaveType}>
                      {selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)} Leave
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.modalDateRange}>
                <Text style={styles.modalDateLabel}>
                  {formatDate(selectedRequest?.startDate || '')} - {formatDate(selectedRequest?.endDate || '')}
                </Text>
                <Text style={styles.modalDays}>
                  {selectedRequest?.days} day{selectedRequest?.days && selectedRequest.days > 1 ? 's' : ''}
                </Text>
              </View>

              {actionType === 'approve' ? (
                <View style={styles.approveInfo}>
                  <Text style={styles.approveText}>
                    You are about to approve this leave request. The employee's leave balance will be deducted accordingly.
                  </Text>
                </View>
              ) : (
                <View style={styles.rejectWarning}>
                  <Text style={styles.rejectWarningText}>
                    Please provide a reason for rejection. This will be shared with the employee.
                  </Text>
                </View>
              )}

              <TextInput
                style={[
                  styles.commentInput,
                  actionType === 'reject' && !comment.trim() && styles.inputError,
                ]}
                placeholder={
                  actionType === 'approve'
                    ? 'Add a comment (optional)'
                    : 'Reason for rejection (required)'
                }
                placeholderTextColor={Colors.textMuted}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowActionModal(false);
                    setSelectedRequest(null);
                    setComment('');
                  }}
                  variant="outline"
                  size="md"
                  style={styles.modalButton}
                />
                <Button
                  title={actionType === 'approve' ? 'Approve' : 'Reject'}
                  onPress={handleSubmit}
                  variant={actionType === 'approve' ? 'primary' : 'danger'}
                  size="md"
                  loading={submitting}
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  listHeaderText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  employeeName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  designation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  appliedDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  dateItem: {
    flex: 1,
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  dateLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  daysContainer: {
    alignItems: 'center',
    paddingLeft: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  daysValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  daysLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  reasonSection: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  reasonText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  balanceSection: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceType: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  balanceDays: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  rejectButton: {
    flex: 1,
  },
  approveButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
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
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalRequestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalRequestDetails: {
    marginLeft: Spacing.md,
  },
  modalEmployeeName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalLeaveType: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  modalDateRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalDateLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  modalDays: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  approveInfo: {
    backgroundColor: Colors.success + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  approveText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    lineHeight: 20,
  },
  rejectWarning: {
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  rejectWarningText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    lineHeight: 20,
  },
  commentInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 100,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
