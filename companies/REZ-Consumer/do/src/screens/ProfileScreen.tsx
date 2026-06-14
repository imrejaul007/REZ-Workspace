import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Award,
  Calendar,
  Star,
  Gift,
  LogOut,
  ChevronLeft,
} from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore, useUIStore } from '@/stores';
import { rezApi, Booking } from '@/services/rezApi';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';

export const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { profile, karma, wallet, logout } = useUserStore();
  const { hapticEnabled, soundEnabled, setHapticEnabled, setSoundEnabled } = useUIStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await rezApi.getBookings();
      setBookings(data.slice(0, 3));
    } catch (error) {
      logger.error('Bookings load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await rezApi.logout();
            logout();
          },
        },
      ]
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return colors.karmaBronze;
      case 'silver': return colors.karmaSilver;
      case 'gold': return colors.karmaGold;
      case 'platinum': return colors.karmaPlatinum;
      default: return colors.karmaBronze;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundGrouped }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { padding: spacing.screenPadding }]}>
          <Text style={[styles.headerTitle, { color: colors.label, ...typography.displaySmall }]}>
            Profile
          </Text>
        </View>

        {/* Profile Card */}
        <Card variant="default" style={{ marginHorizontal: spacing.screenPadding, marginBottom: spacing.lg }}>
          <View style={styles.profileContent}>
            <TouchableOpacity onPress={() => router.push('/settings/edit-profile')}>
              <Avatar
                name={profile?.name || 'User'}
                source={profile?.avatar ? { uri: profile.avatar } : undefined}
                size="large"
              />
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <TouchableOpacity onPress={() => router.push('/settings/edit-profile')}>
                  <Text style={[styles.profileName, { color: colors.label, ...typography.titleMedium }]}>
                    {profile?.name || 'Guest User'}
                  </Text>
                </TouchableOpacity>
                {profile && (
                  <TouchableOpacity onPress={() => router.push('/settings/edit-profile')}>
                    <Text style={[styles.editButton, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.profilePhone, { color: colors.labelSecondary, ...typography.bodyMedium }]}>
                {profile?.phone || 'Sign in to sync your data'}
              </Text>
            </View>
            {!profile && (
              <TouchableOpacity
                style={[styles.signInButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.signInText, { color: colors.white }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Karma Badge */}
          {karma && (
            <View style={[styles.karmaBadge, { backgroundColor: getTierColor(karma.tier) + '20' }]}>
              <Award size={16} color={getTierColor(karma.tier)} />
              <Text style={[styles.karmaText, { color: getTierColor(karma.tier), ...typography.buttonSmall }]}>
                {karma.tier.charAt(0).toUpperCase() + karma.tier.slice(1)} Member
              </Text>
            </View>
          )}
        </Card>

        {/* Stats */}
        {profile && (
          <View style={[styles.statsRow, { marginHorizontal: spacing.screenPadding, marginBottom: spacing.lg }]}>
            <Card variant="filled" style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary, ...typography.displaySmall }]}>
                {wallet?.coins?.toLocaleString() || '0'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.labelSecondary, ...typography.captionMedium }]}>
                Coins
              </Text>
            </Card>
            <Card variant="filled" style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.gold, ...typography.displaySmall }]}>
                {karma?.points || '0'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.labelSecondary, ...typography.captionMedium }]}>
                Karma
              </Text>
            </Card>
            <Card variant="filled" style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.systemGreen, ...typography.displaySmall }]}>
                {bookings.length || '0'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.labelSecondary, ...typography.captionMedium }]}>
                Bookings
              </Text>
            </Card>
          </View>
        )}

        {/* Recent Bookings */}
        <View style={[styles.section, { marginBottom: spacing.lg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.label, ...typography.titleMedium }]}>
              Recent Bookings
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary, ...typography.buttonSmall }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={[
                  styles.bookingItem,
                  { backgroundColor: colors.backgroundElevated },
                ]}
              >
                <View style={[styles.bookingIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Calendar size={20} color={colors.primary} />
                </View>
                <View style={styles.bookingContent}>
                  <Text style={[styles.bookingName, { color: colors.label, ...typography.bodyMedium }]}>
                    {booking.entityName}
                  </Text>
                  <Text style={[styles.bookingDate, { color: colors.labelSecondary, ...typography.captionMedium }]}>
                    {formatDate(booking.dateTime)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.bookingStatus,
                    {
                      backgroundColor:
                        booking.status === 'confirmed' ? colors.systemGreen + '20' :
                        booking.status === 'pending' ? colors.systemOrange + '20' :
                        colors.gray + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bookingStatusText,
                      {
                        color:
                          booking.status === 'confirmed' ? colors.systemGreen :
                          booking.status === 'pending' ? colors.systemOrange :
                          colors.gray,
                      },
                    ]}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyBookings, { backgroundColor: colors.backgroundElevated }]}>
              <Text style={[styles.emptyText, { color: colors.labelSecondary, ...typography.bodyMedium }]}>
                No bookings yet
              </Text>
              <TouchableOpacity>
                <Text style={[styles.emptyLink, { color: colors.primary, ...typography.buttonSmall }]}>
                  Book your first experience
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={[styles.sectionTitle, { color: colors.label, ...typography.titleMedium, paddingHorizontal: spacing.screenPadding }]}>
            Settings
          </Text>

          {/* Preferences */}
          <Card variant="default" padding="none" style={{ marginHorizontal: spacing.screenPadding }}>
            <Text style={[styles.settingsHeader, { color: colors.labelSecondary, ...typography.captionMedium }]}>
              PREFERENCES
            </Text>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => router.push('/settings/notifications')}
            >
              <View style={styles.settingsLeft}>
                <Bell size={20} color={colors.label} />
                <Text style={[styles.settingsLabel, { color: colors.label, ...typography.bodyMedium }]}>
                  Notifications
                </Text>
              </View>
              <ChevronRight size={16} color={colors.labelTertiary} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <View style={styles.settingsItem}>
              <View style={styles.settingsLeft}>
                <Settings size={20} color={colors.label} />
                <Text style={[styles.settingsLabel, { color: colors.label, ...typography.bodyMedium }]}>
                  Haptic Feedback
                </Text>
              </View>
              <Switch
                value={hapticEnabled}
                onValueChange={setHapticEnabled}
                trackColor={{ false: colors.fill, true: colors.primary + '60' }}
                thumbColor={hapticEnabled ? colors.primary : colors.gray3}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <View style={styles.settingsItem}>
              <View style={styles.settingsLeft}>
                <Shield size={20} color={colors.label} />
                <Text style={[styles.settingsLabel, { color: colors.label, ...typography.bodyMedium }]}>
                  Sound Effects
                </Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: colors.fill, true: colors.primary + '60' }}
                thumbColor={soundEnabled ? colors.primary : colors.gray3}
              />
            </View>
          </Card>

          {/* Support */}
          <Card variant="default" padding="none" style={{ marginHorizontal: spacing.screenPadding, marginTop: spacing.md }}>
            <Text style={[styles.settingsHeader, { color: colors.labelSecondary, ...typography.captionMedium }]}>
              SUPPORT
            </Text>
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsLeft}>
                <HelpCircle size={20} color={colors.label} />
                <Text style={[styles.settingsLabel, { color: colors.label, ...typography.bodyMedium }]}>
                  Help & Support
                </Text>
              </View>
              <ChevronRight size={16} color={colors.labelTertiary} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsLeft}>
                <Shield size={20} color={colors.label} />
                <Text style={[styles.settingsLabel, { color: colors.label, ...typography.bodyMedium }]}>
                  Privacy Policy
                </Text>
              </View>
              <ChevronRight size={16} color={colors.labelTertiary} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsLeft}>
                <Star size={20} color={colors.label} />
                <Text style={[styles.settingsLabel, { color: colors.label, ...typography.bodyMedium }]}>
                  Rate Do
                </Text>
              </View>
              <ChevronRight size={16} color={colors.labelTertiary} />
            </TouchableOpacity>
          </Card>

          {/* Sign Out */}
          {profile && (
            <TouchableOpacity
              style={[styles.signOutButton, { marginHorizontal: spacing.screenPadding }]}
              onPress={handleLogout}
            >
              <LogOut size={20} color={colors.systemRed} />
              <Text style={[styles.signOutText, { color: colors.systemRed, ...typography.bodyMedium }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.labelTertiary, ...typography.captionSmall }]}>
            Do v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
  },
  headerTitle: {},
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {},
  editButton: {
    fontSize: 13,
    fontWeight: '500',
  },
  profilePhone: {
    marginTop: 2,
  },
  signInButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '600',
  },
  karmaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 16,
    gap: 6,
  },
  karmaText: {
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontWeight: '700',
  },
  statLabel: {
    marginTop: 4,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAll: {},
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookingContent: {
    flex: 1,
  },
  bookingName: {},
  bookingDate: {
    marginTop: 2,
  },
  bookingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookingStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBookings: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: 8,
  },
  emptyLink: {},
  settingsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: 'uppercase',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {},
  divider: {
    height: 0.5,
    marginLeft: 48,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  signOutText: {},
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {},
});
