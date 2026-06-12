import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import type { TunifyColors } from '../../app/theme/colors';
import { radius, spacing, typography } from '../../app/theme/tokens';
import { useThemeStore } from '../../app/theme/theme.store';

type IconType = React.ComponentType<{
  color?: string;
  fill?: string;
  size?: number;
  strokeWidth?: number;
}>;

type AppButtonVariant = 'primary' | 'secondary' | 'danger';

type AppButtonProps = {
  disabled?: boolean;
  icon: IconType;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: AppButtonVariant;
};

export function AppButton({
  disabled,
  icon: Icon,
  label,
  onPress,
  style,
  variant = 'secondary',
}: AppButtonProps) {
  const systemScheme = useColorScheme();
  const themeMode = useThemeStore(state => state.mode);
  const resolveColors = useThemeStore(state => state.resolveColors);
  const { colors } = useMemo(
    () => resolveColors(systemScheme),
    [resolveColors, systemScheme, themeMode],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDarkPalette = colors.background === '#05070A';
  const solidForeground = variant === 'primary' && isDarkPalette ? '#05070A' : '#FFFFFF';
  const iconColor = variant === 'secondary' ? colors.textPrimary : solidForeground;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon color={iconColor} size={18} />
      <Text
        style={[
          styles.label,
          variant === 'secondary' ? styles.secondaryLabel : styles.solidLabel,
          variant === 'primary' && isDarkPalette && styles.darkPrimaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: TunifyColors) =>
  StyleSheet.create({
    root: {
      alignItems: 'center',
      borderRadius: radius.pill,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
      minHeight: 50,
      paddingHorizontal: spacing.lg,
    },
    primary: {
      backgroundColor: colors.background === '#05070A' ? '#FFFFFF' : colors.primary,
      borderColor: colors.background === '#05070A' ? '#FFFFFF' : colors.primary,
    },
    secondary: {
      backgroundColor: colors.background === '#05070A' ? 'rgba(255,255,255,0.04)' : colors.surface,
      borderColor: colors.divider,
    },
    danger: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 14,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.82,
    },
    secondaryLabel: {
      color: colors.textPrimary,
    },
    solidLabel: {
      color: '#FFFFFF',
    },
    darkPrimaryLabel: {
      color: '#05070A',
    },
  });
