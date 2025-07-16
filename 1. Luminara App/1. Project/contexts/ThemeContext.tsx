import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type Theme = 'light' | 'dark';

interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Shadow colors
  shadow: string;
  
  // Overlay colors
  overlay: string;
  overlayLight: string;
}

const lightTheme: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  surfaceTertiary: '#E5E7EB',
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  
  primary: '#8A2BE2',
  primaryLight: '#9B59B6',
  primaryDark: '#6A1B9A',
  
  accent: '#6366F1',
  accentLight: '#8B5CF6',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  shadow: '#000000',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
};

const darkTheme: ThemeColors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceSecondary: '#262626',
  surfaceTertiary: '#404040',
  
  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  
  primary: '#A855F7',
  primaryLight: '#C084FC',
  primaryDark: '#7C3AED',
  
  accent: '#8B5CF6',
  accentLight: '#A78BFA',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  border: '#374151',
  borderLight: '#4B5563',
  
  shadow: '#000000',
  
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const storeTheme = async (theme: Theme) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('app_theme', theme);
    } else {
      await SecureStore.setItemAsync('app_theme', theme);
    }
  } catch (error) {
    console.warn('Failed to store theme:', error);
  }
};

const getStoredTheme = async (): Promise<Theme | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('app_theme') as Theme | null;
    } else {
      return await SecureStore.getItemAsync('app_theme') as Theme | null;
    }
  } catch (error) {
    console.warn('Failed to get stored theme:', error);
    return null;
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await getStoredTheme();
      if (storedTheme) {
        setThemeState(storedTheme);
      }
    };
    loadTheme();
  }, []);

  const colors = theme === 'light' ? lightTheme : darkTheme;

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await storeTheme(newTheme);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};