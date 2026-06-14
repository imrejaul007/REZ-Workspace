/**
 * GoalSelector — Step 1 of offer creation wizard
 * Merchant picks their campaign goal, which pre-fills recommended settings.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface OfferGoal {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  defaults: {
    type: 'cashback' | 'discount' | 'voucher';
    value: number;
    minSpend: number;
    durationDays: number;
    budgetCap: number;
  };
}

export const OFFER_GOALS: OfferGoal[] = [
  {
    id: 'increase_visits',
    title: 'Increase Visits',
    subtitle: 'Bring more foot traffic to your store',
    icon: 'footsteps',
    color: '#3B82F6',
    bg: '#EFF6FF',
    defaults: { type: 'cashback', value: 10, minSpend: 300, durationDays: 14, budgetCap: 10000 },
  },
  {
    id: 'increase_bill',
    title: 'Increase Bill Size',
    subtitle: 'Encourage bigger orders per visit',
    icon: 'trending-up',
    color: '#10B981',
    bg: '#ECFDF5',
    defaults: { type: 'cashback', value: 15, minSpend: 500, durationDays: 7, budgetCap: 15000 },
  },
  {
    id: 'new_customers',
    title: 'Attract New Customers',
    subtitle: 'Get first-time visitors to your store',
    icon: 'person-add',
    color: '#A855F7',
    bg: '#F5F3FF',
    defaults: { type: 'discount', value: 20, minSpend: 200, durationDays: 30, budgetCap: 20000 },
  },
  {
    id: 'reward_loyal',
    title: 'Reward Loyal Customers',
    subtitle: 'Keep your best customers coming back',
    icon: 'heart',
    color: '#EC4899',
    bg: '#FDF2F8',
    defaults: { type: 'voucher', value: 100, minSpend: 0, durationDays: 30, budgetCap: 5000 },
  },
];

interface GoalSelectorProps {
  selectedGoalId: string | null;
  onSelectGoal: (goal: OfferGoal) => void;
}

function GoalSelector({ selectedGoalId, onSelectGoal }: GoalSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your goal?</Text>
      <Text style={styles.subtitle}>We'll recommend the best offer settings based on your goal</Text>

      <View style={styles.grid}>
        {OFFER_GOALS.map((goal) => {
          const isSelected = selectedGoalId === goal.id;
          return (
            <Pressable
              key={goal.id}
              style={[styles.card, { borderColor: isSelected ? goal.color : '#E5E7EB' }, isSelected && { borderWidth: 2 }]}
              onPress={() => onSelectGoal(goal)}
            >
              <View style={[styles.iconCircle, { backgroundColor: goal.bg }]}>
                <Ionicons name={goal.icon} size={24} color={goal.color} />
              </View>
              <Text style={styles.cardTitle}>{goal.title}</Text>
              <Text style={styles.cardSubtitle}>{goal.subtitle}</Text>
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: goal.color }]}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSubtitle: { fontSize: 11, color: '#6B7280', lineHeight: 15 },
  checkBadge: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

export default React.memo(GoalSelector);
