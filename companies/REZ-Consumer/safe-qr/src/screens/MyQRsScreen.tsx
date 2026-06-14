import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function MyQRsScreen() {
 const navigation = useNavigation<unknown>();
 const [qrs, setQrs] = useState<unknown[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
   loadQRs();
 }, []);

 async function loadQRs() {
   try {
     const response = await api.getMyQRs();
     if (response.success) {
       setQrs(response.data);
     }
   } catch (error) {
     logger.error('Load QRs error:', error);
   } finally {
     setIsLoading(false);
   }
 }

 const modeColors: Record<string, string> = {
   pet: '#f59e0b', device: '#10b981', medical: '#ef4444',
   vehicle: '#3b82f6', personal: '#6366f1', helmet: '#8b5cf6',
 };

 function renderQRItem({ item }: { item: unknown }) {
   const modeColor = modeColors[item.mode] || '#6366f1';
   return (
     <TouchableOpacity
       style={styles.qrCard}
       onPress={() => navigation.navigate('QRDetail', { shortcode: item.shortcode })}
     >
       <View style={[styles.modeIndicator, { backgroundColor: modeColor }]} />
       <View style={styles.qrInfo}>
         <Text style={styles.qrMode}>
           {item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
         </Text>
         <Text style={styles.qrShortcode}>{item.shortcode}</Text>
         <View style={styles.qrStats}>
           <Text style={styles.statText}>{item.stats?.totalScans || 0} scans</Text>
           <Text style={styles.statDot}>•</Text>
           <Text style={styles.statText}>{item.stats?.totalMessages || 0} messages</Text>
         </View>
       </View>
       <View style={styles.qrStatus}>
         <View style={[styles.statusBadge, item.status === 'lost' && styles.lostBadge]}>
           <Text style={[styles.statusText, item.status === 'lost' && styles.lostText]}>
             {item.status.toUpperCase()}
           </Text>
         </View>
         <Text style={styles.arrow}>›</Text>
       </View>
     </TouchableOpacity>
   );
 }

 if (isLoading) {
   return (
     <View style={styles.loadingContainer}>
       <ActivityIndicator size="large" color="#6366f1" />
     </View>
   );
 }

 return (
   <View style={styles.container}>
     <View style={styles.header}>
       <Text style={styles.headerTitle}>My Safe QRs</Text>
       <TouchableOpacity
         style={styles.createButton}
         onPress={() => navigation.navigate('CreateQR')}
       >
         <Text style={styles.createButtonText}>+ Create</Text>
       </TouchableOpacity>
     </View>

     {qrs.length === 0 ? (
       <View style={styles.emptyContainer}>
         <Text style={styles.emptyIcon}>🏷️</Text>
         <Text style={styles.emptyTitle}>No Safe QRs Yet</Text>
         <Text style={styles.emptyText}>
           Create your first Safe QR to get started
         </Text>
         <TouchableOpacity
           style={styles.emptyButton}
           onPress={() => navigation.navigate('CreateQR')}
         >
           <Text style={styles.emptyButtonText}>Create Safe QR</Text>
         </TouchableOpacity>
       </View>
     ) : (
       <FlatList
         data={qrs}
         renderItem={renderQRItem}
         keyExtractor={(item) => item.shortcode}
         contentContainerStyle={styles.listContent}
         refreshing={isLoading}
         onRefresh={loadQRs}
       />
     )}
   </View>
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
 header: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   padding: 20,
   paddingTop: 60,
   backgroundColor: '#fff',
 },
 headerTitle: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#1f2937',
 },
 createButton: {
   backgroundColor: '#6366f1',
   paddingHorizontal: 16,
   paddingVertical: 10,
   borderRadius: 20,
 },
 createButtonText: {
   color: '#fff',
   fontWeight: '600',
 },
 listContent: {
   padding: 16,
 },
 qrCard: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#fff',
   borderRadius: 12,
   marginBottom: 12,
   overflow: 'hidden',
 },
 modeIndicator: {
   width: 4,
   height: '100%',
 },
 qrInfo: {
   flex: 1,
   padding: 16,
 },
 qrMode: {
   fontSize: 16,
   fontWeight: '600',
   color: '#1f2937',
 },
 qrShortcode: {
   fontSize: 14,
   color: '#6b7280',
   marginTop: 2,
 },
 qrStats: {
   flexDirection: 'row',
   alignItems: 'center',
   marginTop: 8,
 },
 statText: {
   fontSize: 12,
   color: '#9ca3af',
 },
 statDot: {
   marginHorizontal: 8,
   color: '#9ca3af',
 },
 qrStatus: {
   flexDirection: 'row',
   alignItems: 'center',
   paddingRight: 16,
 },
 statusBadge: {
   backgroundColor: '#d1fae5',
   paddingHorizontal: 8,
   paddingVertical: 4,
   borderRadius: 4,
   marginRight: 8,
 },
 lostBadge: {
   backgroundColor: '#fee2e2',
 },
 statusText: {
   fontSize: 10,
   fontWeight: '600',
   color: '#059669',
 },
 lostText: {
   color: '#dc2626',
 },
 arrow: {
   fontSize: 24,
   color: '#9ca3af',
 },
 emptyContainer: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
   padding: 40,
 },
 emptyIcon: {
   fontSize: 64,
   marginBottom: 16,
 },
 emptyTitle: {
   fontSize: 20,
   fontWeight: 'bold',
   color: '#1f2937',
   marginBottom: 8,
 },
 emptyText: {
   fontSize: 14,
   color: '#6b7280',
   textAlign: 'center',
   marginBottom: 24,
 },
 emptyButton: {
   backgroundColor: '#6366f1',
   paddingHorizontal: 24,
   paddingVertical: 14,
   borderRadius: 12,
 },
 emptyButtonText: {
   color: '#fff',
   fontWeight: '600',
   fontSize: 16,
 },
});
