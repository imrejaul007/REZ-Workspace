/**
 * PairsWell Component
 * Shows AI pairing suggestions (frequently bought together)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
// @ts-ignore
import { SimilarityService } from '../services';
// @ts-ignore
import type { PairingItem } from '../services';

interface PairsWellProps {
  itemId: string;
  itemName: string;
  storeSlug: string;
  onAddPair?: (item: PairingItem) => void;
  style?: object;
}

export default function PairsWell({
  itemId,
  storeSlug,
  onAddPair,
  style,
}: PairsWellProps) {
  const [pairs, setPairs] = useState<PairingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchPairs();
  }, [itemId, storeSlug]);

  async function fetchPairs() {
    try {
      const result = await SimilarityService.getPairs(itemId, storeSlug, 4);
      if (result.success && result.data?.items) {
        setPairs(result.data.items);
      }
    } catch {
      // Service unavailable
    } finally {
      setLoading(false);
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'frequently_bought':
        return '🛒';
      case 'goes_well':
        return '🍽️';
      case 'alternative':
        return '🔄';
      default:
        return '✨';
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'frequently_bought':
        return 'Frequently bought together';
      case 'goes_well':
        return 'Pairs perfectly with';
      case 'alternative':
        return 'You might also like';
      default:
        return 'Recommended';
    }
  }

  if (loading || pairs.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🍽️</Text>
          <Text style={styles.headerTitle}>
            {getTypeLabel(pairs[0]?.type)}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pairsList}
        >
          {pairs.map((pair) => (
            <View key={pair.itemId} style={styles.pairCard}>
              {pair.image ? (
                <Image source={{ uri: pair.image }} style={styles.pairImage} />
              ) : (
                <View style={styles.pairPlaceholder}>
                  <Text style={styles.pairPlaceholderIcon}>
                    {getTypeIcon(pair.type)}
                  </Text>
                </View>
              )}
              <Text style={styles.pairName} numberOfLines={1}>
                {pair.name}
              </Text>
              <View style={styles.pairFooter}>
                <Text style={styles.pairPrice}>₹{pair.price}</Text>
                {onAddPair && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => onAddPair(pair)}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.confidence}>
                {Math.round((pair.confidence || 0) * 100)}% match
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Text style={styles.footer}>
        Based on what customers like you usually order together
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  chevron: {
    fontSize: 12,
    color: '#8E8E93',
  },
  pairsList: {
    gap: 12,
    paddingVertical: 4,
  },
  pairCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pairImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  pairPlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pairPlaceholderIcon: {
    fontSize: 28,
  },
  pairName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  pairFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pairPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confidence: {
    fontSize: 10,
    color: '#8E8E93',
  },
  footer: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
  },
});
