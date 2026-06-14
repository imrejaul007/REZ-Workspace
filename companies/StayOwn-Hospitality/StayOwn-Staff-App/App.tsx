/**
 * StayOwn Staff Mobile App
 * Hotel Employee Operations App
 *
 * Features:
 * - Dashboard with today's tasks
 * - Room management (status, cleaning)
 * - Guest check-in/checkout
 * - Service requests
 * - Maintenance issues
 * - Messaging with guests
 * - QR code scanning
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

// Types
type RootStackParamList = {
  Main: undefined;
  GuestDetail: { guestId: string };
  RoomDetail: { roomId: string };
  IssueDetail: { issueId: string };
  ScanQR: undefined;
};

type MainTabParamList = {
  Dashboard: undefined;
  Rooms: undefined;
  Requests: undefined;
  Messages: undefined;
  More: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const COLORS = {
  primary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F9FAFB',
  white: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '📊',
    Rooms: '🛏️',
    Requests: '📋',
    Messages: '💬',
    More: '⚙️',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 24 }}>{icons[name]}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{name}</Text>
    </View>
  );
}

// ============================================
// DASHBOARD SCREEN
// ============================================

function DashboardScreen({ navigation }: any) {
  const stats = {
    checkIns: 8,
    checkOuts: 12,
    pendingTasks: 15,
    messages: 6,
    occupiedRooms: 45,
    availableRooms: 5,
  };

  const tasks = [
    { id: '1', type: 'checkin', guest: 'John Smith', room: '201', time: '14:00', status: 'upcoming' },
    { id: '2', type: 'checkout', guest: 'Jane Doe', room: '305', time: '11:00', status: 'pending' },
    { id: '3', type: 'housekeeping', room: '402', time: '15:00', status: 'pending' },
    { id: '4', type: 'maintenance', room: '301', issue: 'AC not working', status: 'urgent' },
    { id: '5', type: 'request', room: '205', request: 'Extra towels', time: '10 min ago', status: 'new' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.hotelName}>The Grand Palace</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
          <Text style={styles.statNumber}>{stats.checkIns}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.statNumber}>{stats.checkOuts}</Text>
          <Text style={styles.statLabel}>Check-outs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.statNumber}>{stats.pendingTasks}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('ScanQR')}>
          <Text style={styles.quickIcon}>📷</Text>
          <Text style={styles.quickLabel}>Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn}>
          <Text style={styles.quickIcon}>🧹</Text>
          <Text style={styles.quickLabel}>HK Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn}>
          <Text style={styles.quickIcon}>🔧</Text>
          <Text style={styles.quickLabel}>Issues</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn}>
          <Text style={styles.quickIcon}>📊</Text>
          <Text style={styles.quickLabel}>Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>

        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
            onPress={() => {
              if (task.type === 'checkin' || task.type === 'checkout') navigation.navigate('GuestDetail', { guestId: task.id });
              else navigation.navigate('RoomDetail', { roomId: task.room });
            }}
          >
            <View style={[styles.taskIcon, {
              backgroundColor: task.type === 'checkin' ? '#10B981' :
                task.type === 'checkout' ? '#F59E0B' :
                  task.type === 'housekeeping' ? '#6366F1' :
                    task.status === 'urgent' ? '#EF4444' : '#8B5CF6'
            }]}>
              <Text style={styles.taskIconText}>
                {task.type === 'checkin' ? '📥' :
                  task.type === 'checkout' ? '📤' :
                    task.type === 'housekeeping' ? '🧹' :
                      task.type === 'maintenance' ? '🔧' : '📋'}
              </Text>
            </View>
            <View style={styles.taskContent}>
              <Text style={styles.taskTitle}>
                {task.type === 'checkin' ? `${task.guest} - Room ${task.room}` :
                  task.type === 'checkout' ? `${task.guest} - Room ${task.room}` :
                    task.type === 'housekeeping' ? `Room ${task.room}` :
                      task.type === 'maintenance' ? `Room ${task.room}: ${task.issue}` :
                        `Room ${task.room}: ${task.request}`}
              </Text>
              <Text style={styles.taskTime}>{task.time || task.time}</Text>
            </View>
            <View style={[styles.taskStatus, {
              backgroundColor: task.status === 'urgent' ? '#FEE2E2' :
                task.status === 'new' ? '#EEF2FF' : '#F3F4F6'
            }]}>
              <Text style={[styles.taskStatusText, {
                color: task.status === 'urgent' ? '#EF4444' :
                  task.status === 'new' ? '#6366F1' : '#6B7280'
              }]}>
                {task.status === 'upcoming' ? 'Upcoming' :
                  task.status === 'pending' ? 'Pending' :
                    task.status === 'urgent' ? 'Urgent' : 'New'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Room Status Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Room Status</Text>
        <View style={styles.roomStatusGrid}>
          <View style={[styles.roomStatusCard, { backgroundColor: '#10B981' }]}>
            <Text style={styles.roomStatusNum}>{stats.occupiedRooms}</Text>
            <Text style={styles.roomStatusLabel}>Occupied</Text>
          </View>
          <View style={[styles.roomStatusCard, { backgroundColor: '#6366F1' }]}>
            <Text style={styles.roomStatusNum}>{stats.availableRooms}</Text>
            <Text style={styles.roomStatusLabel}>Available</Text>
          </View>
          <View style={[styles.roomStatusCard, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.roomStatusNum}>3</Text>
            <Text style={styles.roomStatusLabel}>Dirty</Text>
          </View>
          <View style={[styles.roomStatusCard, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.roomStatusNum}>2</Text>
            <Text style={styles.roomStatusLabel}>Maintenance</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================
// ROOMS SCREEN
// ============================================

function RoomsScreen() {
  const floors = ['1st', '2nd', '3rd'];
  const rooms = [
    { id: '101', floor: '1st', type: 'Deluxe', status: 'occupied', guest: 'John Smith', checkout: 'Jun 2' },
    { id: '102', floor: '1st', type: 'Standard', status: 'available', guest: null },
    { id: '103', floor: '1st', type: 'Suite', status: 'dirty', guest: 'Jane Doe', checkout: 'Jun 1' },
    { id: '201', floor: '2nd', type: 'Deluxe', status: 'occupied', guest: 'Bob Wilson', checkout: 'Jun 3' },
    { id: '202', floor: '2nd', type: 'Standard', status: 'maintenance', guest: null },
    { id: '203', floor: '2nd', type: 'Suite', status: 'occupied', guest: 'Alice Brown', checkout: 'Jun 4' },
  ];

  const statusColors: Record<string, string> = {
    occupied: '#10B981',
    available: '#6366F1',
    dirty: '#F59E0B',
    maintenance: '#EF4444',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Room Management</Text>
        <View style={styles.filterBtns}>
          <TouchableOpacity style={[styles.filterBtn, styles.filterBtnActive]}><Text style={styles.filterBtnText}>All</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn}><Text style={styles.filterBtnText}>Occupied</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn}><Text style={styles.filterBtnText}>Available</Text></TouchableOpacity>
        </View>
      </View>

      {floors.map((floor) => (
        <View key={floor} style={styles.floorSection}>
          <Text style={styles.floorTitle}>{floor} Floor</Text>
          <View style={styles.roomsGrid}>
            {rooms.filter(r => r.floor === floor).map((room) => (
              <TouchableOpacity key={room.id} style={[styles.roomCard, { borderLeftColor: statusColors[room.status] }]}>
                <Text style={styles.roomNum}>{room.id}</Text>
                <Text style={styles.roomType}>{room.type}</Text>
                <View style={[styles.roomStatusBadge, { backgroundColor: statusColors[room.status] + '20' }]}>
                  <Text style={[styles.roomStatusText, { color: statusColors[room.status] }]}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </Text>
                </View>
                {room.guest && <Text style={styles.roomGuest} numberOfLines={1}>{room.guest}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ============================================
// REQUESTS SCREEN
// ============================================

function RequestsScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'housekeeping' | 'maintenance' | 'room'>('all');

  const requests = [
    { id: '1', type: 'housekeeping', room: '301', request: 'Extra towels', time: '5 min ago', status: 'new', priority: 'normal' },
    { id: '2', type: 'room_service', room: '205', request: 'Late checkout requested', time: '10 min ago', status: 'new', priority: 'normal' },
    { id: '3', type: 'maintenance', room: '402', request: 'AC not cooling', time: '15 min ago', status: 'assigned', priority: 'high' },
    { id: '4', type: 'housekeeping', room: '103', request: 'Early checkout - clean room', time: '30 min ago', status: 'in_progress', priority: 'normal' },
    { id: '5', type: 'maintenance', room: '201', request: 'Leaking faucet', time: '1 hour ago', status: 'resolved', priority: 'low' },
  ];

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'housekeeping', label: 'Housekeeping' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'room', label: 'Room Service' },
  ];

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {requests.filter(r => activeTab === 'all' || r.type === activeTab).map((req) => (
          <TouchableOpacity key={req.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.requestRoom}>
                <Text style={styles.requestRoomNum}>{req.room}</Text>
              </View>
              <View style={[styles.requestBadge, {
                backgroundColor: req.status === 'new' ? '#EEF2FF' :
                  req.status === 'assigned' ? '#FEF3C7' :
                    req.status === 'in_progress' ? '#6366F120' : '#10B98120'
              }]}>
                <Text style={[styles.requestBadgeText, {
                  color: req.status === 'new' ? '#6366F1' :
                    req.status === 'assigned' ? '#D97706' :
                      req.status === 'in_progress' ? '#6366F1' : '#10B981'
                }]}>
                  {req.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.requestText}>{req.request}</Text>
            <View style={styles.requestFooter}>
              <Text style={styles.requestTime}>⏰ {req.time}</Text>
              {req.priority === 'high' && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>⚠️ High Priority</Text>
                </View>
              )}
            </View>
            {req.status !== 'resolved' && (
              <View style={styles.requestActions}>
                <TouchableOpacity style={styles.actionBtnPrimary}>
                  <Text style={styles.actionBtnPrimaryText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnSecondary}>
                  <Text style={styles.actionBtnSecondaryText}>View</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================
// MESSAGES SCREEN
// ============================================

function MessagesScreen() {
  const conversations = [
    { id: '1', guest: 'John Smith', room: '201', lastMsg: 'Can I have extra pillows?', time: '2 min ago', unread: 2 },
    { id: '2', guest: 'Jane Doe', room: '305', lastMsg: 'Thank you for the early check-in', time: '15 min ago', unread: 0 },
    { id: '3', guest: 'Bob Wilson', room: '201', lastMsg: 'The AC is still not working', time: '1 hour ago', unread: 1 },
    { id: '4', guest: 'Alice Brown', room: '203', lastMsg: 'Can I extend my stay?', time: '2 hours ago', unread: 0 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guest Messages</Text>
      </View>

      <ScrollView>
        {conversations.map((conv) => (
          <TouchableOpacity key={conv.id} style={styles.conversationCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{conv.guest.split(' ').map(n => n[0]).join('')}</Text>
            </View>
            <View style={styles.convContent}>
              <View style={styles.convHeader}>
                <Text style={styles.convGuest}>{conv.guest}</Text>
                <Text style={styles.convTime}>{conv.time}</Text>
              </View>
              <Text style={styles.convRoom}>Room {conv.room}</Text>
              <Text style={[styles.convMsg, conv.unread > 0 && styles.convMsgUnread]} numberOfLines={1}>
                {conv.lastMsg}
              </Text>
            </View>
            {conv.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadNum}>{conv.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================
// MORE SCREEN
// ============================================

function MoreScreen() {
  const menuItems = [
    { icon: '📊', title: 'Reports', subtitle: 'Daily, weekly, monthly' },
    { icon: '🔧', title: 'Maintenance', subtitle: 'Manage maintenance requests' },
    { icon: '🧹', title: 'Housekeeping', subtitle: 'HK schedule & tasks' },
    { icon: '👥', title: 'Team', subtitle: 'Staff management' },
    { icon: '⚙️', title: 'Settings', subtitle: 'App settings' },
    { icon: '❓', title: 'Help', subtitle: 'Support & FAQs' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>RS</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Rahul Sharma</Text>
          <Text style={styles.profileRole}>Front Desk Manager</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuList}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ============================================
// SCAN QR SCREEN
// ============================================

function ScanQRScreen({ navigation }: any) {
  return (
    <View style={styles.scanContainer}>
      <View style={styles.scanPlaceholder}>
        <Text style={styles.scanIcon}>📷</Text>
        <Text style={styles.scanTitle}>Scan Guest QR Code</Text>
        <Text style={styles.scanSubtitle}>
          Point camera at guest's QR code for{'\n'}quick check-in or verification
        </Text>
      </View>
      <View style={styles.scanActions}>
        <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.scanBtnText}>Open Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.manualBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.manualBtnText}>Enter Manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================
// MAIN TABS
// ============================================

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Rooms" component={RoomsScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

// ============================================
// MAIN APP
// ============================================

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="ScanQR"
          component={ScanQRScreen}
          options={{
            title: 'Scan QR Code',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 85,
    paddingTop: 8,
  },
  tabIcon: { alignItems: 'center' },
  tabLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  tabLabelActive: { color: COLORS.primary, fontWeight: '600' },

  // Dashboard
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: COLORS.white,
  },
  greeting: { fontSize: 14, color: COLORS.textLight },
  hotelName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  profileIcon: { fontSize: 20 },

  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },

  quickActions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  quickBtn: { flex: 1, backgroundColor: COLORS.white, padding: 12, borderRadius: 12, alignItems: 'center' },
  quickIcon: { fontSize: 24, marginBottom: 4 },
  quickLabel: { fontSize: 11, color: COLORS.text, fontWeight: '500' },

  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  seeAll: { fontSize: 14, color: COLORS.primary },

  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 12, borderRadius: 12, marginBottom: 8 },
  taskIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  taskIconText: { fontSize: 20 },
  taskContent: { flex: 1, marginLeft: 12 },
  taskTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  taskTime: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  taskStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  taskStatusText: { fontSize: 11, fontWeight: '500' },

  roomStatusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roomStatusCard: { width: '48%', padding: 16, borderRadius: 12, alignItems: 'center' },
  roomStatusNum: { fontSize: 32, fontWeight: '700', color: COLORS.white },
  roomStatusLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  // Rooms
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, padding: 16 },
  filterBtns: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.background, marginRight: 8 },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterBtnText: { fontSize: 13, color: COLORS.text },
  floorSection: { padding: 16, paddingTop: 0 },
  floorTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  roomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roomCard: { width: '31%', backgroundColor: COLORS.white, padding: 12, borderRadius: 12, borderLeftWidth: 4 },
  roomNum: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  roomType: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  roomStatusBadge: { marginTop: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  roomStatusText: { fontSize: 10, fontWeight: '500' },
  roomGuest: { fontSize: 11, color: COLORS.text, marginTop: 4 },

  // Requests
  tabsContainer: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 8, margin: 16, borderRadius: 12 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textLight },
  tabTextActive: { color: COLORS.white, fontWeight: '600' },
  requestCard: { backgroundColor: COLORS.white, margin: 16, marginTop: 0, padding: 16, borderRadius: 12 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  requestRoom: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  requestRoomNum: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  requestBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  requestBadgeText: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  requestText: { fontSize: 15, color: COLORS.text, marginBottom: 8 },
  requestFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestTime: { fontSize: 12, color: COLORS.textLight },
  priorityBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 11, color: '#EF4444', fontWeight: '500' },
  requestActions: { flexDirection: 'row', marginTop: 12, gap: 12 },
  actionBtnPrimary: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnPrimaryText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  actionBtnSecondary: { flex: 1, backgroundColor: COLORS.background, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnSecondaryText: { color: COLORS.text, fontWeight: '500', fontSize: 14 },

  // Messages
  conversationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  convContent: { flex: 1, marginLeft: 12 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  convGuest: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  convTime: { fontSize: 12, color: COLORS.textLight },
  convRoom: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  convMsg: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  convMsgUnread: { color: COLORS.text, fontWeight: '500' },
  unreadBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  unreadNum: { color: COLORS.white, fontSize: 12, fontWeight: '600' },

  // More
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 20, margin: 16, borderRadius: 16 },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { color: COLORS.white, fontSize: 24, fontWeight: '600' },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  profileRole: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.danger },
  logoutText: { color: COLORS.danger, fontSize: 13, fontWeight: '500' },
  menuList: { padding: 16, paddingTop: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 12, marginBottom: 8 },
  menuIcon: { fontSize: 24 },
  menuContent: { flex: 1, marginLeft: 16 },
  menuTitle: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  menuSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  menuArrow: { fontSize: 24, color: COLORS.textLight },

  // Scan QR
  scanContainer: { flex: 1, backgroundColor: COLORS.background },
  scanPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  scanIcon: { fontSize: 80, marginBottom: 24 },
  scanTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  scanSubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 },
  scanActions: { padding: 16, gap: 12 },
  scanBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  scanBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  manualBtn: { backgroundColor: COLORS.white, paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  manualBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '500' },
});
