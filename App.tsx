import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeProvider, useTheme } from './lib/theme';
import { StoreProvider } from './lib/store';
import { ToastProvider } from './lib/toast';
import EditorScreen from './screens/EditorScreen';
import ArchiveScreen from './screens/ArchiveScreen';
import CalculatorScreen from './screens/CalculatorScreen';
import HelpScreen from './screens/HelpScreen';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, [string, string]> = {
  Sheet: ['grid', 'grid-outline'],
  Arsip: ['albums', 'albums-outline'],
  Kalkulator: ['calculator', 'calculator-outline'],
  Bantuan: ['help-buoy', 'help-buoy-outline'],
};

function RootTabs() {
  const { theme } = useTheme();
  const navTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme : DefaultTheme).colors,
      background: theme.bg,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.sub,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            borderTopWidth: 0.5,
          },
          tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700', marginBottom: 4 },
          tabBarItemStyle: { paddingTop: 6 },
          tabBarIcon: ({ color, focused }) => {
            const pair = ICONS[route.name] || ICONS.Sheet;
            return <Ionicons name={(focused ? pair[0] : pair[1]) as any} size={21} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Sheet" component={EditorScreen} />
        <Tab.Screen name="Arsip" component={ArchiveScreen} />
        <Tab.Screen name="Kalkulator" component={CalculatorScreen} />
        <Tab.Screen name="Bantuan" component={HelpScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function Shell() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <RootTabs />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <StoreProvider>
            <Shell />
          </StoreProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
