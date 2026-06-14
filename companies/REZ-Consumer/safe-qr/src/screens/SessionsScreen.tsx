import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function SessionsScreen() {
 const [sessions, setSessions] = useState<unknown[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
   loadSessions();
 }, []);

 async function loadSessions() {
   try {
     const response = await api.getSessions();
     if (response.success) {
       setSessions(response.data);
     }
   } catch (error) {
     logger.error('Load sessions error:', error);
   } finally {
     setIsLoading(false);
   }
 }

 return (
   <View style={styles.container}>
     <FlatList
       data={sessions}
       keyExtractor={(item) => item.sessionId}
       renderItem={({ item }) => (
         <TouchableOpacity style={styles.sessionCard}>
           <View style={styles.sessionInfo}>
             <Text style={styles.sessionShortcode}>{item.shortcode}</Text>
             <Text style={styles.sessionMode}>{item.mode}</Text>
             <Text style={styles.sessionPreview} numberOfLines={1}>
               {item.lastMessage?.content || 'No messages'}
             </Text>
           </View>
           {item.unreadCount > 0 && (
             <View style={styles.unreadBadge}>
               <Text style={styles.unreadText}>{item.unreadCount}</Text>
             </View>
           )}
         </TouchableOpacity>
       )}
       ListEmptyComponent={
         <View style={styles.empty}>
           <Text style={styles.emptyIcon}>💬</Text>
           <Text style={styles.emptyText}>No conversations yet</Text>
         </View>
       }
     />
   </View>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#f9fafb',
 },
 sessionCard: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#fff',
   padding: 16,
   borderBottomWidth: 1,
   borderBottomColor: '#e5e7eb',
 },
 sessionInfo: {
   flex: 1,
 },
 sessionShortcode: {
   fontSize: 16,
   fontWeight: '600',
   color: '#1f2937',
 },
 sessionMode: {
   fontSize: 12,
   color: '#6b7280',
   textTransform: 'capitalize',
 },
 sessionPreview: {
   fontSize: 14,
   color: '#9ca3af',
   marginTop: 4,
 },
 unreadBadge: {
   backgroundColor: '#6366f1',
   borderRadius: 12,
   minWidth: 24,
   height: 24,
   justifyContent: 'center',
   alignItems: 'center',
   paddingHorizontal: 8,
 },
 unreadText: {
   color: '#fff',
   fontSize: 12,
   fontWeight: 'bold',
 },
 empty: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
   paddingTop: 100,
 },
 emptyIcon: {
   fontSize: 48,
   marginBottom: 12,
 },
 emptyText: {
   fontSize: 16,
   color: '#6b7280',
 },
});
