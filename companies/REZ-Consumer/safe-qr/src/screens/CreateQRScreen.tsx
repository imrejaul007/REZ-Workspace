import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

const MODES = [
  { mode: 'pet', name: 'Pet', icon: '', color: '#f59e0b' },
  { mode: 'personal', name: 'Personal', icon: '', color: '#6366f1' },
  { mode: 'device', name: 'Device', icon: '', color: '#10b981' },
  { mode: 'medical', name: 'Medical', icon: '', color: '#ef4444' },
  { mode: 'vehicle', name: 'Vehicle', icon: '', color: '#3b82f6' },
  { mode: 'helmet', name: 'Helmet', icon: '', color: '#8b5cf6' },
  { mode: 'child', name: 'Child', icon: '', color: '#ec4899' },
  { mode: 'home', name: 'Home', icon: '', color: '#14b8a6' },
];

export default function CreateQRScreen() {
 const navigation = useNavigation<unknown>();
 const [step, setStep] = useState(1);
 const [selectedMode, setSelectedMode] = useState<string | null>(null);
 const [profile, setProfile] = useState<unknown>({});
 const [isLoading, setIsLoading] = useState(false);

 async function handleCreate() {
   if (!selectedMode) {
     Alert.alert('Error', 'Please select a mode');
     return;
   }

   setIsLoading(true);
   try {
     const response = await api.createQR({
       mode: selectedMode,
       profile,
       settings: {},
     });

     if (response.success) {
       Alert.alert('Success!', 'Your Safe QR has been created.', [
         { text: 'OK', onPress: () => navigation.goBack() },
       ]);
     } else {
       Alert.alert('Error', response.error?.message || 'Failed to create QR');
     }
   } catch (error) {
     Alert.alert('Error', error.response?.data?.error?.message || 'Failed to create');
   } finally {
     setIsLoading(false);
   }
 }

 return (
   <ScrollView style={styles.container}>
     {/* Step 1: Select Mode */}
     <View style={styles.section}>
       <Text style={styles.sectionTitle}>What are you securing?</Text>
       <View style={styles.modeGrid}>
         {MODES.map((m) => (
           <TouchableOpacity
             key={m.mode}
             style={[
               styles.modeCard,
               selectedMode === m.mode && { borderColor: m.color, borderWidth: 3 },
             ]}
             onPress={() => {
               setSelectedMode(m.mode);
               setStep(2);
             }}
           >
             <View style={[styles.modeIcon, { backgroundColor: m.color }]}>
               <Text style={styles.modeIconText}>{m.icon}</Text>
             </View>
             <Text style={styles.modeName}>{m.name}</Text>
           </TouchableOpacity>
         ))}
       </View>
     </View>

     {/* Step 2: Basic Info */}
     {step >= 2 && selectedMode && (
       <View style={styles.section}>
         <Text style={styles.sectionTitle}>Basic Information</Text>

         {selectedMode === 'pet' && (
           <>
             <TextInput
               style={styles.input}
               placeholder="Pet name *"
               placeholderTextColor="#9ca3af"
               value={profile.name || ''}
               onChangeText={(v) => setProfile({ ...profile, name: v })}
             />
             <TextInput
               style={styles.input}
               placeholder="Breed (optional)"
               placeholderTextColor="#9ca3af"
               value={profile.breed || ''}
               onChangeText={(v) => setProfile({ ...profile, breed: v })}
             />
             <TextInput
               style={styles.input}
               placeholder="Description"
               placeholderTextColor="#9ca3af"
               multiline
               value={profile.description || ''}
               onChangeText={(v) => setProfile({ ...profile, description: v })}
             />
           </>
         )}

         {selectedMode === 'device' && (
           <>
             <TextInput
               style={styles.input}
               placeholder="Device brand *"
               placeholderTextColor="#9ca3af"
               value={profile.brand || ''}
               onChangeText={(v) => setProfile({ ...profile, brand: v })}
             />
             <TextInput
               style={styles.input}
               placeholder="Model (optional)"
               placeholderTextColor="#9ca3af"
               value={profile.model || ''}
               onChangeText={(v) => setProfile({ ...profile, model: v })}
             />
           </>
         )}

         {selectedMode === 'medical' && (
           <>
             <TextInput
               style={styles.input}
               placeholder="Your name *"
               placeholderTextColor="#9ca3af"
               value={profile.displayName || ''}
               onChangeText={(v) => setProfile({ ...profile, displayName: v })}
             />
             <TextInput
               style={styles.input}
               placeholder="Blood type (e.g., O+)"
               placeholderTextColor="#9ca3af"
               value={profile.bloodType || ''}
               onChangeText={(v) => setProfile({ ...profile, bloodType: v })}
             />
           </>
         )}

         {selectedMode === 'vehicle' && (
           <>
             <TextInput
               style={styles.input}
               placeholder="Vehicle make *"
               placeholderTextColor="#9ca3af"
               value={profile.make || ''}
               onChangeText={(v) => setProfile({ ...profile, make: v })}
             />
             <TextInput
               style={styles.input}
               placeholder="Model (optional)"
               placeholderTextColor="#9ca3af"
               value={profile.model || ''}
               onChangeText={(v) => setProfile({ ...profile, model: v })}
             />
             <TextInput
               style={styles.input}
               placeholder="Color"
               placeholderTextColor="#9ca3af"
               value={profile.color || ''}
               onChangeText={(v) => setProfile({ ...profile, color: v })}
             />
           </>
         )}

         <TouchableOpacity
           style={styles.backButton}
           onPress={() => setStep(1)}
         >
           <Text style={styles.backButtonText}>‹ Back</Text>
         </TouchableOpacity>

         <TouchableOpacity
           style={[styles.createButton, isLoading && styles.createButtonDisabled]}
           onPress={handleCreate}
           disabled={isLoading}
         >
           <Text style={styles.createButtonText}>
             {isLoading ? 'Creating...' : 'Create Safe QR'}
           </Text>
         </TouchableOpacity>
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
 section: {
   padding: 20,
 },
 sectionTitle: {
   fontSize: 20,
   fontWeight: 'bold',
   color: '#1f2937',
   marginBottom: 16,
 },
 modeGrid: {
   flexDirection: 'row',
   flexWrap: 'wrap',
   gap: 12,
 },
 modeCard: {
   width: '47%',
   backgroundColor: '#fff',
   borderRadius: 12,
   padding: 16,
   alignItems: 'center',
   borderWidth: 2,
   borderColor: '#e5e7eb',
 },
 modeIcon: {
   width: 48,
   height: 48,
   borderRadius: 24,
   justifyContent: 'center',
   alignItems: 'center',
   marginBottom: 8,
 },
 modeIconText: {
   fontSize: 24,
 },
 modeName: {
   fontSize: 14,
   fontWeight: '600',
   color: '#1f2937',
 },
 input: {
   backgroundColor: '#fff',
   borderWidth: 1,
   borderColor: '#e5e7eb',
   borderRadius: 12,
   padding: 16,
   fontSize: 16,
   marginBottom: 12,
   color: '#1f2937',
 },
 backButton: {
   padding: 16,
   alignItems: 'center',
 },
 backButtonText: {
   color: '#6366f1',
   fontSize: 16,
   fontWeight: '500',
 },
 createButton: {
   backgroundColor: '#6366f1',
   borderRadius: 12,
   padding: 18,
   alignItems: 'center',
   marginTop: 8,
 },
 createButtonDisabled: {
   opacity: 0.7,
 },
 createButtonText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: '600',
 },
});
