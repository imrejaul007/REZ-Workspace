import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DoctorsScreen from './src/screens/DoctorsScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DoctorDetailScreen from './src/screens/DoctorDetailScreen';
import BookAppointmentScreen from './src/screens/BookAppointmentScreen';
import ConsultationScreen from './src/screens/ConsultationScreen';
import LabTestsScreen from './src/screens/LabTestsScreen';
import PharmacyScreen from './src/screens/PharmacyScreen';
import HealthWalletScreen from './src/screens/HealthWalletScreen';

// Theme
export const COLORS = {
  primary: '#00B4D8',
  secondary: '#0077B6',
  accent: '#90E0EF',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textLight: '#6C757D',
  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: { paddingBottom: 5, paddingTop: 5, height: 60 },
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Doctors" component={DoctorsScreen} />
      <Tab.Screen name="Records" component={RecordsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
        <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
        <Stack.Screen name="Consultation" component={ConsultationScreen} />
        <Stack.Screen name="LabTests" component={LabTestsScreen} />
        <Stack.Screen name="Pharmacy" component={PharmacyScreen} />
        <Stack.Screen name="HealthWallet" component={HealthWalletScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
