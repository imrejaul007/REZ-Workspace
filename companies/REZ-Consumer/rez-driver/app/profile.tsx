import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverStore } from '../src/stores';
import { driverApi } from '../src/services/api';
import { Card, Button } from '../src/components';
import { formatRating, formatDate } from '../src/utils';

export default function ProfileScreen() {
  const {
    driver,
    setDriver,
    setDriverOnline,
    setDriverAvailable,
  } = useDriverStore();

  const [loading, setLoading] = useState(false);

  // Toggle online status
  const toggleOnline = async () => {
    if (!driver) return;

    setLoading(true);
    try {
      const response = await driverApi.setOnlineStatus(!driver.isOnline);
      if (response.success && response.data) {
        setDriverOnline(response.data.isOnline);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle availability
  const toggleAvailability = async () => {
    if (!driver) return;

    setLoading(true);
    try {
      const response = await driverApi.setAvailability(!driver.isAvailable);
      if (response.success && response.data) {
        setDriverAvailable(response.data.isAvailable);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!driver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {driver.avatar ? (
              <Image source={{ uri: driver.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {driver.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.statusDot,
                driver.isOnline ? styles.statusOnline : styles.statusOffline,
              ]}
            />
          </View>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.driverEmail}>{driver.email}</Text>

          {/* Rating and Deliveries */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatRating(driver.rating)}</Text>
              <View style={styles.ratingStars}>
                <Text style={styles.starIcon}>*</Text>
                <Text style={styles.ratingLabel}>Rating</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{driver.totalDeliveries.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {driver.activeVehicle?.type.charAt(0).toUpperCase() + driver.activeVehicle?.type.slice(1) || 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Vehicle</Text>
            </View>
          </View>
        </View>

        {/* Online Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {driver.isOnline ? 'Online' : 'Offline'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {driver.isOnline
                  ? driver.isAvailable
                    ? 'You are available to receive deliveries'
                    : 'You are not accepting deliveries'
                  : 'You are not visible to customers'}
              </Text>
            </View>
            <Switch
              value={driver.isOnline}
              onValueChange={toggleOnline}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#FFFFFF"
              disabled={loading}
            />
          </View>

          {driver.isOnline && (
            <View style={styles.availabilityRow}>
              <View style={styles.availabilityInfo}>
                <Text style={styles.availabilityTitle}>Auto-Accept</Text>
                <Text style={styles.availabilitySubtitle}>
                  Automatically accept delivery requests
                </Text>
              </View>
              <Switch
                value={driver.isAvailable}
                onValueChange={toggleAvailability}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={loading}
              />
            </View>
          )}
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity>
            <Card style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={styles.menuIcon}>
                  <Text style={styles.menuIconText}>D</Text>
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>Delivery History</Text>
                  <Text style={styles.menuSubtitle}>View all your past deliveries</Text>
                </View>
                <Text style={styles.menuArrow}>{'>'}</Text>
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity>
            <Card style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={styles.menuIcon}>
                  <Text style={styles.menuIconText}>D</Text>
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>Documents</Text>
                  <Text style={styles.menuSubtitle}>License, registration, insurance</Text>
                </View>
                <Text style={styles.menuArrow}>{'>'}</Text>
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity>
            <Card style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={styles.menuIcon}>
                  <Text style={styles.menuIconText}>B</Text>
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>Bank Account</Text>
                  <Text style={styles.menuSubtitle}>Manage payout method</Text>
                </View>
                <Text style={styles.menuArrow}>{'>'}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          <Card style={styles.vehicleCard}>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleLabel}>Vehicle Type</Text>
                <Text style={styles.vehicleValue}>
                  {driver.vehicleType.charAt(0).toUpperCase() + driver.vehicleType.slice(1)}
                </Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {driver.activeVehicle?.licensePlate && (
              <View style={[styles.vehicleRow, styles.vehicleRowBorder]}>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleLabel}>License Plate</Text>
                  <Text style={styles.vehicleValue}>{driver.activeVehicle?.licensePlate}</Text>
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <Card style={styles.accountCard}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Phone</Text>
              <Text style={styles.accountValue}>{driver.phone}</Text>
            </View>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Email</Text>
              <Text style={styles.accountValue}>{driver.email}</Text>
            </View>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Member Since</Text>
              <Text style={styles.accountValue}>{formatDate(driver.createdAt)}</Text>
            </View>
          </Card>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <TouchableOpacity>
            <Card style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={styles.menuIcon}>
                  <Text style={styles.menuIconText}>H</Text>
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>Help & Support</Text>
                  <Text style={styles.menuSubtitle}>Get help with your account</Text>
                </View>
                <Text style={styles.menuArrow}>{'>'}</Text>
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity>
            <Card style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={styles.menuIcon}>
                  <Text style={styles.menuIconText}>L</Text>
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>Legal</Text>
                  <Text style={styles.menuSubtitle}>Terms of service, privacy policy</Text>
                </View>
                <Text style={styles.menuArrow}>{'>'}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?')}
          variant="outline"
          size="large"
          fullWidth
          style={styles.signOutButton}
        />

        {/* App Version */}
        <Text style={styles.versionText}>REZ Driver v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  statusOnline: {
    backgroundColor: '#34C759',
  },
  statusOffline: {
    backgroundColor: '#FF3B30',
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 14,
    color: '#FF9500',
    marginRight: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flex: 1,
    marginRight: 16,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  availabilityInfo: {
    flex: 1,
    marginRight: 16,
  },
  availabilityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  availabilitySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#007AFF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  menuArrow: {
    fontSize: 18,
    color: '#C7C7CC',
  },
  vehicleCard: {},
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  vehicleRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 12,
    paddingTop: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
  },
  vehicleValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  editButton: {
    backgroundColor: '#007AFF15',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  accountCard: {},
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  accountLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  accountValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  signOutButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 32,
  },
});
