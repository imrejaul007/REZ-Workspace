import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { SocialMediaPost } from '@/services/api/socialMedia';

interface SocialMediaPostCardProps {
  post: SocialMediaPost;
  onApprove: (postId: string) => void;
  onReject: (postId: string) => void;
  onViewDetails?: (postId: string) => void;
}

export function SocialMediaPostCard({
  post,
  onApprove,
  onReject,
  onViewDetails
}: SocialMediaPostCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.light.warning;
      case 'approved':
      case 'credited': return Colors.light.success;
      case 'rejected': return Colors.light.error;
      default: return Colors.light.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'credited': return 'Credited';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getPlatformInfo = (platform: string) => {
    const platforms: { [key: string]: { name: string; icon: string; color: string } } = {
      instagram: { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
      facebook: { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
      twitter: { name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
      tiktok: { name: 'TikTok', icon: 'musical-notes', color: '#000000' }
    };
    return platforms[platform] || { name: platform, icon: 'globe', color: '#6b7280' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const platformInfo = getPlatformInfo(post.platform);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewDetails?.(post._id)}
      activeOpacity={0.8}
    >
      {/* Header: User Info & Status */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {post.user.avatar ? (
              <Ionicons name="person-circle" size={40} color={Colors.light.primary} />
            ) : (
              <Ionicons name="person-circle" size={40} color={Colors.light.textSecondary} />
            )}
          </View>
          <View style={styles.userDetails}>
            <ThemedText style={styles.userName}>{post.user.name || 'Unknown User'}</ThemedText>
            <ThemedText style={styles.userEmail}>{post.user.email || 'No email'}</ThemedText>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(post.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(post.status) }]} />
          <ThemedText style={[styles.statusText, { color: getStatusColor(post.status) }]}>
            {getStatusLabel(post.status)}
          </ThemedText>
        </View>
      </View>

      {/* Order Info */}
      <View style={styles.orderSection}>
        <View style={styles.orderInfo}>
          <Ionicons name="receipt-outline" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.orderNumber}>
            Order: {post.order?.orderNumber || post.metadata?.orderNumber || 'N/A'}
          </ThemedText>
        </View>
        <ThemedText style={styles.dateText}>
          {formatDate(post.submittedAt)}
        </ThemedText>
      </View>

      {/* Platform & Post Link */}
      <TouchableOpacity
        style={styles.platformSection}
        onPress={openPostUrl}
        activeOpacity={0.7}
      >
        <View style={styles.platformInfo}>
          <Ionicons
            name={platformInfo.icon as unknown}
            size={24}
            color={platformInfo.color}
          />
          <ThemedText style={styles.platformName}>{platformInfo.name}</ThemedText>
        </View>
        <View style={styles.linkButton}>
          <ThemedText style={styles.linkButtonText}>View Post</ThemedText>
          <Ionicons name="open-outline" size={16} color={Colors.light.primary} />
        </View>
      </TouchableOpacity>

      {/* Cashback Amount */}
      <View style={styles.cashbackSection}>
        <View style={styles.cashbackInfo}>
          <Ionicons name="wallet-outline" size={20} color={Colors.light.primary} />
          <ThemedText style={styles.cashbackLabel}>REZ Coins</ThemedText>
        </View>
        <ThemedText style={styles.cashbackAmount}>
          {post.cashbackAmount.toFixed(0)}
        </ThemedText>
      </View>

      {/* Rejection Reason (if rejected) */}
      {post.status === 'rejected' && post.rejectionReason && (
        <View style={styles.rejectionSection}>
          <Ionicons name="information-circle" size={16} color={Colors.light.error} />
          <ThemedText style={styles.rejectionText}>
            Reason: {post.rejectionReason}
          </ThemedText>
        </View>
      )}

      {/* Action Buttons (only for pending) */}
      {post.status === 'pending' && (
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => onReject(post._id)}
          >
            <Ionicons name="close" size={18} color={Colors.light.error} />
            <ThemedText style={styles.rejectButtonText}>Reject</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => onApprove(post._id)}
          >
            <Ionicons name="checkmark" size={18} color={Colors.light.background} />
            <ThemedText style={styles.approveButtonText}>Approve</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  dateText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  platformSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    marginTop: 8,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkButtonText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  cashbackSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cashbackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cashbackLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  cashbackAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  rejectionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.error + '10',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  rejectionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.error,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: Colors.light.error + '15',
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.error,
  },
  approveButton: {
    backgroundColor: Colors.light.success,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
  },
});

export default SocialMediaPostCard;
