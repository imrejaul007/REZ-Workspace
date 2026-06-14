'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

interface PricePoint {
  date: string;
  price: number;
}

interface ProductTimeline {
  productId: string;
  name: string;
  brand: string;
  currentPrice: number;
  mrp: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceTrend: 'increasing' | 'decreasing' | 'stable';
  priceHistory: PricePoint[];
  bestTimeToBuy: {
    dayOfWeek: string;
    timeOfDay: string;
    reason: string;
  };
  pricePrediction: {
    nextMonthPrice: number;
    confidence: number;
    recommendation: 'buy_now' | 'wait' | 'already_low';
  };
  myPurchaseHistory: Array<{
    date: string;
    price: number;
    cashback: number;
  }>;
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;

export default function ProductTimelineScreen() {
  const [timeline, setTimeline] = useState<ProductTimeline | null>(null);

  // Mock data
  const mockTimeline: ProductTimeline = {
    productId: 'PROD-AMUL-BUTTER',
    name: 'Amul Butter 500g',
    brand: 'Amul',
    currentPrice: 275,
    mrp: 299,
    lowestPrice: 245,
    highestPrice: 299,
    averagePrice: 265,
    priceTrend: 'decreasing',
    priceHistory: [
      { date: '2026-03-01', price: 285 },
      { date: '2026-03-15', price: 280 },
      { date: '2026-04-01', price: 275 },
      { date: '2026-04-15', price: 260 },
      { date: '2026-05-01', price: 255 },
      { date: '2026-05-15', price: 245 },
      { date: '2026-05-28', price: 275 },
    ],
    bestTimeToBuy: {
      dayOfWeek: 'Friday',
      timeOfDay: '2:00 PM',
      reason: 'Average cashback: ₹8',
    },
    pricePrediction: {
      nextMonthPrice: 260,
      confidence: 0.85,
      recommendation: 'already_low',
    },
    myPurchaseHistory: [
      { date: '2026-05-28', price: 275, cashback: 8 },
      { date: '2026-05-14', price: 245, cashback: 7 },
      { date: '2026-04-30', price: 260, cashback: 5 },
      { date: '2026-04-15', price: 275, cashback: 8 },
    ],
  };

  // Simple chart rendering
  const renderPriceChart = () => {
    const prices = mockTimeline.priceHistory.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    return (
      <View style={styles.chart}>
        <View style={styles.chartYAxis}>
          <Text style={styles.yAxisLabel}>₹{maxPrice}</Text>
          <Text style={styles.yAxisLabel}>₹{Math.round((maxPrice + minPrice) / 2)}</Text>
          <Text style={styles.yAxisLabel}>₹{minPrice}</Text>
        </View>
        <View style={styles.chartArea}>
          {prices.map((price, index) => {
            const height = ((price - minPrice) / range) * 100;
            const isLowest = price === minPrice;
            const isHighest = price === maxPrice;
            const isCurrent = index === prices.length - 1;

            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${height}%`,
                      backgroundColor: isLowest
                        ? '#22C55E'
                        : isHighest
                        ? '#EF4444'
                        : isCurrent
                        ? '#3B82F6'
                        : '#9CA3AF',
                    },
                  ]}
                />
                {isLowest && (
                  <View style={styles.lowestLabel}>
                    <Text style={styles.lowestText}>30-day low</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const getTrendIcon = () => {
    switch (mockTimeline.priceTrend) {
      case 'decreasing': return { icon: '📉', color: '#22C55E', text: 'Price dropping' };
      case 'increasing': return { icon: '📈', color: '#EF4444', text: 'Price rising' };
      default: return { icon: '➡️', color: '#6B7280', text: 'Stable' };
    }
  };

  const getRecommendationStyle = () => {
    switch (mockTimeline.pricePrediction.recommendation) {
      case 'buy_now': return { bg: '#DCFCE7', color: '#166534', text: '✅ Buy Now' };
      case 'wait': return { bg: '#FEF3C7', color: '#92400E', text: '⏳ Wait for better price' };
      case 'already_low': return { bg: '#DCFCE7', color: '#166534', text: '💚 Already at low price!' };
    }
  };

  const trend = getTrendIcon();
  const recommendation = getRecommendationStyle();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Product Timeline</Text>
        <Text style={styles.subtitle}>Price history & insights</Text>
      </View>

      {/* Product Card */}
      <View style={styles.productCard}>
        <Text style={styles.productName}>{mockTimeline.name}</Text>
        <Text style={styles.productBrand}>{mockTimeline.brand}</Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.currentPrice}>₹{mockTimeline.currentPrice}</Text>
            <Text style={styles.mrp}>MRP ₹{mockTimeline.mrp}</Text>
          </View>
          <View style={[styles.trendBadge, { backgroundColor: trend.color + '20' }]}>
            <Text style={styles.trendIcon}>{trend.icon}</Text>
            <Text style={[styles.trendText, { color: trend.color }]}>{trend.text}</Text>
          </View>
        </View>
      </View>

      {/* Price Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>90-Day Price History</Text>
        {renderPriceChart()}
        <View style={styles.priceRange}>
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>Lowest</Text>
            <Text style={[styles.rangeValue, { color: '#22C55E' }]}>₹{mockTimeline.lowestPrice}</Text>
          </View>
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>Average</Text>
            <Text style={styles.rangeValue}>₹{mockTimeline.averagePrice}</Text>
          </View>
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>Highest</Text>
            <Text style={[styles.rangeValue, { color: '#EF4444' }]}>₹{mockTimeline.highestPrice}</Text>
          </View>
        </View>
      </View>

      {/* Best Time to Buy */}
      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <Text style={styles.insightIcon}>⏰</Text>
          <Text style={styles.insightTitle}>Best Time to Buy</Text>
        </View>
        <View style={styles.bestTimeContent}>
          <Text style={styles.bestTime}>
            {mockTimeline.bestTimeToBuy.dayOfWeek} at {mockTimeline.bestTimeToBuy.timeOfDay}
          </Text>
          <Text style={styles.bestTimeReason}>{mockTimeline.bestTimeToBuy.reason}</Text>
        </View>
      </View>

      {/* Price Prediction */}
      <View style={[styles.predictionCard, { backgroundColor: recommendation.bg }]}>
        <Text style={[styles.predictionTitle, { color: recommendation.color }]}>
          {recommendation.text}
        </Text>
        <View style={styles.predictionDetails}>
          <Text style={styles.predictionLabel}>Predicted price next month:</Text>
          <Text style={styles.predictionValue}>
            ₹{mockTimeline.pricePrediction.nextMonthPrice}
          </Text>
          <Text style={styles.confidence}>
            {Math.round(mockTimeline.pricePrediction.confidence * 100)}% confidence
          </Text>
        </View>
      </View>

      {/* My Purchase History */}
      <View style={styles.historyCard}>
        <Text style={styles.sectionTitle}>My Purchase History</Text>
        {mockTimeline.myPurchaseHistory.map((purchase, index) => (
          <View key={index} style={styles.purchaseItem}>
            <View style={styles.purchaseLeft}>
              <Text style={styles.purchaseDate}>
                {new Date(purchase.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
              <Text style={styles.purchasePrice}>₹{purchase.price}</Text>
            </View>
            <View style={styles.purchaseRight}>
              <Text style={styles.cashback}>+₹{purchase.cashback} cashback</Text>
            </View>
          </View>
        ))}
      </View>

      {/* AI Insight */}
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiIcon}>🤖</Text>
          <Text style={styles.aiTitle}>AI Insight</Text>
        </View>
        <Text style={styles.aiText}>
          Based on 6 months of price data, this product typically drops to ₹250
          during festival sales. Consider buying now if you need it, or wait 2 weeks
          for potential savings of ₹25.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  productCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  productBrand: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22C55E',
  },
  mrp: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  trendIcon: {
    fontSize: 16,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    height: 150,
    marginBottom: 16,
  },
  chartYAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingBottom: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 8,
  },
  lowestLabel: {
    position: 'absolute',
    bottom: -20,
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowestText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  priceRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeItem: {
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  rangeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  insightCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
  },
  bestTimeContent: {
    marginLeft: 28,
  },
  bestTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4338CA',
  },
  bestTimeReason: {
    fontSize: 13,
    color: '#6366F1',
    marginTop: 4,
  },
  predictionCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  predictionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  predictionLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  predictionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  confidence: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
  },
  purchaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  purchaseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  purchaseDate: {
    fontSize: 14,
    color: '#6B7280',
    minWidth: 60,
  },
  purchasePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  purchaseRight: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cashback: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  aiCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    marginBottom: 32,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiIcon: {
    fontSize: 20,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  aiText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginLeft: 28,
  },
});
