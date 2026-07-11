import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  phone: string;
  role: 'citizen' | 'volunteer' | 'analyst';
  region?: string;
  savedLocation?: { lat: number; lng: number };
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  signup: (
    name: string,
    phone: string,
    password: string,
    role: 'citizen' | 'volunteer',
    region?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateUser: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load token and fetch user on boot
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        let storedToken = null;
        try {
          storedToken = await SecureStore.getItemAsync('auth_token');
        } catch {
          storedToken = await AsyncStorage.getItem('auth_token_fallback');
        }

        if (storedToken) {
          setToken(storedToken);
          // Verify token against backend /me
          const userData = await api.get<User>('/api/auth/me');
          setUser(userData);
        }
      } catch (err) {
        console.warn('Authentication token verification failed:', err);
        // Clean stale tokens
        await logout();
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>('/api/auth/login', {
      phone,
      password
    });

    setToken(data.token);
    setUser(data.user);

    try {
      await SecureStore.setItemAsync('auth_token', data.token);
    } catch {
      await AsyncStorage.setItem('auth_token_fallback', data.token);
    }
  };

  const signup = async (
    name: string,
    phone: string,
    password: string,
    role: 'citizen' | 'volunteer',
    region?: string
  ) => {
    const data = await api.post<{ token: string; user: User }>('/api/auth/signup', {
      name,
      phone,
      password,
      role,
      region
    });

    setToken(data.token);
    setUser(data.user);

    try {
      await SecureStore.setItemAsync('auth_token', data.token);
    } catch {
      await AsyncStorage.setItem('auth_token_fallback', data.token);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    try {
      await SecureStore.deleteItemAsync('auth_token');
    } catch {
      await AsyncStorage.removeItem('auth_token_fallback');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        signup,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
