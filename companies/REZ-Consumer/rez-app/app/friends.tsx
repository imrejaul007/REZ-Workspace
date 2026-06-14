/**
 * Friends Screen
 * Social commerce with friends activity, shopping circles, and shared carts
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthUser } from '@/stores/selectors';
import { useFriendsActivity } from '@/hooks/useLiveActivity';
import { ShoppingCircles, SharedCart, CircleMembers } from '@/components/social/ShoppingCircles';

import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  mutualFriends: number;
  isFollowing: boolean;
}

interface ShoppingCircle {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  members: { id: string; name: string; avatar?: string; role: 'member' | 'owner'; joinedAt: string }[];
  sharedCart?: { id: string; name: string; price: number; quantity: number; addedBy: string; addedByName: string }[];
  totalValue?: number;
  savings?: number;
  createdAt: string;
}

// Mock data
const mockCircles: ShoppingCircle[] = [
  {
    id: '1',
    name: 'Family Shopping',
    icon: '👨‍👩‍👧‍👦',
    memberCount: 4,
    members: [
      { id: '1', name: 'You', role: 'owner', joinedAt: new Date().toISOString() },
      { id: '2', name: 'Mom', role: 'member', joinedAt: new Date().toISOString() },
      { id: '3', name: 'Dad', role: 'member', joinedAt: new Date().toISOString() },
      { id: '4', name: 'Sister', role: 'member', joinedAt: new Date().toISOString() },
    ],
    sharedCart: [
      { id: 'c1', name: 'Groceries Pack', price: 2500, quantity: 1, addedBy: '2', addedByName: 'Mom' },
      { id: 'c2', name: 'Kitchen Items', price: 800, quantity: 2, addedBy: '3', addedByName: 'Dad' },
    ],
    totalValue: 4100,
    savings: 350,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Roommates',
    icon: '🏠',
    memberCount: 3,
    members: [
      { id: '1', name: 'You', role: 'owner', joinedAt: new Date().toISOString() },
      { id: '5', name: 'Alex', role: 'member', joinedAt: new Date().toISOString() },
      { id: '6', name: 'Sam', role: 'member', joinedAt: new Date().toISOString() },
    ],
    totalValue: 0,
    savings: 0,
    createdAt: new Date().toISOString(),
  },
];

const mockFriends: Friend[] = [
  { id: '1', name: 'Priya Sharma', avatar: undefined, mutualFriends: 12, isFollowing: true },
  { id: '2', name: 'Rahul Kumar', avatar: undefined, mutualFriends: 8, isFollowing: true },
  { id: '3', name: 'Anita Menon', avatar: undefined, mutualFriends: 5, isFollowing: false },
  { id: '4', name: 'Vikram Joshi', avatar: undefined, mutualFriends: 23, isFollowing: true },
  { id: '5', name: 'Sneha Patel', avatar: undefined, mutualFriends: 3, isFollowing: false },
];

const mockFriendActivities = [
  { id: '1', userId: '1', userName: 'Priya S.', action: 'bought', itemName: 'Nike Air Max', itemPrice: 4999, timestamp: '5 min ago', cashback: 15 },
  { id: '2', userId: '2', userName: 'Rahul K.', action: 'reviewed', itemName: 'Protein Powder', itemPrice: 1299, timestamp: '12 min ago' },
  { id: '3', userId: '3', userName: 'Anita M.', action: 'saved', itemName: 'Yoga Mat', itemPrice: 799, timestamp: '25 min ago', cashback: 18 },
  { id: '4', userId: '4', userName: 'Vikram J.', action: 'visited', itemName: 'Cafe Mocha', storeName: 'Cafe Mocha', timestamp: '1 hour ago' },
  { id: '5', userId: '5', userName: 'Sneha P.', action: 'bought', itemName: 'Coffee Beans', itemPrice: 499, timestamp: '2 hours ago', cashback: 10 },
];

export default function FriendsScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const { activities: liveActivities, loading: activitiesLoading } = useFriendsActivity();

  const [activeTab, setActiveTab] = useState<'activity' | 'circles' | 'friends'>('activity');
  const [refreshing, setRefreshing] = useState(false);

  const friendActivities = mockFriendActivities; // Use liveActivities in production

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      bought: '🛒',
      reviewed: '⭐',
      saved: '❤️',
      visited: '📍',
      shared: '📤',
    };
    return icons[action] || '📌';
  };

  const getActionText = (action: string, itemName: string) => {
    const texts: Record<string, string> = {
      bought: `bought ${itemName}`,
      reviewed: `reviewed ${itemName}`,
      saved: `saved ${itemName}`,
      visited: `visited ${itemName}`,
      shared: `shared ${itemName}`,
    };
    return texts[action] || `interacted with ${itemName}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <Pressable style={styles.inviteButton}>
          <Ionicons name="person-add" size={20} color={colors.brand.primary} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
            Activity
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'circles' && styles.activeTab]}
          onPress={() => setActiveTab('circles')}
        >
          <Text style={[styles.tabText, activeTab === 'circles' && styles.activeTabText]}>
            Circles
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <Animated.View entering={FadeIn}>
            <Text style={styles.sectionTitle}>Friends Activity</Text>
            <Text style={styles.sectionSubtitle}>See what your friends are buying and saving</Text>

            {friendActivities.map((activity, index) => (
              <Animated.View
                key={activity.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
                style={styles.activityCard}
              >
                <View style={styles.activityHeader}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {activity.userName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityUser}>{activity.userName}</Text>
                    <Text style={styles.activityAction}>
                      {getActionIcon(activity.action)} {getActionText(activity.action, activity.itemName)}
                    </Text>
                    {activity.storeName && (
                      <Text style={styles.activityStore}>at {activity.storeName}</Text>
                    )}
                    <Text style={styles.activityTime}>{activity.timestamp}</Text>
                  </View>
                  {activity.cashback && (
                    <View style={styles.cashbackBadge}>
                      <Text style={styles.cashbackText}>{activity.cashback}% CB</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Circles Tab */}
        {activeTab === 'circles' && (
          <Animated.View entering={FadeIn}>
            <ShoppingCircles circles={mockCircles} />

            {/* Show shared cart for first circle */}
            {mockCircles[0]?.sharedCart && mockCircles[0].sharedCart.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{mockCircles[0]?.name} - Shared Cart</Text>
                <SharedCart
                  items={mockCircles[0]?.sharedCart.map((item) => ({
                    ...item,
                    image: undefined,
                  })) ?? []}
                  totalSavings={mockCircles[0]?.savings || 0}
                  onCheckout={() => router.push('/checkout')}
                />
              </View>
            )}

            {/* Circle Members */}
            {mockCircles[0] && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Circle Members</Text>
                <CircleMembers
                  members={mockCircles[0]?.members?.map((m) => ({
                    ...m,
                    joinedAt: new Date().toISOString(),
                    role: m.role as 'owner' | 'member',
                  })) ?? []}
                  currentUserId="1"
                  onInvite={() => {}}
                  onRemoveMember={() => {}}
                />
              </View>
            )}
          </Animated.View>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <Animated.View entering={FadeIn}>
            <Text style={styles.sectionTitle}>Your Friends</Text>
            <Text style={styles.sectionSubtitle}>{mockFriends.length} connections</Text>

            {mockFriends.map((friend, index) => (
              <Animated.View
                key={friend.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
                style={styles.friendCard}
              >
                <View style={styles.friendAvatar}>
                  {friend.avatar ? (
                    <Image source={{ uri: friend.avatar }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>{friend.name.charAt(0)}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendMutual}>{friend.mutualFriends} mutual friends</Text>
                </View>
                <Pressable
                  style={[styles.followButton, friend.isFollowing && styles.followingButton]}
                  onPress={() => {}}
                >
                  <Text style={[styles.followText, friend.isFollowing && styles.followingText]}>
                    {friend.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  inviteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100] + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.brand.primary,
  },
  tabText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  activeTabText: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  activityCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  activityInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  activityUser: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  activityAction: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    marginTop: 2,
  },
  activityStore: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  cashbackBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  cashbackText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.success,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  friendAvatar: {
    marginRight: spacing.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  friendMutual: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  followingButton: {
    backgroundColor: colors.brand.primary + '10',
    borderColor: 'transparent',
  },
  followText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  followingText: {
    color: colors.text.secondary,
  },
});
