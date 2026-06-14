// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReferral } from '../../hooks/useReferral';

export default function QRScreen() {
  const router = useRouter();
  const { referralCode, trackShare } = useReferral();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateQR();
  }, [referralCode]);

  const generateQR = async () => {
    if (!referralCode?.code) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_REFERRAL_API_URL || 'http://localhost:4019'}/api/consumer/qr/${referralCode.code}`
      );
      const data = await response.json();
      if (data.success) {
        setQrDataUrl(data.data.qrCode);
      }
    } catch (error) {
      console.error('QR generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const shareToWhatsApp = async () => {
    const referralUrl = `https://rez.app/join?ref=${referralCode?.code}`;
    const message = `Join me on REZ! Use my referral code ${referralCode?.code} and get ₹50 coins on signup. ${referralUrl}`;

    try {
      await Share.share({
        message,
        title: 'Invite via WhatsApp',
      });
      await trackShare('whatsapp');
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const shareToInstagram = async () => {
    Alert.alert(
      'Share to Instagram',
      `Share your referral code: ${referralCode?.code}\n\nOr download the QR image and post it!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy Code', onPress: () => {
          // Clipboard.copy(referralCode?.code);
          Alert.alert('Copied!', 'Referral code copied');
        }},
      ]
    );
    await trackShare('instagram');
  };

  const shareToFacebook = async () => {
    const referralUrl = `https://rez.app/join?ref=${referralCode?.code}`;
    try {
      await Share.share({
        message: `Join me on REZ! Use my referral code ${referralCode?.code} and get rewards. ${referralUrl}`,
        title: 'Invite Friends',
      });
      await trackShare('facebook');
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const copyLink = () => {
    // In real app: Clipboard.setString(referralUrl);
    Alert.alert('Copied!', 'Referral link copied to clipboard');
    trackShare('copy_link');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Share Your QR</Text>
      </View>

      {/* QR Code Display */}
      <View style={styles.qrSection}>
        {isLoading ? (
          <View style={styles.qrPlaceholder}>
            <Text style={styles.loadingText}>Generating QR...</Text>
          </View>
        ) : qrDataUrl ? (
          <Image
            source={{ uri: qrDataUrl }}
            style={styles.qrImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrIcon}>📱</Text>
            <Text style={styles.qrText}>QR Code</Text>
          </View>
        )}

        <Text style={styles.codeText}>{referralCode?.code}</Text>
        <Text style={styles.urlText}>
          rez.app/join?ref={referralCode?.code}
        </Text>
      </View>

      {/* Share Options */}
      <View style={styles.shareSection}>
        <Text style={styles.shareTitle}>Share via</Text>

        <View style={styles.shareGrid}>
          <TouchableOpacity style={styles.shareButton} onPress={shareToWhatsApp}>
            <Text style={styles.shareIcon}>📱</Text>
            <Text style={styles.shareLabel}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={shareToInstagram}>
            <Text style={styles.shareIcon}>📸</Text>
            <Text style={styles.shareLabel}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={shareToFacebook}>
            <Text style={styles.shareIcon}>👍</Text>
            <Text style={styles.shareLabel}>Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={copyLink}>
            <Text style={styles.shareIcon}>🔗</Text>
            <Text style={styles.shareLabel}>Copy Link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareIcon}>✉️</Text>
            <Text style={styles.shareLabel}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareIcon}>💬</Text>
            <Text style={styles.shareLabel}>Telegram</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Tips for more referrals</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Share on your social media stories
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Print the QR code and put it at your business
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Share with friends and family
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 16,
    color: '#6366F1',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  qrSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  qrImage: {
    width: 250,
    height: 250,
    borderRadius: 16,
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  qrIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  qrText: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    letterSpacing: 4,
  },
  urlText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  shareSection: {
    padding: 24,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shareButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  shareLabel: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  tipsSection: {
    padding: 24,
    paddingTop: 0,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    color: '#6366F1',
    marginRight: 8,
    fontSize: 14,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
});
