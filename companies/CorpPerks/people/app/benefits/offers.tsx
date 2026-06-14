// ==========================================
// MyTalent - Partner Offers Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, formatDate } from '../../src/components/Badge';
import { Card, Button } from '../../src/components';
import { mockPartnerOffers } from '../../src/data/mockData';
import { getPartnerOffers, claimOffer } from '../../src/services/benefitsService';

export default function OffersScreen() {
  const [offers, setOffers] = useState(mockPartnerOffers);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    const result = await getPartnerOffers();
    if (result.success && result.offers) {
      setOffers(result.offers);
    }
  };

  const handleClaim = async (offerId: string, brand: string) => {
    const result = await claimOffer('EMP001', offerId);
    if (result.success) {
      Alert.alert(
        'Offer Claimed!',
        `You've claimed the ${brand} offer.${result.voucherCode ? `\n\nVoucher Code: ${result.voucherCode}` : ''}`,
        [{ text: 'OK' }]
      );
    }
  };

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'food', label: 'Food' },
    { key: 'shopping', label: 'Shopping' },
    { key: 'health', label: 'Health' },
    { key: 'learning', label: 'Learning' },
    { key: 'travel', label: 'Travel' },
  ];

  const filteredOffers = selectedCategory === 'all'
    ? offers
    : offers.filter((o) => o.category === selectedCategory);

  return (
    <ScrollView style={styles.container}>
      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryBtn, selectedCategory === cat.key && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat.key && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Offers List */}
      {filteredOffers.map((offer) => (
        <Card key={offer.id} style={styles.offerCard}>
          <View style={styles.offerHeader}>
            <Text style={styles.offerIcon}>{offer.brandIcon}</Text>
            <View style={styles.offerInfo}>
              <Text style={styles.offerBrand}>{offer.brand}</Text>
              <Text style={styles.offerDiscount}>{offer.discount}</Text>
            </View>
            <View style={styles.expiryBadge}>
              <Text style={styles.expiryText}>Expires: {formatDate(offer.expiry)}</Text>
            </View>
          </View>
          {offer.description && (
            <Text style={styles.offerDesc}>{offer.description}</Text>
          )}
          <View style={styles.offerActions}>
            <Button
              title="Claim Offer"
              variant="primary"
              size="sm"
              onPress={() => handleClaim(offer.id, offer.brand)}
            />
            {offer.claimUrl && (
              <Button
                title="View Details"
                variant="ghost"
                size="sm"
                onPress={() => Alert.alert('External Link', `Would open: ${offer.claimUrl}`)}
              />
            )}
          </View>
        </Card>
      ))}

      {filteredOffers.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No offers available in this category</Text>
        </Card>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  categoriesScroll: {
    marginTop: Spacing.md,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: Colors.textInverse,
  },
  offerCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerIcon: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  offerInfo: {
    flex: 1,
  },
  offerBrand: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  offerDiscount: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    marginTop: 4,
  },
  expiryBadge: {
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  expiryText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  offerDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  offerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  emptyCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
