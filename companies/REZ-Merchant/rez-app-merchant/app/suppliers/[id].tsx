import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/DesignTokens';
import { suppliersService, Supplier } from '@/services/api/suppliers';
import { showAlert } from '@/utils/alert';

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await suppliersService.getSupplier(id);
      setSupplier(response.data || null);
    } catch (error) {
      showAlert('Error', 'Failed to load supplier');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!supplier) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Supplier not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.title}>Supplier Details</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="business" size={40} color={Colors.primary[500]} />
          </View>
          <Text style={styles.businessName}>{supplier.businessName}</Text>
          {supplier.contactPerson && (
            <Text style={styles.contactPerson}>{supplier.contactPerson}</Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)} style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Linking.openURL(`tel:${supplier.phone}`)}
          >
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
          {supplier.email && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`mailto:${supplier.email}`)}
            >
              <Ionicons name="mail" size={20} color="white" />
              <Text style={styles.actionBtnText}>Email</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{supplier.phone}</Text>
          </View>
          {supplier.email && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{supplier.email}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>ADDRESS</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailValue}>{supplier.address}</Text>
            <Text style={styles.detailValue}>
              {supplier.city}, {supplier.state} {supplier.pincode}
            </Text>
          </View>
        </Animated.View>

        {supplier.gstin && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>TAX INFORMATION</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>GSTIN</Text>
              <Text style={styles.detailValue}>{supplier.gstin}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: Typography.fontSize.base, color: Colors.error[500] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  card: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  businessName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  contactPerson: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
  },
  actionBtnText: { color: 'white', fontSize: Typography.fontSize.sm, fontWeight: '600' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  detailValue: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.text.primary },
});
