// ==========================================
// CorpPerks Manager App - Attendance Review Screen
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
} from 'react-native';
import { Card, Avatar, Badge, Button } from '../src/components';
import { api } from '../src/services/api';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatDate,
} from '../src/utils/theme';
import { AttendanceRecord } from '../src/types';

export default function AttendanceReviewScreen() {
  const [corrections, setCorrections] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comment, setComment] = useState('');

  const loadCorrections = async () => {
    try {
      const response = await api.getPendingAttendanceCorrections();
      if (response.success && response.data) {
        setCorrections(response.data);
      }
    } catch (error) {
      logger.error('Error loading corrections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCorrections();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCorrections();
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;

    try {
      const response = await api.approveAttendanceCorrection(
        selectedRecord.id,
        comment || undefined
      );
      if (response.success) {
        setCorrections((prev) => prev.filter((c) => c.id !== selectedRecord.id));
        setShowApproveModal(false);
        setSelectedRecord(null);
        setComment('');
        Alert.alert('Success', 'Attendance correction approved');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to approve correction');
    }
  };

  const handleReject = async () => {
    if (!selectedRecord || !comment.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    try {
      const response = await api.rejectAttendanceCorrection(
        selectedRecord.id,
        comment
      );
      if (response.success) {
        setCorrections((prev) => prev.filter((c) => c.id !== selectedRecord.id));
        setShowRejectModal(false);
        setSelectedRecord(null);
        setComment('');
        Alert.alert('Success', 'Attendance correction rejected');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reject correction');
    }
  };

  const openApproveModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowApproveModal(true);
  };

  const openRejectModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowRejectModal(true);
  };

  const renderCorrectionCard = ({ item }: { item: AttendanceRecord }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar
          uri={`https://i.pravatar.cc/150?u=${item.employeeId}`}
          name={item.employeeName}
          size="md"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.employeeName}>{item.employeeName}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
        </View>
        <Badge label="Pending" variant="warning" size="sm" />
      </View>

      <View style={styles.correctionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Check-in:</Text>
          <Text style={styles.detailValue}>{item.checkIn || 'Not recorded'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Check-out:</Text>
          <Text style={styles.detailValue}>{item.checkOut || 'Not recorded'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Badge label={item.status} variant="status" size="sm" />
        </View>
      </View>

      {item.correction && (
        <View style={styles.correctionRequest}>
          <Text style={styles.correctionTitle}>Correction Request</Text>
          <Text style={styles.correctionReason}>{item.correction.reason}</Text>
          <Text style={styles.correctionDate}>
            Requested: {formatDate(item.correction.requestedAt)}
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <Button
          title="Approve"
          onPress={() => openApproveModal(item)}
          variant="primary"
          size="sm"
          style={styles.approveButton}
        />
        <Button
          title="Reject"
          onPress={() => openRejectModal(item)}
          variant="danger"
          size="sm"
          style={styles.rejectButton}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={corrections}
        keyExtractor={(item) => item.id}
        renderItem={renderCorrectionCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>check_circle</Text>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>
              No pending attendance corrections to review
            </Text>
          </View>
        }
        ListHeaderComponent={
          corrections.length > 0 ? (
            <Text style={styles.listHeader}>
              {corrections.length} pending correction{corrections.length > 1 ? 's' : ''}
            </Text>
          ) : null
        }
      />

      {/* Approve Modal */}
      <Modal
        visible={showApproveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApproveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve Correction</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to approve this attendance correction?
            </Text>

            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment (optional)"
              placeholderTextColor={Colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowApproveModal(false);
                  setSelectedRecord(null);
                  setComment('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Approve"
                onPress={handleApprove}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Correction</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejecting this correction.
            </Text>

            <TextInput
              style={[styles.commentInput, !comment.trim() && styles.inputError]}
              placeholder="Reason for rejection (required)"
              placeholderTextColor={Colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowRejectModal(false);
                  setSelectedRecord(null);
                  setComment('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Reject"
                onPress={handleReject}
                variant="danger"
                style={styles.modalButton}
              />
            </View>
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
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  employeeName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  correctionDetails: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  correctionRequest: {
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  correctionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  correctionReason: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  correctionDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  approveButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
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
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  commentInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
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
  },
  modalButton: {
    flex: 1,
  },
});
