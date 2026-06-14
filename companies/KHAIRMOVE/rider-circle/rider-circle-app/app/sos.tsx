import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function SOSScreen() {
  const router = useRouter();
  const [sosType, setSosType] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  const sosTypes = [
    { id: 'accident', icon: '💥', label: 'Accident', color: '#ef4444' },
    { id: 'medical', icon: '🏥', label: 'Medical', color: '#f97316' },
    { id: 'breakdown', icon: '🔧', label: 'Breakdown', color: '#eab308' },
    { id: 'assistance', icon: '🆘', label: 'Assistance', color: '#22c55e' },
  ];

  const handleSOS = async (type: string) => {
    setSosType(type);
    setIsTriggering(true);

    // In production, this would call the SOS API
    Alert.alert(
      'SOS Activated',
      'Emergency contacts have been notified. Help is on the way.',
      [
        {
          text: 'Cancel SOS',
          onPress: () => {
            setIsTriggering(false);
            setSosType(null);
          },
          style: 'cancel',
        },
        {
          text: 'Stay on Line',
          onPress: () => {
            router.back();
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Warning */}
      <View style={styles.warning}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          Only use SOS in genuine emergencies. False alerts may delay help for those who need it.
        </Text>
      </View>

      {/* SOS Button */}
      <TouchableOpacity
        style={[styles.sosButton, isTriggering && styles.sosButtonActive]}
        onPress={() => handleSOS('emergency')}
        disabled={isTriggering}
      >
        <View style={styles.sosButtonInner}>
          <Text style={styles.sosButtonIcon}>🆘</Text>
          <Text style={styles.sosButtonText}>
            {isTriggering ? 'SOS ACTIVE' : 'TAP FOR SOS'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Type Selection */}
      <Text style={styles.subtitle}>Select emergency type:</Text>

      <View style={styles.typesContainer}>
        {sosTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              { borderColor: type.color },
              sosType === type.id && { backgroundColor: type.color },
            ]}
            onPress={() => handleSOS(type.id)}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <Text style={styles.typeLabel}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <InfoItem
          icon="📱"
          text="Emergency contacts will be notified"
        />
        <InfoItem
          icon="📍"
          text="Your location will be shared"
        />
        <InfoItem
          icon="👥"
          text="Nearby riders may be alerted"
        />
      </View>
    </View>
  );
}

function InfoItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  warning: {
    flexDirection: 'row',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: '#eab308',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#eab308',
    lineHeight: 20,
  },
  sosButton: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  sosButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  sosButtonInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  sosButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  sosButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  typeCard: {
    width: '45%',
    aspectRatio: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
  },
});