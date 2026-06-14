import { logger } from '../../shared/logger';
"""
AssetMind Mobile App
Expo React Native Application

The World's Financial Intelligence Infrastructure

Features:
- Asset Twins
- AI Predictions
- Daily Briefings
- Portfolio Tracking
- Watchlists

Version: 1.0.0
Date: June 9, 2026
"""

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

// API Configuration
// In production, set EXPO_PUBLIC_API_URL environment variable
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5260';

// Types
interface Twin {
  symbol: string;
  opportunity_score: number;
  risk_score: number;
  sentiment: number;
}

interface Asset {
  symbol: string;
  name: string;
  asset_class: string;
}

interface Prediction {
  symbol: string;
  bullish_probability: number;
  bearish_probability: number;
  confidence: number;
}

interface Briefing {
  briefing_id: string;
  title: string;
  summary: string;
  market_regime: string;
}

// Navigation
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// API Client
const api = axios.create({ baseURL: API_BASE });

// Home Screen
function HomeScreen({ navigation }: any) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    try {
      const response = await api.get('/api/v1/briefing');
      setBriefing(response.data);
    } catch (error) {
      logger.error('Failed to fetch briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AssetMind</Text>
      <Text style={styles.subtitle}>Financial Intelligence</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{briefing?.title || 'Daily Briefing'}</Text>
        <Text style={styles.cardSubtitle}>
          Market: {briefing?.market_regime || 'Unknown'}
        </Text>
        <Text style={styles.cardText} numberOfLines={3}>
          {briefing?.summary || 'Loading...'}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Briefing')}>
          <Text style={styles.buttonText}>View Full Briefing</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Discover')}>
          <Text style={styles.actionText}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Watchlist')}>
          <Text style={styles.actionText}>Watchlist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Portfolio')}>
          <Text style={styles.actionText}>Portfolio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Discover Screen
function DiscoverScreen() {
  const [twins, setTwins] = useState<Twin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await api.get('/api/v1/opportunities?limit=20');
      setTwins(response.data.opportunities || []);
    } catch (error) {
      logger.error('Failed to fetch opportunities:', error);
      // Fallback data
      setTwins([
        { symbol: 'NVDA', opportunity_score: 85, risk_score: 35, sentiment: 78 },
        { symbol: 'AAPL', opportunity_score: 78, risk_score: 28, sentiment: 72 },
        { symbol: 'MSFT', opportunity_score: 82, risk_score: 25, sentiment: 75 },
        { symbol: 'BTC', opportunity_score: 75, risk_score: 55, sentiment: 68 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderTwinItem = ({ item }: { item: Twin }) => (
    <TouchableOpacity style={styles.twinCard}>
      <View style={styles.twinHeader}>
        <Text style={styles.symbol}>{item.symbol}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{item.opportunity_score}</Text>
        </View>
      </View>
      <View style={styles.scoreRow}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Risk</Text>
          <Text style={styles.scoreValue}>{item.risk_score}</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Sentiment</Text>
          <Text style={styles.scoreValue}>{item.sentiment}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover Opportunities</Text>
      <FlatList
        data={twins}
        keyExtractor={(item) => item.symbol}
        renderItem={renderTwinItem}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchOpportunities}
      />
    </View>
  );
}

// Search Screen
function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/api/v1/search', {
        params: { q: text },
      });
      setResults(response.data.results || []);
    } catch (error) {
      logger.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item }: { item: Asset }) => (
    <TouchableOpacity style={styles.resultItem}>
      <Text style={styles.symbol}>{item.symbol}</Text>
      <Text style={styles.resultName}>{item.name}</Text>
      <Text style={styles.resultType}>{item.asset_class}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search symbols..."
          value={query}
          onChangeText={search}
          autoCapitalize="none"
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.symbol}
        renderItem={renderResult}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

// Watchlist Screen
function WatchlistScreen() {
  const [watchlist, setWatchlist] = useState<string[]>(['NVDA', 'AAPL', 'MSFT', 'BTC']);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    fetchPredictions();
  }, [watchlist]);

  const fetchPredictions = async () => {
    const results: Prediction[] = [];
    for (const symbol of watchlist) {
      try {
        const response = await api.get(`/api/v1/prediction/${symbol}`);
        results.push(response.data);
      } catch (error) {
        results.push({
          symbol,
          bullish_probability: 65,
          bearish_probability: 35,
          confidence: 75,
        });
      }
    }
    setPredictions(results);
  };

  const renderPrediction = ({ item, index }: { item: Prediction; index: number }) => (
    <TouchableOpacity style={styles.predictionCard}>
      <Text style={styles.symbol}>{item.symbol}</Text>
      <View style={styles.probRow}>
        <View style={styles.probItem}>
          <Text style={styles.probLabel}>Bull</Text>
          <Text style={[styles.probValue, { color: '#10B981' }]}>
            {item.bullish_probability}%
          </Text>
        </View>
        <View style={styles.probItem}>
          <Text style={styles.probLabel}>Bear</Text>
          <Text style={[styles.probValue, { color: '#EF4444' }]}>
            {item.bearish_probability}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Watchlist</Text>
      <FlatList
        data={predictions}
        keyExtractor={(item) => item.symbol}
        renderItem={renderPrediction}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

// Briefing Screen
function BriefingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Briefing</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Market Overview</Text>
        <Text style={styles.cardText}>
          Markets showing mixed signals with tech stocks leading gains.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Key Events Today</Text>
        <Text style={styles.cardText}>
          Earnings from major banks, Fed speakers scheduled.
        </Text>
      </View>
    </View>
  );
}

// Portfolio Screen
function PortfolioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portfolio</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Value</Text>
        <Text style={styles.valueText}>$125,450.00</Text>
        <Text style={styles.changeText}>+$2,340.00 (1.9%)</Text>
      </View>
    </View>
  );
}

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
    </Tab.Navigator>
  );
}

// Main App
export default function App() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6366F1',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  list: {
    paddingBottom: 20,
  },
  twinCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  twinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  symbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreContainer: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchBar: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  resultItem: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  resultName: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  resultType: {
    fontSize: 12,
    color: '#6366F1',
    marginTop: 4,
  },
  predictionCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  probRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  probItem: {
    alignItems: 'center',
  },
  probLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  probValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  valueText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  changeText: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 4,
  },
});
