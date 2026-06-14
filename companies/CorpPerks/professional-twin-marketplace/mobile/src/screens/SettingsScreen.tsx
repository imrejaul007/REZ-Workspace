/**
 * Settings Screen
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7c3aed',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#ffffff',
  textSecondary: '#94a3b8',
};

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [emailVerified, setEmailVerified] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
                <Text style={styles.menuLabel}>Privacy Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="eye-off" size={20} color={COLORS.primary} />
                <Text style={styles.menuLabel}>Visible in Marketplace</Text>
              </View>
              <Switch value={true} onValueChange={() => {}} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="download" size={20} color={COLORS.primary} />
                <Text style={styles.menuLabel}>Export My Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="notifications" size={20} color={COLORS.primary} />
                <Text style={styles.menuLabel}>Push Notifications</Text>
              </View>
              <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />
            </View>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="mail" size={20} color={COLORS.primary} />
                <Text style={styles.menuLabel}>Email Notifications</Text>
              </View>
              <Switch value={true} onValueChange={() => {}} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                <Text style={styles.menuLabel}>Email Verified</Text>
              </View>
              <Text style={styles.menuValue}>{emailVerified ? 'Yes' : 'No'}</Text>
            </View>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="key" size={20} color={COLORS.primary} />
                <Text style={styles.menuLabel}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
                <Text style={styles.menuLabel}>CorpID: CI-IND-001</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="moon" size={20} color={COLORS.primary} />
                <Text style={styles.menuLabel}>Dark Mode</Text>
              </View>
              <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />
            </View>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.menuLabel}>About</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
          <View style={[styles.card, { borderColor: '#ef444430' }]}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="archive" size={20} color="#ef4444" />
                <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Archive All Twins</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="trash" size={20} color="#ef4444" />
                <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Delete Account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <Text style={styles.version}>TwinOS Mobile v1.0.0</Text>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, paddingVertical: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLight },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuLabel: { fontSize: 16, color: COLORS.text, marginLeft: 12 },
  menuValue: { fontSize: 14, color: COLORS.success },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary, marginTop: 32 },
});
