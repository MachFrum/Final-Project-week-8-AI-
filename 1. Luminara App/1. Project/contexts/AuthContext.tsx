import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { generateUUID, isValidUUID } from '@/utils/uuid';
import { DEFAULT_USER_ID } from '@/constants/user';

// Add Supabase import at the top
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isGuest: boolean;
  createdAt: string;
  lastLoginAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  token: null,
};

// Secure storage helpers
const storeSecurely = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, btoa(value));
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getSecurely = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    const value = localStorage.getItem(key);
    return value ? atob(value) : null;
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteSecurely = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await getSecurely('auth_token');
      const userJson = await getSecurely('user_data');
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        // Ensure user has valid UUID
        if (!isValidUUID(user.id)) {
          user.id = generateUUID();
        }
        dispatch({ type: 'SET_TOKEN', payload: token });
        dispatch({ type: 'SET_USER', payload: user });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      // Simple validation
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      // Mock successful login - replace with real API call
      const user: User = {
        id: generateUUID(),
        email: credentials.email,
        firstName: 'Test',
        lastName: 'User',
        isGuest: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const token = generateUUID();

      // Store credentials
      await storeSecurely('auth_token', token);
      await storeSecurely('user_data', JSON.stringify(user));

      dispatch({ type: 'SET_TOKEN', payload: token });
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      // Simple validation
      if (!credentials.email || !credentials.password || !credentials.firstName || !credentials.lastName) {
        throw new Error('All fields are required');
      }

      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Mock successful registration
      const user: User = {
        id: generateUUID(),
        email: credentials.email,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        isGuest: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const token = generateUUID();

      await storeSecurely('auth_token', token);
      await storeSecurely('user_data', JSON.stringify(user));

      dispatch({ type: 'SET_TOKEN', payload: token });
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  };

  const continueAsGuest = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const guestUser: User = {
        id: DEFAULT_USER_ID, // Use consistent default user ID for guests
        email: '',
        firstName: 'Guest',
        lastName: 'User',
        isGuest: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const token = generateUUID();

      await storeSecurely('auth_token', token);
      await storeSecurely('user_data', JSON.stringify(guestUser));

      dispatch({ type: 'SET_TOKEN', payload: token });
      dispatch({ type: 'SET_USER', payload: guestUser });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  };

  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Sign out from Supabase auth if we're using it
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.warn('Supabase sign out error:', signOutError);
        }
      } catch (error) {
        console.warn('Supabase sign out failed:', error);
      }
      
      // Clear all stored authentication data
      await deleteSecurely('auth_token');
      await deleteSecurely('user_data');
      await deleteSecurely('supabase_session');
      
      // Also clear any other stored preferences that might contain user data
      try {
        await deleteSecurely('remember_me');
        await deleteSecurely('user_preferences');
        await deleteSecurely('last_login');
      } catch (error) {
        // These might not exist, so we can safely ignore errors
        console.log('Additional cleanup completed');
      }
      
      dispatch({ type: 'LOGOUT' });
      console.log('User successfully logged out and all data cleared');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we should still log out the user
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        continueAsGuest,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};