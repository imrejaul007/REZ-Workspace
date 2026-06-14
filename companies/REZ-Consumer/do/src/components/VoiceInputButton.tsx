/**
 * VoiceInputButton - Animated microphone button with waveform visualization
 * Provides visual feedback during voice input
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import * as Haptics from 'expo-haptics';
import logger from '@/utils/logger';

interface VoiceInputButtonProps {
  isListening: boolean;
  audioLevel?: number; // 0-1 for waveform intensity
  onPressIn: () => void;
  onPressOut: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showWaveform?: boolean;
}

const SIZES = {
  small: { button: 36, icon: 18, wave: 4 },
  medium: { button: 44, icon: 22, wave: 5 },
  large: { button: 56, icon: 28, wave: 6 },
} as const;

/**
 * Single waveform bar component
 */
const WaveformBar: React.FC<{
  height: number;
  color: string;
  delay: number;
  isActive: boolean;
}> = ({ height, color, delay, isActive }) => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isActive) {
      // Animate with slight variation per bar
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 0.4 + Math.random() * 0.5,
            duration: 200 + delay * 50,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.3 + Math.random() * 0.3,
            duration: 200 + delay * 50,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isActive, delay, animatedValue]);

  const animatedHeight = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [4, height],
  });

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        {
          backgroundColor: color,
          height: animatedHeight,
          opacity: isActive ? 1 : 0.4,
        },
      ]}
    />
  );
};

/**
 * Waveform visualization component
 * Shows animated bars when listening
 */
const WaveformVisualizer: React.FC<{
  isActive: boolean;
  audioLevel: number;
  color: string;
  barCount?: number;
}> = ({ isActive, audioLevel, color, barCount = 5 }) => {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <View style={styles.waveformContainer}>
      {bars.map((_, index) => (
        <WaveformBar
          key={index}
          height={12 + audioLevel * 16} // 12-28 based on level
          color={color}
          delay={index}
          isActive={isActive}
        />
      ))}
    </View>
  );
};

/**
 * VoiceInputButton - Main component
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isListening,
  audioLevel = 0,
  onPressIn,
  onPressOut,
  disabled = false,
  size = 'medium',
  showWaveform = true,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const sizeConfig = SIZES[size];
  const iconColor = isListening ? colors.white : colors.labelSecondary;
  const backgroundColor = isListening ? colors.systemRed : colors.fill;

  // Animate button when listening
  useEffect(() => {
    if (isListening) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isListening, scaleAnim, glowAnim]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPressIn();
  };

  const handlePressOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressOut();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View style={styles.container}>
      {/* Waveform visualization */}
      {showWaveform && isListening && (
        <View style={styles.waveformWrapper}>
          <WaveformVisualizer
            isActive={isListening}
            audioLevel={audioLevel}
            color={colors.systemRed}
            barCount={5}
          />
        </View>
      )}

      {/* Main button */}
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: colors.systemRed,
              opacity: glowOpacity,
              borderRadius: sizeConfig.button / 2 + 8,
            },
          ]}
        />

        <TouchableOpacity
          style={[
            styles.button,
            {
              width: sizeConfig.button,
              height: sizeConfig.button,
              borderRadius: sizeConfig.button / 2,
              backgroundColor,
            },
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={0.8}
        >
          {isListening ? (
            <MicOff size={sizeConfig.icon} color={iconColor} />
          ) : (
            <Mic size={sizeConfig.icon} color={iconColor} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Status indicator */}
      {isListening && (
        <View
          style={[
            styles.statusDot,
            { backgroundColor: colors.systemRed },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  statusDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  waveformWrapper: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 16,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
});

export default VoiceInputButton;
