import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
 const { user, logout } = useAuth();

 return (
   <View style={styles.container}>
     <View style={styles.header}>
       <View style={styles.avatar}>
         <Text style={styles.avatarText}>
           {user?.name?.charAt(0) || 'U'}
         </Text>
       </View>
       <Text style={styles.name}>{user?.name || 'User'}</Text>
       <Text style={styles.phone}>{user?.phone || ''}</Text>
     </View>

     <View style={styles.section}>
       <TouchableOpacity style={styles.menuItem}>
         <Text style={styles.menuText}>Edit Profile</Text>
         <Text style={styles.menuArrow}>›</Text>
       </TouchableOpacity>
       <TouchableOpacity style={styles.menuItem}>
         <Text style={styles.menuText}>Notification Settings</Text>
         <Text style={styles.menuArrow}>›</Text>
       </TouchableOpacity>
       <TouchableOpacity style={styles.menuItem}>
         <Text style={styles.menuText}>Privacy Settings</Text>
         <Text style={styles.menuArrow}>›</Text>
       </TouchableOpacity>
     </View>

     <View style={styles.section}>
       <TouchableOpacity style={styles.menuItem}>
         <Text style={styles.menuText}>Help & Support</Text>
         <Text style={styles.menuArrow}>›</Text>
       </TouchableOpacity>
       <TouchableOpacity style={styles.menuItem}>
         <Text style={styles.menuText}>About ReZ Safe QR</Text>
         <Text style={styles.menuArrow}>›</Text>
       </TouchableOpacity>
     </View>

     <TouchableOpacity style={styles.logoutButton} onPress={logout}>
       <Text style={styles.logoutText}>Log Out</Text>
     </TouchableOpacity>

     <Text style={styles.version}>Version 1.0.0</Text>
   </View>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#f9fafb',
 },
 header: {
   backgroundColor: '#6366f1',
   padding: 24,
   paddingTop: 60,
   alignItems: 'center',
 },
 avatar: {
   width: 80,
   height: 80,
   borderRadius: 40,
   backgroundColor: '#fff',
   justifyContent: 'center',
   alignItems: 'center',
 },
 avatarText: {
   fontSize: 32,
   fontWeight: 'bold',
   color: '#6366f1',
 },
 name: {
   fontSize: 20,
   fontWeight: 'bold',
   color: '#fff',
   marginTop: 12,
 },
 phone: {
   fontSize: 14,
   color: '#e0e7ff',
   marginTop: 4,
 },
 section: {
   backgroundColor: '#fff',
   marginTop: 16,
   paddingHorizontal: 16,
 },
 menuItem: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   paddingVertical: 16,
   borderBottomWidth: 1,
   borderBottomColor: '#e5e7eb',
 },
 menuText: {
   fontSize: 16,
   color: '#1f2937',
 },
 menuArrow: {
   fontSize: 20,
   color: '#9ca3af',
 },
 logoutButton: {
   margin: 16,
   padding: 16,
   backgroundColor: '#fee2e2',
   borderRadius: 12,
   alignItems: 'center',
 },
 logoutText: {
   fontSize: 16,
   fontWeight: '600',
   color: '#dc2626',
 },
 version: {
   textAlign: 'center',
   color: '#9ca3af',
   fontSize: 12,
   marginTop: 16,
 },
});
