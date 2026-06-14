import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../services/api';

export default function ScanResultScreen() {
 const route = useRoute<unknown>();
 const navigation = useNavigation<unknown>();
 const { shortcode, data } = route.params || {};

 const [scanData, setScanData] = useState<unknown>(data);
 const [isLoading, setIsLoading] = useState(!data);
 const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
 const [customMessage, setCustomMessage] = useState('');
 const [isSending, setIsSending] = useState(false);
 const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

 useEffect(() => {
   loadScanData();
   getLocation();
 }, [shortcode]);

 async function loadScanData() {
   if (data) return;
   try {
     const response = await api.scan(shortcode);
     if (response.success) {
       setScanData(response.data);
     } else {
       Alert.alert('Error', 'QR not found');
       navigation.goBack();
     }
   } catch (error) {
     logger.error('Load error:', error);
     Alert.alert('Error', 'Failed to load QR data');
     navigation.goBack();
   } finally {
     setIsLoading(false);
   }
 }

 async function getLocation() {
   try {
     const { status } = await Location.requestForegroundPermissionsAsync();
     if (status === 'granted') {
       const loc = await Location.getCurrentPositionAsync({});
       setLocation({
         lat: loc.coords.latitude,
         lng: loc.coords.longitude,
       });
     }
   } catch (error) {
     console.log('Location error');
   }
 }

 async function sendMessage() {
   if (!selectedTemplate && !customMessage.trim()) {
     Alert.alert('Error', 'Please select a template or enter a message');
     return;
   }

   setIsSending(true);
   try {
     const message = selectedTemplate
       ? {
           content: scanData.templates.find((t) => t.id === selectedTemplate)?.message || '',
           type: 'template',
           templateId: selectedTemplate,
         }
       : {
           content: customMessage.trim(),
           type: 'text',
         };

     if (location && !selectedTemplate) {
       message.location = location;
     }

     const response = await api.sendMessage(shortcode, message);

     if (response.success) {
       Alert.alert('Sent!', 'Your message has been sent to the owner.', [
         { text: 'OK', onPress: () => navigation.goBack() },
       ]);
     } else {
       Alert.alert('Error', response.error?.message || 'Failed to send message');
     }
   } catch (error) {
     Alert.alert('Error', error.response?.data?.error?.message || 'Failed to send');
   } finally {
     setIsSending(false);
   }
 }

 if (isLoading) {
   return (
     <View style={styles.loadingContainer}>
       <ActivityIndicator size="large" color="#6366f1" />
       <Text style={styles.loadingText}>Loading...</Text>
     </View>
   );
 }

 if (!scanData) {
   return (
     <View style={styles.loadingContainer}>
       <Text style={styles.errorText}>QR not found</Text>
     </View>
   );
 }

 const modeColors: Record<string, string> = {
   pet: '#f59e0b',
   device: '#10b981',
   medical: '#ef4444',
   vehicle: '#3b82f6',
   personal: '#6366f1',
   helmet: '#8b5cf6',
   child: '#ec4899',
   bicycle: '#f97316',
   key: '#84cc16',
   luggage: '#06b6d4',
   home: '#14b8a6',
 };

 const modeColor = modeColors[scanData.mode] || '#6366f1';
 const modeName = scanData.mode?.charAt(0).toUpperCase() + scanData.mode?.slice(1) || 'Safe QR';

 return (
   <ScrollView style={styles.container}>
     {/* Header */}
     <View style={[styles.header, { backgroundColor: modeColor }]}>
       <View style={styles.modeBadge}>
         <Text style={styles.modeText}>{modeName}</Text>
       </View>
       {scanData.status === 'lost' && (
         <View style={styles.lostBadge}>
           <Text style={styles.lostText}>LOST</Text>
         </View>
       )}
     </View>

     {/* Profile Section */}
     <View style={styles.section}>
       <Text style={styles.sectionTitle}>Profile</Text>
       <View style={styles.profileCard}>
         {scanData.profile?.photo && (
           <View style={styles.profileImage}>
             <Text style={styles.profileImageText}>
               {scanData.profile.name?.charAt(0) || '?'}
             </Text>
           </View>
         )}
         <View style={styles.profileInfo}>
           <Text style={styles.profileName}>
             {scanData.profile?.name ||
              scanData.profile?.displayName ||
              scanData.profile?.brand ||
              scanData.mode}
           </Text>
           <Text style={styles.profileSubtitle}>
             {scanData.profile?.breed ||
              scanData.profile?.species ||
              scanData.profile?.model ||
              scanData.profile?.vehicleType ||
              ''}
           </Text>
           {scanData.profile?.description && (
             <Text style={styles.profileDesc}>
               {scanData.profile.description}
             </Text>
           )}
         </View>
       </View>
     </View>

     {/* Templates Section */}
     {scanData.templates?.length > 0 && (
       <View style={styles.section}>
         <Text style={styles.sectionTitle}>Quick Actions</Text>
         <View style={styles.templatesGrid}>
           {scanData.templates.map((template) => (
             <TouchableOpacity
               key={template.id}
               style={[
                 styles.templateCard,
                 selectedTemplate === template.id && styles.templateCardSelected,
               ]}
               onPress={() => setSelectedTemplate(template.id)}
             >
               {template.icon && <Text style={styles.templateIcon}>{template.icon}</Text>}
               <Text style={styles.templateLabel}>{template.label}</Text>
             </TouchableOpacity>
           ))}
         </View>
       </View>
     )}

     {/* Custom Message */}
     {scanData.settings?.allowMessages && (
       <View style={styles.section}>
         <Text style={styles.sectionTitle}>Or Send Custom Message</Text>
         <View style={styles.customMessageContainer}>
           <TextInput
             style={styles.customMessageInput}
             placeholder="Type your message..."
             placeholderTextColor="#9ca3af"
             value={customMessage}
             onChangeText={setCustomMessage}
             multiline
             numberOfLines={3}
           />
         </View>
       </View>
     )}

     {/* Send Button */}
     {scanData.settings?.allowMessages && (
       <TouchableOpacity
         style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
         onPress={sendMessage}
         disabled={isSending}
       >
         {isSending ? (
           <ActivityIndicator color="#fff" />
         ) : (
           <Text style={styles.sendButtonText}>Send Message</Text>
         )}
       </TouchableOpacity>
     )}

     {/* Emergency Note */}
     {scanData.mode === 'medical' || scanData.mode === 'helmet' ? (
       <View style={styles.emergencyNote}>
         <Text style={styles.emergencyText}>
           For life-threatening emergencies, call emergency services immediately.
         </Text>
       </View>
     ) : null}
   </ScrollView>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#f9fafb',
 },
 loadingContainer: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
 },
 loadingText: {
   marginTop: 12,
   fontSize: 16,
   color: '#6b7280',
 },
 errorText: {
   fontSize: 16,
   color: '#ef4444',
 },
 header: {
   padding: 24,
   paddingTop: 60,
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'space-between',
 },
 modeBadge: {
   backgroundColor: 'rgba(255,255,255,0.2)',
   paddingHorizontal: 16,
   paddingVertical: 8,
   borderRadius: 20,
 },
 modeText: {
   color: '#fff',
   fontSize: 14,
   fontWeight: '600',
 },
 lostBadge: {
   backgroundColor: '#ef4444',
   paddingHorizontal: 12,
   paddingVertical: 6,
   borderRadius: 4,
 },
 lostText: {
   color: '#fff',
   fontSize: 12,
   fontWeight: 'bold',
 },
 section: {
   padding: 16,
 },
 sectionTitle: {
   fontSize: 16,
   fontWeight: '600',
   color: '#1f2937',
   marginBottom: 12,
 },
 profileCard: {
   backgroundColor: '#fff',
   borderRadius: 12,
   padding: 16,
   flexDirection: 'row',
   alignItems: 'center',
 },
 profileImage: {
   width: 60,
   height: 60,
   borderRadius: 30,
   backgroundColor: '#6366f1',
   justifyContent: 'center',
   alignItems: 'center',
   marginRight: 16,
 },
 profileImageText: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#fff',
 },
 profileInfo: {
   flex: 1,
 },
 profileName: {
   fontSize: 18,
   fontWeight: '600',
   color: '#1f2937',
 },
 profileSubtitle: {
   fontSize: 14,
   color: '#6b7280',
   marginTop: 2,
 },
 profileDesc: {
   fontSize: 14,
   color: '#9ca3af',
   marginTop: 4,
 },
 templatesGrid: {
   flexDirection: 'row',
   flexWrap: 'wrap',
   gap: 8,
 },
 templateCard: {
   width: '48%',
   backgroundColor: '#fff',
   borderRadius: 12,
   padding: 16,
   alignItems: 'center',
   borderWidth: 2,
   borderColor: '#e5e7eb',
 },
 templateCardSelected: {
   borderColor: '#6366f1',
   backgroundColor: '#eef2ff',
 },
 templateIcon: {
   fontSize: 24,
   marginBottom: 8,
 },
 templateLabel: {
   fontSize: 14,
   color: '#1f2937',
   fontWeight: '500',
   textAlign: 'center',
 },
 customMessageContainer: {
   backgroundColor: '#fff',
   borderRadius: 12,
   overflow: 'hidden',
 },
 customMessageInput: {
   padding: 16,
   fontSize: 16,
   minHeight: 100,
   textAlignVertical: 'top',
   color: '#1f2937',
 },
 sendButton: {
   margin: 16,
   backgroundColor: '#6366f1',
   borderRadius: 12,
   padding: 16,
   alignItems: 'center',
 },
 sendButtonDisabled: {
   opacity: 0.7,
 },
 sendButtonText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: '600',
 },
 emergencyNote: {
   margin: 16,
   padding: 12,
   backgroundColor: '#fef2f2',
   borderRadius: 8,
   borderWidth: 1,
   borderColor: '#fecaca',
 },
 emergencyText: {
   fontSize: 12,
   color: '#dc2626',
   textAlign: 'center',
 },
});
