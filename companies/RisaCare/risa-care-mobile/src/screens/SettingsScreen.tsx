// RisaCare Mobile - Settings Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NotificationSettings {
  appointments: boolean;
  medications: boolean;
  reminders: boolean;
  reports: boolean;
  healthAlerts: boolean;
  wellnessTips: boolean;
}

interface AppSettings {
  notifications: NotificationSettings;
  privacy: {
    shareDataWithDoctors: boolean;
    anonymousAnalytics: boolean;
    biometricAuth: boolean;
  };
  language: string;
  theme: 'light' | 'dark' | 'system';
  emergencyContacts: string[];
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      appointments: true,
      medications: true,
      reminders: true,
      reports: true,
      healthAlerts: true,
      wellnessTips: false,
    },
    privacy: {
      shareDataWithDoctors: true,
      anonymousAnalytics: true,
      biometricAuth: false,
    },
    language: 'English',
    theme: 'light',
    emergencyContacts: [],
  });

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });

  const updateNotification = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const updatePrivacy = (key: keyof AppSettings['privacy']) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key],
      },
    }));
  };

  const addEmergencyContact = () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }
    setSettings(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, `${newContact.name}:${newContact.phone}:${newContact.relation}`],
    }));
    setNewContact({ name: '', phone: '', relation: '' });
    setShowEmergencyModal(false);
    Alert.alert('Success', 'Emergency contact added');
  };

  const removeEmergencyContact = (index: number) => {
    Alert.alert('Remove Contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setSettings(prev => ({
            ...prev,
            emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index),
          }));
        },
      },
    ]);
  };

  const exportData = () => {
    Alert.alert(
      'Export Health Data',
      'Your health data will be exported as a PDF file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Success', 'Data export initiated. You will receive the file shortly.') },
      ]
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete all your health data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Contact Support', 'Please contact support@risacare.com to delete your account.'),
        },
      ]
    );
  };

  const SettingRow = ({ title, subtitle, value, onPress, danger }: any) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {value !== undefined && (
        typeof value === 'boolean' ? (
          <Switch value={value} onValueChange={onPress} trackColor={{ false: '#E0E0E0', true: '#81C784' }} />
        ) : (
          <Text style={styles.settingValue}>{value}</Text>
        )
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚙️ Settings</Text>
        </View>

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RS</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Risa User</Text>
            <Text style={styles.profileEmail}>user@email.com</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.section}>
          <SettingRow
            title="Appointment Reminders"
            subtitle="Get notified before appointments"
            value={settings.notifications.appointments}
            onPress={() => updateNotification('appointments')}
          />
          <SettingRow
            title="Medication Reminders"
            subtitle="Daily medication alerts"
            value={settings.notifications.medications}
            onPress={() => updateNotification('medications')}
          />
          <SettingRow
            title="Health Reminders"
            subtitle="Checkup and vaccination reminders"
            value={settings.notifications.reminders}
            onPress={() => updateNotification('reminders')}
          />
          <SettingRow
            title="Report Notifications"
            subtitle="When new reports are analyzed"
            value={settings.notifications.reports}
            onPress={() => updateNotification('reports')}
          />
          <SettingRow
            title="Health Alerts"
            subtitle="Important health warnings"
            value={settings.notifications.healthAlerts}
            onPress={() => updateNotification('healthAlerts')}
          />
          <SettingRow
            title="Wellness Tips"
            subtitle="Daily health tips and motivation"
            value={settings.notifications.wellnessTips}
            onPress={() => updateNotification('wellnessTips')}
          />
        </View>

        {/* Privacy */}
        <SectionHeader title="PRIVACY & SECURITY" />
        <View style={styles.section}>
          <SettingRow
            title="Share Data with Doctors"
            subtitle="Allow doctors to view your health history"
            value={settings.privacy.shareDataWithDoctors}
            onPress={() => updatePrivacy('shareDataWithDoctors')}
          />
          <SettingRow
            title="Anonymous Analytics"
            subtitle="Help improve RisaCare"
            value={settings.privacy.anonymousAnalytics}
            onPress={() => updatePrivacy('anonymousAnalytics')}
          />
          <SettingRow
            title="Biometric Authentication"
            subtitle="Use Face ID or fingerprint to login"
            value={settings.privacy.biometricAuth}
            onPress={() => updatePrivacy('biometricAuth')}
          />
        </View>

        {/* Emergency Contacts */}
        <SectionHeader title="EMERGENCY CONTACTS" />
        <View style={styles.section}>
          {settings.emergencyContacts.length > 0 ? (
            settings.emergencyContacts.map((contact, index) => {
              const [name, phone, relation] = contact.split(':');
              return (
                <View key={index} style={styles.emergencyContact}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{name}</Text>
                    <Text style={styles.contactPhone}>{phone}</Text>
                    {relation && <Text style={styles.contactRelation}>{relation}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => removeEmergencyContact(index)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={styles.noContacts}>No emergency contacts added</Text>
          )}
          <TouchableOpacity style={styles.addContactButton} onPress={() => setShowEmergencyModal(true)}>
            <Text style={styles.addContactText}>+ Add Emergency Contact</Text>
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <SectionHeader title="APP SETTINGS" />
        <View style={styles.section}>
          <SettingRow title="Language" value={settings.language} onPress={() => Alert.alert('Coming Soon', 'More languages coming soon!')} />
          <SettingRow title="Theme" value={settings.theme} onPress={() => Alert.alert('Coming Soon', 'Dark mode coming soon!')} />
          <SettingRow title="Units" value="Metric (kg, cm)" onPress={() => {}} />
        </View>

        {/* Data */}
        <SectionHeader title="DATA MANAGEMENT" />
        <View style={styles.section}>
          <SettingRow title="Export Health Data" subtitle="Download all your health records" onPress={exportData} />
          <SettingRow title="Sync with Apple Health" subtitle="Connect health apps" onPress={() => Alert.alert('Coming Soon')} />
          <SettingRow title="Clear Cache" subtitle="Free up storage space" onPress={() => Alert.alert('Cache Cleared', 'App cache has been cleared.')} />
        </View>

        {/* Support */}
        <SectionHeader title="SUPPORT" />
        <View style={styles.section}>
          <SettingRow title="Help Center" onPress={() => {}} />
          <SettingRow title="Privacy Policy" onPress={() => {}} />
          <SettingRow title="Terms of Service" onPress={() => {}} />
          <SettingRow title="Contact Support" subtitle="support@risacare.com" onPress={() => {}} />
          <SettingRow title="App Version" value="1.0.0" />
        </View>

        {/* Danger Zone */}
        <SectionHeader title="DANGER ZONE" />
        <View style={styles.section}>
          <SettingRow title="Delete Account" danger onPress={deleteAccount} />
        </View>

        {/* Emergency SOS */}
        <TouchableOpacity style={styles.sosButton}>
          <Text style={styles.sosButtonText}>🆘 SOS Emergency</Text>
        </TouchableOpacity>

        {/* Emergency Contact Modal */}
        {showEmergencyModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={newContact.name}
                onChangeText={text => setNewContact({ ...newContact, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={newContact.phone}
                onChangeText={text => setNewContact({ ...newContact, phone: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Relation (e.g., Spouse, Parent)"
                value={newContact.relation}
                onChangeText={text => setNewContact({ ...newContact, relation: text })}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEmergencyModal(false)}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={addEmergencyContact}>
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, backgroundColor: '#2196F3' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, padding: 16, borderRadius: 12, elevation: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 18, fontWeight: '600', color: '#333' },
  profileEmail: { fontSize: 14, color: '#666' },
  editButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E3F2FD', borderRadius: 8 },
  editButtonText: { color: '#2196F3', fontWeight: '600' },
  sectionHeader: { fontSize: 12, fontWeight: '600', color: '#666', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, textTransform: 'uppercase' },
  section: { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 16, color: '#333' },
  settingSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  settingValue: { fontSize: 14, color: '#666' },
  dangerText: { color: '#F44336' },
  emergencyContact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '500', color: '#333' },
  contactPhone: { fontSize: 14, color: '#666' },
  contactRelation: { fontSize: 12, color: '#999' },
  removeText: { color: '#F44336', fontSize: 14 },
  noContacts: { fontSize: 14, color: '#999', textAlign: 'center', padding: 20 },
  addContactButton: { padding: 16, alignItems: 'center' },
  addContactText: { color: '#2196F3', fontWeight: '600', fontSize: 16 },
  sosButton: { margin: 16, padding: 16, backgroundColor: '#F44336', borderRadius: 12, alignItems: 'center' },
  sosButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', marginTop: 8, gap: 12 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center' },
  addBtn: { flex: 1, backgroundColor: '#2196F3', padding: 14, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontWeight: '600' },
});
