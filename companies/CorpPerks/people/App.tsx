import { logger } from '../../shared/logger';
// ==========================================
// MyTalent - Employee Life OS
// Main App Entry Point with Auth Integration
// ==========================================

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { configureNotifications, requestPermissions } from './src/services/notificationsService';
import { useAppStore } from './src/store/useAppStore';
import { useAuthStore } from './src/store/authStore';
import { mockEmployee, mockLeaveBalance, mockCorpIDProfile, mockFinancialHealth, mockPayslips, mockBenefits, mockPartnerOffers, mockSkillGaps, mockInternalJobs, mockTasks, mockProductivityStats } from './src/data/mockData';

// ==========================================
// App Loader Component
// ==========================================

function AppLoader({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  const { initialize } = useAuthStore();
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

  useEffect(() => {
    // Initialize app data and auth
    const init = async () => {
      try {
        // Initialize auth state from storage
        await initialize();

        // Set mock data for demo
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

        // Configure notifications
        configureNotifications();
        requestPermissions();
      } catch (error) {
        logger.error('App initialization error:', error);
      } finally {
        setIsReady(true);
      }
    };

    init();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
          <StatusBar style="light" />
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

// ==========================================
// Main App Component
// ==========================================

export default function App() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
            <StatusBar style="light" />
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <AppLoader>
          {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </AppLoader>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
