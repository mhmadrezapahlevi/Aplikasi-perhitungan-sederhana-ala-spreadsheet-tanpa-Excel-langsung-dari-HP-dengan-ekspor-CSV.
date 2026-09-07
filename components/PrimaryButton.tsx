import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'solid' | 'soft' | 'ghost' | 'danger';

type Props = {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  variant?: Variant;
  size?: 'sm' | 'md';
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
};

function PrimaryButton({ label, icon, onPress, variant = 'solid', size = 'md', style, disabled }: Props) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const palette = {
    solid: { bg: theme.accent, fg: theme.accentText, border: theme.accent },
    soft: { bg: theme.accentSoft, fg: theme.accent, border: theme.accentSoft },
    ghost: { bg: 'transparent', fg: theme.text, border: theme.border },
    danger: { bg: 'transparent', fg: theme.danger, border: theme.danger },
  }[variant];

  const pad = size === 'sm' ? styles.sm : styles.md;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 260 });
      }}
      style={[
        styles.base,
        pad,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : 1,
        },
        aStyle,
        style as any,
      ]}
    >
      {icon ? <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={palette.fg} /> : null}
      <Text style={[styles.label, { color: palette.fg, fontSize: size === 'sm' ? 12.5 : 14 }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  md: { paddingVertical: 13, paddingHorizontal: 18 },
  sm: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10 },
  label: { fontWeight: '700' },
});

export default PrimaryButton;
