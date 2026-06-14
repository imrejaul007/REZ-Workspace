import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';

interface ShareCardProps {
  referralCode: string;
  referralUrl?: string;
  onShare?: () => void;
}

export function ShareCard({ referralCode, referralUrl, onShare }: ShareCardProps) {
  const handleShare = async (platform: 'whatsapp' | 'twitter' | 'facebook' | 'copy') => {
    const url = referralUrl || `https://rez.app/join?ref=${referralCode}`;
    const message = `Join me on REZ! Use my referral code ${referralCode} and get ₹50 coins on signup. ${url}`;

    switch (platform) {
      case 'whatsapp':
      case 'twitter':
      case 'facebook':
        // Open share sheet
        await Share.share({
          message: platform === 'whatsapp' ? `${message} via WhatsApp` : message,
        });
        break;
      case 'copy':
        // Copy to clipboard
        // In real app: Clipboard.setString(url);
        break;
    }

    onShare?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Your Code</Text>
      <Text style={styles.code}>{referralCode}</Text>

      <View style={styles.platforms}>
        <TouchableOpacity
          style={styles.platformButton}
          onPress={() => handleShare('whatsapp')}
        >
          <Text style={styles.platformIcon}>📱</Text>
          <Text style={styles.platformName}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.platformButton}
          onPress={() => handleShare('twitter')}
        >
          <Text style={styles.platformIcon}>🐦</Text>
          <Text style={styles.platformName}>Twitter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.platformButton}
          onPress={() => handleShare('facebook')}
        >
          <Text style={styles.platformIcon}>👍</Text>
          <Text style={styles.platformName}>Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.platformButton}
          onPress={() => handleShare('copy')}
        >
          <Text style={styles.platformIcon}>📋</Text>
          <Text style={styles.platformName}>Copy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 4,
    marginBottom: 20,
  },
  platforms: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  platformButton: {
    alignItems: 'center',
    padding: 8,
  },
  platformIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  platformName: {
    fontSize: 11,
    color: '#6B7280',
  },
});

export default ShareCard;
