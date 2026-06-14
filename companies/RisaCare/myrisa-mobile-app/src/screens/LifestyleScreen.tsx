import { logger } from '../../shared/logger';
/**
 * MyRisa Lifestyle Screen
 * Exercise, nutrition, habits, and daily wellness
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Button, ProgressBar, Chip, SegmentedButtons } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  lifestyle: '#4DB6AC',
  exercise: '#E57373',
  nutrition: '#81C784',
  habits: '#7986CB',
  water: '#64B5F6',
};

export default function LifestyleScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [lifestyleData, setLifestyleData] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userId');
      if (stored) {
        setUserId(stored);
        loadData(stored);
      } else {
        const newId = `user_${Date.now()}`;
        await AsyncStorage.setItem('userId', newId);
        setUserId(newId);
        loadData(newId);
      }
    } catch (error) {
      logger.error('Error loading user:', error);
      setLoading(false);
    }
  };

  const loadData = async (uid: string) => {
    try {
      // In production, fetch from API
      setLifestyleData(getMockData());
    } catch (error) {
      logger.error('Error loading lifestyle data:', error);
      setLifestyleData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      await loadData(userId);
    }
    setRefreshing(false);
  };

  const getMockData = () => ({
    overallScore: 72,
    exercise: {
      weeklyGoal: 150,
      completed: 95,
      workouts: [
        { day: 'Mon', type: 'Running', duration: 30, completed: true },
        { day: 'Tue', type: 'Yoga', duration: 45, completed: true },
        { day: 'Wed', type: 'Strength', duration: 40, completed: true },
        { day: 'Thu', type: 'Rest', duration: 0, completed: true },
        { day: 'Fri', type: 'Swimming', duration: 35, completed: true },
        { day: 'Sat', type: 'Hiking', duration: 60, completed: false },
        { day: 'Sun', type: 'Yoga', duration: 30, completed: false },
      ],
    },
    nutrition: {
      calories: 1850,
      goal: 2000,
      macros: {
        protein: 65,
        carbs: 220,
        fat: 60,
      },
      meals: [
        { type: 'Breakfast', calories: 450, completed: true },
        { type: 'Lunch', calories: 550, completed: true },
        { type: 'Snack', calories: 200, completed: true },
        { type: 'Dinner', calories: 650, completed: false },
      ],
      water: {
        current: 6,
        goal: 8,
      },
    },
    habits: {
      score: 78,
      streaks: [
        { name: 'Meditation', current: 12, best: 30 },
        { name: 'Reading', current: 8, best: 15 },
        { name: 'No Screen Before Bed', current: 5, best: 10 },
      ],
      dailyHabits: [
        { name: 'Morning stretch', completed: true },
        { name: 'Drink water', completed: true },
        { name: 'Take vitamins', completed: true },
        { name: 'Evening walk', completed: false },
        { name: 'Read before bed', completed: false },
      ],
    },
    insights: [
      { id: '1', type: 'success', text: 'Great job completing 4 workouts this week!' },
      { id: '2', type: 'info', text: 'You are well hydrated today.' },
      { id: '3', type: 'warning', text: 'Don\'t forget to log your dinner.' },
    ],
  });

  const toggleHabit = (index: number) => {
    const habits = [...lifestyleData.habits.dailyHabits];
    habits[index].completed = !habits[index].completed;
    setLifestyleData({
      ...lifestyleData,
      habits: { ...lifestyleData.habits, dailyHabits: habits }
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.lifestyle }]}>
        <Text style={styles.headerEmoji}>🌿</Text>
        <Text style={styles.greeting}>Lifestyle</Text>
        <Text style={styles.subtitle}>Exercise, nutrition & habits</Text>
      </View>

      {/* Overall Score Card */}
      <Card style={styles.scoreCard}>
        <Card.Content>
          <View style={styles.scoreContainer}>
            <View style={[styles.scoreCircle, { backgroundColor: COLORS.lifestyle }]}>
              <Text style={styles.scoreNumber}>{lifestyleData?.overallScore || 72}</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Lifestyle Score</Text>
              <View style={styles.scoreBreakdown}>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemEmoji}>🏃</Text>
                  <Text style={styles.scoreItemValue}>{Math.round(lifestyleData?.exercise?.completed / lifestyleData?.exercise?.weeklyGoal * 100)}%</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemEmoji}>🥗</Text>
                  <Text style={styles.scoreItemValue}>{Math.round(lifestyleData?.nutrition?.calories / lifestyleData?.nutrition?.goal * 100)}%</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemEmoji}>✨</Text>
                  <Text style={styles.scoreItemValue}>{lifestyleData?.habits?.score}%</Text>
                </View>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Tab Selector */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'overview', label: 'Overview' },
          { value: 'exercise', label: 'Exercise' },
          { value: 'nutrition', label: 'Nutrition' },
          { value: 'habits', label: 'Habits' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <Card style={[styles.quickStatCard, { backgroundColor: COLORS.exercise + '20' }]}>
              <TouchableOpacity style={styles.quickStatContent}>
                <Text style={styles.quickStatEmoji}>🏃</Text>
                <Text style={styles.quickStatValue}>{lifestyleData?.exercise?.completed}m</Text>
                <Text style={styles.quickStatLabel}>Exercise</Text>
              </TouchableOpacity>
            </Card>
            <Card style={[styles.quickStatCard, { backgroundColor: COLORS.nutrition + '20' }]}>
              <TouchableOpacity style={styles.quickStatContent}>
                <Text style={styles.quickStatEmoji}>🥗</Text>
                <Text style={styles.quickStatValue}>{lifestyleData?.nutrition?.calories}</Text>
                <Text style={styles.quickStatLabel}>Calories</Text>
              </TouchableOpacity>
            </Card>
            <Card style={[styles.quickStatCard, { backgroundColor: COLORS.water + '20' }]}>
              <TouchableOpacity style={styles.quickStatContent}>
                <Text style={styles.quickStatEmoji}>💧</Text>
                <Text style={styles.quickStatValue}>{lifestyleData?.nutrition?.water?.current}/{lifestyleData?.nutrition?.water?.goal}</Text>
                <Text style={styles.quickStatLabel}>Water</Text>
              </TouchableOpacity>
            </Card>
          </View>

          {/* Today's Habits */}
          <Card style={styles.habitsCard}>
            <Card.Content>
              <View style={styles.habitsHeader}>
                <Text style={styles.cardTitle}>Today's Habits</Text>
                <Chip style={styles.habitsChip}>
                  {lifestyleData?.habits?.dailyHabits?.filter((h: any) => h.completed).length}/{lifestyleData?.habits?.dailyHabits?.length}
                </Chip>
              </View>
              {lifestyleData?.habits?.dailyHabits?.map((habit: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.habitItem}
                  onPress={() => toggleHabit(index)}
                >
                  <View style={[
                    styles.habitCheckbox,
                    { backgroundColor: habit.completed ? COLORS.lifestyle : 'transparent' }
                  ]}>
                    {habit.completed && <Text style={styles.habitCheck}>✓</Text>}
                  </View>
                  <Text style={[
                    styles.habitText,
                    { textDecorationLine: habit.completed ? 'line-through' : 'none' }
                  ]}>
                    {habit.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Exercise Tab */}
      {activeTab === 'exercise' && (
        <View style={styles.tabContent}>
          {/* Weekly Progress */}
          <Card style={styles.progressCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Weekly Goal: {lifestyleData?.exercise?.weeklyGoal} minutes</Text>
              <ProgressBar
                progress={lifestyleData?.exercise?.completed / lifestyleData?.exercise?.weeklyGoal}
                color={COLORS.exercise}
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>
                {lifestyleData?.exercise?.completed} of {lifestyleData?.exercise?.weeklyGoal} minutes completed
              </Text>
            </Card.Content>
          </Card>

          {/* Weekly Workouts */}
          <Card style={styles.workoutsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>This Week</Text>
              {lifestyleData?.exercise?.workouts?.map((workout: any, index: number) => (
                <View key={index} style={styles.workoutItem}>
                  <View style={styles.workoutDay}>
                    <Text style={styles.workoutDayText}>{workout.day}</Text>
                    <View style={[
                      styles.workoutStatus,
                      { backgroundColor: workout.completed ? COLORS.exercise + '20' : '#f0f0f0' }
                    ]}>
                      <Text style={styles.workoutStatusText}>
                        {workout.completed ? '✓' : '○'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.workoutDetails}>
                    <Text style={styles.workoutType}>{workout.type}</Text>
                    <Text style={styles.workoutDuration}>
                      {workout.duration > 0 ? `${workout.duration} min` : 'Rest day'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.workoutEmoji,
                    { opacity: workout.completed ? 1 : 0.3 }
                  ]}>
                    {workout.type === 'Running' ? '🏃' :
                     workout.type === 'Yoga' ? '🧘' :
                     workout.type === 'Strength' ? '💪' :
                     workout.type === 'Swimming' ? '🏊' :
                     workout.type === 'Hiking' ? '🥾' :
                     workout.type === 'Rest' ? '😌' : '🏃'}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Quick Log */}
          <TouchableOpacity style={styles.logButton}>
            <Text style={styles.logButtonText}>➕ Log Workout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Nutrition Tab */}
      {activeTab === 'nutrition' && (
        <View style={styles.tabContent}>
          {/* Calories */}
          <Card style={styles.caloriesCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Calories Today</Text>
              <View style={styles.caloriesContainer}>
                <View style={styles.caloriesMain}>
                  <Text style={styles.caloriesValue}>{lifestyleData?.nutrition?.calories}</Text>
                  <Text style={styles.caloriesGoal}>of {lifestyleData?.nutrition?.goal} kcal</Text>
                </View>
                <ProgressBar
                  progress={lifestyleData?.nutrition?.calories / lifestyleData?.nutrition?.goal}
                  color={COLORS.nutrition}
                  style={styles.caloriesProgress}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Macros */}
          <Card style={styles.macrosCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Macros</Text>
              <View style={styles.macrosContainer}>
                <View style={styles.macroItem}>
                  <View style={[styles.macroCircle, { borderColor: COLORS.exercise }]}>
                    <Text style={styles.macroValue}>{lifestyleData?.nutrition?.macros?.protein}g</Text>
                  </View>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroCircle, { borderColor: COLORS.nutrition }]}>
                    <Text style={styles.macroValue}>{lifestyleData?.nutrition?.macros?.carbs}g</Text>
                  </View>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroCircle, { borderColor: COLORS.habits }]}>
                    <Text style={styles.macroValue}>{lifestyleData?.nutrition?.macros?.fat}g</Text>
                  </View>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Water */}
          <Card style={styles.waterCard}>
            <Card.Content>
              <View style={styles.waterHeader}>
                <Text style={styles.cardTitle}>💧 Water Intake</Text>
                <Text style={styles.waterValue}>
                  {lifestyleData?.nutrition?.water?.current} of {lifestyleData?.nutrition?.water?.goal} glasses
                </Text>
              </View>
              <View style={styles.waterGlasses}>
                {[...Array(lifestyleData?.nutrition?.water?.goal)].map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.waterGlass,
                      { backgroundColor: index < lifestyleData?.nutrition?.water?.current ? COLORS.water : '#E3F2FD' }
                    ]}
                  >
                    <Text style={styles.waterGlassText}>💧</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.addWaterButton}>
                <Text style={styles.addWaterText}>➕ Add Glass</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Meals */}
          <Card style={styles.mealsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Today's Meals</Text>
              {lifestyleData?.nutrition?.meals?.map((meal: any, index: number) => (
                <View key={index} style={styles.mealItem}>
                  <View style={styles.mealInfo}>
                    <Text style={[
                      styles.mealType,
                      { color: meal.completed ? '#333' : '#999' }
                    ]}>
                      {meal.type}
                    </Text>
                    <Text style={[
                      styles.mealCalories,
                      { color: meal.completed ? '#666' : '#ccc' }
                    ]}>
                      {meal.calories} kcal
                    </Text>
                  </View>
                  <View style={[
                    styles.mealStatus,
                    { backgroundColor: meal.completed ? COLORS.nutrition + '20' : '#f0f0f0' }
                  ]}>
                    <Text style={styles.mealStatusText}>
                      {meal.completed ? '✓' : '○'}
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Habits Tab */}
      {activeTab === 'habits' && (
        <View style={styles.tabContent}>
          {/* Habit Score */}
          <Card style={styles.scoreCardHabit}>
            <Card.Content>
              <View style={styles.habitScoreContainer}>
                <View style={[styles.habitScoreCircle, { backgroundColor: COLORS.habits }]}>
                  <Text style={styles.habitScoreValue}>{lifestyleData?.habits?.score}</Text>
                </View>
                <View style={styles.habitScoreInfo}>
                  <Text style={styles.habitScoreLabel}>Habit Consistency</Text>
                  <Text style={styles.habitScoreText}>Keep up the great work!</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Streaks */}
          <Card style={styles.streaksCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Current Streaks</Text>
              {lifestyleData?.habits?.streaks?.map((streak: any, index: number) => (
                <View key={index} style={styles.streakItem}>
                  <View style={styles.streakInfo}>
                    <Text style={styles.streakName}>{streak.name}</Text>
                    <Text style={styles.streakProgress}>Best: {streak.best} days</Text>
                  </View>
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={styles.streakDays}>{streak.current}</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Daily Habits Checklist */}
          <Card style={styles.checklistCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Daily Checklist</Text>
              {lifestyleData?.habits?.dailyHabits?.map((habit: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.checklistItem}
                  onPress={() => toggleHabit(index)}
                >
                  <View style={[
                    styles.checklistBox,
                    { borderColor: habit.completed ? COLORS.lifestyle : '#ccc' }
                  ]}>
                    {habit.completed && (
                      <Text style={styles.checklistCheck}>✓</Text>
                    )}
                  </View>
                  <Text style={[
                    styles.checklistText,
                    { color: habit.completed ? '#666' : '#333' }
                  ]}>
                    {habit.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>

          {/* Add Habit */}
          <TouchableOpacity style={styles.addHabitButton}>
            <Text style={styles.addHabitText}>➕ Add New Habit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Insights */}
      <Text style={styles.sectionTitle}>Insights</Text>
      {lifestyleData?.insights?.map((insight: any) => (
        <Card
          key={insight.id}
          style={[
            styles.insightCard,
            { backgroundColor: insight.type === 'success' ? '#E8F5E9' : insight.type === 'warning' ? '#FFF3E0' : '#E3F2FD' }
          ]}
        >
          <Card.Content>
            <Text style={[
              styles.insightText,
              { color: insight.type === 'success' ? '#2E7D32' : insight.type === 'warning' ? '#E65100' : '#1976D2' }
            ]}>
              {insight.text}
            </Text>
          </Card.Content>
        </Card>
      ))}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scoreCard: {
    margin: 16,
    marginTop: -10,
    borderRadius: 16,
    elevation: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreInfo: {
    flex: 1,
    marginLeft: 16,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreItemEmoji: {
    fontSize: 20,
  },
  scoreItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tabContent: {
    padding: 16,
  },
  quickStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  quickStatCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  quickStatContent: {
    alignItems: 'center',
    padding: 12,
  },
  quickStatEmoji: {
    fontSize: 24,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#666',
  },
  habitsCard: {
    borderRadius: 16,
  },
  habitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  habitsChip: {
    height: 28,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  habitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.lifestyle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitCheck: {
    color: '#fff',
    fontWeight: 'bold',
  },
  habitText: {
    fontSize: 14,
    color: '#333',
  },
  progressCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  workoutsCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  workoutDay: {
    alignItems: 'center',
    width: 50,
  },
  workoutDayText: {
    fontSize: 12,
    color: '#666',
  },
  workoutStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  workoutStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.exercise,
  },
  workoutDetails: {
    flex: 1,
    marginLeft: 12,
  },
  workoutType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  workoutDuration: {
    fontSize: 12,
    color: '#666',
  },
  workoutEmoji: {
    fontSize: 28,
  },
  logButton: {
    backgroundColor: COLORS.exercise,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  caloriesCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  caloriesContainer: {
    alignItems: 'center',
  },
  caloriesMain: {
    alignItems: 'center',
    marginBottom: 16,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  caloriesGoal: {
    fontSize: 14,
    color: '#666',
  },
  caloriesProgress: {
    width: '100%',
    height: 10,
    borderRadius: 5,
  },
  macrosCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  waterCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterValue: {
    fontSize: 14,
    color: '#666',
  },
  waterGlasses: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  waterGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterGlassText: {
    fontSize: 20,
  },
  addWaterButton: {
    backgroundColor: COLORS.water,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addWaterText: {
    color: '#fff',
    fontWeight: '600',
  },
  mealsCard: {
    borderRadius: 16,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealCalories: {
    fontSize: 12,
  },
  mealStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.nutrition,
  },
  scoreCardHabit: {
    borderRadius: 16,
    marginBottom: 12,
  },
  habitScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitScoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  habitScoreInfo: {
    marginLeft: 16,
  },
  habitScoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  habitScoreText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  streaksCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  streakInfo: {
    flex: 1,
  },
  streakName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  streakProgress: {
    fontSize: 12,
    color: '#666',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  streakDays: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
  },
  checklistCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checklistBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checklistCheck: {
    color: COLORS.habits,
    fontWeight: 'bold',
    fontSize: 16,
  },
  checklistText: {
    fontSize: 14,
  },
  addHabitButton: {
    backgroundColor: COLORS.habits,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addHabitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  insightCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  insightText: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 100,
  },
});
