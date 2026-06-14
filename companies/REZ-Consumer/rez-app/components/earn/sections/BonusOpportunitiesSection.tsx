import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BonusOpportunity } from '@/services/gamificationApi';
import { Spacing } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { earnStyles as styles } from './styles';

interface BonusOpportunitiesSectionProps {
  bonusOpportunities: BonusOpportunity[];
  replaceCurrencySymbol: (value: string) => string;
  navigateTo: (path: string) => void;
}

const BonusOpportunitiesSection = React.memo(function BonusOpportunitiesSection({
  bonusOpportunities,
  replaceCurrencySymbol,
  navigateTo,
}: BonusOpportunitiesSectionProps) {
  if (bonusOpportunities.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="flash" size={24} color={colors.error} />
        <Text style={styles.sectionTitle}>Limited-Time Opportunities</Text>
      </View>
      {bonusOpportunities.map((opp) => (
        <Pressable
          key={opp.id}
          style={styles.bonusOppCard}
          onPress={() => opp.path && navigateTo(opp.path)}
        >
          <View style={styles.bonusOppRow}>
            <Text style={styles.bonusOppIcon}>{opp.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bonusOppTitle}>{opp.title}</Text>
              <Text style={styles.bonusOppDesc}>{opp.description}</Text>
            </View>
            <View style={styles.bonusOppRight}>
              <Text style={styles.bonusOppReward}>{replaceCurrencySymbol(opp.reward)}</Text>
              {opp.timeLeft ? (
                <View style={[styles.bonusOppTimeBadge, opp.urgent ? styles.bonusOppUrgent : null]}>
                  <Ionicons name="time" size={10} color={opp.urgent ? colors.error : colors.text.tertiary} />
                  <Text style={[styles.bonusOppTime, opp.urgent && { color: colors.error }]}>{opp.timeLeft}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
});

export default BonusOpportunitiesSection;
