import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { purchaseOrderApi } from '../services/api';
import { RootStackParamList, DeliveryPhoto } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'Camera'>;

const PHOTO_TYPES = [
  { type: 'delivery' as const, label: 'Delivery', icon: 'package-variant', color: '#4CAF50' },
  { type: 'damage' as const, label: 'Damage', icon: 'alert', color: '#F44336' },
  { type: 'receiving' as const, label: 'Receiving', icon: 'check-circle', color: '#2196F3' },
  { type: 'signature' as const, label: 'Signature', icon: 'draw', color: '#9C27B0' },
];

export const CameraScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { poId, type } = route.params;

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });
      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    setNotes('');
  }, []);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedPhoto(result.assets[0].uri);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!capturedPhoto) return;

    setIsUploading(true);
    try {
      const response = await purchaseOrderApi.uploadDeliveryPhoto(poId, {
        uri: capturedPhoto,
        type,
        notes: notes || undefined,
      });

      if (response.success) {
        Alert.alert('Success', 'Photo uploaded successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
    } catch (error) {
      Alert.alert(
        'Upload Failed',
        'Would you like to save the photo locally and upload later?',
        [
          { text: 'Discard', style: 'cancel', onPress: () => navigation.goBack() },
          { text: 'Save Offline', onPress: () => navigation.goBack() },
        ]
      );
    } finally {
      setIsUploading(false);
    }
  }, [capturedPhoto, poId, type, notes, navigation]);

  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashMode((current) => (current === 'off' ? 'on' : 'off'));
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#FFF" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionMessage}>
          We need camera access to capture delivery photos
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Photo preview mode
  if (capturedPhoto) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={handleRetake}>
            <MaterialCommunityIcons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Review Photo</Text>
          <View style={{ width: 28 }} />
        </View>

        <Image source={{ uri: capturedPhoto }} style={styles.preview} resizeMode="contain" />

        <View style={styles.previewFooter}>
          <View style={styles.typeSelector}>
            {PHOTO_TYPES.map((pt) => (
              <TouchableOpacity
                key={pt.type}
                style={[
                  styles.typeButton,
                  type === pt.type && { backgroundColor: pt.color },
                ]}
                onPress={() => {}}
              >
                <MaterialCommunityIcons
                  name={pt.icon as unknown}
                  size={20}
                  color={type === pt.type ? '#FFF' : pt.color}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === pt.type && styles.typeButtonTextActive,
                  ]}
                >
                  {pt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.notesInput} onPress={() => {}}>
            <MaterialCommunityIcons name="comment-text-outline" size={20} color="#999" />
            <Text style={styles.notesPlaceholder}>
              {notes || 'Add notes (optional)...'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="cloud-upload" size={24} color="#FFF" />
                <Text style={styles.uploadButtonText}>Upload Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera mode
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flashMode}
      >
        {/* Top controls */}
        <View style={[styles.topControls, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.controlButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.typeLabel}>
              {PHOTO_TYPES.find((pt) => pt.type === type)?.label || 'Photo'}
            </Text>
          </View>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <MaterialCommunityIcons
              name={flashMode === 'on' ? 'flash' : 'flash-off'}
              size={28}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinder}>
          <View style={styles.viewfinderCorner} />
        </View>

        {/* Bottom controls */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
            <MaterialCommunityIcons name="image" size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonActive]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <MaterialCommunityIcons name="camera-flip" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 20,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 30,
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  backLink: {
    marginTop: 20,
    padding: 10,
  },
  backLinkText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCenter: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  viewfinder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderCorner: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  captureButtonActive: {
    opacity: 0.7,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  preview: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewFooter: {
    backgroundColor: '#1A1A1A',
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  typeButtonText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#FFF',
  },
  notesInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  notesPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default CameraScreen;
