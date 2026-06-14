import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { QuickAction } from '../types';
import clsx from 'clsx';

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (action: QuickAction) => void;
}

export function QuickActions({ actions, onAction }: QuickActionsProps) {
  return (
    <View className="px-4 mb-4">
      <View className="flex-row flex-wrap justify-between">
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => onAction(action)}
            className="items-center mb-4"
            style={{ width: '18%' }}
          >
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mb-1"
              style={{ backgroundColor: action.color + '20' }}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: action.color }}
              >
                <Text className="text-white text-lg">
                  {action.icon === 'plus-circle' && '+'}
                  {action.icon === 'calendar-plus' && '📅'}
                  {action.icon === 'bar-chart-2' && '📊'}
                  {action.icon === 'list' && '📋'}
                  {action.icon === 'message-circle' && '💬'}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-gray-700 text-center font-medium">
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
