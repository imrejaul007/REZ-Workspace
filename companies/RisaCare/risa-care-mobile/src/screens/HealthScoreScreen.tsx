// RisaCare Mobile - Health Score Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScoreCategory {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  icon: string;
  color: string;
  factors: Factor[];
  trend: 'up' | 'down' | 'stable';
}

interface Factor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface HealthScore {
  overall: number;
  maxOverall: number;
  grade: string;
  categories: ScoreCategory[];
  recommendations: string[];
  lastUpdated: string;
}

const { width } = Dimensions.get('window');

export default function HealthScoreScreen() {
  const [score, setScore] = useState<HealthScore | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadHealthScore();
  }, []);

  const loadHealthScore = () => {
    // Mock data
    const mockScore: HealthScore = {
      overall: 78,
      maxOverall: 100,
      grade: 'B+',
      lastUpdated: new Date().toISOString(),
      categories: [
        {
          id: 'vital',
          name: 'Vital Health',
          score: 85,
          maxScore: 100,
          icon: '❤️',
          color: '#F44336',
          trend: 'up',
          factors: [
            { name: 'Blood Pressure', impact: 'positive', description: 'Normal range (120/80)' },
            { name: 'Heart Rate', impact: 'positive', description: 'Resting HR: 72 bpm' },
            { name: 'BMI', impact: 'neutral', description: 'Within healthy range' },
          ],
        },
        {
          id: 'metabolic',
          name: 'Metabolic Health',
          score: 72,
          maxScore: 100,
          icon: '⚡',
          color: '#FF9800',
          trend: 'stable',
          factors: [
            { name: 'Blood Sugar', impact: 'positive', description: 'Fasting: 95 mg/dL' },
            { name: 'Cholesterol', impact: 'negative', description: 'LDL slightly elevated' },
            { name: 'Thyroid', impact: 'positive', description: 'TSH: 2.5 mIU/L (normal)' },
          ],
        },
        {
          id: 'nutrition',
          name: 'Nutrition',
          score: 68,
          maxScore: 100,
          icon: '🥗',
          color: '#4CAF50',
          trend: 'up',
          factors: [
            { name: 'Diet Balance', impact: 'neutral', description: 'Room for improvement' },
            { name: 'Water Intake', impact: 'negative', description: 'Only 5 glasses/day (target: 8)' },
            { name: 'Vegetables', impact: 'positive', description: 'Good variety' },
          ],
        },
        {
          id: 'activity',
          name: 'Physical Activity',
          score: 55,
          maxScore: 100,
          icon: '🏃',
          color: '#2196F3',
          trend: 'down',
          factors: [
            { name: 'Daily Steps', impact: 'negative', description: '5,200 steps (target: 10,000)' },
            { name: 'Exercise', impact: 'neutral', description: '3 sessions/week' },
            { name: 'Sedentary Time', impact: 'negative', description: '8+ hours/day' },
          ],
        },
        {
          id: 'mental',
          name: 'Mental Wellness',
          score: 82,
          maxScore: 100,
          icon: '🧘',
          color: '#9C27B0',
          trend: 'stable',
          factors: [
            { name: 'Sleep Quality', impact: 'positive', description: '7.5 hours average' },
            { name: 'Stress Level', impact: 'positive', description: 'Moderate and manageable' },
            { name: 'Mood', impact: 'positive', description: 'Generally positive' },
          ],
        },
        {
          id: 'preventive',
          name: 'Preventive Care',
          score: 90,
          maxScore: 100,
          icon: '🛡️',
          color: '#00BCD4',
          trend: 'stable',
          factors: [
            { name: 'Vaccinations', impact: 'positive', description: 'All up to date' },
            { name: 'Health Checkups', impact: 'positive', description: 'Annual checkup completed' },
            { name: 'Screenings', impact: 'positive', description: 'All recommended done' },
          ],
        },
      ],
      recommendations: [
        'Increase daily water intake to 8 glasses',
        'Aim for 10,000 steps daily',
        'Schedule a follow-up for cholesterol',
        'Continue regular exercise routine',
      ],
    };
    setScore(mockScore);
  };

  const getGrade = (score: number): { letter: string; color: string } => {
    if (score >= 90) return { letter: 'A', color: '#4CAF50' };
    if (score >= 80) return { letter: 'B+', color: '#8BC34A' };
    if (score >= 70) return { letter: 'B', color: '#CDDC39' };
    if (score >= 60) return { letter: 'C', color: '#FFEB3B' };
    if (score >= 50) return { letter: 'D', color: '#FF9800' };
    return { letter: 'F', color: '#F44336' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  if (!score) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const gradeInfo = getGrade(score.overall);
  const percentage = Math.round((score.overall / score.maxOverall) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Health Score</Text>
          <Text style={styles.headerSubtitle}>Last updated: {new Date(score.lastUpdated).toLocaleDateString()}</Text>
        </View>

        {/* Main Score Card */}
        <View style={styles.mainScoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNumber, { color: gradeInfo.color }]}>{score.overall}</Text>
            <Text style={styles.scoreMax}>/{score.maxOverall}</Text>
          </View>
          <View style={[styles.gradeBadge, { backgroundColor: gradeInfo.color }]}>
            <Text style={styles.gradeText}>{gradeInfo.grade}</Text>
          </View>
          <Text style={styles.scoreLabel}>Overall Health Score</Text>
          <Text style={styles.scorePercentile}>{percentage}% optimal health</Text>
        </View>

        {/* Category Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          {score.categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                  <Text style={styles.categoryIconText}>{cat.icon}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryScore}>{cat.score}/{cat.maxScore}</Text>
                </View>
                <View style={styles.categoryRight}>
                  <View style={[styles.miniProgress, { backgroundColor: cat.color, width: (cat.score / cat.maxScore) * 40 }]} />
                  <Text style={styles.trendIcon}>{getTrendIcon(cat.trend)}</Text>
                </View>
              </View>

              {/* Expanded Details */}
              {selectedCategory === cat.id && (
                <View style={styles.categoryDetails}>
                  {cat.factors.map((factor, idx) => (
                    <View key={idx} style={styles.factorRow}>
                      <View style={[styles.factorDot, {
                        backgroundColor: factor.impact === 'positive' ? '#4CAF50' : factor.impact === 'negative' ? '#F44336' : '#FF9800'
                      }]} />
                      <View style={styles.factorInfo}>
                        <Text style={styles.factorName}>{factor.name}</Text>
                        <Text style={styles.factorDesc}>{factor.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Personalized Recommendations</Text>
          {score.recommendations.map((rec, idx) => (
            <View key={idx} style={styles.recommendationCard}>
              <Text style={styles.recommendationNumber}>{idx + 1}</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>How to Improve</Text>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>🎯</Text>
            <Text style={styles.tipText}>Track daily to see gradual improvements</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>📊</Text>
            <Text style={styles.tipText}>Upload health reports for accurate scores</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>🏥</Text>
            <Text style={styles.tipText}>Regular checkups improve preventive care score</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Health scores are estimates based on available data. Not a medical diagnosis.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loading: { fontSize: 16, textAlign: 'center', marginTop: 50 },
  header: { padding: 20, backgroundColor: '#2196F3' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  mainScoreCard: { backgroundColor: '#FFF', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center', elevation: 2 },
  scoreCircle: { flexDirection: 'row', alignItems: 'baseline' },
  scoreNumber: { fontSize: 64, fontWeight: 'bold' },
  scoreMax: { fontSize: 24, color: '#999' },
  gradeBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginTop: 8 },
  gradeText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scoreLabel: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 12 },
  scorePercentile: { fontSize: 14, color: '#666', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12 },
  categoryCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 8, elevation: 1 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  categoryIconText: { fontSize: 20 },
  categoryInfo: { flex: 1, marginLeft: 12 },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#333' },
  categoryScore: { fontSize: 14, color: '#666', marginTop: 2 },
  categoryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniProgress: { height: 6, borderRadius: 3 },
  trendIcon: { fontSize: 14 },
  categoryDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EEE' },
  factorRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  factorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 12 },
  factorInfo: { flex: 1 },
  factorName: { fontSize: 14, fontWeight: '500', color: '#333' },
  factorDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  recommendationCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 8, alignItems: 'center' },
  recommendationNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E3F2FD', textAlign: 'center', lineHeight: 28, fontSize: 14, fontWeight: 'bold', color: '#1976D2', marginRight: 12 },
  recommendationText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  tipCard: { backgroundColor: '#E8F5E9', margin: 16, padding: 16, borderRadius: 12 },
  tipTitle: { fontSize: 16, fontWeight: '600', color: '#2E7D32', marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tipIcon: { fontSize: 16, marginRight: 12 },
  tipText: { flex: 1, fontSize: 14, color: '#333' },
  disclaimer: { padding: 16, alignItems: 'center' },
  disclaimerText: { fontSize: 12, color: '#999', textAlign: 'center' },
});
