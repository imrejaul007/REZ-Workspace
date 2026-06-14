import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import api from '../services/api';

export default function KarmaScreen() {
 const [karmaState, setKarmaState] = useState<unknown>(null);
 const [leaderboard, setLeaderboard] = useState<unknown[]>([]);
 const [history, setHistory] = useState<unknown[]>([]);
 const [activeTab, setActiveTab] = useState<'state' | 'leaderboard' | 'history'>('state');

 useEffect(() => {
   loadData();
 }, []);

 async function loadData() {
   try {
     const [stateRes, leaderRes, histRes] = await Promise.all([
       api.getKarmaState().catch(() => null),
       api.getKarmaLeaderboard(10).catch(() => ({ data: [] })),
       api.getKarmaHistory(20).catch(() => []),
     ]);
     if (stateRes?.data) setKarmaState(stateRes.data);
     if (leaderRes?.data) setLeaderboard(leaderRes.data);
     if (Array.isArray(histRes)) setHistory(histRes);
   } catch (error) {
     logger.error('Load error:', error);
   }
 }

 return (
   <ScrollView style={styles.container}>
     {/* Header Card */}
     <View style={styles.karmaCard}>
       <Text style={styles.badge}>{karmaState?.badge || ''}</Text>
       <Text style={styles.level}>{karmaState?.level || 'Newbie'}</Text>
       <Text style={styles.points}>{karmaState?.totalPoints || 0} points</Text>
       <View style={styles.stats}>
         <View style={styles.stat}>
           <Text style={styles.statValue}>{karmaState?.helpCount || 0}</Text>
           <Text style={styles.statLabel}>Helps</Text>
         </View>
         <View style={styles.statDivider} />
         <View style={styles.stat}>
           <Text style={styles.statValue}>{karmaState?.streak || 0}</Text>
           <Text style={styles.statLabel}>Day Streak</Text>
         </View>
       </View>
     </View>

     {/* Tabs */}
     <View style={styles.tabs}>
       {(['state', 'leaderboard', 'history'] as const).map((tab) => (
         <TouchableOpacity
           key={tab}
           style={[styles.tab, activeTab === tab && styles.tabActive]}
           onPress={() => setActiveTab(tab)}
         >
           <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
             {tab.charAt(0).toUpperCase() + tab.slice(1)}
           </Text>
         </TouchableOpacity>
       ))}
     </View>

     {/* Content */}
     {activeTab === 'state' && (
       <View style={styles.content}>
         <Text style={styles.contentTitle}>Karma Levels</Text>
         {[
           { name: 'Newbie', points: 0 },
           { name: 'Active', points: 10 },
           { name: 'Contributor', points: 50 },
           { name: 'Helper', points: 200 },
           { name: 'Guardian', points: 500 },
           { name: 'Hero', points: 1000 },
           { name: 'Legend', points: 5000 },
         ].map((level) => (
           <View key={level.name} style={styles.levelRow}>
             <Text style={styles.levelName}>{level.name}</Text>
             <Text style={styles.levelPoints}>{level.points}+ pts</Text>
           </View>
         ))}
       </View>
     )}

     {activeTab === 'leaderboard' && (
       <View style={styles.content}>
         {leaderboard.map((user, index) => (
           <View key={user.userId} style={styles.leaderRow}>
             <Text style={styles.leaderRank}>#{index + 1}</Text>
             <Text style={styles.leaderName}>{user.userId}</Text>
             <Text style={styles.leaderPoints}>{user.totalPoints} pts</Text>
           </View>
         ))}
       </View>
     )}

     {activeTab === 'history' && (
       <View style={styles.content}>
         {history.map((event) => (
           <View key={event.eventId} style={styles.historyRow}>
             <Text style={styles.historyPoints}>
               {event.points > 0 ? '+' : ''}{event.points}
             </Text>
             <View>
               <Text style={styles.historyReason}>{event.reason || event.eventType}</Text>
               <Text style={styles.historyDate}>
                 {new Date(event.createdAt).toLocaleDateString()}
               </Text>
             </View>
           </View>
         ))}
       </View>
     )}
   </ScrollView>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#f9fafb',
 },
 karmaCard: {
   backgroundColor: '#6366f1',
   padding: 24,
   alignItems: 'center',
   paddingTop: 60,
 },
 badge: {
   fontSize: 48,
 },
 level: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#fff',
   marginTop: 8,
 },
 points: {
   fontSize: 16,
   color: '#e0e7ff',
   marginTop: 4,
 },
 stats: {
   flexDirection: 'row',
   marginTop: 20,
 },
 stat: {
   alignItems: 'center',
   paddingHorizontal: 20,
 },
 statValue: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#fff',
 },
 statLabel: {
   fontSize: 12,
   color: '#e0e7ff',
   marginTop: 4,
 },
 statDivider: {
   width: 1,
   backgroundColor: 'rgba(255,255,255,0.3)',
 },
 tabs: {
   flexDirection: 'row',
   backgroundColor: '#fff',
   padding: 8,
 },
 tab: {
   flex: 1,
   paddingVertical: 12,
   alignItems: 'center',
   borderRadius: 8,
 },
 tabActive: {
   backgroundColor: '#eef2ff',
 },
 tabText: {
   fontSize: 14,
   color: '#6b7280',
   fontWeight: '500',
 },
 tabTextActive: {
   color: '#6366f1',
 },
 content: {
   padding: 16,
 },
 contentTitle: {
   fontSize: 18,
   fontWeight: '600',
   color: '#1f2937',
   marginBottom: 16,
 },
 levelRow: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   paddingVertical: 12,
   borderBottomWidth: 1,
   borderBottomColor: '#e5e7eb',
 },
 levelName: {
   fontSize: 16,
   color: '#1f2937',
 },
 levelPoints: {
   fontSize: 14,
   color: '#6b7280',
 },
 leaderRow: {
   flexDirection: 'row',
   alignItems: 'center',
   paddingVertical: 12,
   borderBottomWidth: 1,
   borderBottomColor: '#e5e7eb',
 },
 leaderRank: {
   fontSize: 16,
   fontWeight: 'bold',
   color: '#6366f1',
   width: 40,
 },
 leaderName: {
   flex: 1,
   fontSize: 16,
   color: '#1f2937',
 },
 leaderPoints: {
   fontSize: 14,
   fontWeight: '600',
   color: '#6366f1',
 },
 historyRow: {
   flexDirection: 'row',
   alignItems: 'center',
   paddingVertical: 12,
   borderBottomWidth: 1,
   borderBottomColor: '#e5e7eb',
 },
 historyPoints: {
   fontSize: 18,
   fontWeight: 'bold',
   color: '#059669',
   width: 60,
 },
 historyReason: {
   fontSize: 14,
   color: '#1f2937',
 },
 historyDate: {
   fontSize: 12,
   color: '#9ca3af',
   marginTop: 2,
 },
});
