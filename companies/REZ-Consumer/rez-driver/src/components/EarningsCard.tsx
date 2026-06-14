import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { formatCurrency } from '../utils';

interface EarningsCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'highlight' | 'compact';
}

export const EarningsCard: React.FC<EarningsCardProps> = ({
  title,
  amount,
  subtitle,
  trend,
  variant = 'default',
}) => {
  const isHighlight = variant === 'highlight';

  return (
    <Card
      style={[
        styles.card,
        isHighlight && styles.cardHighlight,
        variant === 'compact' && styles.cardCompact,
      ]}
    >
      <Text style={[styles.title, isHighlight && styles.titleHighlight]}>
        {title}
      </Text>
      <Text style={[styles.amount, isHighlight && styles.amountHighlight]}>
        {formatCurrency(amount)}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, isHighlight && styles.subtitleHighlight]}>
          {subtitle}
        </Text>
      )}
      {trend && (
        <View style={styles.trendContainer}>
          <Text
            style={[
              styles.trendValue,
              trend.value >= 0 ? styles.trendPositive : styles.trendNegative,
            ]}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}%
          </Text>
          <Text style={styles.trendLabel}>{trend.label}</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  cardHighlight: {
    backgroundColor: '#34C759',
  },
  cardCompact: {
    padding: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  titleHighlight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  amountHighlight: {
    color: '#FFFFFF',
    fontSize: 32,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  subtitleHighlight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendPositive: {
    color: '#34C759',
  },
  trendNegative: {
    color: '#FF3B30',
  },
  trendLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
});

export default EarningsCard;
