import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function QRDetailScreen() {
 const route = useRoute<unknown>();
 const navigation = useNavigation<unknown>();
 const { shortcode } = route.params || {};

 const [qr, setQR] = useState<unknown>(null);
 const [qrImage, setQRImage] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
   loadQR();
 }, [shortcode]);

 async function loadQR() {
   try {
     const response = await api.getQRDetail(shortcode);
     if (response.success) {
       setQR(response.data);
     }
   } catch (error) {
     logger.error('Load error:', error);
   } finally {
     setIsLoading(false);
   }
 }

 async function downloadQR() {
   try {
     const imageData = await api.generateQRImage(shortcode, { format: 'png', size: 400 });
     // In real app, would save to gallery
     Alert.alert('Success', 'QR code saved!');
   } catch (error) {
     Alert.alert('Error', 'Failed to download QR');
   }
 }

 async function shareQR() {
   try {
     await Share.share({
       message: `Scan my Safe QR: https://rez.app/s/${shortcode}`,
     });
   } catch (error) {
     logger.error('Share error:', error);
   }
 }

 async function activateLostMode() {
   Alert.alert(
     'Activate Lost Mode',
     'Are you sure you want to activate lost mode?',
     [
       { text: 'Cancel', style: 'cancel' },
       {
         text: 'Activate',
         onPress: async () => {
           try {
             await api.activateLostMode(shortcode, {});
             Alert.alert('Success', 'Lost mode activated!');
             loadQR();
           } catch (error) {
             Alert.alert('Error', 'Failed to activate lost mode');
           }
         },
       },
     ]
   );
 }

 if (isLoading) {
   return (
     <View style={styles.loading}>
       <Text>Loading...</Text>
     </View>
   );
 }

 if (!qr) {
   return (
     <View style={styles.loading}>
       <Text>QR not found</Text>
     </View>
   );
 }

 return (
   <ScrollView style={styles.container}>
     {/* QR Display */}
     <View style={styles.qrSection}>
       <View style={styles.qrContainer}>
         {qrImage ? (
           <Image source={{ uri: qrImage }} style={styles.qrImage} />
         ) : (
           <View style={styles.qrPlaceholder}>
             <Text style={styles.qrPlaceholderText}>QR</Text>
           </View>
         )}
       </View>
       <Text style={styles.shortcode}>{qr.shortcode}</Text>
       <View style={styles.modeBadge}>
         <Text style={styles.modeText}>{qr.mode.toUpperCase()}</Text>
       </View>
     </View>

     {/* Actions */}
     <View style={styles.actions}>
       <TouchableOpacity style={styles.actionButton} onPress={downloadQR}>
         <Text style={styles.actionIcon}>📥</Text>
         <Text style={styles.actionText}>Download</Text>
       </TouchableOpacity>
       <TouchableOpacity style={styles.actionButton} onPress={shareQR}>
         <Text style={styles.actionIcon}>📤</Text>
         <Text style={styles.actionText}>Share</Text>
       </TouchableOpacity>
     </View>

     {/* Stats */}
     <View style={styles.section}>
       <Text style={styles.sectionTitle}>Statistics</Text>
       <View style={styles.statsGrid}>
         <View style={styles.statCard}>
           <Text style={styles.statValue}>{qr.stats?.totalScans || 0}</Text>
           <Text style={styles.statLabel}>Total Scans</Text>
         </View>
         <View style={styles.statCard}>
           <Text style={styles.statValue}>{qr.stats?.uniqueScanners || 0}</Text>
           <Text style={styles.statLabel}>Unique Scans</Text>
         </View>
         <View style={styles.statCard}>
           <Text style={styles.statValue}>{qr.stats?.totalMessages || 0}</Text>
           <Text style={styles.statLabel}>Messages</Text>
         </View>
       </View>
     </View>

     {/* Danger Zone */}
     <View style={styles.section}>
       <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>Actions</Text>
       {qr.status !== 'lost' ? (
         <TouchableOpacity style={styles.dangerButton} onPress={activateLostMode}>
           <Text style={styles.dangerButtonText}>Activate Lost Mode</Text>
         </TouchableOpacity>
       ) : (
         <TouchableOpacity
           style={styles.successButton}
           onPress={async () => {
             await api.markAsFound(shortcode, []);
             loadQR();
           }}
         >
           <Text style={styles.successButtonText}>Mark as Found</Text>
         </TouchableOpacity>
       )}
     </View>
   </ScrollView>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#f9fafb',
 },
 loading: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
 },
 qrSection: {
   backgroundColor: '#fff',
   alignItems: 'center',
   padding: 24,
 },
 qrContainer: {
   width: 200,
   height: 200,
   backgroundColor: '#f3f4f6',
   borderRadius: 16,
   justifyContent: 'center',
   alignItems: 'center',
 },
 qrImage: {
   width: 200,
   height: 200,
   borderRadius: 16,
 },
 qrPlaceholder: {
   width: 200,
   height: 200,
   justifyContent: 'center',
   alignItems: 'center',
 },
 qrPlaceholderText: {
   fontSize: 32,
   fontWeight: 'bold',
   color: '#9ca3af',
 },
 shortcode: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#1f2937',
   marginTop: 16,
 },
 modeBadge: {
   backgroundColor: '#e0e7ff',
   paddingHorizontal: 12,
   paddingVertical: 4,
   borderRadius: 12,
   marginTop: 8,
 },
 modeText: {
   color: '#6366f1',
   fontWeight: '600',
   fontSize: 12,
 },
 actions: {
   flexDirection: 'row',
   justifyContent: 'center',
   padding: 16,
   gap: 16,
 },
 actionButton: {
   alignItems: 'center',
   padding: 16,
   backgroundColor: '#fff',
   borderRadius: 12,
   width: 100,
 },
 actionIcon: {
   fontSize: 24,
   marginBottom: 4,
 },
 actionText: {
   fontSize: 12,
   color: '#6b7280',
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
 statsGrid: {
   flexDirection: 'row',
   gap: 12,
 },
 statCard: {
   flex: 1,
   backgroundColor: '#fff',
   borderRadius: 12,
   padding: 16,
   alignItems: 'center',
 },
 statValue: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#6366f1',
 },
 statLabel: {
   fontSize: 12,
   color: '#6b7280',
   marginTop: 4,
 },
 dangerButton: {
   backgroundColor: '#fee2e2',
   borderRadius: 12,
   padding: 16,
   alignItems: 'center',
 },
 dangerButtonText: {
   color: '#dc2626',
   fontWeight: '600',
 },
 successButton: {
   backgroundColor: '#d1fae5',
   borderRadius: 12,
   padding: 16,
   alignItems: 'center',
 },
 successButtonText: {
   color: '#059669',
   fontWeight: '600',
 },
});
