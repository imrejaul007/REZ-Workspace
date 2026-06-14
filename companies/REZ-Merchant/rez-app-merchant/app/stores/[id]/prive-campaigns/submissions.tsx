import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { priveCampaignsService } from '@/services/api';
import { logger } from '@/utils/logger';

interface Submission {
  _id: string;
  userHandle: string;
  platform: 'Instagram' | 'Twitter' | 'YouTube';
  postUrl: string;
  thumbnailUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export default function SubmissionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;
  const campaignId = params.campaignId as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await priveCampaignsService.getSubmissions(campaignId);
      setSubmissions(data || []);
    } catch (err) {
      if (__DEV__) console.error('Error loading submissions:', err);
      showAlert('Error', 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubmissions();
    setRefreshing(false);
  };

  useEffect(() => {
    loadSubmissions();
  }, [campaignId]);

  const handleApprove = async (submissionId: string) => {
    try {
      await priveCampaignsService.approveSubmission(campaignId, submissionId);
      setSubmissions((prev) =>
        prev.map((s) => (s._id === submissionId ? { ...s, status: 'approved' as const } : s))
      );
      showAlert('Success', 'Submission approved!');
    } catch (err) {
      if (__DEV__) console.error('Error approving submission:', err);
      showAlert('Error', err.message || 'Failed to approve submission');
    }
  };

  const handleRejectClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedSubmission) return;
    if (!rejectReason.trim()) {
      showAlert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      await priveCampaignsService.rejectSubmission(campaignId, selectedSubmission._id, {
        reason: rejectReason,
      });
      setSubmissions((prev) =>
        prev.map((s) =>
          s._id === selectedSubmission._id ? { ...s, status: 'rejected' as const } : s
        )
      );
      setShowRejectModal(false);
      setSelectedSubmission(null);
      setRejectReason('');
      showAlert('Success', 'Submission rejected');
    } catch (err) {
      if (__DEV__) console.error('Error rejecting submission:', err);
      showAlert('Error', err.message || 'Failed to reject submission');
    }
  };

  const handleBulkApprove = async () => {
    const pendingCount = submissions.filter((s) => s.status === 'pending').length;
    if (pendingCount === 0) {
      showAlert('Info', 'No pending submissions to approve');
      return;
    }

    showAlert('Confirm', `Approve all ${pendingCount} pending submissions?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve All',
        onPress: async () => {
          try {
            const pendingIds = submissions.filter((s) => s.status === 'pending').map((s) => s._id);
            await priveCampaignsService.bulkApproveSubmissions(campaignId, {
              submissionIds: pendingIds,
            });
            setSubmissions((prev) =>
              prev.map((s) => (s.status === 'pending' ? { ...s, status: 'approved' as const } : s))
            );
            showAlert('Success', `${pendingCount} submissions approved!`);
          } catch (err) {
            if (__DEV__) console.error('Error bulk approving submissions:', err);
            showAlert('Error', err.message || 'Failed to bulk approve');
          }
        },
      },
    ]);
  };

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved');
  const rejectedSubmissions = submissions.filter((s) => s.status === 'rejected');

  const getPlatformColor = (platform: string): string => {
    const colors: Record<string, string> = {
      Instagram: '#E1306C',
      Twitter: '#1DA1F2',
      YouTube: '#FF0000',
    };
    return colors[platform] || '#6B7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Submissions</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading submissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Submissions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingSubmissions.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{approvedSubmissions.length}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{rejectedSubmissions.length}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Bulk Approve Button */}
      {pendingSubmissions.length > 0 && (
        <TouchableOpacity style={styles.bulkApproveButton} onPress={handleBulkApprove}>
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
          <Text style={styles.bulkApproveText}>Approve All Pending</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {submissions.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Submissions Yet</Text>
            <Text style={styles.emptyText}>
              Submissions will appear here once creators start participating in your campaign.
            </Text>
          </View>
        )}

        {submissions.map((submission) => (
          <View key={submission._id} style={styles.submissionCard}>
            {/* Header */}
            <View style={styles.submissionHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {submission.userHandle.charAt(1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userHandle}>{submission.userHandle}</Text>
                  <Text style={styles.submittedTime}>{formatDate(submission.submittedAt)}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.platformBadge,
                  { backgroundColor: getPlatformColor(submission.platform) + '20' },
                ]}
              >
                <Text
                  style={[styles.platformText, { color: getPlatformColor(submission.platform) }]}
                >
                  {submission.platform}
                </Text>
              </View>
            </View>

            {/* Thumbnail */}
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: submission.thumbnailUrl }} style={styles.thumbnail} />
            </View>

            {/* Post Link */}
            <TouchableOpacity style={styles.linkContainer}>
              <Ionicons name="open-outline" size={16} color="#3B82F6" />
              <Text style={styles.linkText} numberOfLines={1}>
                View Post
              </Text>
            </TouchableOpacity>

            {/* Status & Actions */}
            {submission.status === 'pending' && (
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectClick(submission)}
                >
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(submission._id)}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}

            {submission.status === 'approved' && (
              <View style={styles.statusContainer}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.approvedText}>Approved</Text>
              </View>
            )}

            {submission.status === 'rejected' && (
              <View style={styles.statusContainer}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
                <Text style={styles.rejectedText}>Rejected</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rejection Reason</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Explain why you're rejecting this submission..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleRejectSubmit}
              >
                <Text style={styles.submitButtonText}>Reject</Text>
              </TouchableOpacity>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  bulkApproveButton: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bulkApproveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  userDetails: {
    flex: 1,
  },
  userHandle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  submittedTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  platformBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailContainer: {
    marginVertical: 12,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  approvedText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectedText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#EF4444',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
