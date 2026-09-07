import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from './theme';

type Msg = { id: number; text: string; icon: string };

type Ctx = { show: (text: string, icon?: string) => void };

const ToastCtx = createContext<Ctx>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [msg, setMsg] = useState<Msg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, icon: string = 'checkmark-circle') => {
    setMsg({ id: Date.now(), text, icon });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <View pointerEvents="box-none" style={styles.layer}>
        {msg ? (
          <Animated.View
            key={msg.id}
            entering={FadeInDown.duration(220)}
            exiting={FadeOutDown.duration(220)}
            style={[
              styles.toast,
              {
                backgroundColor: theme.dark ? '#1D2A40' : '#0B1B2B',
                borderColor: theme.border,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <Ionicons name={msg.icon as any} size={16} color={theme.accent} />
            <Text style={styles.toastText}>{msg.text}</Text>
          </Animated.View>
        ) : null}
      </View>
    </ToastCtx.Provider>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', flexShrink: 1 },
});

export function useToast(): Ctx {
  return useContext(ToastCtx);
}
