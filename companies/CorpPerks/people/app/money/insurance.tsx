// ==========================================
// MyTalent - Insurance Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, formatCurrency } from '../../src/components/Badge';
import { Card, Button } from '../../src/components';
import { getInsuranceProducts } from '../../src/services/ridzaService';

export default function InsuranceScreen() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const result = await getInsuranceProducts();
    if (result.success && result.products) {
      setProducts(result.products);
    }
  };

  const handleApply = (product: any) => {
    Alert.alert(
      'Apply for Insurance',
      `Apply for ${product.name}?\n\nCoverage: ${formatCurrency(product.coverage)}\nPremium: ${formatCurrency(product.premium)}/month`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => Alert.alert('Coming Soon', 'Application will open shortly.') },
      ]
    );
  };

  const healthProducts = products.filter((p) => p.type === 'health');
  const termProducts = products.filter((p) => p.type === 'term');

  return (
    <ScrollView style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>🏥</Text>
          <Text style={styles.statValue}>Active</Text>
          <Text style={styles.statLabel}>Health Cover</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>🛡️</Text>
          <Text style={styles.statValue}>Active</Text>
          <Text style={styles.statLabel}>Life Cover</Text>
        </Card>
      </View>

      {/* Health Insurance */}
      <Text style={styles.sectionTitle}>Health Insurance</Text>
      {healthProducts.length > 0 ? (
        healthProducts.map((product) => (
          <Card key={product.id} style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={[styles.productIcon, { backgroundColor: Colors.errorLight }]}>
                <Text style={styles.productIconText}>🏥</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productProvider}>{product.provider}</Text>
              </View>
            </View>
            <View style={styles.productDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Coverage</Text>
                <Text style={styles.detailValue}>{formatCurrency(product.coverage)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Premium</Text>
                <Text style={styles.detailValue}>{formatCurrency(product.premium)}/mo</Text>
              </View>
            </View>
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Key Features</Text>
              {product.features.map((feature: string, index: number) => (
                <View key={index} style={styles.featureTag}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <Button
              title="Buy Now"
              variant="primary"
              fullWidth
              onPress={() => handleApply(product)}
              style={styles.applyBtn}
            />
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Health insurance products will appear here</Text>
        </Card>
      )}

      {/* Term Insurance */}
      <Text style={styles.sectionTitle}>Term Life Insurance</Text>
      {termProducts.length > 0 ? (
        termProducts.map((product) => (
          <Card key={product.id} style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={[styles.productIcon, { backgroundColor: Colors.successLight }]}>
                <Text style={styles.productIconText}>🛡️</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productProvider}>{product.provider}</Text>
              </View>
            </View>
            <View style={styles.productDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Coverage</Text>
                <Text style={styles.detailValue}>{formatCurrency(product.coverage)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Premium</Text>
                <Text style={styles.detailValue}>{formatCurrency(product.premium)}/mo</Text>
              </View>
            </View>
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Key Features</Text>
              {product.features.map((feature: string, index: number) => (
                <View key={index} style={styles.featureTag}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <Button
              title="Buy Now"
              variant="primary"
              fullWidth
              onPress={() => handleApply(product)}
              style={styles.applyBtn}
            />
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Term insurance products will appear here</Text>
        </Card>
      )}

      {/* Comparison CTA */}
      <Card style={styles.compareCard}>
        <Text style={styles.compareIcon}>📊</Text>
        <Text style={styles.compareTitle}>Not sure which insurance is right for you?</Text>
        <Text style={styles.compareDesc}>Get a free consultation with our insurance advisor</Text>
        <Button
          title="Book Consultation"
          variant="outline"
          fullWidth
          onPress={() => Alert.alert('Coming Soon', 'Consultation booking will be available soon!')}
          style={styles.consultBtn}
        />
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statsRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  productCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIconText: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  productName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  productProvider: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  productDetails: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  featuresSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  featuresTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureIcon: {
    fontSize: FontSize.sm,
    color: Colors.success,
    marginRight: Spacing.xs,
  },
  featureText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  applyBtn: {
    marginTop: Spacing.md,
  },
  emptyCard: {
    marginHorizontal: Spacing.md,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  compareCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.secondary,
  },
  compareIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  compareTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  compareDesc: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  consultBtn: {
    marginTop: Spacing.md,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
