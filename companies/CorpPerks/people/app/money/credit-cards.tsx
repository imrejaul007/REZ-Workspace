// ==========================================
// MyTalent - Credit Cards Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card, Button } from '../../src/components';
import { getRecommendedCreditCards } from '../../src/services/ridzaService';

export default function CreditCardsScreen() {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const result = await getRecommendedCreditCards('EMP001');
    if (result.success && result.cards) {
      setCards(result.cards);
    }
  };

  const handleApply = (applyUrl: string, cardName: string) => {
    Alert.alert(
      'Apply for Card',
      `You will be redirected to apply for ${cardName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => Alert.alert('Coming Soon', 'Application will open in browser.') },
      ]
    );
  };

  const cashbackCards = cards.filter((c) => c.cashbackRate >= 5);
  const travelCards = cards.filter((c) => c.features.some((f: string) => f.toLowerCase().includes('travel') || f.toLowerCase().includes('lounge')));

  return (
    <ScrollView style={styles.container}>
      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{cards.length}</Text>
          <Text style={styles.statLabel}>Available Cards</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>Up to 10%</Text>
          <Text style={styles.statLabel}>Cashback</Text>
        </Card>
      </View>

      {/* Cashback Cards */}
      <Text style={styles.sectionTitle}>Cashback Cards</Text>
      {cashbackCards.length > 0 ? (
        cashbackCards.map((card) => (
          <Card key={card.id} style={styles.cardItem}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>💳</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.cardBank}>{card.bank}</Text>
              </View>
              <View style={styles.cashbackBadge}>
                <Text style={styles.cashbackValue}>{card.cashbackRate}%</Text>
                <Text style={styles.cashbackLabel}>Cashback</Text>
              </View>
            </View>
            <View style={styles.cardFeatures}>
              {card.features.slice(0, 3).map((feature: string, index: number) => (
                <View key={index} style={styles.featureTag}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.feeLabel}>Annual Fee</Text>
                <Text style={styles.feeValue}>{card.annualFee === 0 ? 'FREE' : `₹${card.annualFee}`}</Text>
              </View>
              <View>
                <Text style={styles.eligibilityLabel}>Eligibility</Text>
                <Text style={styles.eligibilityValue}>{card.eligibility}</Text>
              </View>
            </View>
            <Button
              title="Apply Now"
              variant="primary"
              fullWidth
              onPress={() => handleApply(card.applyUrl, card.name)}
              style={styles.applyBtn}
            />
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No cashback cards available at this time</Text>
        </Card>
      )}

      {/* Travel Cards */}
      <Text style={styles.sectionTitle}>Travel Cards</Text>
      {travelCards.length > 0 ? (
        travelCards.map((card) => (
          <Card key={card.id} style={styles.cardItem}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: Colors.secondaryLight }]}>
                <Text style={styles.cardIconText}>✈️</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.cardBank}>{card.bank}</Text>
              </View>
            </View>
            <View style={styles.cardFeatures}>
              {card.features.map((feature: string, index: number) => (
                <View key={index} style={styles.featureTag}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.feeLabel}>Annual Fee</Text>
                <Text style={styles.feeValue}>{card.annualFee === 0 ? 'FREE' : `₹${card.annualFee}`}</Text>
              </View>
            </View>
            <Button
              title="Apply Now"
              variant="primary"
              fullWidth
              onPress={() => handleApply(card.applyUrl, card.name)}
              style={styles.applyBtn}
            />
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No travel cards available at this time</Text>
        </Card>
      )}

      {/* All Cards */}
      <Text style={styles.sectionTitle}>All Recommended Cards</Text>
      {cards.map((card) => (
        <Card key={card.id} style={styles.cardItem}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>💳</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{card.name}</Text>
              <Text style={styles.cardBank}>{card.bank}</Text>
            </View>
          </View>
          <View style={styles.cardFeatures}>
            <View style={styles.featureTag}>
              <Text style={styles.featureText}>{card.cashbackRate}% Cashback</Text>
            </View>
            <View style={styles.featureTag}>
              <Text style={styles.featureText}>{card.rewardRate}x Rewards</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.feeValue}>Annual Fee: {card.annualFee === 0 ? 'FREE' : `₹${card.annualFee}`}</Text>
          </View>
          <Button
            title="Compare & Apply"
            variant="outline"
            fullWidth
            onPress={() => handleApply(card.applyUrl, card.name)}
            style={styles.applyBtn}
          />
        </Card>
      ))}

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
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardItem: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardBank: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cashbackBadge: {
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  cashbackValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  cashbackLabel: {
    fontSize: FontSize.xs,
    color: Colors.success,
  },
  cardFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  featureTag: {
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  featureText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  feeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  feeValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  eligibilityLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  eligibilityValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginTop: 2,
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
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
