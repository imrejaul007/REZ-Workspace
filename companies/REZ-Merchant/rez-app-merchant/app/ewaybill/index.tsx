/**
 * E-waybill Screen
 *
 * Generate and manage e-waybills for GST compliance
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import {
  getEwaybills,
  generateEwaybill,
  cancelEwaybill,
  Ewaybill,
  EwaybillStatus,
} from '@/services/api/b2bApi';

type TabType = 'all' | 'generated' | 'in_transit' | 'delivered' | 'cancelled';

export default function EwaybillScreen() {
  const { activeStore } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [ewaybills, setEwaybills] = useState<Ewaybill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  const fetchEwaybills = useCallback(async () => {
    if (!activeStore?._id) return;
    try {
      const status = activeTab === 'all' ? undefined : activeTab as EwaybillStatus;
      const response = await getEwaybills(activeStore._id, { status });
      setEwaybills(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load e-waybills');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStore?._id, activeTab]);

  useEffect(() => {
    fetchEwaybills();
  }, [fetchEwaybills]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEwaybills();
  };

  const handleCancel = async (ewaybillNumber: string) => {
    Alert.alert(
      'Cancel E-waybill',
      'Are you sure you want to cancel this e-waybill?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelEwaybill(ewaybillNumber, 'User cancelled', '1');
              Alert.alert('Success', 'E-waybill cancelled');
              fetchEwaybills();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel e-waybill');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: EwaybillStatus) => {
    switch (status) {
      case 'generated': return Colors.blue[500];
      case 'in_transit': return Colors.orange[500];
      case 'delivered': return Colors.green[500];
      case 'cancelled': return Colors.red[500];
      case 'expired': return Colors.gray[500];
      default: return Colors.gray[500];
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'generated', label: 'Active' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeIn} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>E-Waybill</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowGenerate(true)}>
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{ewaybills.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.green[500] }]}>
              {ewaybills.filter((e) => e.status === 'generated').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.orange[500] }]}>
              {ewaybills.filter((e) => e.status === 'in_transit').length}
            </Text>
            <Text style={styles.statLabel}>In Transit</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* E-waybill List */}
        <ScrollView
          style={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {ewaybills.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={Colors.gray[300]} />
              <Text style={styles.emptyTitle}>No E-waybills</Text>
              <Text style={styles.emptyText}>Generate e-waybills for your purchase orders</Text>
            </View>
          ) : (
            ewaybills.map((ewaybill) => (
              <Animated.View key={ewaybill.id} entering={FadeInDown}>
                <View style={styles.ewaybillCard}>
                  <View style={styles.ewaybillHeader}>
                    <View>
                      <Text style={styles.ewaybillNumber}>{ewaybill.ewaybillNumber}</Text>
                      <Text style={styles.ewaybillDate}>{formatDate(ewaybill.ewaybillDate)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ewaybill.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(ewaybill.status) }]}>
                        {ewaybill.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ewaybillRoute}>
                    <View style={styles.routePoint}>
                      <View style={[styles.routeDot, { backgroundColor: Colors.blue[500] }]} />
                      <View>
                        <Text style={styles.routeLabel}>From</Text>
                        <Text style={styles.routeName}>{ewaybill.fromName}</Text>
                        {ewaybill.fromGstin && <Text style={styles.routeGstin}>GSTIN: {ewaybill.fromGstin}</Text>}
                      </View>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                      <View style={[styles.routeDot, { backgroundColor: Colors.green[500] }]} />
                      <View>
                        <Text style={styles.routeLabel}>To</Text>
                        <Text style={styles.routeName}>{ewaybill.toName}</Text>
                        {ewaybill.toGstin && <Text style={styles.routeGstin}>GSTIN: {ewaybill.toGstin}</Text>}
                      </View>
                    </View>
                  </View>

                  <View style={styles.ewaybillFooter}>
                    <View style={styles.footerItem}>
                      <Text style={styles.footerLabel}>Amount</Text>
                      <Text style={styles.footerValue}>{formatCurrency(ewaybill.totalAmount)}</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <Text style={styles.footerLabel}>Distance</Text>
                      <Text style={styles.footerValue}>{ewaybill.distance} km</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <Text style={styles.footerLabel}>Valid Until</Text>
                      <Text style={styles.footerValue}>{formatDate(ewaybill.validUntil)}</Text>
                    </View>
                  </View>

                  {ewaybill.vehicleNumber && (
                    <View style={styles.vehicleInfo}>
                      <Ionicons name="car" size={16} color={Colors.gray[500]} />
                      <Text style={styles.vehicleText}>Vehicle: {ewaybill.vehicleNumber}</Text>
                    </View>
                  )}

                  {ewaybill.status === 'generated' && (
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="create-outline" size={18} color={Colors.blue[500]} />
                        <Text style={styles.actionText}>Update Vehicle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancel(ewaybill.ewaybillNumber)}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={Colors.red[500]} />
                        <Text style={[styles.actionText, { color: Colors.red[500] }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray[50] },
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.white },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray[900] },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[500], justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: Colors.gray[900] },
  statLabel: { fontSize: 12, color: Colors.gray[500], marginTop: 4 },
  tabsScroll: { backgroundColor: Colors.white, maxHeight: 50 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginRight: 8, backgroundColor: Colors.gray[100] },
  tabActive: { backgroundColor: Colors.primary[500] },
  tabText: { fontSize: 13, color: Colors.gray[600] },
  tabTextActive: { color: Colors.white, fontWeight: '600' },
  listContainer: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.gray[700], marginTop: 16 },
  emptyText: { fontSize: 14, color: Colors.gray[500], marginTop: 8 },
  ewaybillCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  ewaybillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  ewaybillNumber: { fontSize: 16, fontWeight: '700', color: Colors.gray[900] },
  ewaybillDate: { fontSize: 12, color: Colors.gray[500], marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  ewaybillRoute: { marginBottom: 16 },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  routeLine: { width: 2, height: 24, backgroundColor: Colors.gray[200], marginLeft: 5, marginVertical: 4 },
  routeLabel: { fontSize: 11, color: Colors.gray[500], textTransform: 'uppercase' },
  routeName: { fontSize: 14, fontWeight: '500', color: Colors.gray[800] },
  routeGstin: { fontSize: 11, color: Colors.gray[400] },
  ewaybillFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  footerItem: { alignItems: 'center' },
  footerLabel: { fontSize: 11, color: Colors.gray[500] },
  footerValue: { fontSize: 14, fontWeight: '600', color: Colors.gray[800], marginTop: 2 },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 8, backgroundColor: Colors.gray[50], borderRadius: 8, gap: 8 },
  vehicleText: { fontSize: 13, color: Colors.gray[600] },
  actions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.gray[200], gap: 6 },
  cancelButton: { borderColor: Colors.red[200] },
  actionText: { fontSize: 13, fontWeight: '500', color: Colors.blue[500] },
});
