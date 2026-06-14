import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ReferralCardProps {
  referral: {
    id: string;
    status: string;
    rewardAmount: number;
    qualifiedAt?: string;
    rewardedAt?: string;
    createdAt: string;
  };
  onPress?: () => void;
}

export function ReferralCard({ referral, onPress }: ReferralCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rewarded': return { bg: '#ECFDF5', text: '#059669' };
      case 'qualified': return { bg: '#EEF2FF', text: '#6366F1' };
      case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rewarded': return '✅';
      case 'qualified': return '🎯';
      case 'pending': return '⏳';
      default: return '📋';
    }
  };

  const statusStyle = getStatusColor(referral.status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <Text style={styles.icon}>{getStatusIcon(referral.status)}</Text>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.rewardAmount}>+{referral.rewardAmount} coins</Text>
        <Text style={styles.date}>
          {referral.rewardedAt
            ? `Rewarded ${formatDate(referral.rewardedAt)}`
            : referral.qualifiedAt
            ? `Qualified ${formatDate(referral.qualifiedAt)}`
            : `Invited ${formatDate(referral.createdAt)}`
          }
        </Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusText, { color: statusStyle.text }]}>
          {referral.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leftSection: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  middleSection: {
    flex: 1,
  },
  rewardAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});

export default ReferralCard;
