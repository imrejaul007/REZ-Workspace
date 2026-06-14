/**
 * REZ Go Product Intelligence Panel
 *
 * Shows full product info when scanned:
 * - Nutrition
 * - Ingredients
 * - Health insights
 * - Tutorials
 * - Warnings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';

interface ProductNutrition {
  servingSize?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

interface ProductAllergens {
  contains?: string[];
  mayContain?: string[];
  dietary?: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    halal?: boolean;
    jain?: boolean;
  };
}

interface ProductHealthInsight {
  type: 'warning' | 'info' | 'tip';
  category: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

interface ProductTutorial {
  type: string;
  title: string;
  url: string;
  duration?: number;
}

interface ProductPanelProps {
  product: {
    name: string;
    brand?: string;
    price: number;
    mrp?: number;
    weight?: string;
    category?: string;
  };
  nutrition?: ProductNutrition;
  allergens?: ProductAllergens;
  healthScore?: number;
  healthInsights?: ProductHealthInsight[];
  tutorials?: ProductTutorial[];
  howToUse?: string;
  storageInstructions?: string;
  onClose: () => void;
}

export function ProductPanel({
  product,
  nutrition,
  allergens,
  healthScore,
  healthInsights,
  tutorials,
  howToUse,
  storageInstructions,
  onClose,
}: ProductPanelProps) {
  const getHealthScoreColor = (score?: number) => {
    if (!score) return '#9CA3AF';
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'tip': return '💡';
      default: return '•';
    }
  };

  const handleTutorialPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.brand && (
              <Text style={styles.brand}>{product.brand}</Text>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{product.price}</Text>
              {product.mrp && product.mrp > product.price && (
                <Text style={styles.mrp}>₹{product.mrp}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Health Score */}
        {healthScore !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Score</Text>
            <View style={styles.healthScoreContainer}>
              <View
                style={[
                  styles.healthScoreBadge,
                  { backgroundColor: getHealthScoreColor(healthScore) },
                ]}
              >
                <Text style={styles.healthScoreValue}>{healthScore}</Text>
              </View>
              <Text style={styles.healthScoreLabel}>/100</Text>
            </View>
          </View>
        )}

        {/* Nutrition */}
        {nutrition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition (per 100g)</Text>
            <View style={styles.nutritionGrid}>
              {nutrition.calories !== undefined && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
              )}
              {nutrition.protein !== undefined && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
              )}
              {nutrition.carbs !== undefined && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
              )}
              {nutrition.fat !== undefined && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              )}
              {nutrition.fiber !== undefined && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.fiber}g</Text>
                  <Text style={styles.nutritionLabel}>Fiber</Text>
                </View>
              )}
              {nutrition.sugar !== undefined && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.sugar}g</Text>
                  <Text style={styles.nutritionLabel}>Sugar</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Allergens & Dietary */}
        {allergens && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Info</Text>
            <View style={styles.dietaryBadges}>
              {allergens.dietary?.vegetarian && (
                <View style={[styles.dietaryBadge, styles.vegetarian]}>
                <Text style={styles.dietaryText}>🌿 Vegetarian</Text>
              </View>
              )}
              {allergens.dietary?.vegan && (
                <View style={[styles.dietaryBadge, styles.vegan]}>
                <Text style={styles.dietaryText}>🌱 Vegan</Text>
                </View>
              )}
              {allergens.dietary?.glutenFree && (
                <View style={[styles.dietaryBadge, styles.glutenFree]}>
                <Text style={styles.dietaryText}>🌾 Gluten Free</Text>
                </View>
              )}
              {allergens.dietary?.halal && (
                <View style={[styles.dietaryBadge, styles.halal]}>
                <Text style={styles.dietaryText}>☪ Halal</Text>
                </View>
              )}
              {allergens.dietary?.jain && (
                <View style={[styles.dietaryBadge, styles.jain]}>
                <Text style={styles.dietaryText}>🙏 Jain</Text>
                </View>
              )}
            </View>
            {allergens.contains && allergens.contains.length > 0 && (
              <View style={styles.allergenWarning}>
                <Text style={styles.allergenTitle}>Contains:</Text>
                <Text style={styles.allergenList}>
                  {allergens.contains.join(', ')}
                </Text>
              </View>
            )}
            {allergens.mayContain && allergens.mayContain.length > 0 && (
              <View style={styles.allergenCaution}>
                <Text style={styles.allergenTitle}>May contain:</Text>
                <Text style={styles.allergenList}>
                  {allergens.mayContain.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Health Insights */}
        {healthInsights && healthInsights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Insights</Text>
            {healthInsights.map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightCard,
                  insight.type === 'warning' && styles.insightWarning,
                  insight.type === 'info' && styles.insightInfo,
                  insight.type === 'tip' && styles.insightTip,
                ]}
              >
                <Text style={styles.insightIcon}>
                  {getInsightIcon(insight.type)}
                </Text>
                <Text style={styles.insightMessage}>{insight.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* How to Use */}
        {howToUse && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Use</Text>
            <Text style={styles.instructionText}>{howToUse}</Text>
          </View>
        )}

        {/* Storage */}
        {storageInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage</Text>
            <Text style={styles.instructionText}>{storageInstructions}</Text>
          </View>
        )}

        {/* Tutorials */}
        {tutorials && tutorials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tutorials & More</Text>
            {tutorials.map((tutorial, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tutorialCard}
                onPress={() => handleTutorialPress(tutorial.url)}
              >
                <View style={styles.tutorialIcon}>
                  <Text style={styles.tutorialIconText}>
                    {tutorial.type === 'video' ? '🎬' :
                     tutorial.type === 'recipe' ? '🍳' :
                     tutorial.type === 'article' ? '📖' : '📸'}
                  </Text>
                </View>
                <View style={styles.tutorialContent}>
                  <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                  {tutorial.duration && (
                    <Text style={styles.tutorialDuration}>
                      {Math.floor(tutorial.duration / 60)}:{(tutorial.duration % 60).toString().padStart(2, '0')}
                    </Text>
                  )}
                </View>
                <Text style={styles.tutorialArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  brand: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
  },
  mrp: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: '#6B7280',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  healthScoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  healthScoreValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  healthScoreLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
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
    minWidth: 80,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  dietaryBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dietaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  vegetarian: { backgroundColor: '#DCFCE7' },
  vegan: { backgroundColor: '#DCFCE7' },
  glutenFree: { backgroundColor: '#FEF3C7' },
  halal: { backgroundColor: '#DBEAFE' },
  jain: { backgroundColor: '#FEE2E2' },
  dietaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  allergenWarning: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  allergenCaution: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  allergenTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  allergenList: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  insightWarning: { backgroundColor: '#FEE2E2' },
  insightInfo: { backgroundColor: '#DBEAFE' },
  insightTip: { backgroundColor: '#F0FDF4' },
  insightIcon: {
    fontSize: 20,
  },
  insightMessage: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  tutorialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  tutorialIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialIconText: {
    fontSize: 24,
  },
  tutorialContent: {
    flex: 1,
    marginLeft: 12,
  },
  tutorialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  tutorialDuration: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tutorialArrow: {
    fontSize: 18,
    color: '#6B7280',
  },
});

export default ProductPanel;
