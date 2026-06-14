import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Web-compatible RBAC import
let useRBAC;
if (Platform.OS !== 'web') {
  useRBAC = require('@/hooks/useRBAC').useRBAC;
}

export default function AnalyticsLayout() {
  const colorScheme = useColorScheme();

  // Web-compatible version
  if (Platform.OS === 'web') {
    return (
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].primary,
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Analytics',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="overview"
          options={{
            title: 'Analytics Overview',
          }}
        />
        <Stack.Screen
          name="sales"
          options={{
            title: 'Sales Analytics',
          }}
        />
        <Stack.Screen
          name="customers"
          options={{
            title: 'Customer Analytics',
          }}
        />
        <Stack.Screen
          name="inventory"
          options={{
            title: 'Inventory Analytics',
          }}
        />
        <Stack.Screen
          name="products"
          options={{
            title: 'Product Performance',
          }}
        />
        <Stack.Screen
          name="revenue"
          options={{
            title: 'Revenue Breakdown',
          }}
        />
        <Stack.Screen
          name="trends"
          options={{
            title: 'Trend Analysis',
          }}
        />
        <Stack.Screen
          name="forecast"
          options={{
            title: 'Sales Forecast',
          }}
        />
        <Stack.Screen
          name="export"
          options={{
            title: 'Export Analytics',
          }}
        />
        {/* GAP FIX #5 — Store Performance Comparison screen (web) */}
        <Stack.Screen
          name="stores-compare"
          options={{
            title: 'Store Comparison',
          }}
        />
        <Stack.Screen
          name="rez-summary"
          options={{
            title: 'REZ Analytics',
          }}
        />
        <Stack.Screen
          name="cohorts"
          options={{
            title: 'Cohort Retention',
          }}
        />
        <Stack.Screen
          name="comparison"
          options={{
            title: 'Period Comparison',
          }}
        />
        <Stack.Screen
          name="peak-hours"
          options={{
            title: 'Peak Hours',
          }}
        />
        <Stack.Screen
          name="web-feedback"
          options={{
            title: 'Web Menu Feedback',
          }}
        />
      </Stack>
    );
  }

  // Native version with RBAC
  const { hasPermission } = useRBAC();

  // Check for analytics view permission
  const canViewAnalytics = hasPermission('analytics:view');

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Analytics',
          headerShown: true,
        }}
      />

      {canViewAnalytics && (
        <>
          <Stack.Screen
            name="overview"
            options={{
              title: 'Analytics Overview',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="sales"
            options={{
              title: 'Sales Analytics',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="customers"
            options={{
              title: 'Customer Analytics',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="inventory"
            options={{
              title: 'Inventory Analytics',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="products"
            options={{
              title: 'Product Performance',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="revenue"
            options={{
              title: 'Revenue Breakdown',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="trends"
            options={{
              title: 'Trend Analysis',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="forecast"
            options={{
              title: 'Sales Forecast',
              headerShown: true,
            }}
          />
        </>
      )}

      {/* GAP FIX #5 — Store Performance Comparison screen */}
      {canViewAnalytics && (
        <Stack.Screen
          name="stores-compare"
          options={{
            title: 'Store Comparison',
            headerShown: true,
          }}
        />
      )}

      {canViewAnalytics && (
        <Stack.Screen
          name="rez-summary"
          options={{
            title: 'REZ Analytics',
            headerShown: true,
          }}
        />
      )}

      {canViewAnalytics && (
        <Stack.Screen
          name="cohorts"
          options={{
            title: 'Cohort Retention',
            headerShown: true,
          }}
        />
      )}

      {canViewAnalytics && (
        <Stack.Screen
          name="comparison"
          options={{
            title: 'Period Comparison',
            headerShown: true,
          }}
        />
      )}

      {canViewAnalytics && (
        <Stack.Screen
          name="peak-hours"
          options={{
            title: 'Peak Hours',
            headerShown: true,
          }}
        />
      )}

      {canViewAnalytics && (
        <Stack.Screen
          name="web-feedback"
          options={{
            title: 'Web Menu Feedback',
            headerShown: true,
          }}
        />
      )}

      {hasPermission('analytics:export') && (
        <Stack.Screen
          name="export"
          options={{
            title: 'Export Analytics',
            headerShown: true,
            presentation: 'modal',
          }}
        />
      )}
    </Stack>
  );
}
