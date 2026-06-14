// ==========================================
// MyTalent - Properties Screen
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, formatCurrency } from '../../src/components/Badge';
import { Card, ProgressRing } from '../../src/components';
import { mockWealthData } from '../../src/data/mockData';

export default function PropertiesScreen() {
  const properties = mockWealthData.properties;
  const totalValue = properties.reduce((sum, p) => sum + p.currentValue, 0);
  const totalGain = properties.reduce((sum, p) => sum + (p.currentValue - p.purchaseValue), 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'apartment': return '🏢';
      case 'house': return '🏠';
      case 'land': return '🌍';
      case 'commercial': return '🏪';
      default: return '🏗️';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryLabel}>Total Property Value</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>
          </View>
          <View style={styles.gainContainer}>
            <Text style={styles.gainValue}>+{formatCurrency(totalGain)}</Text>
            <Text style={styles.gainLabel}>Total Gain</Text>
          </View>
        </View>
      </Card>

      {/* Properties List */}
      {properties.map((property) => {
        const gain = property.currentValue - property.purchaseValue;
        const gainPercent = ((gain / property.purchaseValue) * 100).toFixed(1);
        const ownershipValue = (property.currentValue * property.ownership) / 100;

        return (
          <Card key={property.id} style={styles.propertyCard}>
            <View style={styles.propertyHeader}>
              <View style={styles.propertyIcon}>
                <Text style={styles.propertyEmoji}>{getTypeIcon(property.type)}</Text>
              </View>
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyName}>{property.name}</Text>
                <Text style={styles.propertyType}>
                  {property.type.charAt(0).toUpperCase() + property.type.slice(1)} • {property.ownership}% ownership
                </Text>
              </View>
            </View>

            <View style={styles.propertyAddress}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={styles.addressText}>{property.address}</Text>
            </View>

            <View style={styles.propertyValues}>
              <View style={styles.valueItem}>
                <Text style={styles.valueLabel}>Purchase Value</Text>
                <Text style={styles.valueAmount}>{formatCurrency(property.purchaseValue)}</Text>
              </View>
              <View style={styles.valueItem}>
                <Text style={styles.valueLabel}>Current Value</Text>
                <Text style={styles.valueAmount}>{formatCurrency(property.currentValue)}</Text>
              </View>
              <View style={styles.valueItem}>
                <Text style={styles.valueLabel}>Your Share</Text>
                <Text style={[styles.valueAmount, { color: Colors.primary }]}>
                  {formatCurrency(ownershipValue)}
                </Text>
              </View>
            </View>

            <View style={styles.gainSection}>
              <View style={[styles.gainBadge, { backgroundColor: gain >= 0 ? `${Colors.success}20` : `${Colors.error}20` }]}>
                <Text style={[styles.gainBadgeText, { color: gain >= 0 ? Colors.success : Colors.error }]}>
                  {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({gainPercent}%)
                </Text>
              </View>
            </View>

            {property.rentalIncome && (
              <View style={styles.rentalSection}>
                <View style={styles.rentalItem}>
                  <Text style={styles.rentalLabel}>Monthly Rental</Text>
                  <Text style={styles.rentalValue}>{formatCurrency(property.rentalIncome)}</Text>
                </View>
                {property.emi && (
                  <>
                    <View style={styles.rentalItem}>
                      <Text style={styles.rentalLabel}>EMI</Text>
                      <Text style={[styles.rentalValue, { color: Colors.error }]}>
                        {formatCurrency(property.emi)}
                      </Text>
                    </View>
                    {property.emiRemaining && (
                      <View style={styles.rentalItem}>
                        <Text style={styles.rentalLabel}>EMIs Remaining</Text>
                        <Text style={styles.rentalValue}>{property.emiRemaining} months</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </Card>
        );
      })}

      {/* Integration Card */}
      <Card style={styles.integrationCard}>
        <View style={styles.integrationHeader}>
          <Text style={styles.integrationIcon}>🔗</Text>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationTitle}>RisnaEstate Integration</Text>
            <Text style={styles.integrationText}>
              Properties automatically synced from your RisnaEstate account
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.syncButton}>
          <Text style={styles.syncButtonText}>Sync Properties</Text>
        </TouchableOpacity>
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
  summaryCard: {
    margin: Spacing.md,
    backgroundColor: Colors.success,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginTop: 4,
  },
  gainContainer: {
    alignItems: 'flex-end',
  },
  gainValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  gainLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  propertyCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  propertyIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  propertyEmoji: {
    fontSize: 28,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  propertyType: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  propertyAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.md,
  },
  addressIcon: {
    fontSize: FontSize.sm,
    marginRight: Spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  propertyValues: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  valueItem: {
    flex: 1,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  valueAmount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  gainSection: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  gainBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  gainBadgeText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  rentalSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  rentalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  rentalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  rentalValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  integrationCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundDark,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  integrationIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  integrationText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  syncButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
