import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import clsx from 'clsx';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingActions: number;
  onSync: () => void;
}

export function OfflineBanner({ isOnline, pendingActions, onSync }: OfflineBannerProps) {
  if (isOnline && pendingActions === 0) return null;

  return (
    <View
      className={clsx('px-4 py-2', {
        'bg-yellow-100': !isOnline,
        'bg-blue-100': isOnline && pendingActions > 0,
      })}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className={clsx('w-2 h-2 rounded-full mr-2', {
              'bg-yellow-500': !isOnline,
              'bg-blue-500': isOnline,
            })}
          />
          <Text
            className={clsx('text-sm font-medium', {
              'text-yellow-800': !isOnline,
              'text-blue-800': isOnline,
            })}
          >
            {!isOnline
              ? 'You are offline. Changes will sync when connected.'
              : `${pendingActions} pending action${pendingActions > 1 ? 's' : ''} to sync.`}
          </Text>
        </View>
        {isOnline && pendingActions > 0 && (
          <TouchableOpacity onPress={onSync}>
            <Text className="text-sm font-semibold text-blue-600">Sync Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
