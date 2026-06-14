import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MerchantRole } from '../../types/team';
import { useThemedStyles } from '../ui/ThemeProvider';
import { Colors } from '../../constants/DesignTokens';

interface RoleBadgeProps {
  role: MerchantRole;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'medium',
  showIcon = false,
  style,
  testID,
}) => {
  const styles = useThemedStyles((theme) => {
    // Role-specific colors
    const roleColors = {
      owner: {
        backgroundColor: '#7C3AED',
        color: Colors.text.inverse,
        borderColor: '#6D28D9',
      },
      admin: {
        backgroundColor: Colors.primary[500],
        color: Colors.text.inverse,
        borderColor: Colors.primary[600],
      },
      manager: {
        backgroundColor: Colors.success[500],
        color: Colors.text.inverse,
        borderColor: Colors.success[600],
      },
      staff: {
        backgroundColor: theme.colors.gray[500],
        color: Colors.text.inverse,
        borderColor: theme.colors.gray[600],
      },
      cashier: {
        backgroundColor: '#F59E0B',
        color: Colors.text.inverse,
        borderColor: '#D97706',
      },
    };

    // Size configurations
    const sizes = {
      small: {
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        fontSize: theme.typography.fontSize.xs,
        borderRadius: theme.borderRadius.sm,
        iconSize: 12,
      },
      medium: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        fontSize: theme.typography.fontSize.sm,
        borderRadius: theme.borderRadius.base,
        iconSize: 14,
      },
      large: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
        borderRadius: theme.borderRadius.lg,
        iconSize: 16,
      },
    };

    const roleConfig = roleColors[role];
    const sizeConfig = sizes[size];

    return {
      badge: {
        backgroundColor: roleConfig.backgroundColor,
        borderColor: roleConfig.borderColor,
        borderWidth: 1,
        borderRadius: sizeConfig.borderRadius,
        paddingHorizontal: sizeConfig.paddingHorizontal,
        paddingVertical: sizeConfig.paddingVertical,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
      } as ViewStyle,
      text: {
        color: roleConfig.color,
        fontSize: sizeConfig.fontSize,
        fontWeight: theme.typography.fontWeight.semiBold,
        textTransform: 'capitalize',
      } as TextStyle,
      iconSize: sizeConfig.iconSize,
      iconColor: roleConfig.color,
    };
  });

  // Role icons
  const roleIcons: Record<MerchantRole, keyof typeof Ionicons.glyphMap> = {
    owner: 'diamond-outline',
    admin: 'shield-checkmark-outline',
    manager: 'briefcase-outline',
    staff: 'person-outline',
    cashier: 'cash-outline',
  };

  return (
    <View style={[styles.badge, style]} testID={testID}>
      {showIcon && (
        <Ionicons
          name={roleIcons[role]}
          size={styles.iconSize}
          color={styles.iconColor}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={styles.text}>{role}</Text>
    </View>
  );
};
