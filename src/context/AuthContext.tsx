import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserSettings } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
  currencySymbol: string;
  debitLabel: string;
  creditLabel: string;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; phone?: string; location?: string; currencySymbol?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; location?: string; avatarUrl?: string; settings?: Partial<UserSettings> }) => Promise<void>;
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial user fetch
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.warn('Failed to load user session:', err);
          // If offline, check cached user
          const cached = localStorage.getItem('rupeetrack_cached_user');
          if (cached) {
            try {
              setUser(JSON.parse(cached));
            } catch (_) {}
          } else {
            api.setToken(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    setUser(res.user);
  };

  const register = async (payload: { name: string; email: string; password: string; phone?: string; location?: string; currencySymbol?: string }) => {
    const res = await api.register(payload);
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; phone?: string; location?: string; avatarUrl?: string; settings?: Partial<UserSettings> }) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
  };

  const changePassword = async (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    return await api.changePassword(data);
  };

  const currencySymbol = user?.settings?.currencySymbol || '₹';
  const debitLabel = user?.settings?.debitLabel || 'Debit';
  const creditLabel = user?.settings?.creditLabel || 'Credit';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOnline,
        currencySymbol,
        debitLabel,
        creditLabel,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
