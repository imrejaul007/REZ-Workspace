import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function ScanScreen() {
 const navigation = useNavigation<unknown>();
 const [permission, requestPermission] = useCameraPermissions();
 const [scanned, setScanned] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [manualCode, setManualCode] = useState('');
 const [showManual, setShowManual] = useState(false);
 const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

 useEffect(() => {
   getLocation();
 }, []);

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
     console.log('Location permission denied');
   }
 }

 async function handleBarCodeScanned({ type, data }: { type: string; data: string }) {
   if (scanned || isLoading) return;

   setScanned(true);
   setIsLoading(true);

   try {
     // Parse QR data
     let shortcode = data;

     // Handle JSON payload
     if (data.startsWith('{')) {
       const payload = JSON.parse(data);
       if (payload.shortcode) {
         shortcode = payload.shortcode;
       }
     }

     // Handle URL format
     if (data.includes('/s/')) {
       const parts = data.split('/s/');
       shortcode = parts[parts.length - 1].split('?')[0];
     }

     // Normalize shortcode
     shortcode = shortcode.toUpperCase().trim();

     // Call scan API
     const response = await api.scan(shortcode);

     if (response.success) {
       // Navigate to result
       navigation.navigate('ScanResult', {
         shortcode,
         data: response.data,
       });
     } else {
       Alert.alert('Error', response.error?.message || 'QR not found');
       setScanned(false);
     }
   } catch (error) {
     logger.error('Scan error:', error);
     Alert.alert(
       'Error',
       error.response?.data?.error?.message || 'Failed to scan QR'
     );
     setScanned(false);
   } finally {
     setIsLoading(false);
   }
 }

 async function handleManualSubmit() {
   if (!manualCode.trim()) {
     Alert.alert('Error', 'Please enter a shortcode');
     return;
   }

   const shortcode = manualCode.toUpperCase().trim();
   navigation.navigate('ScanResult', { shortcode, data: null });
   setShowManual(false);
   setManualCode('');
 }

 if (!permission) {
   return (
     <View style={styles.container}>
       <Text style={styles.message}>Requesting camera permission...</Text>
     </View>
   );
 }

 if (!permission.granted) {
   return (
     <View style={styles.container}>
       <View style={styles.permissionContainer}>
         <Text style={styles.permissionIcon}>📷</Text>
         <Text style={styles.permissionTitle}>Camera Access Required</Text>
         <Text style={styles.permissionText}>
           We need camera access to scan QR codes
         </Text>
         <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
           <Text style={styles.permissionButtonText}>Grant Permission</Text>
         </TouchableOpacity>
         <TouchableOpacity
           style={styles.manualButton}
           onPress={() => setShowManual(true)}
         >
           <Text style={styles.manualButtonText}>Enter Code Manually</Text>
         </TouchableOpacity>
       </View>
     </View>
   );
 }

 if (showManual) {
   return (
     <View style={styles.container}>
       <View style={styles.manualContainer}>
         <Text style={styles.manualTitle}>Enter Shortcode</Text>
         <Text style={styles.manualText}>
           Enter the 6-character code shown on the QR
         </Text>
         <TextInput
           style={styles.manualInput}
           value={manualCode}
           onChangeText={setManualCode}
           placeholder="REZP01"
           placeholderTextColor="#9ca3af"
           autoCapitalize="characters"
           maxLength={6}
           autoFocus
         />
         <View style={styles.manualButtons}>
           <TouchableOpacity
             style={styles.manualCancel}
             onPress={() => {
               setShowManual(false);
               setManualCode('');
             }}
           >
             <Text style={styles.manualCancelText}>Cancel</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.manualSubmit} onPress={handleManualSubmit}>
             <Text style={styles.manualSubmitText}>Scan</Text>
           </TouchableOpacity>
         </View>
       </View>
     </View>
   );
 }

 return (
   <View style={styles.container}>
     <CameraView
       style={styles.camera}
       barcodeScannerSettings={{
         barcodeTypes: ['qr'],
       }}
       onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
     >
       <View style={styles.overlay}>
         {/* Header */}
         <View style={styles.header}>
           <Text style={styles.headerText}>Scan Safe QR</Text>
         </View>

         {/* Scan Frame */}
         <View style={styles.frameContainer}>
           <View style={styles.frame}>
             <View style={[styles.corner, styles.cornerTopLeft]} />
             <View style={[styles.corner, styles.cornerTopRight]} />
             <View style={[styles.corner, styles.cornerBottomLeft]} />
             <View style={[styles.corner, styles.cornerBottomRight]} />
             {isLoading && (
               <View style={styles.loadingOverlay}>
                 <ActivityIndicator size="large" color="#6366f1" />
                 <Text style={styles.loadingText}>Scanning...</Text>
               </View>
             )}
           </View>
         </View>

         {/* Footer */}
         <View style={styles.footer}>
           <Text style={styles.footerText}>
             Point camera at a Safe QR code
           </Text>
           <TouchableOpacity
             style={styles.manualEntryButton}
             onPress={() => setShowManual(true)}
           >
             <Text style={styles.manualEntryText}>Enter code manually</Text>
           </TouchableOpacity>
         </View>
       </View>
     </CameraView>
   </View>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#000',
 },
 message: {
   color: '#fff',
   fontSize: 16,
   textAlign: 'center',
   marginTop: 100,
 },
 permissionContainer: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
   padding: 40,
   backgroundColor: '#f9fafb',
 },
 permissionIcon: {
   fontSize: 64,
   marginBottom: 20,
 },
 permissionTitle: {
   fontSize: 20,
   fontWeight: 'bold',
   color: '#1f2937',
   marginBottom: 8,
 },
 permissionText: {
   fontSize: 14,
   color: '#6b7280',
   textAlign: 'center',
   marginBottom: 24,
 },
 permissionButton: {
   backgroundColor: '#6366f1',
   paddingHorizontal: 32,
   paddingVertical: 14,
   borderRadius: 12,
   marginBottom: 16,
 },
 permissionButtonText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: '600',
 },
 manualButton: {
   paddingHorizontal: 32,
   paddingVertical: 14,
 },
 manualButtonText: {
   color: '#6366f1',
   fontSize: 16,
   fontWeight: '500',
 },
 camera: {
   flex: 1,
 },
 overlay: {
   flex: 1,
   backgroundColor: 'rgba(0,0,0,0.5)',
 },
 header: {
   paddingTop: 60,
   paddingHorizontal: 20,
   paddingBottom: 20,
 },
 headerText: {
   color: '#fff',
   fontSize: 24,
   fontWeight: 'bold',
   textAlign: 'center',
 },
 frameContainer: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
 },
 frame: {
   width: 250,
   height: 250,
   position: 'relative',
 },
 corner: {
   position: 'absolute',
   width: 40,
   height: 40,
   borderColor: '#6366f1',
 },
 cornerTopLeft: {
   top: 0,
   left: 0,
   borderTopWidth: 4,
   borderLeftWidth: 4,
   borderTopLeftRadius: 16,
 },
 cornerTopRight: {
   top: 0,
   right: 0,
   borderTopWidth: 4,
   borderRightWidth: 4,
   borderTopRightRadius: 16,
 },
 cornerBottomLeft: {
   bottom: 0,
   left: 0,
   borderBottomWidth: 4,
   borderLeftWidth: 4,
   borderBottomLeftRadius: 16,
 },
 cornerBottomRight: {
   bottom: 0,
   right: 0,
   borderBottomWidth: 4,
   borderRightWidth: 4,
   borderBottomRightRadius: 16,
 },
 loadingOverlay: {
   ...StyleSheet.absoluteFillObject,
   backgroundColor: 'rgba(255,255,255,0.9)',
   justifyContent: 'center',
   alignItems: 'center',
   borderRadius: 16,
 },
 loadingText: {
   marginTop: 12,
   fontSize: 14,
   color: '#6366f1',
 },
 footer: {
   padding: 40,
   alignItems: 'center',
 },
 footerText: {
   color: '#fff',
   fontSize: 16,
   textAlign: 'center',
   marginBottom: 16,
 },
 manualEntryButton: {
   padding: 12,
 },
 manualEntryText: {
   color: '#fff',
   fontSize: 14,
   textDecorationLine: 'underline',
 },
 manualContainer: {
   flex: 1,
   justifyContent: 'center',
   padding: 40,
   backgroundColor: '#f9fafb',
 },
 manualTitle: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#1f2937',
   textAlign: 'center',
   marginBottom: 8,
 },
 manualText: {
   fontSize: 14,
   color: '#6b7280',
   textAlign: 'center',
   marginBottom: 24,
 },
 manualInput: {
   backgroundColor: '#fff',
   borderWidth: 2,
   borderColor: '#e5e7eb',
   borderRadius: 12,
   padding: 16,
   fontSize: 24,
   fontWeight: 'bold',
   textAlign: 'center',
   letterSpacing: 4,
   color: '#1f2937',
 },
 manualButtons: {
   flexDirection: 'row',
   marginTop: 24,
   gap: 12,
 },
 manualCancel: {
   flex: 1,
   padding: 16,
   borderRadius: 12,
   backgroundColor: '#e5e7eb',
   alignItems: 'center',
 },
 manualCancelText: {
   fontSize: 16,
   fontWeight: '600',
   color: '#6b7280',
 },
 manualSubmit: {
   flex: 1,
   padding: 16,
   borderRadius: 12,
   backgroundColor: '#6366f1',
   alignItems: 'center',
 },
 manualSubmitText: {
   fontSize: 16,
   fontWeight: '600',
   color: '#fff',
 },
});
