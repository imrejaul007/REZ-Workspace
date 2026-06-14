/**
 * REZ Business AI - Dashboard
 * Connected to Port 4059
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getHealth, getSuggestions, launchAction } from '../../services/api/ai';

const API = 'https://rez-business-ai.rezapp.com';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  estimatedImpact: { revenue: number; customers: number };
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface Health {
  score: number;
  revenue: number;
  customers: number;
  streak: number;
}

export default function AIDashboard() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<Health>({ score: 87, revenue: 12500, customers: 45, streak: 7 });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
      const sug = await fetch(`${API}/api/suggestions`);
      if (sug.ok) {
        const data = await sug.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (e) {
      // Use mock data
      setHealth({ score: 87, revenue: 12500, customers: 45, streak: 7 });
      setSuggestions([
        { id: '1', title: 'Weekend Rush', description: 'Launch campaign', reasoning: 'Historical data shows +40% weekend traffic', estimatedImpact: { revenue: 8000, customers: 40 }, confidence: 85, status: 'pending' },
        { id: '2', title: 'Win-Back', description: '3 customers at risk', reasoning: 'High-value customers inactive 14+ days', estimatedImpact: { revenue: 5000, customers: 15 }, confidence: 92, status: 'pending' },
      ]);
    }
    setLoading(false);
  }

  async function approve(id: string) {
    await fetch(`${API}/api/actions/${id}/approve`, { method: 'POST' });
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }

  async function dismiss(id: string) {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>AI is thinking...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Dashboard</Text>
        <Text style={styles.headerSub}>Powered by REZ Business AI</Text>
      </View>

      <View style={styles.health}>
        <Text style={styles.healthScore}>{health.score}</Text>
        <Text style={styles.healthLabel}>AI Health Score</Text>
        {health.streak > 0 && (
          <View style={styles.streak}>
            <Text>🔥</Text>
            <Text style={styles.streakText}>{health.streak} Day Streak</Text>
          </View>
        )}
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>₹{health.revenue.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Revenue</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{health.customers}</Text>
          <Text style={styles.metricLabel}>Customers</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Suggestions</Text>
        {suggestions.map(s => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <View style={styles.confidence}>
                <Text>{s.confidence}%</Text>
              </View>
            </View>
            <Text style={styles.reasoning}>{s.reasoning || s.description}</Text>
            <Text style={styles.impact}>
              +₹{s.estimatedImpact.revenue.toLocaleString()}
            </Text>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.dismiss} onPress={() => dismiss(s.id)}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approve} onPress={() => approve(s.id)}>
                <Text style={styles.approveText}>Launch</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {suggestions.length === 0 && (
          <View style={styles.empty}>
            <Text>✨ All caught up!</Text>
            <Text>New suggestions coming soon...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6366f1' },
  header: { backgroundColor: '#6366f1', padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  health: { backgroundColor: '#6366f1', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  healthScore: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  healthLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  streak: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  streakText: { color: '#fbbf24', fontWeight: '600', marginLeft: 6 },
  metrics: { flexDirection: 'row', paddingHorizontal: 12 },
  metric: { flex: 1, backgroundColor: '#fff', margin: 4, padding: 12, borderRadius: 8, alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: 'bold' },
  metricLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  confidence: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  reasoning: { fontSize: 13, color: '#64748b', marginTop: 8 },
  impact: { fontSize: 16, fontWeight: 'bold', color: '#16a34a', marginTop: 8 },
  buttons: { flexDirection: 'row', marginTop: 12 },
  dismiss: { flex: 1, backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, marginRight: 8, alignItems: 'center' },
  dismissText: { color: '#dc2626', fontWeight: '600' },
  approve: { flex: 1, backgroundColor: '#dcfce7', padding: 10, borderRadius: 8, alignItems: 'center' },
  approveText: { color: '#16a34a', fontWeight: '600' },
  empty: { backgroundColor: '#fff', padding: 24, borderRadius: 12, alignItems: 'center' },
});
