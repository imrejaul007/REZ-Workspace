import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface QRCodeCardProps {
  url: string;
  label: string;
  size?: number;
  expiresAt?: Date | string | null;
  onExpired?: () => void;
}

export function QRCodeCard({ url, label, size = 140, expiresAt, onExpired }: QRCodeCardProps) {
  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setIsExpired(false);
      setTimeRemaining(null);
      return;
    }

    const expirationDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const checkExpiration = () => {
      const now = new Date();
      const diff = expirationDate.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        onExpired?.();
        return;
      }

      setIsExpired(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days}d ${hours % 24}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const handleShare = async () => {
    if (isExpired) return;

    try {
      await Share.share({
        message: `${label}: ${url}`,
        title: label,
        ...(Platform.OS === 'ios' ? { url } : {}),
      });
    } catch {
      // User cancelled or share failed — no-op
    }
  };

  return (
    <View style={[styles.card, isExpired && styles.cardExpired]}>
      <View style={[styles.qrWrapper, isExpired && styles.qrWrapperExpired]}>
        <QRCode
          value={isExpired ? 'EXPIRED' : url}
          size={size}
          color={isExpired ? Colors.light.error : Colors.light.navy}
          backgroundColor={isExpired ? '#FEF2F2' : '#ffffff'}
        />
      </View>
      <Text style={[styles.label, isExpired && styles.labelExpired]} numberOfLines={2}>
        {label}
      </Text>
      {timeRemaining && (
        <View style={[styles.expirationBadge, isExpired && styles.expirationBadgeExpired]}>
          <Ionicons
            name={isExpired ? 'time-outline' : 'hourglass-outline'}
            size={12}
            color={isExpired ? Colors.light.error : Colors.light.textSecondary}
          />
          <Text style={[styles.expirationText, isExpired && styles.expirationTextExpired]}>
            {timeRemaining}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.shareBtn, isExpired && styles.shareBtnDisabled]}
        onPress={handleShare}
        activeOpacity={isExpired ? 1 : 0.7}
        disabled={isExpired}
        accessibilityLabel={`Share ${label}${isExpired ? ' (expired)' : ''}`}
        accessibilityRole="button"
      >
        <Ionicons
          name="share-outline"
          size={16}
          color={isExpired ? Colors.light.textSecondary : Colors.light.primary}
        />
        <Text style={[styles.shareBtnText, isExpired && styles.shareBtnTextDisabled]}>
          {isExpired ? 'Expired' : 'Share'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  qrWrapper: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.borderLight,
    marginBottom: 10,
  },
  qrWrapperExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textHeading,
    textAlign: 'center',
    marginBottom: 8,
  },
  labelExpired: {
    color: Colors.light.error,
  },
  expirationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    marginBottom: 8,
  },
  expirationBadgeExpired: {
    backgroundColor: '#FEE2E2',
  },
  expirationText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  expirationTextExpired: {
    color: Colors.light.error,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight2,
  },
  shareBtnDisabled: {
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  shareBtnTextDisabled: {
    color: Colors.light.textSecondary,
  },
});
