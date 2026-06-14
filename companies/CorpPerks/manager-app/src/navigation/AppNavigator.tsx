// ==========================================
// CorpPerks Manager App - Main Navigator
// ==========================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../utils/theme';

// Import Screens
import DashboardScreen from '../app/index';
import TeamListScreen from '../app/team/index';
import TeamMemberDetailScreen from '../app/team/[id]';
import AttendanceOverviewScreen from '../app/attendance/index';
import AttendanceReviewScreen from '../app/attendance/review';
import LeaveOverviewScreen from '../app/leave/index';
import LeaveApprovalsScreen from '../app/leave/approve';
import PerformanceOverviewScreen from '../app/performance/index';
import PerformanceReviewScreen from '../app/performance/review';
import OneOnOneOverviewScreen from '../app/1on1/index';
import ScheduleMeetingScreen from '../app/1on1/schedule';
import ReportsScreen from '../app/reports/index';

// Type definitions
export type RootStackParamList = {
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Team: undefined;
  Attendance: undefined;
  Leave: undefined;
  Performance: undefined;
  OneOnOne: undefined;
  Reports: undefined;
};

export type TeamStackParamList = {
  TeamList: undefined;
  TeamMemberDetail: { memberId: string };
};

export type AttendanceStackParamList = {
  AttendanceOverview: undefined;
  AttendanceReview: undefined;
};

export type LeaveStackParamList = {
  LeaveOverview: undefined;
  LeaveApprovals: undefined;
};

export type PerformanceStackParamList = {
  PerformanceOverview: undefined;
  PerformanceReview: undefined;
};

export type OneOnOneStackParamList = {
  OneOnOneOverview: undefined;
  ScheduleMeeting: { employeeId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const TeamStackNav = createNativeStackNavigator<TeamStackParamList>();
const AttendanceStackNav = createNativeStackNavigator<AttendanceStackParamList>();
const LeaveStackNav = createNativeStackNavigator<LeaveStackParamList>();
const PerformanceStackNav = createNativeStackNavigator<PerformanceStackParamList>();
const OneOnOneStackNav = createNativeStackNavigator<OneOnOneStackParamList>();

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

// Team Stack Navigator
function TeamStackNavigator() {
  return (
    <TeamStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <TeamStackNav.Screen
        name="TeamList"
        component={TeamListScreen}
        options={{ title: 'My Team' }}
      />
      <TeamStackNav.Screen
        name="TeamMemberDetail"
        component={TeamMemberDetailScreen}
        options={{ title: 'Team Member' }}
      />
    </TeamStackNav.Navigator>
  );
}

// Attendance Stack Navigator
function AttendanceStackNavigator() {
  return (
    <AttendanceStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <AttendanceStackNav.Screen
        name="AttendanceOverview"
        component={AttendanceOverviewScreen}
        options={{ title: 'Attendance' }}
      />
      <AttendanceStackNav.Screen
        name="AttendanceReview"
        component={AttendanceReviewScreen}
        options={{ title: 'Review Requests' }}
      />
    </AttendanceStackNav.Navigator>
  );
}

// Leave Stack Navigator
function LeaveStackNavigator() {
  return (
    <LeaveStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <LeaveStackNav.Screen
        name="LeaveOverview"
        component={LeaveOverviewScreen}
        options={{ title: 'Leave Management' }}
      />
      <LeaveStackNav.Screen
        name="LeaveApprovals"
        component={LeaveApprovalsScreen}
        options={{ title: 'Leave Approvals' }}
      />
    </LeaveStackNav.Navigator>
  );
}

// Performance Stack Navigator
function PerformanceStackNavigator() {
  return (
    <PerformanceStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <PerformanceStackNav.Screen
        name="PerformanceOverview"
        component={PerformanceOverviewScreen}
        options={{ title: 'Performance' }}
      />
      <PerformanceStackNav.Screen
        name="PerformanceReview"
        component={PerformanceReviewScreen}
        options={{ title: 'Performance Review' }}
      />
    </PerformanceStackNav.Navigator>
  );
}

// 1:1 Stack Navigator
function OneOnOneStackNavigator() {
  return (
    <OneOnOneStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <OneOnOneStackNav.Screen
        name="OneOnOneOverview"
        component={OneOnOneOverviewScreen}
        options={{ title: '1:1 Meetings' }}
      />
      <OneOnOneStackNav.Screen
        name="ScheduleMeeting"
        component={ScheduleMeetingScreen}
        options={{ title: 'Schedule Meeting' }}
      />
    </OneOnOneStackNav.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
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
            <TabIcon icon="dashboard" label="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Team"
        component={TeamStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="people" label="Team" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="schedule" label="Attendance" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="event_busy" label="Leave" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Performance"
        component={PerformanceStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="trending_up" label="Performance" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="OneOnOne"
        component={OneOnOneStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="chat" label="1:1" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="assessment" label="Reports" focused={focused} />
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
