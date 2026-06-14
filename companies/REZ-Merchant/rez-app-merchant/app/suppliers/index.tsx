import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/DesignTokens';
import { suppliersService, Supplier } from '@/services/api/suppliers';
import { useAuth } from '@/contexts/AuthContext';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

export default function SuppliersScreen() {
  const { merchant } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    if (!merchant?.id) return;
    try {
      setLoading(true);
      const response = await suppliersService.listSuppliers(merchant.id);
      const supplierList = response.data?.items || [];
      setSuppliers(supplierList);
      setFilteredSuppliers(supplierList);
    } catch (error) {
      logger.error('Fetch error:', error);
      showAlert('Error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilteredSuppliers(
      suppliers.filter(
        (s) =>
          s.businessName.toLowerCase().includes(searchText.toLowerCase()) ||
          s.phone.includes(searchText)
      )
    );
  }, [searchText, suppliers]);

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
      <Animated.View entering={FadeIn} style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={styles.title}>Suppliers</Text>
          <TouchableOpacity onPress={() => router.push('/suppliers/add')} style={styles.addButton}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search suppliers..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown} style={styles.content}>
        {filteredSuppliers.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={filteredSuppliers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/suppliers/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.supplierIcon}>
                    <Ionicons name="business" size={20} color={Colors.primary[500]} />
                  </View>
                  <View style={styles.supplierInfo}>
                    <Text style={styles.businessName}>{item.businessName}</Text>
                    <Text style={styles.phone}>{item.phone}</Text>
                  </View>
                </View>
                {item.gstin && (
                  <View style={styles.gstinBadge}>
                    <Text style={styles.gstinText}>GST: {item.gstin}</Text>
                  </View>
                )}
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{item.productsCount} products</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>
              {searchText ? 'No suppliers found' : 'No suppliers yet'}
            </Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  listContent: { gap: Spacing.md, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  supplierIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  supplierInfo: { flex: 1 },
  businessName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  phone: { fontSize: Typography.fontSize.xs, color: Colors.text.tertiary },
  gstinBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.warning[50],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  gstinText: { fontSize: Typography.fontSize.xs, color: Colors.warning[700], fontWeight: '600' },
  meta: { flexDirection: 'row', gap: Spacing.md },
  metaText: { fontSize: Typography.fontSize.xs, color: Colors.text.tertiary },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
});
