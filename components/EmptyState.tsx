import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
};

function EmptyState({ icon, title, subtitle }: Props) {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(320)} style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icon} size={26} color={theme.accent} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.sub, { color: theme.sub }]}>{subtitle}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 36, paddingVertical: 48 },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  sub: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});

export default EmptyState;
