import { logger } from '../../shared/logger';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { io, Socket } from 'socket.io-client';

const { width, height } = Dimensions.get('window');

// API Configuration
const API_URL = 'http://localhost:4000';
const WS_URL = 'http://localhost:4000/ride';

interface Ad {
  id: string;
  campaignId: string;
  creative: {
    type: 'image' | 'video' | 'card';
    url: string;
    title: string;
    description: string;
    ctaText?: string;
    ctaUrl?: string;
  };
}

interface RideContext {
  rideId: string;
  status: 'idle' | 'pickup' | 'in_progress';
  userName?: string;
  dropAddress?: string;
  etaMinutes?: number;
}

const ScreenApp: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [screenId] = useState<string>('SCREEN_001');
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [rideContext, setRideContext] = useState<RideContext>({
    rideId: '',
    status: 'idle',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [impressionStartTime, setImpressionStartTime] = useState<number>(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Connect to WebSocket
  useEffect(() => {
    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const connectSocket = () => {
    const newSocket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      logger.info('Connected to server');
      setIsOnline(true);
      newSocket.emit('screen:join', { screenId });
    });

    newSocket.on('disconnect', () => {
      logger.info('Disconnected from server');
      setIsOnline(false);
    });

    // Listen for ads
    newSocket.on('ad:show', (ad: Ad) => {
      showAd(ad);
    });

    // Listen for ride context
    newSocket.on('ride:context', (context: RideContext) => {
      setRideContext(context);
    });

    // Listen for idle state
    newSocket.on('screen:idle', () => {
      setRideContext({ rideId: '', status: 'idle' });
      setCurrentAd(null);
    });

    setSocket(newSocket);
  };

  const showAd = (ad: Ad) => {
    setIsLoading(true);
    setCurrentAd(ad);
    setImpressionStartTime(Date.now());

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsLoading(false);
    });

    // Record impression
    socket?.emit('screen:impression', {
      screenId,
      adId: ad.id,
      event: 'ad_view_start',
      timestamp: new Date().toISOString(),
    });
  };

  const handleAdTap = () => {
    if (!currentAd || !impressionStartTime) return;

    const viewDuration = (Date.now() - impressionStartTime) / 1000;

    // Record interaction
    socket?.emit('screen:impression', {
      screenId,
      adId: currentAd.id,
      event: 'ad_tap',
      viewDuration,
      timestamp: new Date().toISOString(),
    });

    // Could open CTA URL or navigate
    logger.info('Ad tapped:', currentAd.creative.ctaUrl);
  };

  const renderIdleScreen = () => (
    <View style={styles.idleContainer}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🚗</Text>
        <Text style={styles.brandName}>ReZ Ride</Text>
        <Text style={styles.tagline}>"Rides that pay you back"</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, isOnline && styles.statusOnline]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Screen Online' : 'Connecting...'}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Screen ID: {screenId}</Text>
        <Text style={styles.infoText}>Waiting for ride...</Text>
      </View>
    </View>
  );

  const renderAdScreen = () => {
    if (!currentAd) return null;

    return (
      <TouchableOpacity
        style={styles.adContainer}
        activeOpacity={0.95}
        onPress={handleAdTap}
      >
        <Animated.View
          style={[
            styles.adContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Ad Image */}
          <View style={styles.adImageContainer}>
            {currentAd.creative.type === 'image' ? (
              <Image
                source={{ uri: currentAd.creative.url }}
                style={styles.adImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.adPlaceholder}>
                <Text style={styles.adPlaceholderText}>
                  {currentAd.creative.title}
                </Text>
              </View>
            )}
          </View>

          {/* Ad Info */}
          <View style={styles.adInfo}>
            <Text style={styles.adTitle}>{currentAd.creative.title}</Text>
            <Text style={styles.adDescription} numberOfLines={2}>
              {currentAd.creative.description}
            </Text>

            {currentAd.creative.ctaText && (
              <View style={styles.ctaButton}>
                <Text style={styles.ctaText}>{currentAd.creative.ctaText}</Text>
              </View>
            )}
          </View>

          {/* ReZ Branding */}
          <View style={styles.brandingBar}>
            <Text style={styles.brandingText}>ReZ Ride</Text>
            <Text style={styles.brandingSubtext}>Powered by Ads</Text>
          </View>
        </Animated.View>

        {/* Ride Info Overlay */}
        {rideContext.status !== 'idle' && (
          <View style={styles.rideOverlay}>
            <View style={styles.rideInfo}>
              <Text style={styles.rideUser}>Passenger: {rideContext.userName || 'User'}</Text>
              <Text style={styles.rideDrop}>
                To: {rideContext.dropAddress || 'Destination'}
              </Text>
              {rideContext.etaMinutes && (
                <Text style={styles.rideEta}>
                  {rideContext.etaMinutes} min remaining
                </Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {rideContext.status === 'idle' ? renderIdleScreen() : renderAdScreen()}

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  idleContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff6b6b',
    marginRight: 8,
  },
  statusOnline: {
    backgroundColor: '#4ecdc4',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
  infoContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    marginVertical: 4,
  },
  adContainer: {
    flex: 1,
  },
  adContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  adImageContainer: {
    flex: 1,
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  adPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adPlaceholderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
  },
  adInfo: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  adTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  adDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
  },
  ctaButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  brandingBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  brandingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  brandingSubtext: {
    color: '#888',
    fontSize: 12,
  },
  rideOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  rideInfo: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
  },
  rideUser: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  rideDrop: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rideEta: {
    color: '#4ecdc4',
    fontSize: 12,
    marginTop: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default ScreenApp;
