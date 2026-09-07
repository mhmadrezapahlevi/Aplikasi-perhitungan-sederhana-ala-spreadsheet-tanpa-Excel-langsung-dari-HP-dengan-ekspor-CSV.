import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = {
  dark: boolean;
  bg: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  sub: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  danger: string;
  warn: string;
  gridHead: string;
  shadow: string;
};

const LIGHT: Theme = {
  dark: false,
  bg: '#F2F5F9',
  card: '#FFFFFF',
  cardAlt: '#F7FAFC',
  border: '#E2E8F0',
  text: '#0B1B2B',
  sub: '#64748B',
  accent: '#0F766E',
  accentSoft: '#D5F3EE',
  accentText: '#FFFFFF',
  danger: '#DC2626',
  warn: '#B45309',
  gridHead: '#ECF1F6',
  shadow: '#0F172A',
};

const DARK: Theme = {
  dark: true,
  bg: '#0A1220',
  card: '#121C2E',
  cardAlt: '#17233A',
  border: '#23324C',
  text: '#E8EEF8',
  sub: '#8FA3BF',
  accent: '#2DD4BF',
  accentSoft: '#0F3B39',
  accentText: '#04211E',
  danger: '#F87171',
  warn: '#FBBF24',
  gridHead: '#17233A',
  shadow: '#000000',
};

export type ThemeMode = 'auto' | 'light' | 'dark';

const MODE_KEY = 'sheetwork.mode.v1';

type Ctx = {
  theme: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
};

const ThemeCtx = createContext<Ctx>({ theme: LIGHT, mode: 'auto', setMode: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'auto') setModeState(v);
      })
      .catch(() => {});
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(MODE_KEY, m).catch(() => {});
  };

  const value = useMemo<Ctx>(() => {
    const resolved = mode === 'auto' ? (scheme === 'dark' ? 'dark' : 'light') : mode;
    return { theme: resolved === 'dark' ? DARK : LIGHT, mode, setMode };
  }, [mode, scheme]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Ctx {
  return useContext(ThemeCtx);
}
