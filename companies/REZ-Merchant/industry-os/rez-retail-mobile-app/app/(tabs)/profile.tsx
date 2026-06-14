import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Settings, CreditCard, Heart, MapPin, Bell, LogOut, ChevronRight, Award, Truck, HelpCircle, Shield } from '@expo/vector-icons';

interface MenuItem {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
}

export default function ProfileScreen() {
  const menuItems: MenuItem[] = [
    { icon: <Award name="award" size={22} color="#f59e0b" />, title: 'REZ Rewards', subtitle: '250 points available', badge: 'Gold' },
    { icon: <CreditCard name="credit-card" size={22} color="#2563eb" />, title: 'Payment Methods', subtitle: 'Add cards for faster checkout' },
    { icon: <MapPin name="map-pin" size={22} color="#22c55e" />, title: 'Saved Addresses', subtitle: '2 addresses' },
    { icon: <Heart name="heart" size={22} color="#ec4899" />, title: 'Wishlist', subtitle: '5 items' },
    { icon: <Truck name="truck" size={22} color="#8b5cf6" />, title: 'My Orders', subtitle: 'Track your orders' },
    { icon: <Bell name="bell" size={22} color="#6366f1" />, title: 'Notifications', subtitle: 'Manage alerts' },
    { icon: <Shield name="shield" size={22} color="#14b8a6" />, title: 'Privacy & Security', subtitle: 'Password, PIN' },
    { icon: <HelpCircle name="help-circle" size={22} color="#f97316" />, title: 'Help & Support', subtitle: 'FAQs, Contact us' },
    { icon: <Settings name="settings" size={22} color="#64748b" />, title: 'Settings', subtitle: 'App preferences' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>PS</Text>
          </View>
          <View style={styles.tierBadge}>
            <Award name="award" size={12} color="#f59e0b" />
            <Text style={styles.tierText}>Gold</Text>
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Priya Sharma</Text>
          <Text style={styles.userEmail}>priya.sharma@email.com</Text>
          <Text style={styles.userPhone}>+91 98765 43210</Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Points Card */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsMain}>
          <Text style={styles.pointsValue}>250</Text>
          <Text style={styles.pointsLabel}>Points</Text>
        </View>
        <View style={styles.pointsDivider} />
        <View style={styles.pointsSecondary}>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsItemValue}>₹125</Text>
            <Text style={styles.pointsItemLabel}>Worth</Text>
          </View>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsItemValue}>₹1250</Text>
            <Text style={styles.pointsItemLabel}>Total Spent</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.redeemButton}>
          <Text style={styles.redeemButtonText}>Redeem</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Wishlist</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>Addresses</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <View style={styles.menuIcon}>{item.icon}</View>
            <View style={styles.menuContent}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.badge && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              {item.subtitle && (
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              )}
            </View>
            <ChevronRight name="chevron-right" size={20} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton}>
        <LogOut name="log-out" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.version}>REZ Retail v1.0.0</Text>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tierBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b45309',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  editButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  pointsCard: {
    marginHorizontal: 20,
    marginTop: -20,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pointsMain: {
    alignItems: 'center',
    paddingRight: 20,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#bfdbfe',
  },
  pointsDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: 20,
  },
  pointsSecondary: {
    flex: 1,
  },
  pointsItem: {
    marginBottom: 8,
  },
  pointsItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  pointsItemLabel: {
    fontSize: 11,
    color: '#bfdbfe',
  },
  redeemButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  menuSection: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  menuBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b45309',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
