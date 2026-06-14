// RisaCare Mobile App - Main Entry Point

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import UploadScreen from './src/screens/UploadScreen';
import AIAssistantScreen from './src/screens/AIAssistantScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BookingScreen from './src/screens/BookingScreen';
import WellnessScreen from './src/screens/WellnessScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import FamilyScreen from './src/screens/FamilyScreen';
import RecordDetailScreen from './src/screens/RecordDetailScreen';
import DoctorDetailScreen from './src/screens/DoctorDetailScreen';
import AppointmentScreen from './src/screens/AppointmentScreen';
import PregnancyScreen from './src/screens/PregnancyScreen';
import VaccinationScreen from './src/screens/VaccinationScreen';
import MedicationScreen from './src/screens/MedicationScreen';
import SymptomCheckerScreen from './src/screens/SymptomCheckerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HealthScoreScreen from './src/screens/HealthScoreScreen';
import RiskAlertsScreen from './src/screens/RiskAlertsScreen';

// Types
export type RootStackParamList = {
  Main: undefined;
  RecordDetail: { recordId: string };
  DoctorDetail: { doctorId: string };
  Appointment: { doctorId?: string; appointmentId?: string };
  AIAssistant: { mode?: 'symptoms' | 'interpret' | 'copilot' };
  Pregnancy: undefined;
  Medication: undefined;
  SymptomChecker: undefined;
  HealthScore: undefined;
  RiskAlerts: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Records: undefined;
  AI: undefined;
  Wellness: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab Icon Component
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 20 }}>{getTabIcon(name)}</Text>
    <Text style={{ fontSize: 10, color: focused ? '#007AFF' : '#999' }}>{name}</Text>
  </View>
);

const getTabIcon = (name: string): string => {
  const icons: Record<string, string> = {
    Home: '🏠',
    Records: '📋',
    AI: '🤖',
    Wellness: '💪',
    Pregnancy: '👶',
    Vaccination: '💉',
    Profile: '👤'
  };
  return icons[name] || '📱';
};

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'RisaCare' }} />
      <Tab.Screen name="Records" component={RecordsScreen} options={{ title: 'Health Records' }} />
      <Tab.Screen name="AI" component={AIAssistantScreen} options={{ title: 'AI Assistant' }} />
      <Tab.Screen name="Wellness" component={WellnessScreen} options={{ title: 'Wellness' }} />
      <Tab.Screen name="Pregnancy" component={PregnancyScreen} options={{ title: 'Pregnancy' }} />
      <Tab.Screen name="Vaccination" component={VaccinationScreen} options={{ title: 'Vaccine' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RecordDetail"
          component={RecordDetailScreen}
          options={{ title: 'Report Details' }}
        />
        <Stack.Screen
          name="DoctorDetail"
          component={DoctorDetailScreen}
          options={{ title: 'Doctor Profile' }}
        />
        <Stack.Screen
          name="Appointment"
          component={AppointmentScreen}
          options={{ title: 'Book Appointment' }}
        />
        <Stack.Screen
          name="AIAssistant"
          component={AIAssistantScreen}
          options={{ title: 'AI Health Assistant' }}
        />
        <Stack.Screen
          name="Pregnancy"
          component={PregnancyScreen}
          options={{ title: 'Pregnancy Tracker' }}
        />
        <Stack.Screen
          name="Vaccination"
          component={VaccinationScreen}
          options={{ title: 'Vaccination Tracker' }}
        />
        <Stack.Screen
          name="Medication"
          component={MedicationScreen}
          options={{ title: 'Medications' }}
        />
        <Stack.Screen
          name="SymptomChecker"
          component={SymptomCheckerScreen}
          options={{ title: 'Symptom Checker' }}
        />
        <Stack.Screen
          name="HealthScore"
          component={HealthScoreScreen}
          options={{ title: 'Health Score' }}
        />
        <Stack.Screen
          name="RiskAlerts"
          component={RiskAlertsScreen}
          options={{ title: 'Health Alerts' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
