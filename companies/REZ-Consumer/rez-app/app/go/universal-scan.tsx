'use client';

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';

interface UniversalScanResult {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  currentPrice?: number;
  mrp?: number;
  lowestPrice?: number;
  healthScore?: number;
  nutrition?: Record<string, number>;
  ingredients?: string[];
  allergens?: { contains?: string[] };
  authentic: boolean;
  authenticityScore?: number;
  aiSummary?: string;
  nearbyOffers?: Array<{
    storeId: string;
    storeName: string;
    price: number;
    cashback: number;
    distance: string;
  }>;
  alternatives?: Array<{
    productId: string;
    name: string;
    price: number;
    savings: number;
  }>;
}

export default function UniversalScanScreen() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<UniversalScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');

  const handleScan = useCallback(async (code?: string) => {
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      // In production, call the API
      // const res = await fetch('/api/universal/scan', {
      //   method: 'POST',
      //   body: JSON.stringify({ barcode: code || barcode })
      // });
      // const data = await res.json();

      // Mock result
      const mockResult: UniversalScanResult = {
        barcode: code || barcode || '8901030123457',
        name: 'Maggi 2-Minute Noodles Masala',
        brand: 'Nestle',
        category: 'Instant Food',
        currentPrice: 12,
        mrp: 14,
        lowestPrice: 10,
        healthScore: 45,
        nutrition: {
          calories: 180,
          protein: 5,
          carbs: 25,
          fat: 7,
          sodium: 980,
        },
        ingredients: ['Refined Wheat Flour', 'Vegetable Oil', 'Salt', 'Spices', 'Sugar', 'Flavor Enhancers'],
        allergens: { contains: ['Wheat', 'Gluten'] },
        authentic: true,
        authenticityScore: 95,
        aiSummary: 'A popular instant noodle brand. High in sodium (980mg). Use in moderation as part of a balanced diet.',
        nearbyOffers: [
          { storeId: 'S1', storeName: 'BigBasket', price: 11, cashback: 0.5, distance: '< 1 km' },
          { storeId: 'S2', storeName: 'Reliance Fresh', price: 12, cashback: 0.3, distance: '0.5 km' },
        ],
        alternatives: [
          { productId: 'A1', name: 'Yippee Noodles', price: 10, savings: 2 },
          { productId: 'A2', name: 'Sunfeast Pasta', price: 15, savings: 0 },
        ],
      };

      setResult(mockResult);
    } catch (err) {
      setError('Failed to scan. Please try again.');
    } finally {
      setScanning(false);
    }
  }, [barcode]);

  const getHealthColor = (score?: number) => {
    if (!score) return '#9CA3AF';
    if (score >= 70) return '#22C55E';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Universal Scan</Text>
          <Text style={styles.subtitle}>Scan ANY product, anywhere</Text>
        </View>

        {/* Scanner Area */}
        <View style={styles.scannerCard}>
          <View style={styles.scannerArea}>
            {scanning ? (
              <ActivityIndicator size="large" color="#22C55E" />
            ) : (
              <>
                <Text style={styles.scannerIcon}>📷</Text>
                <Text style={styles.scannerText}>
                  Point camera at product barcode
                </Text>
              </>
            )}
          </View>

          <View style={styles.scannerActions}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => handleScan()}
            >
              <Text style={styles.scanButtonText}>📷 Scan</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.barcodeInput}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Enter barcode manually"
              keyboardType="numeric"
              onSubmitEditing={() => handleScan()}
            />
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <>
            {/* Product Card */}
            <View style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{result.name}</Text>
                  <Text style={styles.brand}>{result.brand}</Text>
                </View>
                <View style={styles.priceContainer}>
                  {result.currentPrice && (
                    <Text style={styles.price}>₹{result.currentPrice}</Text>
                  )}
                  {result.mrp && result.mrp > (result.currentPrice || 0) && (
                    <Text style={styles.mrp}>₹{result.mrp}</Text>
                  )}
                </View>
              </View>

              {/* Health Score */}
              {result.healthScore !== undefined && (
                <View style={styles.healthSection}>
                  <View style={styles.healthBadge}>
                    <View
                      style={[
                        styles.healthScore,
                        { backgroundColor: getHealthColor(result.healthScore) },
                      ]}
                    >
                      <Text style={styles.healthScoreText}>
                        {result.healthScore}
                      </Text>
                    </View>
                    <Text style={styles.healthLabel}>Health Score</Text>
                  </View>
                </View>
              )}

              {/* Authenticity */}
              {result.authenticityScore !== undefined && (
                <View style={styles.authSection}>
                  <View style={styles.authBadge}>
                    <Text style={styles.authIcon}>
                      {result.authentic ? '✅' : '⚠️'}
                    </Text>
                    <Text style={styles.authText}>
                      {result.authenticityScore}% Authentic
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* AI Summary */}
            {result.aiSummary && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryIcon}>🤖</Text>
                  <Text style={styles.summaryTitle}>AI Summary</Text>
                </View>
                <Text style={styles.summaryText}>{result.aiSummary}</Text>
              </View>
            )}

            {/* Nutrition */}
            {result.nutrition && (
              <View style={styles.nutritionCard}>
                <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {result.nutrition.calories}
                    </Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {result.nutrition.protein}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {result.nutrition.carbs}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {result.nutrition.fat}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
                {result.nutrition.sodium && (
                  <View style={styles.warningBadge}>
                    <Text style={styles.warningText}>
                      ⚠️ High sodium: {result.nutrition.sodium}mg
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Ingredients */}
            {result.ingredients && result.ingredients.length > 0 && (
              <View style={styles.ingredientsCard}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <Text style={styles.ingredientsText}>
                  {result.ingredients.join(', ')}
                </Text>
                {result.allergens?.contains && result.allergens.contains.length > 0 && (
                  <View style={styles.allergenWarning}>
                    <Text style={styles.allergenTitle}>Contains:</Text>
                    <Text style={styles.allergenText}>
                      {result.allergens.contains.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Nearby Deals */}
            {result.nearbyOffers && result.nearbyOffers.length > 0 && (
              <View style={styles.dealsCard}>
                <Text style={styles.sectionTitle}>Nearby Deals</Text>
                {result.nearbyOffers.map((offer, index) => (
                  <View key={index} style={styles.dealItem}>
                    <View style={styles.dealInfo}>
                      <Text style={styles.dealStore}>{offer.storeName}</Text>
                      <Text style={styles.dealDistance}>{offer.distance}</Text>
                    </View>
                    <View style={styles.dealPrice}>
                      <Text style={styles.dealAmount}>₹{offer.price}</Text>
                      {offer.cashback > 0 && (
                        <Text style={styles.dealCashback}>
                          +₹{offer.cashback} cashback
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Alternatives */}
            {result.alternatives && result.alternatives.length > 0 && (
              <View style={styles.alternativesCard}>
                <Text style={styles.sectionTitle}>Alternatives</Text>
                {result.alternatives.map((alt, index) => (
                  <TouchableOpacity key={index} style={styles.altItem}>
                    <View style={styles.altInfo}>
                      <Text style={styles.altName}>{alt.name}</Text>
                      {alt.savings > 0 && (
                        <Text style={styles.altSavings}>
                          Save ₹{alt.savings}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.altPrice}>₹{alt.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  scannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  scannerArea: {
    height: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  scannerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scannerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scannerActions: {
    marginTop: 16,
  },
  scanButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#9CA3AF',
  },
  barcodeInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  brand: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
  },
  mrp: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  healthSection: {
    marginTop: 16,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthScore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  healthLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  authSection: {
    marginTop: 12,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  authIcon: {
    fontSize: 16,
  },
  authText: {
    fontSize: 14,
    color: '#166534',
  },
  summaryCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
  },
  summaryText: {
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  warningBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
  },
  ingredientsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  ingredientsText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  allergenWarning: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  allergenTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  allergenText: {
    fontSize: 12,
    color: '#DC2626',
  },
  dealsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  dealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dealInfo: {
    flex: 1,
  },
  dealStore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dealDistance: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  dealPrice: {
    alignItems: 'flex-end',
  },
  dealAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dealCashback: {
    fontSize: 12,
    color: '#22C55E',
    marginTop: 2,
  },
  alternativesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  altItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  altInfo: {
    flex: 1,
  },
  altName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  altSavings: {
    fontSize: 12,
    color: '#22C55E',
    marginTop: 2,
  },
  altPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});
