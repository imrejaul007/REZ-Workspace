import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { SocialMediaPost } from '@/services/api/socialMedia';

interface VerifyPostModalProps {
  visible: boolean;
  post: SocialMediaPost;
  action: 'approve' | 'reject';
  onConfirmApprove: (notes?: string) => void;
  onConfirmReject: (reason: string) => void;
  onClose: () => void;
}

export function VerifyPostModal({
  visible,
  post,
  action,
  onConfirmApprove,
  onConfirmReject,
  onClose
}: VerifyPostModalProps) {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getPlatformInfo = (platform: string) => {
    const platforms: { [key: string]: { name: string; icon: string; color: string } } = {
      instagram: { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
      facebook: { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
      twitter: { name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
      tiktok: { name: 'TikTok', icon: 'musical-notes', color: '#000000' }
    };
    return platforms[platform] || { name: platform, icon: 'globe', color: '#6b7280' };
  };

  const openPostUrl = async () => {
    try {
      const supported = await Linking.canOpenURL(post.postUrl);
      if (supported) {
        await Linking.openURL(post.postUrl);
      }
    } catch (error) {
      if (__DEV__) console.error('Error opening URL:', error);
    }
  };

  const handleConfirm = async () => {
    if (action === 'approve') {
      setIsLoading(true);
      try {
        await onConfirmApprove(notes || undefined);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!rejectionReason.trim()) {
        return; // Don't allow empty rejection reason
      }
      setIsLoading(true);
      try {
        await onConfirmReject(rejectionReason.trim());
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setNotes('');
    setRejectionReason('');
    onClose();
  };

  const platformInfo = getPlatformInfo(post.platform);

  const rejectionReasons = [
    'Post not found or deleted',
    'Post does not mention our store/product',
    'Invalid or broken link',
    'Post content is inappropriate',
    'Post was not made by this user'
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {action === 'approve' ? 'Approve Post' : 'Reject Post'}
              </ThemedText>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Verification Instructions */}
              <View style={styles.instructionsCard}>
                <Ionicons
                  name={action === 'approve' ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={action === 'approve' ? Colors.light.success : Colors.light.error}
                />
                <View style={styles.instructionsText}>
                  <ThemedText style={styles.instructionsTitle}>
                    {action === 'approve'
                      ? 'Before approving, please verify:'
                      : 'Select a rejection reason:'}
                  </ThemedText>
                  {action === 'approve' && (
                    <ThemedText style={styles.instructionsDetail}>
                      1. The post exists and is public{'\n'}
                      2. The post mentions your store or product{'\n'}
                      3. The content is appropriate
                    </ThemedText>
                  )}
                </View>
              </View>

              {/* Post Link Section */}
              <View style={styles.postLinkSection}>
                <ThemedText style={styles.sectionLabel}>View Post</ThemedText>
                <TouchableOpacity
                  style={styles.postLinkButton}
                  onPress={openPostUrl}
                  activeOpacity={0.7}
                >
                  <View style={styles.platformBadge}>
                    <Ionicons
                      name={platformInfo.icon as unknown}
                      size={20}
                      color={platformInfo.color}
                    />
                    <ThemedText style={styles.platformText}>{platformInfo.name}</ThemedText>
                  </View>
                  <View style={styles.openLinkContainer}>
                    <ThemedText style={styles.openLinkText}>Open in Browser</ThemedText>
                    <Ionicons name="open-outline" size={18} color={Colors.light.primary} />
                  </View>
                </TouchableOpacity>
                <ThemedText style={styles.urlText} numberOfLines={2}>
                  {post.postUrl}
                </ThemedText>
              </View>

              {/* Post Details */}
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>User</ThemedText>
                  <ThemedText style={styles.detailValue}>{post.user.name}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Order</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {post.order?.orderNumber || post.metadata?.orderNumber || 'N/A'}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>REZ Coins</ThemedText>
                  <ThemedText style={[styles.detailValue, { color: Colors.light.primary, fontWeight: 'bold' }]}>
                    {post.cashbackAmount.toFixed(0)}
                  </ThemedText>
                </View>
              </View>

              {/* Approve: Notes Input */}
              {action === 'approve' && (
                <View style={styles.inputSection}>
                  <ThemedText style={styles.sectionLabel}>Notes (Optional)</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Add unknown notes about this approval..."
                    placeholderTextColor={Colors.light.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              {/* Reject: Reason Selection */}
              {action === 'reject' && (
                <View style={styles.inputSection}>
                  <ThemedText style={styles.sectionLabel}>Rejection Reason *</ThemedText>
                  <View style={styles.reasonButtons}>
                    {rejectionReasons.map((reason) => (
                      <TouchableOpacity
                        key={reason}
                        style={[
                          styles.reasonButton,
                          rejectionReason === reason && styles.reasonButtonActive
                        ]}
                        onPress={() => setRejectionReason(reason)}
                      >
                        <ThemedText
                          style={[
                            styles.reasonButtonText,
                            rejectionReason === reason && styles.reasonButtonTextActive
                          ]}
                        >
                          {reason}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.textInput, { marginTop: 12 }]}
                    placeholder="Or enter a custom reason..."
                    placeholderTextColor={Colors.light.textSecondary}
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  action === 'approve' ? styles.approveBtn : styles.rejectBtn,
                  (isLoading || (action === 'reject' && !rejectionReason.trim())) && styles.buttonDisabled
                ]}
                onPress={handleConfirm}
                disabled={isLoading || (action === 'reject' && !rejectionReason.trim())}
              >
                {isLoading ? (
                  <ThemedText style={styles.confirmButtonText}>Processing...</ThemedText>
                ) : (
                  <>
                    <Ionicons
                      name={action === 'approve' ? 'checkmark' : 'close'}
                      size={18}
                      color={Colors.light.background}
                    />
                    <ThemedText style={styles.confirmButtonText}>
                      {action === 'approve' ? 'Approve' : 'Reject'}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 12,
  },
  instructionsText: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  instructionsDetail: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  postLinkSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  postLinkButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  openLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openLinkText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  urlText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  detailsSection: {
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
  },
  inputSection: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  reasonButtons: {
    gap: 8,
  },
  reasonButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  reasonButtonActive: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.error + '10',
  },
  reasonButtonText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  reasonButtonTextActive: {
    color: Colors.light.error,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  approveBtn: {
    backgroundColor: Colors.light.success,
  },
  rejectBtn: {
    backgroundColor: Colors.light.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.background,
  },
});

export default VerifyPostModal;
