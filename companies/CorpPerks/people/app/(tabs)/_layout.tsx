// ==========================================
// MyTalent - Tabs Layout
// Main app navigation with bottom tabs
// ==========================================

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useAppStore } from '../../src/store/useAppStore';
import { mockEmployee, mockLeaveBalance, mockCorpIDProfile, mockFinancialHealth, mockPayslips, mockBenefits, mockPartnerOffers, mockSkillGaps, mockInternalJobs, mockTasks, mockProductivityStats } from '../../src/data/mockData';

// ==========================================
// Colors
// ==========================================

const COLORS = {
  primary: '#6366F1',
  card: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
};

// ==========================================
// Tab Icon Component
// ==========================================

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

// ==========================================
// Tabs Layout Component
// ==========================================

export default function TabsLayout() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const {
    setEmployee,
    setLeaveBalance,
    setCorpIDProfile,
    setFinancialHealth,
    setPayslips,
    setBenefits,
    setOffers,
    setSkillGaps,
    setInternalJobs,
    setTasks,
    setProductivityStats,
  } = useAppStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/auth/login');
    } else if (isAuthenticated) {
      // Initialize app data when authenticated
      setEmployee(mockEmployee);
      setLeaveBalance(mockLeaveBalance);
      setCorpIDProfile(mockCorpIDProfile);
      setFinancialHealth(mockFinancialHealth);
      setPayslips(mockPayslips);
      setBenefits(mockBenefits);
      setOffers(mockPartnerOffers);
      setSkillGaps(mockSkillGaps);
      setInternalJobs(mockInternalJobs);
      setTasks(mockTasks);
      setProductivityStats(mockProductivityStats);
    }
  }, [isInitialized, isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: 'Work',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💼" label="Work" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: 'Pay',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💰" label="Pay" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="benefits"
        options={{
          title: 'Benefits',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🎁" label="Benefits" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="money"
        options={{
          title: 'Money',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💸" label="Money" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="career"
        options={{
          title: 'Career',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📈" label="Career" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wealth"
        options={{
          title: 'Wealth',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💎" label="Wealth" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profile" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💬" label="Team" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-hub"
        options={{
          title: 'AI Hub',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🤖" label="AI" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === 'ios' ? 85 : 70,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelFocused: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
