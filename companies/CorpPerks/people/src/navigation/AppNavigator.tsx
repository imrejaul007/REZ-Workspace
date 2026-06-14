// ==========================================
// MyTalent - App Navigator
// Bottom Tab Navigation
// ==========================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { Colors } from '../components/Badge';

// Import Tab Screens
import HomeScreen from '../app/(tabs)/index';
import WorkScreen from '../app/(tabs)/work';
import PayScreen from '../app/(tabs)/pay';
import BenefitsScreen from '../app/(tabs)/benefits';
import MoneyScreen from '../app/(tabs)/money';
import CareerScreen from '../app/(tabs)/career';
import WealthScreen from '../app/(tabs)/wealth';
import ProfileScreen from '../app/(tabs)/profile';
import TeamScreen from '../app/(tabs)/team';

// Import Stack Screens
import AttendanceScreen from '../app/work/attendance';
import LeaveScreen from '../app/work/leave';
import TasksScreen from '../app/work/tasks';
import ProductivityScreen from '../app/work/productivity';

import PayslipDetailScreen from '../app/pay/payslip-detail';

import HealthBenefitsScreen from '../app/benefits/health';
import OffersScreen from '../app/benefits/offers';

import SalaryAdvanceScreen from '../app/money/salary-advance';
import CreditCardsScreen from '../app/money/credit-cards';
import LoansScreen from '../app/money/loans';
import InsuranceScreen from '../app/money/insurance';

import SkillGapScreen from '../app/career/skill-gap';
import CareerPathsScreen from '../app/career/career-paths';
import AICoachScreen from '../app/career/ai-coach';
import InternalMobilityScreen from '../app/career/internal-mobility';
import OpportunitiesScreen from '../app/career/opportunities';

import CorpIDScreen from '../app/profile/corpid';
import ProfessionalPassportScreen from '../app/profile/professional-passport';
import TrustWalletScreen from '../app/profile/trust-wallet';
import DocumentsScreen from '../app/profile/documents';
import DirectoryScreen from '../app/profile/directory';
import SupportScreen from '../app/profile/support';
import AICopilotScreen from '../app/profile/ai-copilot';

// Wealth screens
import WealthPropertiesScreen from '../app/wealth/properties';
import WealthInvestmentsScreen from '../app/wealth/investments';
import WealthRetirementScreen from '../app/wealth/retirement';
import WealthInsuranceScreen from '../app/wealth/insurance';

// Team screens
import TeamAnnouncementsScreen from '../app/team/announcements';
import TeamMeetingsScreen from '../app/team/meetings';
import ChatScreen from '../app/team/chat';

// Type definitions
export type RootTabParamList = {
  Home: undefined;
  Work: undefined;
  Pay: undefined;
  Benefits: undefined;
  Money: undefined;
  Career: undefined;
  Wealth: undefined;
  Team: undefined;
  Profile: undefined;
};

export type WorkStackParamList = {
  WorkMain: undefined;
  Attendance: undefined;
  Leave: undefined;
  Tasks: undefined;
  Productivity: undefined;
};

export type PayStackParamList = {
  PayMain: undefined;
  PayslipDetail: { payslipId: string };
};

export type BenefitsStackParamList = {
  BenefitsMain: undefined;
  HealthBenefits: undefined;
  Offers: undefined;
};

export type MoneyStackParamList = {
  MoneyMain: undefined;
  SalaryAdvance: undefined;
  CreditCards: undefined;
  Loans: undefined;
  Insurance: undefined;
};

export type CareerStackParamList = {
  CareerMain: undefined;
  SkillGap: undefined;
  CareerPaths: undefined;
  AICoach: undefined;
  InternalMobility: undefined;
  Opportunities: undefined;
};

export type WealthStackParamList = {
  WealthMain: undefined;
  Properties: undefined;
  Investments: undefined;
  Retirement: undefined;
  Insurance: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  CorpID: undefined;
  ProfessionalPassport: undefined;
  TrustWallet: undefined;
  Documents: undefined;
  Directory: undefined;
  Support: undefined;
  AICopilot: undefined;
};

export type TeamStackParamList = {
  TeamMain: undefined;
  TeamAnnouncements: undefined;
  TeamMeetings: undefined;
  Chat: { channel: { channelId: string; name: string; description?: string; type: string } };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const WorkStack = createNativeStackNavigator<WorkStackParamList>();
const PayStack = createNativeStackNavigator<PayStackParamList>();
const BenefitsStack = createNativeStackNavigator<BenefitsStackParamList>();
const MoneyStack = createNativeStackNavigator<MoneyStackParamList>();
const CareerStack = createNativeStackNavigator<CareerStackParamList>();
const WealthStack = createNativeStackNavigator<WealthStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const TeamStack = createNativeStackNavigator<TeamStackParamList>();

// Tab Icon Component
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

// Work Stack Navigator
function WorkStackNavigator() {
  return (
    <WorkStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <WorkStack.Screen
        name="WorkMain"
        component={WorkScreen}
        options={{ title: 'Workspace' }}
      />
      <WorkStack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ title: 'Attendance' }}
      />
      <WorkStack.Screen
        name="Leave"
        component={LeaveScreen}
        options={{ title: 'Leave Management' }}
      />
      <WorkStack.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: 'My Tasks' }}
      />
      <WorkStack.Screen
        name="Productivity"
        component={ProductivityScreen}
        options={{ title: 'Productivity' }}
      />
    </WorkStack.Navigator>
  );
}

// Pay Stack Navigator
function PayStackNavigator() {
  return (
    <PayStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <PayStack.Screen
        name="PayMain"
        component={PayScreen}
        options={{ title: 'Payroll' }}
      />
      <PayStack.Screen
        name="PayslipDetail"
        component={PayslipDetailScreen}
        options={{ title: 'Payslip Details' }}
      />
    </PayStack.Navigator>
  );
}

// Benefits Stack Navigator
function BenefitsStackNavigator() {
  return (
    <BenefitsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <BenefitsStack.Screen
        name="BenefitsMain"
        component={BenefitsScreen}
        options={{ title: 'Benefits Hub' }}
      />
      <BenefitsStack.Screen
        name="HealthBenefits"
        component={HealthBenefitsScreen}
        options={{ title: 'Health Benefits' }}
      />
      <BenefitsStack.Screen
        name="Offers"
        component={OffersScreen}
        options={{ title: 'Partner Offers' }}
      />
    </BenefitsStack.Navigator>
  );
}

// Money Stack Navigator
function MoneyStackNavigator() {
  return (
    <MoneyStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <MoneyStack.Screen
        name="MoneyMain"
        component={MoneyScreen}
        options={{ title: 'Money Hub' }}
      />
      <MoneyStack.Screen
        name="SalaryAdvance"
        component={SalaryAdvanceScreen}
        options={{ title: 'Salary Advance' }}
      />
      <MoneyStack.Screen
        name="CreditCards"
        component={CreditCardsScreen}
        options={{ title: 'Credit Cards' }}
      />
      <MoneyStack.Screen
        name="Loans"
        component={LoansScreen}
        options={{ title: 'Loans' }}
      />
      <MoneyStack.Screen
        name="Insurance"
        component={InsuranceScreen}
        options={{ title: 'Insurance' }}
      />
    </MoneyStack.Navigator>
  );
}

// Career Stack Navigator
function CareerStackNavigator() {
  return (
    <CareerStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <CareerStack.Screen
        name="CareerMain"
        component={CareerScreen}
        options={{ title: 'Career Hub' }}
      />
      <CareerStack.Screen
        name="SkillGap"
        component={SkillGapScreen}
        options={{ title: 'Skill Gap Analysis' }}
      />
      <CareerStack.Screen
        name="CareerPaths"
        component={CareerPathsScreen}
        options={{ title: 'Career Paths' }}
      />
      <CareerStack.Screen
        name="AICoach"
        component={AICoachScreen}
        options={{ title: 'AI Career Coach' }}
      />
      <CareerStack.Screen
        name="InternalMobility"
        component={InternalMobilityScreen}
        options={{ title: 'Internal Mobility' }}
      />
      <CareerStack.Screen
        name="Opportunities"
        component={OpportunitiesScreen}
        options={{ title: 'Opportunity Hub' }}
      />
    </CareerStack.Navigator>
  );
}

// Wealth Stack Navigator
function WealthStackNavigator() {
  return (
    <WealthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <WealthStack.Screen
        name="WealthMain"
        component={WealthScreen}
        options={{ title: 'Wealth Dashboard' }}
      />
      <WealthStack.Screen
        name="Properties"
        component={WealthPropertiesScreen}
        options={{ title: 'Properties' }}
      />
      <WealthStack.Screen
        name="Investments"
        component={WealthInvestmentsScreen}
        options={{ title: 'Investments' }}
      />
      <WealthStack.Screen
        name="Retirement"
        component={WealthRetirementScreen}
        options={{ title: 'Retirement Calculator' }}
      />
      <WealthStack.Screen
        name="Insurance"
        component={WealthInsuranceScreen}
        options={{ title: 'Insurance Policies' }}
      />
    </WealthStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="CorpID"
        component={CorpIDScreen}
        options={{ title: 'CorpID' }}
      />
      <ProfileStack.Screen
        name="ProfessionalPassport"
        component={ProfessionalPassportScreen}
        options={{ title: 'Professional Passport' }}
      />
      <ProfileStack.Screen
        name="TrustWallet"
        component={TrustWalletScreen}
        options={{ title: 'Trust Wallet' }}
      />
      <ProfileStack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ title: 'Documents' }}
      />
      <ProfileStack.Screen
        name="Directory"
        component={DirectoryScreen}
        options={{ title: 'People Directory' }}
      />
      <ProfileStack.Screen
        name="Support"
        component={SupportScreen}
        options={{ title: 'Support Center' }}
      />
      <ProfileStack.Screen
        name="AICopilot"
        component={AICopilotScreen}
        options={{ title: 'AI Copilot' }}
      />
    </ProfileStack.Navigator>
  );
}

// Team Stack Navigator
function TeamStackNavigator() {
  return (
    <TeamStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <TeamStack.Screen
        name="TeamMain"
        component={TeamScreen}
        options={{ title: 'Team Hub' }}
      />
      <TeamStack.Screen
        name="TeamAnnouncements"
        component={TeamAnnouncementsScreen}
        options={{ title: 'Announcements' }}
      />
      <TeamStack.Screen
        name="TeamMeetings"
        component={TeamMeetingsScreen}
        options={{ title: 'Meetings' }}
      />
      <TeamStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params?.channel?.name || 'Chat' })}
      />
    </TeamStack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🏠" label="Home" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Work"
          component={WorkStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="💼" label="Work" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Pay"
          component={PayStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="💰" label="Pay" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Benefits"
          component={BenefitsStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🎁" label="Benefits" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Money"
          component={MoneyStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="💸" label="Money" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Career"
          component={CareerStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="📈" label="Career" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Wealth"
          component={WealthStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="💎" label="Wealth" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="👤" label="Profile" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Team"
          component={TeamStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="💬" label="Team" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: 65,
    paddingBottom: 5,
    paddingTop: 5,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabIconFocused: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
