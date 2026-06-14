// ==========================================
// CorpPerks Client App - Main Navigator
// ==========================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../utils/theme';

// Import Screens
import DashboardScreen from '../app/(tabs)/index';
import ProjectsListScreen from '../app/(tabs)/projects';
import InvoicesListScreen from '../app/(tabs)/invoices';
import MessagesListScreen from '../app/(tabs)/messages';
import ProjectDetailScreen from '../app/project/[id]';

// Type definitions
export type RootStackParamList = {
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Projects: undefined;
  Invoices: undefined;
  Messages: undefined;
};

export type ProjectStackParamList = {
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ProjectStackNav = createNativeStackNavigator<ProjectStackParamList>();

// Tab Icon Component
interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
  badge?: number;
}

function TabIcon({ icon, label, focused, badge }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <View>
        <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

// Project Stack Navigator
function ProjectStackNavigator() {
  return (
    <ProjectStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ProjectStackNav.Screen
        name="ProjectList"
        component={ProjectsListScreen}
        options={{ title: 'Projects' }}
      />
      <ProjectStackNav.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ title: 'Project Details' }}
      />
    </ProjectStackNav.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const totalUnread = 2; // This would come from store in real app

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="dashboard" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="folder" label="Projects" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoicesListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="receipt" label="Invoices" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="chat"
              label="Messages"
              focused={focused}
              badge={totalUnread}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <MainTabNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  tabIconFocused: {
    color: Colors.primary,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: Colors.primary,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
});
