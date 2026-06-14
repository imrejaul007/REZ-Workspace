import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useSafeQR } from '../context/SafeQRContext';
import api from '../services/api';

export default function HomeScreen() {
 const navigation = useNavigation<unknown>();
 const { user } = useAuth();
 const { karmaState, nearbyPosts, refreshKarma, refreshFeed } = useSafeQR();
 const [refreshing, setRefreshing] = useState(false);

 useEffect(() => {
   loadData();
 }, []);

 async function loadData() {
   try {
     const [karmaRes, feedRes] = await Promise.all([
       api.getKarmaState().catch(() => null),
       api.getNearbyFeed(12.9716, 77.5946).catch(() => ({ data: [] })),
     ]);
     if (karmaRes?.data) {
       // Set karma state
     }
     if (feedRes?.data?.data) {
       // Set nearby posts
     }
   } catch (error) {
     logger.error('Home load error:', error);
   }
 }

 async function onRefresh() {
   setRefreshing(true);
   await loadData();
   setRefreshing(false);
 }

 return (
   <ScrollView
     style={styles.container}
     refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
   >
     {/* Header */}
     <View style={styles.header}>
       <View>
         <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
         <Text style={styles.subtitle}>Stay safe with ReZ Safe QR</Text>
       </View>
       <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
         <View style={styles.avatar}>
           <Text style={styles.avatarText}>
             {user?.name?.charAt(0) || 'U'}
           </Text>
         </View>
       </TouchableOpacity>
     </View>

     {/* Karma Card */}
     <TouchableOpacity
       style={styles.karmaCard}
       onPress={() => navigation.navigate('Karma')}
     >
       <View style={styles.karmaLeft}>
         <Text style={styles.karmaBadge}>{karmaState?.badge || ''}</Text>
         <View>
           <Text style={styles.karmaLevel}>{karmaState?.level || 'Newbie'}</Text>
           <Text style={styles.karmaPoints}>
             {karmaState?.totalPoints || 0} points
           </Text>
         </View>
       </View>
       <View style={styles.karmaRight}>
         <Text style={styles.helpCount}>
           {karmaState?.helpCount || 0}
         </Text>
         <Text style={styles.helpLabel}>helps</Text>
       </View>
     </TouchableOpacity>

     {/* Quick Actions */}
     <View style={styles.section}>
       <Text style={styles.sectionTitle}>Quick Actions</Text>
       <View style={styles.quickActions}>
         <TouchableOpacity
           style={styles.actionButton}
           onPress={() => navigation.navigate('CreateQR')}
         >
           <Text style={styles.actionIcon}>+</Text>
           <Text style={styles.actionText}>Create QR</Text>
         </TouchableOpacity>
         <TouchableOpacity
           style={styles.actionButton}
           onPress={() => navigation.navigate('Scan')}
         >
           <Text style={styles.actionIcon}>📷</Text>
           <Text style={styles.actionText}>Scan</Text>
         </TouchableOpacity>
         <TouchableOpacity
           style={styles.actionButton}
           onPress={() => navigation.navigate('Sessions')}
         >
           <Text style={styles.actionIcon}>💬</Text>
           <Text style={styles.actionText}>Messages</Text>
         </TouchableOpacity>
       </View>
     </View>

     {/* Nearby Lost Items */}
     <View style={styles.section}>
       <View style={styles.sectionHeader}>
         <Text style={styles.sectionTitle}>Nearby Lost Items</Text>
         <TouchableOpacity onPress={() => navigation.navigate('Karma')}>
           <Text style={styles.seeAll}>See all</Text>
         </TouchableOpacity>
       </View>
       {nearbyPosts.length === 0 ? (
         <View style={styles.emptyState}>
           <Text style={styles.emptyIcon}>🔍</Text>
           <Text style={styles.emptyText}>No lost items nearby</Text>
           <Text style={styles.emptySubtext}>
             Help others and earn karma points!
           </Text>
         </View>
       ) : (
         nearbyPosts.slice(0, 3).map((post) => (
           <TouchableOpacity key={post.postId} style={styles.lostItemCard}>
             <View style={styles.lostItemContent}>
               <Text style={styles.lostItemTitle}>{post.title}</Text>
               <Text style={styles.lostItemDesc} numberOfLines={1}>
                 {post.description}
               </Text>
               {post.location?.address && (
                 <Text style={styles.lostItemLocation}>
                   📍 {post.location.address}
                 </Text>
               )}
             </View>
             {post.reward && (
               <View style={styles.rewardBadge}>
                 <Text style={styles.rewardAmount}>
                   ₹{post.reward.amount}
                 </Text>
               </View>
             )}
           </TouchableOpacity>
         ))
       )}
     </View>

     {/* Recent Scans */}
     <View style={styles.section}>
       <View style={styles.sectionHeader}>
         <Text style={styles.sectionTitle}>Recent Activity</Text>
       </View>
       <View style={styles.emptyState}>
         <Text style={styles.emptyIcon}>📊</Text>
         <Text style={styles.emptyText}>No recent activity</Text>
         <Text style={styles.emptySubtext}>
           Scan QRs to help others!
         </Text>
       </View>
     </View>
   </ScrollView>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#f9fafb',
 },
 header: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   padding: 20,
   paddingTop: 60,
   backgroundColor: '#6366f1',
 },
 greeting: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#ffffff',
 },
 subtitle: {
   fontSize: 14,
   color: '#e0e7ff',
   marginTop: 4,
 },
 avatar: {
   width: 48,
   height: 48,
   borderRadius: 24,
   backgroundColor: '#ffffff',
   justifyContent: 'center',
   alignItems: 'center',
 },
 avatarText: {
   fontSize: 20,
   fontWeight: 'bold',
   color: '#6366f1',
 },
 karmaCard: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   margin: 16,
   marginTop: -20,
   padding: 20,
   backgroundColor: '#ffffff',
   borderRadius: 16,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 4 },
   shadowOpacity: 0.1,
   shadowRadius: 8,
   elevation: 4,
 },
 karmaLeft: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 karmaBadge: {
   fontSize: 32,
   marginRight: 12,
 },
 karmaLevel: {
   fontSize: 18,
   fontWeight: '600',
   color: '#1f2937',
 },
 karmaPoints: {
   fontSize: 14,
   color: '#6b7280',
   marginTop: 2,
 },
 karmaRight: {
   alignItems: 'center',
 },
 helpCount: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#6366f1',
 },
 helpLabel: {
   fontSize: 12,
   color: '#6b7280',
 },
 section: {
   padding: 16,
 },
 sectionHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   marginBottom: 12,
 },
 sectionTitle: {
   fontSize: 18,
   fontWeight: '600',
   color: '#1f2937',
   marginBottom: 12,
 },
 seeAll: {
   fontSize: 14,
   color: '#6366f1',
   fontWeight: '500',
 },
 quickActions: {
   flexDirection: 'row',
   justifyContent: 'space-around',
 },
 actionButton: {
   alignItems: 'center',
   padding: 16,
   backgroundColor: '#ffffff',
   borderRadius: 12,
   width: 100,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.05,
   shadowRadius: 4,
   elevation: 2,
 },
 actionIcon: {
   fontSize: 28,
   marginBottom: 8,
 },
 actionText: {
   fontSize: 12,
   color: '#6b7280',
   fontWeight: '500',
 },
 emptyState: {
   alignItems: 'center',
   padding: 32,
   backgroundColor: '#ffffff',
   borderRadius: 12,
 },
 emptyIcon: {
   fontSize: 40,
   marginBottom: 12,
 },
 emptyText: {
   fontSize: 16,
   fontWeight: '500',
   color: '#6b7280',
 },
 emptySubtext: {
   fontSize: 14,
   color: '#9ca3af',
   marginTop: 4,
 },
 lostItemCard: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#ffffff',
   borderRadius: 12,
   padding: 16,
   marginBottom: 8,
 },
 lostItemContent: {
   flex: 1,
 },
 lostItemTitle: {
   fontSize: 16,
   fontWeight: '600',
   color: '#1f2937',
 },
 lostItemDesc: {
   fontSize: 14,
   color: '#6b7280',
   marginTop: 2,
 },
 lostItemLocation: {
   fontSize: 12,
   color: '#9ca3af',
   marginTop: 4,
 },
 rewardBadge: {
   backgroundColor: '#fef3c7',
   paddingHorizontal: 12,
   paddingVertical: 6,
   borderRadius: 20,
 },
 rewardAmount: {
   fontSize: 14,
   fontWeight: '600',
   color: '#d97706',
 },
});
