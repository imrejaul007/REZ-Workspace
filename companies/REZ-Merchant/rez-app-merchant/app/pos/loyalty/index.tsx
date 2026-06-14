/**
 * Loyalty & Points System
 * Track customer points, tiers, and rewards
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignTokens';

const TIER_CONFIG = {
  Bronze: { min: 0, color: '#CD7F32', discount: 0 },
  Silver: { min: 500, color: '#C0C0C0', discount: 5 },
  Gold: { min: 2000, color: '#FFD700', discount: 10 },
  Platinum: { min: 5000, color: '#E5E4E2', discount: 15 },
  Diamond: { min: 10000, color: '#B9F2FF', discount: 20 },
};

const POINTS_PER_RUPEE = 1; // 1 point per ₹1 spent
const REDEMPTION_RATE = 100; // 100 points = ₹1

export default function LoyaltyScreen() {
  const [customers, setCustomers] = useState<unknown[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<unknown>(null);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [pointsAmount, setPointsAmount] = useState('');

  useEffect(() => {
    // Load customers with loyalty data
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    // Mock data - replace with API call
    setCustomers([
      { id: '1', name: 'Priya Sharma', phone: '9876543210', points: 2500, tier: 'Gold', visits: 15 },
      { id: '2', name: 'Anita Patel', phone: '9876543211', points: 800, tier: 'Silver', visits: 5 },
      { id: '3', name: 'Meera Singh', phone: '9876543212', points: 5200, tier: 'Platinum', visits: 28 },
      { id: '4', name: 'Kavita Reddy', phone: '9876543213', points: 200, tier: 'Bronze', visits: 2 },
    ]);
  };

  const getTier = (points: number) => {
    if (points >= 10000) return 'Diamond';
    if (points >= 5000) return 'Platinum';
    if (points >= 2000) return 'Gold';
    if (points >= 500) return 'Silver';
    return 'Bronze';
  };

  const getNextTier = (current: string) => {
    const tiers = Object.keys(TIER_CONFIG);
    const idx = tiers.indexOf(current);
    return idx < tiers.length - 1 ? tiers[idx + 1] : null;
  };

  const pointsToRupees = (points: number) => points / REDEMPTION_RATE;
  const rupeesToPoints = (rupees: number) => rupees * POINTS_PER_RUPEE;

  const addPoints = (customerId: string, amount: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const newPoints = customer.points + rupeesToPoints(amount);
    const newTier = getTier(newPoints);

    setCustomers(customers.map(c =>
      c.id === customerId
        ? { ...c, points: newPoints, tier: newTier, visits: c.visits + 1 }
        : c
    ));

    setShowAddPoints(false);
    setPointsAmount('');

    Alert.alert(
      'Points Added! 🎉',
      `₹${amount} → +${rupeesToPoints(amount)} points\nNew tier: ${newTier}`,
    );
  };

  const redeemPoints = (customerId: string, pointsToRedeem: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || customer.points < pointsToRedeem) {
      Alert.alert('Error', 'Not enough points');
      return;
    }

    const rupeeValue = pointsToRupees(pointsToRedeem);

    Alert.alert(
      'Redeem Points',
      `Use ${pointsToRedeem} points = ₹${rupeeValue.toFixed(0)} discount?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => {
            setCustomers(customers.map(c =>
              c.id === customerId
                ? { ...c, points: c.points - pointsToRedeem, tier: getTier(c.points - pointsToRedeem) }
                : c
            ));
            Alert.alert('Success', `₹${rupeeValue.toFixed(0)} redeemed!`);
          },
        },
      ]
    );
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const renderCustomer = ({ item }: { item: unknown }) => {
    const tierInfo = TIER_CONFIG[item.tier as keyof typeof TIER_CONFIG];
    const nextTier = getNextTier(item.tier);
    const pointsToNext = nextTier ? TIER_CONFIG[nextTier as keyof typeof TIER_CONFIG].min - item.points : 0;

    return (
      <TouchableOpacity
        style={styles.customerCard}
        onPress={() => setSelectedCustomer(item)}
      >
        <View style={[styles.tierBadge, { backgroundColor: tierInfo.color }]}>
          <Text style={styles.tierText}>{item.tier}</Text>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerPhone}>{item.phone}</Text>
        </View>

        <View style={styles.pointsSection}>
          <Text style={styles.pointsValue}>{item.points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>points</Text>
        </View>

        {nextTier && (
          <View style={styles.nextTierHint}>
            <Text style={styles.nextTierText}>
              {pointsToNext.toLocaleString()} more to {nextTier}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCustomerDetail = () => {
    if (!selectedCustomer) return null;

    const tierInfo = TIER_CONFIG[selectedCustomer.tier as keyof typeof TIER_CONFIG];
    const rupeeBalance = pointsToRupees(selectedCustomer.points);

    return (
      <View style={styles.detailModal}>
        <View style={styles.detailHeader}>
          <View style={[styles.tierBadgeLarge, { backgroundColor: tierInfo.color }]}>
            <Text style={styles.tierTextLarge}>{selectedCustomer.tier}</Text>
          </View>
          <Text style={styles.detailName}>{selectedCustomer.name}</Text>
          <Text style={styles.detailPhone}>{selectedCustomer.phone}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{selectedCustomer.points.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{rupeeBalance.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Redeemable</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{selectedCustomer.visits}</Text>
            <Text style={styles.statLabel}>Visits</Text>
          </View>
        </View>

        <View style={styles.tierBenefits}>
          <Text style={styles.benefitsTitle}>{selectedCustomer.tier} Benefits:</Text>
          <Text style={styles.benefitsText}>
            • {tierInfo.discount}% discount on all services
          </Text>
        </View>

        {showAddPoints ? (
          <View style={styles.addPointsSection}>
            <Text style={styles.addPointsTitle}>Add Points (₹ spent)</Text>
            <TextInput
              style={styles.pointsInput}
              value={pointsAmount}
              onChangeText={setPointsAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
            />
            <View style={styles.addPointsButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddPoints(false);
                  setPointsAmount('');
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addPoints(selectedCustomer.id, parseInt(pointsAmount || '0'))}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowAddPoints(true)}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Add Points</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => redeemPoints(selectedCustomer.id, Math.min(selectedCustomer.points, 500))}
            >
              <Ionicons name="gift" size={20} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Redeem 500 pts</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loyalty & Points</Text>
        <View style={styles.tierLegend}>
          {Object.entries(TIER_CONFIG).map(([tier, config]) => (
            <View key={tier} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: config.color }]} />
              <Text style={styles.legendText}>{tier}</Text>
            </View>
          ))}
        </View>
      </View>

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search customer..."
        placeholderTextColor={Colors.textSecondary}
      />

      <FlatList
        data={filteredCustomers}
        keyExtractor={item => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.list}
      />

      {selectedCustomer && renderCustomerDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.md },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  tierLegend: { flexDirection: 'row', marginTop: Spacing.sm, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: Spacing.md },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 4 },
  legendText: { fontSize: 12, color: Colors.textSecondary },
  search: {
    margin: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    color: Colors.text,
  },
  list: { padding: Spacing.md },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tierText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  customerInfo: { flex: 1, marginLeft: Spacing.sm },
  customerName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  customerPhone: { fontSize: 12, color: Colors.textSecondary },
  pointsSection: { alignItems: 'flex-end' },
  pointsValue: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  pointsLabel: { fontSize: 10, color: Colors.textSecondary },
  nextTierHint: {
    position: 'absolute',
    bottom: 4,
    left: 60,
  },
  nextTierText: { fontSize: 10, color: Colors.primary },
  detailModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    elevation: 10,
  },
  detailHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  tierBadgeLarge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  tierTextLarge: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  detailName: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginTop: Spacing.sm },
  detailPhone: { color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  tierBenefits: { marginBottom: Spacing.lg },
  benefitsTitle: { fontWeight: '600', marginBottom: 4 },
  benefitsText: { fontSize: 14, color: Colors.textSecondary },
  actionButtons: { flexDirection: 'row', gap: Spacing.sm },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  primaryButtonText: { color: 'white', fontWeight: '600' },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  secondaryButtonText: { color: Colors.primary, fontWeight: '600' },
  addPointsSection: { gap: Spacing.sm },
  addPointsTitle: { fontWeight: '600' },
  pointsInput: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    fontSize: 18,
  },
  addPointsButtons: { flexDirection: 'row', gap: Spacing.sm },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  addButton: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  addButtonText: { color: 'white', fontWeight: '600' },
});
