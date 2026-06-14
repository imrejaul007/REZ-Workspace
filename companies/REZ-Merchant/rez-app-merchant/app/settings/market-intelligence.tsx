/**
 * Market Intelligence Consent Screen
 * GDPR-compliant data sharing opt-in/opt-out
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ActivityIndicator } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Info, CheckCircle, XCircle } from 'lucide-react';

interface ConsentStatus {
  optedIn: boolean;
  consentDate?: string;
  benefits: string[];
}

export function MarketIntelligenceConsent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<ConsentStatus>({
    optedIn: false,
    benefits: [
      'Compare your performance with local competitors',
      'Access industry benchmarks and trends',
      'Discover growth opportunities',
      'Get AI-powered recommendations',
    ],
  });

  useEffect(() => {
    fetchConsentStatus();
  }, []);

  const fetchConsentStatus = async () => {
    try {
      const response = await fetch('/api/merchant/intelligence/market/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch consent status:', error);
    }
    setLoading(false);
  };

  const handleOptIn = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/merchant/intelligence/market/opt-in', {
        method: 'POST',
      });

      if (response.ok) {
        Alert.alert(
          'Welcome to Market Intelligence!',
          'You now have access to industry benchmarks, competitor analysis, and growth insights.',
          [{ text: 'Got it!' }]
        );
        setStatus({ ...status, optedIn: true, consentDate: new Date().toISOString() });
      } else {
        Alert.alert('Error', 'Failed to opt in. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    }
    setSaving(false);
  };

  const handleOptOut = () => {
    Alert.alert(
      'Opt Out of Market Intelligence',
      'You will lose access to benchmarks and competitor insights. Your historical data will be anonymized and retained for aggregated analytics only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Opt Out',
          style: 'destructive',
          onPress: performOptOut,
        },
      ]
    );
  };

  const performOptOut = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/merchant/intelligence/market/opt-out', {
        method: 'POST',
      });

      if (response.ok) {
        Alert.alert(
          'Opted Out',
          'You have been removed from the Market Intelligence program. Your data will no longer be shared.',
          [{ text: 'OK' }]
        );
        setStatus({ ...status, optedIn: false, consentDate: undefined });
      } else {
        Alert.alert('Error', 'Failed to opt out. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Market Intelligence Program
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.optedIn ? (
            <>
              <View className="flex-row items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <Text className="text-green-800 font-medium">
                  You're participating
                </Text>
              </View>

              <Text className="text-gray-600">
                Your anonymized data helps create industry benchmarks and insights.
                You can opt out anytime.
              </Text>

              <View className="space-y-2">
                <Text className="font-medium text-gray-900">Your Benefits:</Text>
                {status.benefits.map((benefit, index) => (
                  <View key={index} className="flex-row items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Text className="text-gray-600">{benefit}</Text>
                  </View>
                ))}
              </View>

              <Button
                variant="outline"
                onPress={handleOptOut}
                disabled={saving}
                className="mt-4"
              >
                {saving ? 'Processing...' : 'Opt Out'}
              </Button>
            </>
          ) : (
            <>
              <View className="flex-row items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
                <Text className="text-blue-800 text-sm">
                  Join to unlock powerful insights
                </Text>
              </View>

              <Text className="text-gray-600">
                Share anonymized data to access industry benchmarks, competitor
                analysis, and AI-powered recommendations.
              </Text>

              <View className="space-y-2">
                <Text className="font-medium text-gray-900">What we collect (anonymized):</Text>
                <Text className="text-sm text-gray-500">
                  • Order counts and values (no personal data)
                </Text>
                <Text className="text-sm text-gray-500">
                  • Peak hours and popular items
                </Text>
                <Text className="text-sm text-gray-500">
                  • Location (neighborhood level only)
                </Text>
              </View>

              <View className="space-y-2">
                <Text className="font-medium text-gray-900">What we NEVER collect:</Text>
                <Text className="text-sm text-gray-500">
                  • Customer names or phone numbers
                </Text>
                <Text className="text-sm text-gray-500">
                  • Individual transactions
                </Text>
                <Text className="text-sm text-gray-500">
                  • Bank or payment details
                </Text>
              </View>

              <View className="space-y-2">
                <Text className="font-medium text-gray-900">What you unlock:</Text>
                {status.benefits.map((benefit, index) => (
                  <View key={index} className="flex-row items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <Text className="text-gray-600">{benefit}</Text>
                  </View>
                ))}
              </View>

              <Button onPress={handleOptIn} disabled={saving} className="mt-4">
                {saving ? 'Joining...' : 'Join Market Intelligence'}
              </Button>

              <Text className="text-xs text-gray-400 text-center">
                You can opt out anytime. Your data will be removed within 30 days.
              </Text>
            </>
          )}
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
});
