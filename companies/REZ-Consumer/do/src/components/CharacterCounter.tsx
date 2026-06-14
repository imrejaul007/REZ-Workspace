/**
 * CharacterCounter - Displays current/max character count with color coding
 * Shows warning colors as user approaches or exceeds limit
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface CharacterCounterProps {
  current: number;
  max?: number;
  showBar?: boolean; // Optional progress bar visualization
}

const DEFAULT_MAX = 500;

/**
 * Character counter component with color-coded warnings
 * - Gray: Under 80% of max
 * - Orange: 80-99% of max
 * - Red: At or over max
 */
export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max = DEFAULT_MAX,
  showBar = false,
}) => {
  const percentage = (current / max) * 100;

  // Determine color based on usage percentage
  const getColor = (): string => {
    if (percentage >= 100) {
      return '#EF4444'; // Red - over limit
    } else if (percentage >= 80) {
      return '#F59E0B'; // Orange - approaching limit
    }
    return '#999999'; // Gray - safe
  };

  const color = getColor();
  const isOverLimit = percentage >= 100;

  return (
    <Text style={[styles.counter, { color }]}>
      {current}/{max}
      {isOverLimit && ' (limit exceeded)'}
    </Text>
  );
};

/**
 * CharacterCounterWithBar - Includes a visual progress bar
 */
export const CharacterCounterWithBar: React.FC<CharacterCounterProps> = ({
  current,
  max = DEFAULT_MAX,
  showBar = true,
}) => {
  const percentage = Math.min((current / max) * 100, 100);

  const getColor = (): string => {
    if (percentage >= 100) {
      return '#EF4444';
    } else if (percentage >= 80) {
      return '#F59E0B';
    }
    return '#22C55E'; // Green when safe
  };

  const color = getColor();

  return (
    <>
      <Text style={[styles.counter, { color }]}>
        {current}/{max}
      </Text>
      {showBar && (
        <Text style={styles.barContainer}>
          {'['}
          <Text style={[styles.barFill, { color, width: `${percentage}%` }]}>
            {'█'.repeat(Math.floor(percentage / 10))}
          </Text>
          {'░'.repeat(10 - Math.floor(percentage / 10))}
          {']'}
        </Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  counter: {
    fontSize: 12,
    fontWeight: '500',
  },
  barContainer: {
    fontSize: 10,
    color: '#999999',
  },
  barFill: {
    // Color applied inline
  },
});

export default CharacterCounter;
