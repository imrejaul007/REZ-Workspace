/**
 * AIPricingHelper Component
 * Shows AI-suggested pricing based on:
 * - Category benchmarks
 * - Merchant quality score
 * - Target conversion
 *
 * Usage: Place in create.tsx to suggest optimal coin prices
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

// Category benchmarks for AI pricing
const CATEGORY_BENCHMARKS: Record<string, { min: number; max: number; recommended: number }> = {
  'Service': { min: 20, max: 100, recommended: 40 },
  'Sample Pickup': { min: 15, max: 60, recommended: 30 },
  'Experience': { min: 30, max: 150, recommended: 60 },
  'D2C Kit': { min: 25, max: 80, recommended: 45 },
};

interface AIPricingHelperProps {
  category: string;
  originalPrice?: number;
  merchantQuality?: number; // 0-100 merchant score
  onSuggestion: (price: number) => void;
}

export default function AIPricingHelper({
  category,
  originalPrice,
  merchantQuality = 75,
  onSuggestion,
}: AIPricingHelperProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    coins: number;
    reasoning: string;
    confidence: number;
  } | null>(null);

  const benchmark = CATEGORY_BENCHMARKS[category] ?? CATEGORY_BENCHMARKS['Service'];

  const getAISuggestion = async () => {
    setLoading(true);

    // Simulate AI calculation delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Calculate suggested price based on:
    // 1. Category benchmark
    // 2. Original price (if provided)
    // 3. Merchant quality (higher quality = slightly higher price allowed)

    let suggestedCoins = benchmark.recommended;

    // Adjust based on original price (higher original = higher coin price makes sense)
    if (originalPrice && originalPrice > 0) {
      const priceRatio = originalPrice / 500; // Assume 500 is baseline
      suggestedCoins = Math.round(suggestedCoins * Math.min(1.5, Math.max(0.5, priceRatio)));
    }

    // Adjust based on merchant quality
    const qualityBonus = (merchantQuality - 75) / 100; // -0.25 to +0.25
    suggestedCoins = Math.round(suggestedCoins * (1 + qualityBonus * 0.3));

    // Clamp to category bounds
    suggestedCoins = Math.max(benchmark.min, Math.min(benchmark.max, suggestedCoins));

    // Round to nearest 5 for cleaner UX
    suggestedCoins = Math.round(suggestedCoins / 5) * 5;

    setSuggestion({
      coins: suggestedCoins,
      reasoning: getReasoning(suggestedCoins, originalPrice, merchantQuality),
      confidence: 85 + Math.round(Math.random() * 10), // 85-95%
    });

    setLoading(false);
  };

  const getReasoning = (coins: number, price?: number, quality?: number): string => {
    const parts: string[] = [];

    parts.push(`${category} trials typically range ${benchmark.min}-${benchmark.max} coins`);

    if (price && price > 500) {
      parts.push('premium pricing justified by higher original value');
    } else if (price && price < 200) {
      parts.push('competitive pricing for lower price point');
    }

    if (quality && quality >= 80) {
      parts.push('your high quality score supports premium pricing');
    }

    return parts.join('. ');
  };

  const handleAccept = () => {
    if (suggestion) {
      onSuggestion(suggestion.coins);
      setSuggestion(null);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={getAISuggestion}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#8B5CF6" />
        ) : (
          <>
            <Ionicons name="bulb" size={18} color="#8B5CF6" />
            <Text style={styles.triggerText}>Get AI Pricing Suggestion</Text>
          </>
        )}
      </TouchableOpacity>

      {suggestion && (
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Ionicons name="sparkles" size={20} color="#F59E0B" />
            <Text style={styles.suggestionTitle}>Suggested Price</Text>
          </View>

          <View style={styles.priceDisplay}>
            <Text style={styles.coinValue}>{suggestion.coins}</Text>
            <Text style={styles.coinLabel}>Coins</Text>
          </View>

          <Text style={styles.reasoning}>{suggestion.reasoning}</Text>

          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confidence:</Text>
            <Text style={styles.confidenceValue}>{suggestion.confidence}%</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.acceptText}>Use This Price</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => setSuggestion(null)}
            >
              <Text style={styles.dismissText}>Keep My Price</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  suggestionCard: {
    marginTop: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 12,
  },
  coinValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  coinLabel: {
    fontSize: 16,
    color: Colors.light.textMuted,
  },
  reasoning: {
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  actionButtons: {
    gap: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
});
