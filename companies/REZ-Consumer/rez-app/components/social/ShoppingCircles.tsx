/**
 * Shopping Circles Component
 * Group buying, shared carts, family wallet
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface CircleMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

interface SharedCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  addedBy: string;
  addedByName: string;
  image?: string;
}

interface ShoppingCircle {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  members: CircleMember[];
  sharedCart?: SharedCartItem[];
  totalValue?: number;
  savings?: number;
  createdAt: string;
}

interface ShoppingCirclesProps {
  circles?: ShoppingCircle[];
  onCirclePress?: (circle: ShoppingCircle) => void;
  onCreateCircle?: () => void;
}

// Main Shopping Circles Component
export function ShoppingCircles({
  circles = [],
  onCirclePress,
  onCreateCircle,
}: ShoppingCirclesProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');

  const handleCreateCircle = useCallback(() => {
    if (newCircleName.trim()) {
      // In production, call API to create circle
      Alert.alert('Circle Created', `"${newCircleName}" circle has been created!`);
      setShowCreateModal(false);
      setNewCircleName('');
    }
  }, [newCircleName]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Circles</Text>
        <Pressable style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {circles.length > 0 ? (
          circles.map((circle, index) => (
            <Animated.View
              key={circle.id}
              entering={FadeInDown.delay(index * 100).duration(300)}
            >
              <Pressable
                style={styles.circleCard}
                onPress={() => onCirclePress?.(circle) || router.push(`/circle/${circle.id}`)}
              >
                <View style={styles.circleIconContainer}>
                  <Text style={styles.circleIcon}>{circle.icon}</Text>
                </View>
                <Text style={styles.circleName} numberOfLines={1}>{circle.name}</Text>
                <Text style={styles.memberCount}>{circle.memberCount} members</Text>
                {circle.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>₹{circle.savings} saved</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          ))
        ) : (
          <EmptyState onCreate={() => setShowCreateModal(true)} />
        )}
      </ScrollView>

      {/* Create Circle Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Shopping Circle</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Circle name (e.g., Family, Roommates)"
              placeholderTextColor={colors.text.tertiary}
              value={newCircleName}
              onChangeText={setNewCircleName}
            />

            <Text style={styles.modalSubtitle}>Choose an icon</Text>
            <View style={styles.iconGrid}>
              {['👨‍👩‍👧‍👦', '🏠', '💑', '👯', '🎉', '🏢', '🎓', '⚽'].map((icon) => (
                <Pressable key={icon} style={styles.iconOption}>
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.submitButton} onPress={handleCreateCircle}>
              <Text style={styles.submitButtonText}>Create Circle</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Empty State
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Pressable style={styles.emptyState} onPress={onCreate}>
      <LinearGradient
        colors={['#FF6B35', '#FF8F6B']}
        style={styles.emptyGradient}
      >
        <Ionicons name="people-circle-outline" size={48} color="#FFFFFF" />
        <Text style={styles.emptyTitle}>Start a Shopping Circle</Text>
        <Text style={styles.emptySubtitle}>
          Share carts with family, friends, or roommates
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

// Shared Cart Component
interface SharedCartProps {
  items: SharedCartItem[];
  onRemoveItem?: (itemId: string) => void;
  onCheckout?: () => void;
  totalSavings?: number;
}

export function SharedCart({
  items,
  onRemoveItem,
  onCheckout,
  totalSavings = 0,
}: SharedCartProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <View style={styles.sharedCart}>
      <View style={styles.sharedCartHeader}>
        <Text style={styles.sharedCartTitle}>Shared Cart</Text>
        <Text style={styles.sharedCartCount}>{items.length} items</Text>
      </View>

      {items.map((item) => (
        <View key={item.id} style={styles.cartItem}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.itemImage} />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Ionicons name="cube-outline" size={24} color={colors.text.tertiary} />
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemMeta}>Added by {item.addedByName}</Text>
            <View style={styles.itemPriceRow}>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
              <Text style={styles.itemQuantity}>× {item.quantity}</Text>
            </View>
          </View>
          <Pressable style={styles.removeButton} onPress={() => onRemoveItem?.(item.id)}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        </View>
      ))}

      <View style={styles.cartSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{total}</Text>
        </View>
        {totalSavings > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Group Savings</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>-₹{totalSavings}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{total - totalSavings}</Text>
        </View>
      </View>

      <Pressable style={styles.checkoutButton} onPress={onCheckout}>
        <Text style={styles.checkoutButtonText}>Checkout Together</Text>
      </Pressable>
    </View>
  );
}

// Circle Members List
interface CircleMembersProps {
  members: CircleMember[];
  currentUserId?: string;
  onInvite?: () => void;
  onRemoveMember?: (memberId: string) => void;
}

export function CircleMembers({
  members,
  currentUserId,
  onInvite,
  onRemoveMember,
}: CircleMembersProps) {
  return (
    <View style={styles.membersContainer}>
      <View style={styles.membersHeader}>
        <Text style={styles.membersTitle}>Members ({members.length})</Text>
        <Pressable style={styles.inviteButton} onPress={onInvite}>
          <Ionicons name="person-add-outline" size={18} color={colors.brand.primary} />
          <Text style={styles.inviteButtonText}>Invite</Text>
        </Pressable>
      </View>

      {members.map((member) => (
        <View key={member.id} style={styles.memberItem}>
          {member.avatar ? (
            <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
          ) : (
            <View style={styles.memberAvatarPlaceholder}>
              <Text style={styles.memberInitial}>
                {member.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>{member.name}</Text>
              {member.id === currentUserId && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>You</Text>
                </View>
              )}
              {member.role === 'owner' && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>Owner</Text>
                </View>
              )}
            </View>
            <Text style={styles.memberJoined}>
              Joined {new Date(member.joinedAt).toLocaleDateString()}
            </Text>
          </View>
          {member.id !== currentUserId && member.role !== 'owner' && (
            <Pressable onPress={() => onRemoveMember?.(member.id)}>
              <Ionicons name="close-circle-outline" size={24} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  createButtonText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  circleCard: {
    width: 140,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
  },
  circleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100] + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  circleIcon: {
    fontSize: 24,
  },
  circleName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  memberCount: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  savingsBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.success,
  },
  emptyState: {
    width: 280,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  emptyGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text.primary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionText: {
    fontSize: 24,
  },
  submitButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Shared Cart
  sharedCart: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  sharedCartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sharedCartTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sharedCartCount: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  itemImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
    color: colors.text.primary,
  },
  itemMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemQuantity: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
  removeButton: {
    padding: spacing.sm,
  },
  cartSummary: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.primary,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  totalLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  checkoutButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  checkoutButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Members
  membersContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  membersTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.brand.primary,
    marginLeft: spacing.xs,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  youBadge: {
    backgroundColor: colors.brand.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  youBadgeText: {
    fontSize: 10,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  ownerBadge: {
    backgroundColor: colors.gold + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  ownerBadgeText: {
    fontSize: 10,
    color: colors.gold,
    fontWeight: '600',
  },
  memberJoined: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});

export default {
  ShoppingCircles,
  SharedCart,
  CircleMembers,
};
